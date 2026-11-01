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

    const mappedSubQuestions: MockExamQuestionItem[] = sortedQuestions.map((q, qIdx) => ({
      id: q.id,
      number: q.itemNumber || qIdx + 1,
      prompt: q.prompt,
      options: q.questionType === 'mcq' && q.options && q.options.length > 1 ? q.options : undefined,
      maxScore: q.maxScore,
      chapterId: q.chapterId
    }));

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
 * Automatically archives/deactivates any previously active mock exam.
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

  // 2. Filter & pick 35 random Multiple Choice Questions (N1-35)
  const filteredMcq = allMcq.filter((q) =>
    chapterSet.has(extractChapterNumber(q.chapterId))
  );

  if (filteredMcq.length === 0) {
    throw new Error('არჩეულ თავებში არჩევითპასუხიანი კითხვები ვერ მოიძებნა.');
  }

  const pickedMcq: MockExamQuestionItem[] = shuffleArray(filteredMcq)
    .slice(0, 35)
    .map((q, idx) => ({
      id: q.id,
      number: idx + 1,
      prompt: q.prompt,
      options: q.options && q.options.length > 0 ? q.options : ['ა', 'ბ', 'გ', 'დ'],
      maxScore: q.maxScore || 1,
      chapterId: q.chapterId
    }));

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

  const payload: MockExamPayload = {
    mcqQuestions: pickedMcq,
    mapTask: pickedMapTask,
    analogyTask: pickedAnalogyTask,
    sourceTask: pickedSourceTask
  };

  // 6. Deactivate any previously active mock exam
  await supabase
    .from('mock_exams')
    .update({ is_active: false })
    .eq('is_active', true);

  // 7. Compute start_time and end_time
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
 * Fetch the full active mock exam (including questions_payload) for authenticated students
 */
export async function fetchActiveMockExamForStudent(): Promise<MockExam | null> {
  try {
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
    return data as MockExam;
  } catch {
    return null;
  }
}

/**
 * Fetch all mock exams for Admin Panel management (active + recent history)
 */
export async function fetchAllMockExamsForAdmin(): Promise<MockExam[]> {
  try {
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data as MockExam[];
  } catch {
    return [];
  }
}

