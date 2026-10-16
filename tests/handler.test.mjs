// Handler-level tests with a MOCKED fetch (Supabase + Gemini). No network, no real credentials.

import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.GEMINI_API_KEY = 'gemini-key';

const { default: handler } = await import('../api/grade-answer.js');

const QUESTION = { id: 7, question: 'ვინ შექმნა ქართლის სამეფო?', answer: 'ფარნავაზმა', score: 2 };

let geminiCalls;
let geminiMode;

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  if (u.includes('/auth/v1/user')) {
    return init.headers.Authorization === 'Bearer good' ? json(200, { id: `user-${init.headers.Authorization}` }) : json(401, {});
  }
  if (u.includes('/rest/v1/')) {
    return u.includes('id=eq.7') ? json(200, [QUESTION]) : json(200, []);
  }
  if (u.includes('generativelanguage.googleapis.com')) {
    geminiCalls++;
    if (geminiMode === 'overloaded') return json(503, { error: { message: 'UPSTREAM SECRET DETAIL' } });
    if (geminiMode === 'bad-score') return json(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"score":99,"feedback":"კარგია."}' }] } }] });
    return json(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"score":1,"feedback":"პასუხი ნაწილობრივ სწორია."}' }] } }] });
  }
  throw new Error(`unexpected fetch ${u}`);
};

const call = async ({ method = 'POST', token = 'good', body }) => {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res);
  return res;
};

const valid = (extra = {}) => ({ table: 'analogy_questions', questionId: '7', studentAnswer: 'ფარნავაზის ტომი', ...extra });

test.beforeEach(() => {
  geminiCalls = 0;
  geminiMode = 'ok';
});

test('rejects non-POST, missing/invalid token', async () => {
  assert.equal((await call({ method: 'GET', body: {} })).code, 405);
  assert.equal((await call({ token: '', body: valid() })).code, 401);
  assert.equal((await call({ token: 'bad', body: valid() })).code, 401);
  assert.equal(geminiCalls, 0);
});

test('input validation: table whitelist, missing id, empty/too long answer', async () => {
  assert.equal((await call({ body: valid({ table: 'users' }) })).code, 400);
  assert.equal((await call({ body: valid({ questionId: '' }) })).code, 400);
  assert.equal((await call({ body: valid({ studentAnswer: '   ' }) })).code, 400);
  assert.equal((await call({ body: valid({ studentAnswer: 'ა'.repeat(3001) }) })).code, 400);
  assert.equal((await call({ body: valid({ questionId: '999' }) })).code, 404);
  assert.equal(geminiCalls, 0);
});

test('client-supplied score/maxScore are ignored', async () => {
  const r = await call({ body: valid({ studentAnswer: 'სრულიად სხვა პასუხი 1', score: 2, maxScore: 100 }) });
  assert.equal(r.code, 200);
  assert.equal(r.body.score, 1);
  assert.equal(r.body.maxScore, 2);
});

test('exact match is graded without calling Gemini', async () => {
  const r = await call({ body: valid({ studentAnswer: ' ფარნავაზმა. ' }) });
  assert.equal(r.code, 200);
  assert.deepEqual([r.body.score, r.body.source], [2, 'exact']);
  assert.equal(geminiCalls, 0);
});

test('punctuation-only answer is scored 0 without calling Gemini', async () => {
  const r = await call({ body: valid({ studentAnswer: '...' }) });
  assert.deepEqual([r.code, r.body.score, r.body.source], [200, 0, 'rule']);
  assert.equal(geminiCalls, 0);
});

test('AI result is returned once and identical repeats come from cache (no second billable call)', async () => {
  const body = valid({ studentAnswer: 'ფარნავაზი ქართლის პირველი მეფე იყო (cache test)' });
  const first = await call({ body });
  const second = await call({ body });
  assert.deepEqual([first.code, first.body.source], [200, 'ai']);
  assert.deepEqual([second.code, second.body.source, second.body.score], [200, 'cache', 1]);
  assert.equal(geminiCalls, 1);
});

test('concurrent identical requests share one Gemini call', async () => {
  const body = valid({ studentAnswer: 'ერთდროული მოთხოვნის ტესტი' });
  const [a, b] = await Promise.all([call({ body }), call({ body })]);
  assert.equal(a.code, 200);
  assert.equal(b.code, 200);
  assert.equal(geminiCalls, 1);
});

test('Gemini overload -> 503 with a safe message (no upstream text, nothing cached)', async () => {
  geminiMode = 'overloaded';
  const body = valid({ studentAnswer: 'overload test answer' });
  const r = await call({ body });
  assert.equal(r.code, 503);
  assert.ok(!JSON.stringify(r.body).includes('UPSTREAM SECRET'));
  assert.equal(geminiCalls, 3);

  geminiMode = 'ok';
  const retry = await call({ body });
  assert.deepEqual([retry.code, retry.body.source], [200, 'ai']);
});

test('model returns out-of-range score -> 502, never a clamped full score', async () => {
  geminiMode = 'bad-score';
  const r = await call({ body: valid({ studentAnswer: 'bad score test answer' }) });
  assert.equal(r.code, 502);
  assert.equal(r.body.score, undefined);
});

test('per-user rate limit applies to billable AI calls only', async () => {
  let blocked = false;
  for (let i = 0; i < 20; i++) {
    const r = await call({ body: valid({ studentAnswer: `rate limit probe number ${i}` }) });
    if (r.code === 429) { blocked = true; break; }
  }
  assert.ok(blocked, 'expected a 429 after exceeding the per-user AI limit');
  // deterministic grading is still available while rate limited
  assert.equal((await call({ body: valid({ studentAnswer: 'ფარნავაზმა' }) })).code, 200);
});

test.after(() => {
  globalThis.fetch = realFetch;
});
