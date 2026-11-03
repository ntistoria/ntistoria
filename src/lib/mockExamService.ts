import { supabase } from './supabase';
import { fetchQuestionsForCategory } from './testService';
import {
  MockExam,
  MockExamBannerInfo,
  MockExamPayload,
  MockExamQuestionItem,
  MockExamTaskSection,
  QuizQuestion
} from '../types';

const GEORGIAN_LETTERS = ['ა', 'ბ', 'გ', 'დ'];

/**
 * Unbiased Fisher-Yates array shuffle
 */
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Extract numeric chapter number from chapterId (e.g. "ch-3" -> 3)
 */
function extractChapterNumber(chapterId?: string): number {
  if (!chapterId) return 1;
  const match = String(chapterId).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

/**
 * Fetch reference answers for AI-graded open questions (analogy_questions & source_questions)
 * for Admin use (generation & Answer Key sheet).
 */
export async function fetchAdminOpenAnswersMap(
  analogyIds: string[],
  sourceIds: string[]
): Promise<{
  analogy_questions: Record<string, { answer: string; score?: number }>;
  source_questions: Record<string, { answer: string; score?: number }>;
}> {
  const result = {
    analogy_questions: {} as Record<string, { answer: string; score?: number }>,
    source_questions: {} as Record<string, { answer: string; score?: number }>
  };

  if (analogyIds.length === 0 && sourceIds.length === 0) {
    return result;
  }

  // 1. Try Supabase SECURITY DEFINER RPC `get_admin_open_answers`
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_open_answers', {
      p_analogy_ids: analogyIds,
      p_source_ids: sourceIds
    });
    if (!rpcErr && rpcData) {
      if (rpcData.analogy_questions) result.analogy_questions = rpcData.analogy_questions;
      if (rpcData.source_questions) result.source_questions = rpcData.source_questions;
      if (
        Object.keys(result.analogy_questions).length > 0 ||
        Object.keys(result.source_questions).length > 0
      ) {
        return result;
      }
    }
  } catch {}

  // 2. Fallback: Serverless API `/api/grade-answer` with `action: 'admin_get_answers'`
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const res = await fetch('/api/grade-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'admin_get_answers',
          analogyIds,
          sourceIds
        })
      });
      if (res.ok) {
        const body = await res.json();
        if (body?.analogy_questions) result.analogy_questions = body.analogy_questions;
        if (body?.source_questions) result.source_questions = body.source_questions;
        return result;
      }
    }
  } catch {}

  // 3. Fallback: Direct table query if column-level RLS was not applied
  try {
    if (analogyIds.length > 0) {
      const { data } = await supabase
        .from('analogy_questions')
        .select('id, answer, score')
        .in('id', analogyIds);
      if (data) {
        data.forEach((row: any) => {
          result.analogy_questions[String(row.id)] = {
            answer: String(row.answer || ''),
            score: Number(row.score) || undefined
          };
        });
      }
    }
    if (sourceIds.length > 0) {
      const { data } = await supabase
        .from('source_questions')
        .select('id, answer, score')
        .in('id', sourceIds);
      if (data) {
        data.forEach((row: any) => {
          result.source_questions[String(row.id)] = {
            answer: String(row.answer || ''),
            score: Number(row.score) || undefined
          };
        });
      }
    }
  } catch {}

  return result;
}

/**
 * Group category questions (map / analogies / source) into complete task units
 * filtered by selected chapter numbers.
 */
