import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, type FC } from 'react';
import { HistoryTest, QuizQuestion, MockExam, MockExamBannerInfo } from '../types';
import {
  TEST_CATEGORIES,
  ProgramChapter,
  fetchProgramsAndSubprograms,
  fetchQuestionsForCategory,
  fetchChapterCountsForCategory,
  fetchCategoryQuestionsCount,
  fetchCategoryItemDetails,
  CategoryItemDetails,
  getCategoryUnitInfo,
  buildHistoryTest,
  AI_GRADED_TABLES,
  sanitizeTestForSessionStorage,
  hydrateTestQuestionsFromVault
} from '../lib/testService';
import {
  fetchActiveMockExamBanner,
  fetchActiveMockExamForStudent,
  getServerClockOffsetMs,
  getSyncedServerNowMs
} from '../lib/mockExamService';
import { checkOpenAnswerMatch } from '../lib/answerMatching';
import { supabase } from '../lib/supabase';
import {
  getStudentProgress,
  recordUserAnswers,
  resetStudentProgress,
  StudentProfileProgress
} from '../lib/progressService';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { ChevronLeft } from 'lucide-react';
import { TestCategoryGrid } from '../components/tests/TestCategoryGrid';
import { TestChapterSelector, TaskGroup } from '../components/tests/TestChapterSelector';
import { InlineTestRunner, checkChronologyItemsMatch } from '../components/tests/InlineTestRunner';
import { InlineTestSummary } from '../components/tests/InlineTestSummary';
import { QuestionImageLightbox } from '../components/tests/QuestionImageLightbox';

// 4.1 Code-Splitting: Lazy-load MockExamStudentView
const MockExamStudentView = lazy(() =>
  import('../components/MockExamStudentView').then(m => ({ default: m.MockExamStudentView }))
);

interface TestsViewProps {
  onOpenTest?: (test: HistoryTest) => void;
  user?: { name: string; email: string } | null;
  onOpenAuth?: () => void;
  isLoggedIn?: boolean;
  onNavigateHome?: () => void;
  initialCategoryKey?: string | null;
  initialChapterId?: string | null;
  onClearInitialTarget?: () => void;
}

