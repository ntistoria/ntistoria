// POST /api/grade-answer   (requires header: Authorization: Bearer <supabase access_token>)
// Body: { "table": "analogy_questions" | "source_questions", "questionId": "<id>", "studentAnswer": "..." }
// Returns: { "score": <0..maxScore>, "maxScore": <question's score column>, "feedback": "...", "correctAnswer": "...", "source": "rule" | "exact" | "ai" | "cache" }

import {
  GradingError,
  buildGradingRequest,
  callGemini,
  createRateLimiter,
  createResultCache,
  deterministicGrade,
  makeCacheKey,
  parseModelResponse
} from './_lib/grading.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Lightweight Flash-Lite model only (auto-updating alias).
const GEMINI_MODEL = 'gemini-flash-lite-latest';

// Whitelist — never let the client choose arbitrary table names.
const ALLOWED_TABLES = ['analogy_questions', 'source_questions'];

// Possible column names (adjust to your real schema if needed).
const ANSWER_COLUMNS = ['correct_answer', 'answer', 'model_answer', 'correct_answer_text', 'answer_text'];
const QUESTION_COLUMNS = ['question', 'question_text', 'prompt', 'text'];

// Best-effort (per serverless instance) cost controls.
const resultCache = createResultCache();
const aiRateLimiter = createRateLimiter({ limit: 15, windowMs: 60 * 1000 });

// Verifies the caller's Supabase session token. Returns the user or null.
async function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const user = await r.json();
  return user?.id ? user : null;
}

const MAX_ANSWER_LENGTH = 3000;

const pick = (row, columns) => {
  for (const c of columns) {
    if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') return String(row[c]);
  }
  return '';
};

async function fetchQuestion(table, id) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
}

// Semantic evaluation with Gemini. Only reached when deterministic rules cannot decide.
async function gradeWithGemini({ question, correctAnswer, studentAnswer, maxScore }) {
  const startedAt = Date.now();
  const data = await callGemini({
    body: buildGradingRequest({ question, correctAnswer, studentAnswer, maxScore }),
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL
  });
  const result = parseModelResponse(data, maxScore);
  // Monitoring only: no student text or credentials are logged.
  console.info('[grade-answer] ai ok', {
    model: GEMINI_MODEL,
    latencyMs: Date.now() - startedAt,
    totalTokens: data?.usageMetadata?.totalTokenCount ?? null
  });
  return { ...result, source: 'ai' };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server is not configured (missing environment variables)' });
  }

  const { table, questionId, studentAnswer } = req.body || {};

  let authUser;
  try {
    authUser = await getAuthUser(req);
  } catch (err) {
    console.error('auth check failed:', err?.message);
  }
  if (!authUser) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }
  if (questionId === undefined || questionId === null || String(questionId).trim() === '') {
    return res.status(400).json({ error: 'questionId is required' });
  }
  if (typeof studentAnswer !== 'string' || !studentAnswer.trim()) {
    return res.status(400).json({ error: 'studentAnswer is required' });
  }
  if (studentAnswer.length > MAX_ANSWER_LENGTH) {
    return res.status(400).json({ error: 'studentAnswer is too long' });
  }

  try {
    const row = await fetchQuestion(table, questionId);
    if (!row) return res.status(404).json({ error: 'Question not found' });

    const correctAnswer = pick(row, ANSWER_COLUMNS);
    if (!correctAnswer) {
      return res.status(500).json({ error: 'Correct answer column not found in table' });
    }

    const maxScore = Number(row.score);
    if (!Number.isFinite(maxScore) || Math.floor(maxScore) < 1) {
      return res.status(500).json({ error: 'Question has no valid max score' });
    }

    const question = pick(row, QUESTION_COLUMNS);
    const answer = studentAnswer.trim();
    const respond = (result) =>
      res.status(200).json({
        score: result.score,
        maxScore,
        feedback: result.feedback,
        correctAnswer,
        source: result.source
      });

    // 1. Deterministic rules first: no AI call, no cost.
    const ruleResult = deterministicGrade({ studentAnswer: answer, correctAnswer, maxScore });
    if (ruleResult) return respond(ruleResult);

    // 2. Cached / in-flight result for the identical question + reference answer + student answer.
    //    Any change to the question, reference answer, max score or prompt produces a new key.
    const cacheKey = makeCacheKey([GEMINI_MODEL, table, String(questionId), question, correctAnswer, maxScore, answer]);
    const cached = resultCache.get(cacheKey);
    if (cached) return respond({ ...cached, source: 'cache' });

    const result = await resultCache.dedupe(cacheKey, async () => {
      // Rate limit only applies to real (billable) AI calls.
      if (!aiRateLimiter.allow(authUser.id)) {
        throw new GradingError('rate_limited', 429, 'ძალიან ბევრი მოთხოვნაა, გთხოვთ სცადოთ ერთი წუთის შემდეგ.');
      }
      const graded = await gradeWithGemini({ question, correctAnswer, studentAnswer: answer, maxScore });
      resultCache.set(cacheKey, graded);
      return graded;
    });

    return respond(result);
  } catch (err) {
    if (err instanceof GradingError) {
      console.error('grade-answer failed:', err.code);
      return res.status(err.httpStatus).json({ error: err.userMessage });
    }
    console.error('grade-answer failed:', err?.message);
    return res.status(502).json({ error: 'შეფასება ვერ მოხერხდა, გთხოვთ სცადოთ თავიდან.' });
  }
}