function buildTaskCandidates(
  questions: (QuizQuestion & { chapterId: string })[],
  selectedChapters: number[],
  categoryKey: 'map' | 'analogies' | 'source',
  taskNumber: number,
  defaultTitle: string
): MockExamTaskSection[] {
  const chapterSet = new Set(selectedChapters);
  const filtered = questions.filter((q) =>
    chapterSet.has(extractChapterNumber(q.chapterId))
  );

  if (filtered.length === 0) return [];

  const groupMap = new Map<string, (QuizQuestion & { chapterId: string })[]>();

  filtered.forEach((q, idx) => {
    let groupKey = '';
    if (q.parentItemNumber) {
      groupKey = `parent-${q.parentItemNumber}`;
    } else if (categoryKey === 'map' && q.mapImage) {
      groupKey = `img-${q.mapImage}`;
    } else if ((categoryKey === 'analogies' || categoryKey === 'source') && q.sourceContext) {
      groupKey = `ctx-${q.sourceContext.substring(0, 120)}`;
    } else if (q.itemNumber) {
      groupKey = `${q.chapterId}-item-${q.itemNumber}`;
    } else {
      groupKey = `${q.chapterId}-q-${idx}`;
    }

    const list = groupMap.get(groupKey) || [];
    list.push(q);
    groupMap.set(groupKey, list);
  });

  const sections: MockExamTaskSection[] = [];

  Array.from(groupMap.values()).forEach((qList, index) => {
    const sortedQuestions = [...qList].sort(
      (a, b) => (a.itemNumber || 0) - (b.itemNumber || 0)
    );
    const firstQ = sortedQuestions[0];
    const parentNum = firstQ.parentItemNumber || index + 1;

    const mappedSubQuestions: MockExamQuestionItem[] = sortedQuestions.map((q, qIdx) => {
      const isMcq = q.questionType === 'mcq' && q.options && q.options.length > 1;
      const ansIdx = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;
      const ansLetter = isMcq ? GEORGIAN_LETTERS[ansIdx] || 'ა' : undefined;
      const ansText = isMcq
        ? q.options?.[ansIdx] || q.correctAnswerText || ''
        : q.correctAnswerText || '';

      // Default points distribution if DB score is not set:
      // Map (6 questions -> 1pt each = 6), Analogy (4 questions -> 1,1,1,2 = 5), Source (total 14)
      let defaultScore = q.maxScore;
      if (!defaultScore || defaultScore <= 0) {
        if (categoryKey === 'map') defaultScore = 1;
        else if (categoryKey === 'analogies') defaultScore = qIdx === 3 ? 2 : 1;
        else if (categoryKey === 'source') defaultScore = 1;
      }

      return {
        id: q.id,
        number: q.itemNumber || qIdx + 1,
        prompt: q.prompt,
        options: isMcq ? q.options : undefined,
        maxScore: defaultScore,
        chapterId: q.chapterId,
        correctAnswerIndex: isMcq ? ansIdx : undefined,
        correctAnswerLetter: ansLetter,
        correctAnswerText: ansText || undefined,
        explanation: q.explanation || undefined
      };
    });

    sections.push({
      taskNumber,
      title: defaultTitle,
      chapterId: firstQ.chapterId,
      parentItemNumber: parentNum,
      mapImage: firstQ.mapImage,
      sourceContext: firstQ.sourceContext,
      questions: mappedSubQuestions
    });
  });

  return sections;
}

/**
 * Generate a new Mock Exam from selected chapters and activate it immediately.
 * Stores both the exam variant and full answer key (letters, answers, points) in `mock_exams`.
 */