export const TestsView: FC<TestsViewProps> = ({
  user,
  onOpenAuth,
  onNavigateHome,
  initialCategoryKey,
  initialChapterId,
  onClearInitialTarget
}) => {
  const isLoggedIn = !!(user && user.email);

  // Read initial URL query parameters (?category=map&chapter=ch-2) if present
  const initialUrlParams = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return {
        category: sp.get('category'),
        chapter: sp.get('chapter')
      };
    } catch {
      return { category: null, chapter: null };
    }
  }, []);

  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(
    initialCategoryKey || initialUrlParams.category || null
  );
  const [programs, setPrograms] = useState<ProgramChapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    initialChapterId || initialUrlParams.chapter || 'all'
  );
  const [questionsCountMap, setQuestionsCountMap] = useState<Record<string, number>>({});
  const [categoryTotalCounts, setCategoryTotalCounts] = useState<Record<string, number>>({});
  const [categoryItemDetailsMap, setCategoryItemDetailsMap] = useState<Record<string, CategoryItemDetails>>({});
  const [progressData, setProgressData] = useState<StudentProfileProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Lightbox for Map / Illustration inside Inline Test Runner
  const [inlineLightboxUrl, setInlineLightboxUrl] = useState<string | null>(null);
  const [inlineLightboxZoom, setInlineLightboxZoom] = useState<number>(1);

  // MOCK EXAM MODE STATE
  const [mockBanner, setMockBanner] = useState<MockExamBannerInfo | null>(null);
  const [activeMockExam, setActiveMockExam] = useState<MockExam | null>(null);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState<number>(() => getServerClockOffsetMs());
  const [openingMockExam, setOpeningMockExam] = useState<boolean>(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  const refreshMockBanner = useCallback(async () => {
    const info = await fetchActiveMockExamBanner();
    setMockBanner(info);
    if (info?.server_now) {
      const serverMs = new Date(info.server_now).getTime();
      if (!isNaN(serverMs)) {
        setServerTimeOffsetMs(serverMs - Date.now());
        return;
      }
    }
    setServerTimeOffsetMs(getServerClockOffsetMs());
  }, []);

  useEffect(() => {
    refreshMockBanner();
  }, [refreshMockBanner, isLoggedIn, user?.email]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isMockExamActive = useMemo(() => {
    if (!mockBanner || !mockBanner.is_active || !mockBanner.end_time) return false;
    const endMs = new Date(mockBanner.end_time).getTime();
    const effectiveOffset = serverTimeOffsetMs || getServerClockOffsetMs();
    return endMs > nowTick + effectiveOffset;
  }, [mockBanner, nowTick, serverTimeOffsetMs]);

  const handleOpenMockExam = useCallback(async () => {
    if (!isLoggedIn) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setOpeningMockExam(true);
    try {
      const fullExam = await fetchActiveMockExamForStudent();
      if (fullExam && fullExam.is_active && fullExam.end_time && new Date(fullExam.end_time).getTime() > getSyncedServerNowMs()) {
        setActiveMockExam(fullExam);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        await refreshMockBanner();
      }
    } catch (err) {
      console.error('Error opening mock exam:', err);
    } finally {
      setOpeningMockExam(false);
    }
  }, [isLoggedIn, onOpenAuth, refreshMockBanner]);

  // Auto-open Mock Exam when navigated via Home page "შეუერთდი" button
  useEffect(() => {
    try {
      if (sessionStorage.getItem('nt_auto_open_mock_exam') === '1') {
        sessionStorage.removeItem('nt_auto_open_mock_exam');
        handleOpenMockExam();
      }
    } catch {}
  }, [handleOpenMockExam]);

  // Category Questions & Task Groups
  const [categoryQuestions, setCategoryQuestions] = useState<(QuizQuestion & { chapterId: string })[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);

  const CHAPTERS_PER_PAGE = 12;
  const [visibleChapterCount, setVisibleChapterCount] = useState(CHAPTERS_PER_PAGE);

  // INLINE TEST RUNNER STATE
  const [activeInlineTest, setActiveInlineTest] = useState<HistoryTest | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);

  // Anti-cheating & Tab Switch tracking
  const { tabSwitchCount, switchCountRef } = useAntiCheating({
    isActive: Boolean(activeInlineTest) && !isTestFinished,
    onViolation: useCallback((count: number) => {
      if (count >= 3 && activeInlineTest && !isTestFinished) {
        handleFinishInlineTest();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeInlineTest, isTestFinished])
  });

  // Chronology & Open Text state
  const [chronologyOrders, setChronologyOrders] = useState<Record<number, string[]>>({});
  const [chronologyChecked, setChronologyChecked] = useState<Record<number, boolean>>({});
  const [openTextAnswers, setOpenTextAnswers] = useState<Record<number, string>>({});
  const [openTextChecked, setOpenTextChecked] = useState<Record<number, boolean>>({});
  const [openTextScores, setOpenTextScores] = useState<Record<number, { score: number; maxScore: number; feedback: string; correctAnswer: string }>>({});
  const [openTextGrading, setOpenTextGrading] = useState<Record<number, boolean>>({});
  const [openTextError, setOpenTextError] = useState<Record<number, string>>({});

  const userEmail = user?.email || 'guest_user';

  // =========================================================================
  // 4.3 Routing & Browser History (Back/Forward) Sync for /tests
  // =========================================================================
  const syncTestsUrl = useCallback(
    (catKey: string | null, chId: string, isRunning: boolean, replace = false) => {
      try {
        if (window.location.pathname !== '/tests') return;
        const params = new URLSearchParams();
        if (catKey) params.set('category', catKey);
        if (catKey && chId) params.set('chapter', chId);
        if (isRunning) params.set('running', '1');
        const qs = params.toString();
        const nextUrl = qs ? `/tests?${qs}` : '/tests';
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (currentUrl !== nextUrl) {
          if (replace) {
            window.history.replaceState({ tab: 'tests', catKey, chId, isRunning }, '', nextUrl);
          } else {
            window.history.pushState({ tab: 'tests', catKey, chId, isRunning }, '', nextUrl);
          }
        }
      } catch {}
    },
    []
  );

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname !== '/tests') return;
      const sp = new URLSearchParams(window.location.search);
      const urlCat = sp.get('category');
      const urlCh = sp.get('chapter') || (urlCat === 'mcq' ? 'ch-1' : 'all');
      const urlRunning = sp.get('running') === '1';

      if (!urlRunning && activeInlineTest) {
        setActiveInlineTest(null);
      }
      setSelectedCategoryKey(urlCat);
      setSelectedChapterId(urlCh);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeInlineTest]);

  // Load programs, total question counts per category, item details, and student progress
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const progs = await fetchProgramsAndSubprograms();
        if (isMounted) {
          setPrograms(progs);
          setLoading(false);
        }

        const catEntries = await Promise.all(
          TEST_CATEGORIES.map(async (cat) => {
            const count = await fetchCategoryQuestionsCount(cat.key);
            const details = await fetchCategoryItemDetails(cat.key);
            return { key: cat.key, count, details };
          })
        );

        if (isMounted) {
          const totalCounts: Record<string, number> = {};
          const detailsMap: Record<string, CategoryItemDetails> = {};
          catEntries.forEach(item => {
            totalCounts[item.key] = item.count;
            detailsMap[item.key] = item.details;
          });
          setCategoryTotalCounts(totalCounts);
          setCategoryItemDetailsMap(detailsMap);
        }

        const prog = await getStudentProgress(userEmail);
        if (isMounted) {
          setProgressData(prog);
        }
      } catch (err) {
        console.error('Error initializing TestsView:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [userEmail]);

  // Real-time Database Subscription: Listen ONLY to `mock_exams` table changes
  useEffect(() => {
    const channel = supabase
      .channel('tests-view-mock-exams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mock_exams' },
        () => {
          refreshMockBanner();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshMockBanner]);

  // Fetch questions when category changes & calculate chapter counts
  useEffect(() => {
    if (!selectedCategoryKey) {
      setCategoryQuestions([]);
      setTaskGroups([]);
      return;
    }

    const loadCategoryData = async () => {
      setLoading(true);
      try {
        if (selectedCategoryKey === 'mcq') {
          const counts = await fetchChapterCountsForCategory('mcq');
          setCategoryQuestions([]);
          setQuestionsCountMap(counts);
        } else {
          const allQ = await fetchQuestionsForCategory(selectedCategoryKey);
          setCategoryQuestions(allQ);

          const counts: Record<string, number> = {};
          allQ.forEach(q => {
            counts[q.chapterId] = (counts[q.chapterId] || 0) + 1;
          });
          setQuestionsCountMap(counts);
        }
      } catch (err) {
        console.error('Error loading category questions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [selectedCategoryKey]);

  // Update Task Groups when selectedChapterId or categoryQuestions change
  useEffect(() => {
    if (!selectedCategoryKey || selectedCategoryKey === 'mcq' || selectedCategoryKey === 'chronology') {
      setTaskGroups([]);
      return;
    }

    const targetNum = Number(String(selectedChapterId).replace(/[^0-9]/g, ''));
    const chapterQuestions = categoryQuestions.filter(q => {
      if (selectedChapterId === 'all') return true;
      const qNum = Number(String(q.chapterId).replace(/[^0-9]/g, ''));
      return qNum === targetNum || q.chapterId === selectedChapterId || q.chapterId === `ch-${selectedChapterId.replace('ch-', '')}`;
    });

    if (chapterQuestions.length === 0) {
      setTaskGroups([]);
      return;
    }

    const groupMap = new Map<string, (QuizQuestion & { chapterId: string })[]>();

    chapterQuestions.forEach((q, idx) => {
      let groupKey = '';
      if (q.parentItemNumber) {
        groupKey = `parent-${q.parentItemNumber}`;
      } else if (q.itemNumber) {
        groupKey = `item-${q.itemNumber}`;
      } else if (selectedCategoryKey === 'map' || selectedCategoryKey === 'illustrations') {
        groupKey = q.mapImage || `q-${idx}`;
      } else if (selectedCategoryKey === 'source' || selectedCategoryKey === 'analogies') {
        groupKey = q.sourceContext?.substring(0, 100) || `q-${idx}`;
      } else {
        groupKey = `q-${idx}`;
      }

      if (selectedChapterId === 'all') {
        groupKey = `${q.chapterId}_${groupKey}`;
      }

      const existing = groupMap.get(groupKey) || [];
      existing.push(q);
      groupMap.set(groupKey, existing);
    });

    const groups: TaskGroup[] = Array.from(groupMap.entries()).map(([, qList], index) => {
      const firstQ = qList[0];
      const itemNum = firstQ.parentItemNumber || firstQ.itemNumber || (index + 1);
      let taskTitle = '';

      if (selectedCategoryKey === 'map') taskTitle = `რუკა N${itemNum}`;
      else if (selectedCategoryKey === 'analogies') taskTitle = `ანალოგია N${itemNum}`;
      else if (selectedCategoryKey === 'source') taskTitle = `წყარო N${itemNum}`;
      else if (selectedCategoryKey === 'illustrations') taskTitle = `ილუსტრაცია N${itemNum}`;
      else taskTitle = `დავალება N${itemNum}`;

      return {
        id: `task-${selectedCategoryKey}-${itemNum}-${index}`,
        title: taskTitle,
        subtitle: `${qList.length} შეკითხვა დავალებაში`,
        image: firstQ.mapImage,
        sourceContext: firstQ.sourceContext,
        itemNumber: itemNum,
        questions: qList
      };
    });

    setTaskGroups(groups);
  }, [selectedCategoryKey, selectedChapterId, categoryQuestions]);

  // ============================================================
  // Session Auto-Save
  // ============================================================
  const SESSION_KEY = `nt_test_session_${userEmail}`;

  const saveSession = useCallback((patch: Record<string, unknown>) => {
    try {
      const existing = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
      const nextPatch = { ...patch };
      if (nextPatch.activeInlineTest) {
        nextPatch.activeInlineTest = sanitizeTestForSessionStorage(nextPatch.activeInlineTest as HistoryTest);
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...nextPatch }));
    } catch {}
  }, [SESSION_KEY]);

  const clearSession = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }, [SESSION_KEY]);

  // Restore session on mount (once) and re-hydrate answer keys in memory
  useEffect(() => {
    let isMounted = true;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.activeInlineTest && s.selectedCategoryKey) {
        setSelectedCategoryKey(s.selectedCategoryKey);
        setSelectedChapterId(s.selectedChapterId || 'all');
        setCurrentQIndex(s.currentQIndex ?? 0);
        setSelectedAnswers(s.selectedAnswers ?? []);
        setIsTestFinished(s.isTestFinished ?? false);
        setChronologyOrders(s.chronologyOrders ?? {});
        setChronologyChecked(s.chronologyChecked ?? {});
        setOpenTextAnswers(s.openTextAnswers ?? {});
        setOpenTextChecked(s.openTextChecked ?? {});

        hydrateTestQuestionsFromVault(s.activeInlineTest, s.selectedCategoryKey).then((hydrated) => {
          if (isMounted) {
            setActiveInlineTest(hydrated);
            syncTestsUrl(s.selectedCategoryKey, s.selectedChapterId || 'all', true, true);
          }
        });
      }
    } catch {}
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitFullscreen = () => {
    try {
      const doc = document as any;
      (doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.mozCancelFullScreen)?.call(doc);
    } catch {}
  };

  const handleSelectCategory = (key: string) => {
    const defaultCh = key === 'mcq' ? 'ch-1' : (!isLoggedIn ? 'ch-1' : 'all');
    setSelectedCategoryKey(key);
    setSelectedChapterId(defaultCh);
    setActiveInlineTest(null);
    setVisibleChapterCount(CHAPTERS_PER_PAGE);
    clearSession();
    syncTestsUrl(key, defaultCh, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
    setSelectedCategoryKey(null);
    setActiveInlineTest(null);
    clearSession();
    syncTestsUrl(null, 'all', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChapterId = (chId: string) => {
    setSelectedChapterId(chId);
    syncTestsUrl(selectedCategoryKey, chId, false, true);
  };

  // Start an Inline Test
  const startInlineTest = (testObj: HistoryTest) => {
    setActiveInlineTest(testObj);
    setCurrentQIndex(0);
    const initAnswers = new Array(testObj.questions.length).fill(-1);
    setSelectedAnswers(initAnswers);
    setIsTestFinished(false);

    const initChronOrders: Record<number, string[]> = {};
    testObj.questions.forEach((q, idx) => {
      if (q.questionType === 'chronology' && q.chronologyItems && q.chronologyItems.length > 0) {
        initChronOrders[idx] = [...q.chronologyItems];
      }
    });
    setChronologyOrders(initChronOrders);
    setChronologyChecked({});
    setOpenTextAnswers({});
    setOpenTextChecked({});

    saveSession({
      activeInlineTest: testObj,
      selectedCategoryKey,
      selectedChapterId,
      currentQIndex: 0,
      selectedAnswers: initAnswers,
      isTestFinished: false,
      chronologyOrders: initChronOrders,
      chronologyChecked: {},
      openTextAnswers: {},
      openTextChecked: {}
    });

    syncTestsUrl(selectedCategoryKey, selectedChapterId, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitInlineTest = () => {
    setActiveInlineTest(null);
    clearSession();
    syncTestsUrl(selectedCategoryKey, selectedChapterId, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartRandomTest = async () => {
    if (!selectedCategoryKey) return;
    if (!isLoggedIn && selectedCategoryKey !== 'mcq' && selectedCategoryKey !== 'chronology') {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setLoading(true);
    try {
      const testObj = await buildHistoryTest(selectedCategoryKey, 'all');
      startInlineTest(testObj);
    } catch (err) {
      console.error('Error starting random test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChapterTest = async (chId: string) => {
    if (!selectedCategoryKey) return;
    if (!isLoggedIn && selectedCategoryKey !== 'mcq' && selectedCategoryKey !== 'chronology' && chId !== 'ch-1') {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setLoading(true);
    try {
      const testObj = await buildHistoryTest(selectedCategoryKey, chId);
      startInlineTest(testObj);
    } catch (err) {
      console.error('Error starting chapter test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTaskGroupTest = (task: TaskGroup) => {
    if (!isLoggedIn && selectedCategoryKey !== 'mcq' && selectedCategoryKey !== 'chronology' && selectedChapterId !== 'ch-1') {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const catMeta = TEST_CATEGORIES.find(c => c.key === selectedCategoryKey);
    const testObj: HistoryTest = {
      id: task.id,
      title: `${catMeta?.title || 'დავალება'} — ${task.title}`,
      category: 'ეროვნული გამოცდები',
      difficulty: 'საგამოცდო',
      timeLimitMinutes: 0,
      questionCount: task.questions.length,
      description: task.subtitle || '',
      questions: task.questions
    };
    startInlineTest(testObj);
  };

  const handleResetCategoryProgress = async () => {
    if (!selectedCategoryKey) return;
    setIsResetting(true);
    try {
      const updated = await resetStudentProgress(userEmail, selectedCategoryKey, selectedChapterId);
      setProgressData(updated);
    } catch (err) {
      console.error('Error resetting progress:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const activeCategoryMeta = useMemo(
    () => TEST_CATEGORIES.find(c => c.key === selectedCategoryKey),
    [selectedCategoryKey]
  );

  const getChapterStats = (catKey: string, chId: string, totalQ: number) => {
    if (!progressData) return { correct: 0, incorrect: 0, unattempted: totalQ, total: totalQ, pct: 0 };
    const statKey = `${catKey}_${chId}`;
    const chapterStat = progressData.statsByChapter[statKey];

    const correct = chapterStat?.correctQuestionIds.length || 0;
    const incorrect = chapterStat?.incorrectQuestionIds.length || 0;
    const unattempted = Math.max(0, totalQ - (correct + incorrect));
    const pct = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;

    return { correct, incorrect, unattempted, total: totalQ, pct };
  };

  const chapterItemDisplayMap = useMemo(() => {
    const result: Record<string, string> = {};
    const { qPerItem, unitLabel } = getCategoryUnitInfo(selectedCategoryKey);

    for (const chId of Object.keys(questionsCountMap)) {
      const qCount = questionsCountMap[chId] ?? 0;

      if (qPerItem <= 1) {
        result[chId] = `${qCount} ${unitLabel}`;
        continue;
      }

      const chQuestions = categoryQuestions.filter(
        q => q.chapterId === chId || q.chapterId === `ch-${chId.replace('ch-', '')}`
      );

      let count = 0;
      if (chQuestions.length > 0) {
        const groupSet = new Set<string>();
        chQuestions.forEach((q, idx) => {
          let key = '';
          if (q.parentItemNumber) {
            key = `parent-${q.parentItemNumber}`;
          } else if (q.itemNumber) {
            key = `item-${q.itemNumber}`;
          } else if (selectedCategoryKey === 'map' || selectedCategoryKey === 'illustrations') {
            key = q.mapImage || `q-${idx}`;
          } else if (selectedCategoryKey === 'source' || selectedCategoryKey === 'analogies') {
            key = q.sourceContext?.substring(0, 100) || `q-${idx}`;
          } else {
            key = `q-${idx}`;
          }
          groupSet.add(key);
        });
        count = groupSet.size;
      } else {
        count = Math.round(qCount / qPerItem);
      }

      result[chId] = `${count} ${unitLabel}`;
    }
    return result;
  }, [categoryQuestions, questionsCountMap, selectedCategoryKey]);

  const getChapterItemDisplay = (chId: string) =>
    chapterItemDisplayMap[chId] ?? `0 ${getCategoryUnitInfo(selectedCategoryKey).unitLabel}`;

  // INLINE TEST RUNNER HANDLERS
  const handleSelectOptionInline = (optIndex: number) => {
    if (!activeInlineTest || isTestFinished) return;
    if (selectedAnswers[currentQIndex] !== -1) return;

    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);

    const currentQ = activeInlineTest.questions[currentQIndex];
    if (currentQ && selectedCategoryKey) {
      const isCorrect = optIndex === currentQ.correctAnswerIndex;
      const chId = currentQ.chapterId || selectedChapterId || 'ch-1';

      const optimisticUpdate = (prev: typeof progressData) => {
        if (!prev) return prev;
        const statKey = `${selectedCategoryKey}_${chId}`;
        const existing = prev.statsByChapter[statKey];
        const correctIds = new Set(existing?.correctQuestionIds || []);
        const incorrectIds = new Set(existing?.incorrectQuestionIds || []);
        if (isCorrect) { correctIds.add(currentQ.id); incorrectIds.delete(currentQ.id); }
        else { incorrectIds.add(currentQ.id); correctIds.delete(currentQ.id); }
        return {
          ...prev,
          statsByChapter: {
            ...prev.statsByChapter,
            [statKey]: {
              ...(existing || {}),
              correctQuestionIds: [...correctIds],
              incorrectQuestionIds: [...incorrectIds]
            }
          }
        };
      };
      setProgressData(optimisticUpdate as any);

      recordUserAnswers(userEmail, selectedCategoryKey, chId, [
        { questionId: currentQ.id, isCorrect, selectedOptionIndex: optIndex }
      ]).then(setProgressData).catch(err => {
        console.error('recordUserAnswers failed:', err);
      });
    }

    saveSession({ selectedAnswers: updated, currentQIndex });
  };

  // Support deep-linking from ProfileView ("გაიმეორე ეს თემა")
  useEffect(() => {
    if (initialCategoryKey) {
      const ch = initialChapterId || 'ch-1';
      setSelectedCategoryKey(initialCategoryKey);
      setSelectedChapterId(ch);
      setActiveInlineTest(null);
      syncTestsUrl(initialCategoryKey, ch, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (onClearInitialTarget) onClearInitialTarget();
    }
  }, [initialCategoryKey, initialChapterId, onClearInitialTarget, syncTestsUrl]);

  // 3.2 Keyboard Shortcuts for Inline Test Runner
  useEffect(() => {
    if (!activeInlineTest || isTestFinished || inlineLightboxUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toUpperCase() || '';
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const totalQ = activeInlineTest.questions.length;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentQIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentQIndex(prev => Math.min(totalQ - 1, prev + 1));
        return;
      }

      const currentQ = activeInlineTest.questions[currentQIndex];
      if (!currentQ || (currentQ.questionType && currentQ.questionType !== 'mcq')) return;

      const keyMap: Record<string, number> = {
        '1': 0, 'a': 0, 'A': 0, 'ა': 0,
        '2': 1, 'b': 1, 'B': 1, 'ბ': 1,
        '3': 2, 'c': 2, 'C': 2, 'გ': 2,
        '4': 3, 'd': 3, 'D': 3, 'დ': 3
      };

      if (e.key in keyMap) {
        const optIdx = keyMap[e.key];
        if (currentQ.options && optIdx < currentQ.options.length) {
          e.preventDefault();
          handleSelectOptionInline(optIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInlineTest, isTestFinished, currentQIndex, selectedAnswers, inlineLightboxUrl]);

  const handleMoveChronologyItem = (fromIdx: number, toIdx: number) => {
    if (!activeInlineTest || isTestFinished) return;
    const currentQ = activeInlineTest.questions[currentQIndex];
    const currentOrder = chronologyOrders[currentQIndex] || currentQ.chronologyItems || [];

    if (toIdx < 0 || toIdx >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    const temp = newOrder[fromIdx];
    newOrder[fromIdx] = newOrder[toIdx];
    newOrder[toIdx] = temp;

    setChronologyOrders({
      ...chronologyOrders,
      [currentQIndex]: newOrder
    });
  };

  const handleCheckChronology = () => {
    if (!activeInlineTest || isTestFinished) return;
    const currentQ = activeInlineTest.questions[currentQIndex];
    const currentOrder = chronologyOrders[currentQIndex] || currentQ.chronologyItems || [];

    const isCorrect = checkChronologyItemsMatch(
      currentOrder,
      currentQ.chronologyItems || [],
      currentQ.correctSequence || [0, 1, 2]
    );

    setChronologyChecked({ ...chronologyChecked, [currentQIndex]: true });

    if (currentQ && selectedCategoryKey) {
      const chId = currentQ.chapterId || selectedChapterId || 'ch-1';
      recordUserAnswers(userEmail, selectedCategoryKey, chId, [
        { questionId: currentQ.id, isCorrect, userAnswerText: currentOrder.join(' → ') }
      ]).then(setProgressData).catch(console.error);
    }
  };

  const handleCheckOpenText = async () => {
    if (!activeInlineTest || isTestFinished) return;
    const qIndex = currentQIndex;
    if (openTextGrading[qIndex]) return;
    const currentQ = activeInlineTest.questions[qIndex];
    const typed = openTextAnswers[qIndex] || '';

    const useAI = !!currentQ.maxScore && !!currentQ.sourceTable && AI_GRADED_TABLES.includes(currentQ.sourceTable);
    let isCorrect: boolean;

    if (useAI) {
      if (!user) {
        setOpenTextError(prev => ({ ...prev, [qIndex]: 'ამ დავალების შესასრულებლად საჭიროა ავტორიზაცია.' }));
        return;
      }
      setOpenTextGrading(prev => ({ ...prev, [qIndex]: true }));
      setOpenTextError(prev => ({ ...prev, [qIndex]: '' }));
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/grade-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ table: currentQ.sourceTable, questionId: currentQ.id, studentAnswer: typed })
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(res.status === 401 ? 'ავტორიზაცია საჭიროა. გთხოვთ ხელახლა შეხვიდეთ ანგარიშში.' : (body?.error || 'შეფასება ვერ მოხერხდა'));
        }
        const apiScore = Number(body.score);
        const apiMax = Number(body.maxScore);
        if (!Number.isFinite(apiScore) || !Number.isFinite(apiMax) || apiMax <= 0 || apiScore < 0 || apiScore > apiMax) {
          throw new Error('შეფასება ვერ მოხერხდა, სცადეთ თავიდან.');
        }
        setOpenTextScores(prev => ({
          ...prev,
          [qIndex]: {
            score: Number(body.score),
            maxScore: Number(body.maxScore),
            feedback: String(body.feedback || ''),
            correctAnswer: String(body.correctAnswer || currentQ.correctAnswerText || '')
          }
        }));
        isCorrect = Number(body.score) >= Number(body.maxScore);
      } catch (err: any) {
        console.error('AI grading failed:', err);
        setOpenTextError(prev => ({ ...prev, [qIndex]: err?.message || 'შეფასება ვერ მოხერხდა, სცადეთ თავიდან.' }));
        setOpenTextGrading(prev => ({ ...prev, [qIndex]: false }));
        return;
      }
      setOpenTextGrading(prev => ({ ...prev, [qIndex]: false }));
    } else {
      isCorrect = checkOpenAnswerMatch(typed, currentQ.correctAnswerText || '');
    }

    setOpenTextChecked(prev => ({ ...prev, [qIndex]: true }));

    if (currentQ && selectedCategoryKey) {
      const chId = currentQ.chapterId || selectedChapterId || 'ch-1';
      recordUserAnswers(userEmail, selectedCategoryKey, chId, [
        { questionId: currentQ.id, isCorrect, userAnswerText: typed }
      ]).then(setProgressData).catch(console.error);
    }
  };

  const handleRestartInlineTest = () => {
    if (!activeInlineTest) return;
    setCurrentQIndex(0);
    setSelectedAnswers(new Array(activeInlineTest.questions.length).fill(-1));
    setIsTestFinished(false);
    setOpenTextAnswers({});
    setOpenTextChecked({});
    setOpenTextScores({});
    setOpenTextGrading({});
    setOpenTextError({});

    const initChronOrders: Record<number, string[]> = {};
    activeInlineTest.questions.forEach((q, idx) => {
      if (q.questionType === 'chronology' && q.chronologyItems && q.chronologyItems.length > 0) {
        initChronOrders[idx] = [...q.chronologyItems];
      }
    });
    setChronologyOrders(initChronOrders);
    setChronologyChecked({});
    clearSession();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishInlineTest = () => {
    if (!activeInlineTest) return;
    setIsTestFinished(true);
    clearSession();
    exitFullscreen();

    const resultsByChapter: Record<string, { questionId: string; isCorrect: boolean; selectedOptionIndex?: number; userAnswerText?: string }[]> = {};

    activeInlineTest.questions.forEach((q, idx) => {
      let isCorrect = false;
      let selectedOptionIndex: number | undefined;
      let userAnswerText: string | undefined;

      if (q.questionType === 'chronology') {
        const order = chronologyOrders[idx] || q.chronologyItems || [];
        isCorrect = checkChronologyItemsMatch(order, q.chronologyItems || [], q.correctSequence || [0, 1, 2]);
      } else if (q.questionType === 'open_text') {
        const typed = openTextAnswers[idx] || '';
        userAnswerText = typed;
        const graded = openTextScores[idx];
        isCorrect = graded
          ? graded.score >= graded.maxScore
          : (!q.maxScore && checkOpenAnswerMatch(typed, q.correctAnswerText || ''));
      } else {
        selectedOptionIndex = selectedAnswers[idx];
        isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
      }

      const chId = q.chapterId || selectedChapterId || 'ch-1';
      if (!resultsByChapter[chId]) {
        resultsByChapter[chId] = [];
      }
      resultsByChapter[chId].push({
        questionId: q.id,
        isCorrect,
        selectedOptionIndex,
        userAnswerText
      });
    });

    const catKey = selectedCategoryKey || 'mcq';
    Object.entries(resultsByChapter).forEach(([chId, resList]) => {
      recordUserAnswers(userEmail, catKey, chId, resList)
        .then(setProgressData)
        .catch(console.error);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activeMockExam) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <MockExamStudentView
          exam={activeMockExam}
          serverTimeOffsetMs={serverTimeOffsetMs}
          onExit={() => {
            setActiveMockExam(null);
            refreshMockBanner();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onTimeExpired={() => {
            setActiveMockExam(null);
            refreshMockBanner();
            if (onNavigateHome) {
              onNavigateHome();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-24 py-6 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[#C79B3A]">
            <div className="w-6 h-6 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-[#666666]">ბაზიდან ტვირთვა...</span>
          </div>
        </div>
      )}

      {activeInlineTest ? (
        <div className="space-y-8 animate-fade-in">
          {/* Top Test Header Bar */}
          <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
            <button
              onClick={handleExitInlineTest}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#13253D] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-[#C79B3A]" />
              <span>ტესტებში დაბრუნება</span>
            </button>

            <span className="px-3.5 py-1 bg-[#0D1B2A] text-[#FAF8F3] text-xs font-bold rounded-full font-mono">
              შეკითხვა {currentQIndex + 1} / {activeInlineTest.questions.length}
            </span>
          </div>

          {!isTestFinished ? (
            <InlineTestRunner
              activeInlineTest={activeInlineTest}
              selectedCategoryKey={selectedCategoryKey}
              currentQIndex={currentQIndex}
              selectedAnswers={selectedAnswers}
              tabSwitchCount={tabSwitchCount}
              chronologyOrders={chronologyOrders}
              chronologyChecked={chronologyChecked}
              openTextAnswers={openTextAnswers}
              openTextChecked={openTextChecked}
              openTextScores={openTextScores}
              openTextGrading={openTextGrading}
              openTextError={openTextError}
              onSelectQuestionIndex={setCurrentQIndex}
              onSelectOptionInline={handleSelectOptionInline}
              onMoveChronologyItem={handleMoveChronologyItem}
              onCheckChronology={handleCheckChronology}
              onChangeOpenTextAnswer={(qIdx, val) => setOpenTextAnswers({ ...openTextAnswers, [qIdx]: val })}
              onCheckOpenText={handleCheckOpenText}
              onFinishTest={handleFinishInlineTest}
              onOpenLightbox={(url) => {
                setInlineLightboxZoom(1);
                setInlineLightboxUrl(url);
              }}
            />
          ) : (
            <InlineTestSummary
              activeInlineTest={activeInlineTest}
              selectedAnswers={selectedAnswers}
              chronologyOrders={chronologyOrders}
              openTextAnswers={openTextAnswers}
              openTextScores={openTextScores}
              switchCount={switchCountRef.current}
              onRestartTest={handleRestartInlineTest}
              onExitToTests={handleExitInlineTest}
            />
          )}

          <QuestionImageLightbox
            imageUrl={inlineLightboxUrl}
            zoom={inlineLightboxZoom}
            onZoomChange={setInlineLightboxZoom}
            onResetZoom={() => setInlineLightboxZoom(1)}
            onClose={() => setInlineLightboxUrl(null)}
          />
        </div>
      ) : (
        <>
          {!loading && !selectedCategoryKey ? (
            <TestCategoryGrid
              loading={loading}
              isLoggedIn={isLoggedIn}
              isMockExamActive={isMockExamActive}
              mockBanner={mockBanner}
              openingMockExam={openingMockExam}
              categoryItemDetailsMap={categoryItemDetailsMap}
              onOpenMockExam={handleOpenMockExam}
              onSelectCategory={handleSelectCategory}
            />
          ) : !loading && selectedCategoryKey ? (
            <TestChapterSelector
              selectedCategoryKey={selectedCategoryKey}
              activeCategoryMeta={activeCategoryMeta}
              programs={programs}
              selectedChapterId={selectedChapterId}
              visibleChapterCount={visibleChapterCount}
              isLoggedIn={isLoggedIn}
              loading={loading}
              isResetting={isResetting}
              categoryItemDetailsMap={categoryItemDetailsMap}
              categoryTotalCounts={categoryTotalCounts}
              categoryQuestionsLength={categoryQuestions.length}
              questionsCountMap={questionsCountMap}
              taskGroups={taskGroups}
              onBackToCategories={handleBackToCategories}
              onSelectChapterId={handleSelectChapterId}
              onStartRandomTest={handleStartRandomTest}
              onStartChapterTest={handleStartChapterTest}
              onStartTaskGroupTest={handleStartTaskGroupTest}
              onResetCategoryProgress={handleResetCategoryProgress}
              onOpenAuth={onOpenAuth}
              getChapterStats={getChapterStats}
              getChapterItemDisplay={getChapterItemDisplay}
            />
          ) : null}
        </>
      )}
    </div>
  );
};
