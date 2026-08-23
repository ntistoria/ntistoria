import { supabase } from './supabase';

export interface ChapterProgressStats {
  chapterId: string;
  categoryKey: string;
  correctQuestionIds: string[];
  incorrectQuestionIds: string[];
  attemptedQuestionIds: string[];
}

export interface StudentProfileProgress {
  userEmail: string;
  statsByChapter: Record<string, ChapterProgressStats>; // key: `${categoryKey}_${chapterId}`
  lastUpdated: string;
}

const LOCAL_PROGRESS_PREFIX = 'ntistoria_student_progress_';

const getStorageKey = (email: string) => `${LOCAL_PROGRESS_PREFIX}${email.toLowerCase().trim()}`;

/**
 * Load student progress from Supabase & LocalStorage
 */
export const getStudentProgress = async (userEmail: string): Promise<StudentProfileProgress> => {
  const defaultProgress: StudentProfileProgress = {
    userEmail,
    statsByChapter: {},
    lastUpdated: new Date().toISOString()
  };

  if (!userEmail) return defaultProgress;

  // 1. Try reading from localStorage first (fastest)
  let localData: StudentProfileProgress | null = null;
  try {
    const raw = localStorage.getItem(getStorageKey(userEmail));
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Local storage progress read error:', err);
  }

  // 2. Try fetching from Supabase 'user_progress' table
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_email', userEmail.toLowerCase().trim())
      .maybeSingle();

    if (!error && data && data.progress_json) {
      const dbProgress: StudentProfileProgress = typeof data.progress_json === 'string'
        ? JSON.parse(data.progress_json)
        : data.progress_json;

      // Merge local and DB (DB priority if newer)
      const merged: StudentProfileProgress = {
        userEmail,
        statsByChapter: {
          ...(localData?.statsByChapter || {}),
          ...(dbProgress.statsByChapter || {})
        },
        lastUpdated: new Date().toISOString()
      };

      // Save back to local storage
      localStorage.setItem(getStorageKey(userEmail), JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Supabase progress fetch notice (using local progress):', err);
  }

  return localData || defaultProgress;
};

/**
 * Save user answers to progress
 */
export const recordUserAnswers = async (
  userEmail: string,
  categoryKey: string,
  chapterId: string,
  results: { questionId: string; isCorrect: boolean }[]
): Promise<StudentProfileProgress> => {
  if (!userEmail) {
    // Guest mode: save to guest storage
    userEmail = 'guest_user';
  }

  const current = await getStudentProgress(userEmail);
  const key = `${categoryKey}_${chapterId}`;

  const existingChapter = current.statsByChapter[key] || {
    chapterId,
    categoryKey,
    correctQuestionIds: [],
    incorrectQuestionIds: [],
    attemptedQuestionIds: []
  };

  const correctSet = new Set(existingChapter.correctQuestionIds);
  const incorrectSet = new Set(existingChapter.incorrectQuestionIds);
  const attemptedSet = new Set(existingChapter.attemptedQuestionIds);

  results.forEach(res => {
    attemptedSet.add(res.questionId);
    if (res.isCorrect) {
      correctSet.add(res.questionId);
      incorrectSet.delete(res.questionId);
    } else {
      incorrectSet.add(res.questionId);
      correctSet.delete(res.questionId);
    }
  });

  const updatedStats: ChapterProgressStats = {
    chapterId,
    categoryKey,
    correctQuestionIds: Array.from(correctSet),
    incorrectQuestionIds: Array.from(incorrectSet),
    attemptedQuestionIds: Array.from(attemptedSet)
  };

  const updatedProgress: StudentProfileProgress = {
    ...current,
    statsByChapter: {
      ...current.statsByChapter,
      [key]: updatedStats
    },
    lastUpdated: new Date().toISOString()
  };

  // 1. Save to Local Storage
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(updatedProgress));
  } catch (err) {
    console.error('Failed to write progress to local storage:', err);
  }

  // 2. Try saving to Supabase
  if (userEmail !== 'guest_user') {
    try {
      await supabase.from('user_progress').upsert({
        user_email: userEmail.toLowerCase().trim(),
        progress_json: JSON.stringify(updatedProgress),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_email' });
    } catch (err) {
      console.warn('Supabase progress save notice (local saved):', err);
    }
  }

  return updatedProgress;
};

/**
 * Reset student progress for a specific chapter or all chapters
 */
export const resetStudentProgress = async (
  userEmail: string,
  categoryKey?: string,
  chapterId?: string
): Promise<StudentProfileProgress> => {
  if (!userEmail) userEmail = 'guest_user';

  let current = await getStudentProgress(userEmail);

  if (categoryKey && chapterId) {
    // Reset specific chapter
    const key = `${categoryKey}_${chapterId}`;
    const newStats = { ...current.statsByChapter };
    delete newStats[key];

    current = {
      ...current,
      statsByChapter: newStats,
      lastUpdated: new Date().toISOString()
    };
  } else {
    // Complete Reset
    current = {
      userEmail,
      statsByChapter: {},
      lastUpdated: new Date().toISOString()
    };
  }

  // Save updated reset state
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(current));
  } catch (err) {
    console.error('Error resetting local progress:', err);
  }

  if (userEmail !== 'guest_user') {
    try {
      await supabase.from('user_progress').upsert({
        user_email: userEmail.toLowerCase().trim(),
        progress_json: JSON.stringify(current),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_email' });
    } catch (err) {
      console.warn('Supabase progress reset notice:', err);
    }
  }

  return current;
};