export async function generateAndActivateMockExam(params: {
  title: string;
  selectedChapters: number[];
  durationMinutes: number;
}): Promise<MockExam> {
  const { title, selectedChapters, durationMinutes } = params;

  if (!selectedChapters || selectedChapters.length === 0) {
    throw new Error('გთხოვთ აირჩიოთ მინიმუმ ერთი თავი.');
  }

  if (!durationMinutes || durationMinutes <= 0) {
    throw new Error('გთხოვთ მიუთითოთ გამოცდის ხანგრძლივობა (წუთებში).');
  }

  const sortedChapters = [...selectedChapters].sort((a, b) => a - b);
  const chapterSet = new Set(sortedChapters);

  // 1. Fetch questions from all 4 national exam categories in parallel
  const [allMcq, allMap, allAnalogies, allSource] = await Promise.all([
    fetchQuestionsForCategory('mcq'),
    fetchQuestionsForCategory('map'),
    fetchQuestionsForCategory('analogies'),
    fetchQuestionsForCategory('source')
  ]);

  // 2. Filter & pick 35 random Multiple Choice Questions (N1-35) with correct answer letters
  const filteredMcq = allMcq.filter((q) =>
    chapterSet.has(extractChapterNumber(q.chapterId))
  );

  if (filteredMcq.length === 0) {
    throw new Error('არჩეულ თავებში არჩევითპასუხიანი კითხვები ვერ მოიძებნა.');
  }

  const pickedMcq: MockExamQuestionItem[] = shuffleArray(filteredMcq)
    .slice(0, 35)
    .map((q, idx) => {
      const opts = q.options && q.options.length > 0 ? q.options : ['ა', 'ბ', 'გ', 'დ'];
      const ansIdx = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;
      const ansLetter = GEORGIAN_LETTERS[ansIdx] || 'ა';
      return {
        id: q.id,
        number: idx + 1,
        prompt: q.prompt,
        options: opts,
        maxScore: 1,
        chapterId: q.chapterId,
        correctAnswerIndex: ansIdx,
        correctAnswerLetter: ansLetter,
        correctAnswerText: opts[ansIdx] || q.correctAnswerText || '',
        explanation: q.explanation || undefined
      };
    });

  // 3. Filter & pick 1 random Map task (N36)
  const mapCandidates = buildTaskCandidates(
    allMap,
    sortedChapters,
    'map',
    36,
    'დავალება N36 — ისტორიული რუკის ანალიზი'
  );
  const pickedMapTask = mapCandidates.length > 0 ? shuffleArray(mapCandidates)[0] : null;

  // 4. Filter & pick 1 random Analogy task (N37)
  const analogyCandidates = buildTaskCandidates(
    allAnalogies,
    sortedChapters,
    'analogies',
    37,
    'დავალება N37 — ისტორიული მოვლენის / ანალოგიების ანალიზი'
  );
  const pickedAnalogyTask = analogyCandidates.length > 0 ? shuffleArray(analogyCandidates)[0] : null;

  // 5. Filter & pick 1 random Historical Source task (N38)
  const sourceCandidates = buildTaskCandidates(
    allSource,
    sortedChapters,
    'source',
    38,
    'დავალება N38 — ისტორიული პირველწყაროს ანალიზი'
  );
  const pickedSourceTask = sourceCandidates.length > 0 ? shuffleArray(sourceCandidates)[0] : null;

  // 6. Populate open-question reference answers for N37 and N38
  const analogyQIds = pickedAnalogyTask ? pickedAnalogyTask.questions.map((q) => q.id) : [];
  const sourceQIds = pickedSourceTask ? pickedSourceTask.questions.map((q) => q.id) : [];
  const openAnswers = await fetchAdminOpenAnswersMap(analogyQIds, sourceQIds);

  if (pickedAnalogyTask) {
    pickedAnalogyTask.questions = pickedAnalogyTask.questions.map((q, idx) => {
      const dbAns = openAnswers.analogy_questions[q.id];
      return {
        ...q,
        maxScore: dbAns?.score || q.maxScore || (idx === 3 ? 2 : 1),
        correctAnswerText: dbAns?.answer || q.correctAnswerText || q.explanation || ''
      };
    });
  }

  if (pickedSourceTask) {
    pickedSourceTask.questions = pickedSourceTask.questions.map((q) => {
      const dbAns = openAnswers.source_questions[q.id];
      return {
        ...q,
        maxScore: dbAns?.score || q.maxScore || 1,
        correctAnswerText: dbAns?.answer || q.correctAnswerText || q.explanation || ''
      };
    });
  }

  const payload: MockExamPayload = {
    mcqQuestions: pickedMcq,
    mapTask: pickedMapTask,
    analogyTask: pickedAnalogyTask,
    sourceTask: pickedSourceTask
  };

  // 7. Deactivate any previously active mock exam
  await supabase
    .from('mock_exams')
    .update({ is_active: false })
    .eq('is_active', true);

  // 8. Compute start_time and end_time
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const cleanTitle = title.trim() || 'იმიტირებული ეროვნული გამოცდა';

  const { data, error } = await supabase
    .from('mock_exams')
    .insert({
      title: cleanTitle,
      selected_chapters: sortedChapters,
      duration_minutes: durationMinutes,
      is_active: true,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      questions_payload: payload
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'იმიტირებული გამოცდის შენახვა ვერ მოხერხდა.');
  }

  return data as MockExam;
}

