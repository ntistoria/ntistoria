// Deterministic matching for NON-AI open-text questions.
//
// Rules (intentionally strict so that materially different answers are never treated as equal):
//  1. Normalised text must be identical, OR
//  2. the student's answer contains the COMPLETE reference answer as whole words and is not
//     much longer than it (so a long dump of text that happens to contain the answer is rejected).
// Not used on purpose: reverse containment (a fragment of the answer), keyword presence,
// or fuzzy/typo matching. Digits are never fuzzed, so "1783" never equals "1784".

export const normalizeAnswerText = (value: string): string =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Extra words a student may add around the exact reference answer (e.g. "ეს იყო X"). */
const MAX_EXTRA_WORDS = 4;

export const checkOpenAnswerMatch = (userInput: string, correctAnswer: string): boolean => {
  const user = normalizeAnswerText(userInput);
  const correct = normalizeAnswerText(correctAnswer);
  if (!user || !correct) return false;
  if (user === correct) return true;

  const userWords = user.split(' ');
  const correctWords = correct.split(' ');
  if (userWords.length > correctWords.length + MAX_EXTRA_WORDS) return false;

  // Whole-word phrase containment (never a partial-word match).
  return ` ${user} `.includes(` ${correct} `);
};