/**
 * Strip answer key fields from MockExam before returning to Student Exam View
 */
function sanitizeMockExamForStudent(exam: MockExam): MockExam {
  const stripQ = (q: MockExamQuestionItem): MockExamQuestionItem => ({
    id: q.id,
    number: q.number,
    prompt: q.prompt,
    options: q.options,
    maxScore: q.maxScore,
    chapterId: q.chapterId
  });

  const p = exam.questions_payload;
  if (!p) return exam;

  return {
    ...exam,
    questions_payload: {
      mcqQuestions: (p.mcqQuestions || []).map(stripQ),
      mapTask: p.mapTask ? { ...p.mapTask, questions: p.mapTask.questions.map(stripQ) } : null,
      analogyTask: p.analogyTask ? { ...p.analogyTask, questions: p.analogyTask.questions.map(stripQ) } : null,
      sourceTask: p.sourceTask ? { ...p.sourceTask, questions: p.sourceTask.questions.map(stripQ) } : null
    }
  };
}

/**
 * Enrich a MockExam with Answer Key data for Admin Answer Key View
 * (Backfills answers if an older exam was generated before answer key fields were stored)
 */
export async function enrichMockExamWithAnswerKey(exam: MockExam): Promise<MockExam> {
  const p = exam.questions_payload;
  if (!p) return exam;

  const needsMcqBackfill = p.mcqQuestions?.some((q) => !q.correctAnswerLetter);
  const needsMapBackfill = p.mapTask?.questions?.some(
    (q) => !q.correctAnswerLetter && !q.correctAnswerText
  );
  const needsAnalogyBackfill = p.analogyTask?.questions?.some((q) => !q.correctAnswerText);
  const needsSourceBackfill = p.sourceTask?.questions?.some((q) => !q.correctAnswerText);

  if (!needsMcqBackfill && !needsMapBackfill && !needsAnalogyBackfill && !needsSourceBackfill) {
    return exam;
  }

  const [allMcq, allMap] = await Promise.all([
    needsMcqBackfill ? fetchQuestionsForCategory('mcq') : Promise.resolve([]),
    needsMapBackfill ? fetchQuestionsForCategory('map') : Promise.resolve([])
  ]);

  const mcqById = new Map(allMcq.map((q) => [q.id, q]));
  const mapById = new Map(allMap.map((q) => [q.id, q]));

  const analogyIds = needsAnalogyBackfill && p.analogyTask
    ? p.analogyTask.questions.map((q) => q.id)
    : [];
  const sourceIds = needsSourceBackfill && p.sourceTask
    ? p.sourceTask.questions.map((q) => q.id)
    : [];

  const openAnswers = await fetchAdminOpenAnswersMap(analogyIds, sourceIds);

  const enrichedMcq = (p.mcqQuestions || []).map((q) => {
    if (q.correctAnswerLetter) return q;
    const found = mcqById.get(q.id);
    const ansIdx = found?.correctAnswerIndex ?? q.correctAnswerIndex ?? 0;
    const opts = q.options || found?.options || ['ა', 'ბ', 'გ', 'დ'];
    return {
      ...q,
      correctAnswerIndex: ansIdx,
      correctAnswerLetter: GEORGIAN_LETTERS[ansIdx] || 'ა',
      correctAnswerText: opts[ansIdx] || found?.correctAnswerText || '',
      explanation: q.explanation || found?.explanation
    };
  });

  const enrichedMapTask = p.mapTask
    ? {
        ...p.mapTask,
        questions: p.mapTask.questions.map((q) => {
          if (q.correctAnswerLetter || q.correctAnswerText) return q;
          const found = mapById.get(q.id);
          const isMcq = (q.options && q.options.length > 1) || found?.questionType === 'mcq';
          const ansIdx = found?.correctAnswerIndex ?? q.correctAnswerIndex ?? 0;
          const opts = q.options || found?.options || [];
          return {
            ...q,
            maxScore: q.maxScore || found?.maxScore || 1,
            correctAnswerIndex: isMcq ? ansIdx : undefined,
            correctAnswerLetter: isMcq ? GEORGIAN_LETTERS[ansIdx] || 'ა' : undefined,
            correctAnswerText: isMcq
              ? opts[ansIdx] || found?.correctAnswerText || ''
              : found?.correctAnswerText || found?.explanation || '',
            explanation: q.explanation || found?.explanation
          };
        })
      }
    : null;

  const enrichedAnalogyTask = p.analogyTask
    ? {
        ...p.analogyTask,
        questions: p.analogyTask.questions.map((q, idx) => {
          const dbAns = openAnswers.analogy_questions[q.id];
          return {
            ...q,
            maxScore: q.maxScore || dbAns?.score || (idx === 3 ? 2 : 1),
            correctAnswerText: q.correctAnswerText || dbAns?.answer || q.explanation || ''
          };
        })
      }
    : null;

  const enrichedSourceTask = p.sourceTask
    ? {
        ...p.sourceTask,
        questions: p.sourceTask.questions.map((q) => {
          const dbAns = openAnswers.source_questions[q.id];
          return {
            ...q,
            maxScore: q.maxScore || dbAns?.score || 1,
            correctAnswerText: q.correctAnswerText || dbAns?.answer || q.explanation || ''
          };
        })
      }
    : null;

  return {
    ...exam,
    questions_payload: {
      mcqQuestions: enrichedMcq,
      mapTask: enrichedMapTask,
      analogyTask: enrichedAnalogyTask,
      sourceTask: enrichedSourceTask
    }
  };
}

/**
 * Deactivate / Finish an active mock exam (Admin action)
 */
export async function deactivateMockExam(examId?: string): Promise<void> {
  let query = supabase.from('mock_exams').update({ is_active: false });
  if (examId) {
    query = query.eq('id', examId);
  } else {
    query = query.eq('is_active', true);
  }
  const { error } = await query;
  if (error) {
    throw new Error(error.message || 'ტესტის გაუქმება ვერ მოხერხდა.');
  }
}

/**
 * Fetch active mock exam banner metadata (works for both guests & logged-in students)
 */
export async function fetchActiveMockExamBanner(): Promise<MockExamBannerInfo | null> {
  try {
    // 1. Try lightweight security-definer RPC first (works for anon & authenticated)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_active_mock_exam_banner');
    if (!rpcErr && rpcData) {
      const endMs = rpcData.end_time ? new Date(rpcData.end_time).getTime() : 0;
      const nowMs = rpcData.server_now ? new Date(rpcData.server_now).getTime() : Date.now();
      if (rpcData.is_active && endMs > nowMs) {
        return rpcData as MockExamBannerInfo;
      }
      return null;
    }

    // 2. Fallback: direct query for authenticated users
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('mock_exams')
      .select('id, title, selected_chapters, duration_minutes, is_active, start_time, end_time, created_at')
      .eq('is_active', true)
      .gt('end_time', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as MockExamBannerInfo;
  } catch {
    return null;
  }
}

/**
 * Fetch the full active mock exam (with answer keys stripped) for authenticated students
 */
export async function fetchActiveMockExamForStudent(): Promise<MockExam | null> {
  try {
    // 1. Try server-side sanitized RPC first so answer keys never even cross the wire
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_active_mock_exam_student');
    if (!rpcErr && rpcData && rpcData.id) {
      return sanitizeMockExamForStudent(rpcData as MockExam);
    }

    // 2. Fallback: direct query + client sanitization
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*')
      .eq('is_active', true)
      .gt('end_time', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return sanitizeMockExamForStudent(data as MockExam);
  } catch {
    return null;
  }
}

/**
 * Fetch all mock exams for Admin Panel management (active + completed archive)
 */
export async function fetchAllMockExamsForAdmin(): Promise<MockExam[]> {
  try {
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as MockExam[];
  } catch {
    return [];
  }
}
