import React, { useState, useEffect } from 'react';
import { HistoryTest, QuizQuestion } from '../types';

import { 
  TEST_CATEGORIES, 
  ProgramChapter, 
  fetchProgramsAndSubprograms, 
  fetchQuestionsForCategory, 
  fetchCategoryQuestionsCount,
  fetchCategoryItemDetails,
  CategoryItemDetails,
  getCategoryUnitInfo,
  buildHistoryTest 
} from '../lib/testService';
import { supabase } from '../lib/supabase';
import { 
  getStudentProgress, 
  recordUserAnswers,
  resetStudentProgress, 
  StudentProfileProgress 
} from '../lib/progressService';
import { 
  BookOpen, 
  MapPin, 
  Layers, 
  FileText, 
  Clock, 
  Image as ImageIcon, 
  ArrowRight, 
  Shuffle, 
  BookMarked, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronLeft, 
  Sparkles,
  Database,
  Award,
  Check,
  X,
  Play,
  ArrowUp,
  ArrowDown,
  Send,
  Lock,
  UserCheck,
  ShieldAlert,
  LogIn
} from 'lucide-react';

interface TestsViewProps {
  onOpenTest?: (test: HistoryTest) => void;
  user?: { name: string; email: string } | null;
  onOpenAuth?: () => void;
}

interface TaskGroup {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  sourceContext?: string;
  itemNumber?: number;
  questions: (QuizQuestion & { chapterId: string })[];
}

// Fuzzy text matching helper for open-ended questions
const checkOpenAnswerMatch = (userInput: string, correctAnswer: string): boolean => {
  if (!userInput || !correctAnswer) return false;

  const normalize = (str: string) => str.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'„“«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normUser = normalize(userInput);
  const normCorrect = normalize(correctAnswer);

  if (normUser === normCorrect) return true;
  if (normUser.includes(normCorrect) || normCorrect.includes(normUser)) return true;

  // Keyword match check
  const keywords = normCorrect.split(' ').filter(w => w.length > 2);
  if (keywords.length > 0) {
    const matchedCount = keywords.filter(w => normUser.includes(w)).length;
    if (matchedCount / keywords.length >= 0.4) {
      return true;
    }
  }

  return false;
};

// Chronology sequence matching helper
const checkChronologyItemsMatch = (
  userItemsOrder: string[], 
  originalItems: string[], 
  correctSeq: number[]
): boolean => {
  if (!userItemsOrder || !originalItems || !correctSeq) return false;

  const expectedOrder = correctSeq.map(seqIdx => {
    const idx = seqIdx > 0 && seqIdx <= originalItems.length ? seqIdx - 1 : seqIdx;
    return originalItems[idx] || '';
  });

  return userItemsOrder.every((item, i) => item === expectedOrder[i]);
};

export const TestsView: React.FC<TestsViewProps> = ({ onOpenTest, user, onOpenAuth }) => {
  const isLoggedIn = !!(user && user.email);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramChapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [questionsCountMap, setQuestionsCountMap] = useState<Record<string, number>>({});
  const [categoryTotalCounts, setCategoryTotalCounts] = useState<Record<string, number>>({});
  const [categoryItemDetailsMap, setCategoryItemDetailsMap] = useState<Record<string, CategoryItemDetails>>({});
  const [progressData, setProgressData] = useState<StudentProfileProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Category Questions & Task Groups for Maps/Analogies/Sources/Illustrations
  const [categoryQuestions, setCategoryQuestions] = useState<(QuizQuestion & { chapterId: string })[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);

  // INLINE TEST RUNNER STATE
  const [activeInlineTest, setActiveInlineTest] = useState<HistoryTest | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);

  // Chronology interactive reordering state (current item sequence per question index)
  const [chronologyOrders, setChronologyOrders] = useState<Record<number, string[]>>({});
  const [chronologyChecked, setChronologyChecked] = useState<Record<number, boolean>>({});

  // Open-ended typed text state
  const [openTextAnswers, setOpenTextAnswers] = useState<Record<number, string>>({});
  const [openTextChecked, setOpenTextChecked] = useState<Record<number, boolean>>({});

  const userEmail = user?.email || 'guest_user';

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

  // Real-time Database Subscription: Automatically sync new questions/updates in real time!
  useEffect(() => {
    const channel = supabase
      .channel('public-db-questions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async () => {
          // Re-fetch counts and details
          const catEntries = await Promise.all(
            TEST_CATEGORIES.map(async (cat) => {
              const count = await fetchCategoryQuestionsCount(cat.key);
              const details = await fetchCategoryItemDetails(cat.key);
              return { key: cat.key, count, details };
            })
          );

          const totalCounts: Record<string, number> = {};
          const detailsMap: Record<string, CategoryItemDetails> = {};
          catEntries.forEach(item => {
            totalCounts[item.key] = item.count;
            detailsMap[item.key] = item.details;
          });
          setCategoryTotalCounts(totalCounts);
          setCategoryItemDetailsMap(detailsMap);

          // If a category is active, re-fetch questions
          if (selectedCategoryKey) {
            const allQ = await fetchQuestionsForCategory(selectedCategoryKey);
            setCategoryQuestions(allQ);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategoryKey]);

  // Fetch questions when category changes & calculate chapter counts + Task Groups
  useEffect(() => {
    if (!selectedCategoryKey) {
      setCategoryQuestions([]);
      setTaskGroups([]);
      return;
    }

    const loadCategoryData = async () => {
      setLoading(true);
      try {
        const allQ = await fetchQuestionsForCategory(selectedCategoryKey);
        setCategoryQuestions(allQ);

        const counts: Record<string, number> = {};
        allQ.forEach(q => {
          counts[q.chapterId] = (counts[q.chapterId] || 0) + 1;
        });
        setQuestionsCountMap(counts);
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

    // Group questions by parentItemNumber (e.g. map_number, source_number, analogy_number, illustration_number)
    const groupMap = new Map<string, (QuizQuestion & { chapterId: string })[]>();
    
    chapterQuestions.forEach((q, idx) => {
      let groupKey = '';
      if (q.parentItemNumber) {
        groupKey = `parent-${q.parentItemNumber}`;
      } else if (selectedCategoryKey === 'map' || selectedCategoryKey === 'illustrations') {
        groupKey = q.mapImage || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
      } else if (selectedCategoryKey === 'source' || selectedCategoryKey === 'analogies') {
        groupKey = q.sourceContext?.substring(0, 100) || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
      } else {
        groupKey = q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`;
      }

      if (selectedChapterId === 'all') {
        groupKey = `${q.chapterId}_${groupKey}`;
      }

      const existing = groupMap.get(groupKey) || [];
      existing.push(q);
      groupMap.set(groupKey, existing);
    });

    const groups: TaskGroup[] = Array.from(groupMap.entries()).map(([key, qList], index) => {
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

  const handleSelectCategory = (key: string) => {
    setSelectedCategoryKey(key);
    if (key === 'mcq') {
      setSelectedChapterId('ch-1');
    } else {
      setSelectedChapterId(!isLoggedIn ? 'ch-1' : 'all');
    }
    setActiveInlineTest(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start an Inline Test
  const startInlineTest = (testObj: HistoryTest) => {
    setActiveInlineTest(testObj);
    setCurrentQIndex(0);
    setSelectedAnswers(new Array(testObj.questions.length).fill(-1));
    setIsTestFinished(false);

    // Initialize chronology order arrays for questions
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

  const getCategoryIcon = (key: string) => {
    const iconClass = "w-6 h-6 text-[#C79B3A] group-hover:text-white transition-colors duration-300";
    switch (key) {
      case 'mcq': return <BookOpen className={iconClass} />;
      case 'map': return <MapPin className={iconClass} />;
      case 'analogies': return <Layers className={iconClass} />;
      case 'source': return <FileText className={iconClass} />;
      case 'chronology': return <Clock className={iconClass} />;
      case 'illustrations': return <ImageIcon className={iconClass} />;
      default: return <BookOpen className={iconClass} />;
    }
  };

  const activeCategoryMeta = TEST_CATEGORIES.find(c => c.key === selectedCategoryKey);

  // Helper to compute stats for a specific chapter
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

  // Helper to format chapter item count display in dropdown (maps, sources, analogies, illustrations, questions)
  const getChapterItemDisplay = (chId: string) => {
    const qCount = questionsCountMap[chId] ?? 0;
    const { qPerItem, unitLabel } = getCategoryUnitInfo(selectedCategoryKey);

    if (qPerItem <= 1) {
      return `${qCount} ${unitLabel}`;
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
        } else if (selectedCategoryKey === 'map' || selectedCategoryKey === 'illustrations') {
          key = q.mapImage || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
        } else if (selectedCategoryKey === 'source' || selectedCategoryKey === 'analogies') {
          key = q.sourceContext?.substring(0, 100) || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
        } else {
          key = q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`;
        }
        groupSet.add(key);
      });
      count = groupSet.size;
    } else {
      count = Math.round(qCount / qPerItem);
    }

    return `${count} ${unitLabel}`;
  };

  // INLINE TEST RUNNER HANDLERS
  const handleSelectOptionInline = (optIndex: number) => {
    if (!activeInlineTest || isTestFinished) return;
    const updated = [...selectedAnswers];
    updated[currentQIndex] = optIndex;
    setSelectedAnswers(updated);

    const currentQ = activeInlineTest.questions[currentQIndex];
    if (currentQ && selectedCategoryKey) {
      const isCorrect = optIndex === currentQ.correctAnswerIndex;
      const chId = currentQ.chapterId || selectedChapterId || 'ch-1';
      recordUserAnswers(userEmail, selectedCategoryKey, chId, [
        { questionId: currentQ.id, isCorrect }
      ]).then(setProgressData).catch(console.error);
    }
  };

  // CHRONOLOGY MOVE HANDLERS (Mouse move up / move down 3 items)
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
        { questionId: currentQ.id, isCorrect }
      ]).then(setProgressData).catch(console.error);
    }
  };

  // OPEN TEXT SUBMIT HANDLER
  const handleCheckOpenText = () => {
    if (!activeInlineTest || isTestFinished) return;
    const currentQ = activeInlineTest.questions[currentQIndex];
    const typed = openTextAnswers[currentQIndex] || '';

    const isCorrect = checkOpenAnswerMatch(typed, currentQ.correctAnswerText || '');
    setOpenTextChecked({ ...openTextChecked, [currentQIndex]: true });

    if (currentQ && selectedCategoryKey) {
      const chId = currentQ.chapterId || selectedChapterId || 'ch-1';
      recordUserAnswers(userEmail, selectedCategoryKey, chId, [
        { questionId: currentQ.id, isCorrect }
      ]).then(setProgressData).catch(console.error);
    }
  };

  // Restart active inline test completely (clears typed open answers, chronology orders, and choices)
  const handleRestartInlineTest = () => {
    if (!activeInlineTest) return;
    setCurrentQIndex(0);
    setSelectedAnswers(new Array(activeInlineTest.questions.length).fill(-1));
    setIsTestFinished(false);

    // Completely clear all open-ended answers and checked states
    setOpenTextAnswers({});
    setOpenTextChecked({});

    // Completely reset all chronology orders and checked states
    const initChronOrders: Record<number, string[]> = {};
    activeInlineTest.questions.forEach((q, idx) => {
      if (q.questionType === 'chronology' && q.chronologyItems && q.chronologyItems.length > 0) {
        initChronOrders[idx] = [...q.chronologyItems];
      }
    });
    setChronologyOrders(initChronOrders);
    setChronologyChecked({});

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishInlineTest = () => {
    if (!activeInlineTest) return;
    setIsTestFinished(true);

    const resultsByChapter: Record<string, { questionId: string; isCorrect: boolean }[]> = {};

    activeInlineTest.questions.forEach((q, idx) => {
      let isCorrect = false;

      if (q.questionType === 'chronology') {
        const order = chronologyOrders[idx] || q.chronologyItems || [];
        isCorrect = checkChronologyItemsMatch(order, q.chronologyItems || [], q.correctSequence || [0, 1, 2]);
      } else if (q.questionType === 'open_text') {
        const typed = openTextAnswers[idx] || '';
        isCorrect = checkOpenAnswerMatch(typed, q.correctAnswerText || '');
      } else {
        isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
      }

      const chId = q.chapterId || selectedChapterId || 'ch-1';
      if (!resultsByChapter[chId]) {
        resultsByChapter[chId] = [];
      }
      resultsByChapter[chId].push({
        questionId: q.id,
        isCorrect
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

      {/* INLINE TEST RUNNER VIEW (When a test is active) */}
      {activeInlineTest ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Test Header Bar */}
          <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
            <button
              onClick={() => setActiveInlineTest(null)}
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
            /* ACTIVE INLINE QUESTION VIEW */
            <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] p-6 sm:p-10 space-y-8 shadow-md">
              
              {/* Question Header & Title */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {activeInlineTest.title}
                  </span>

                  {/* Question Badge displaying parent/item number e.g. რუკა N4.1 */}
                  {(() => {
                    const q = activeInlineTest.questions[currentQIndex];
                    if (!q) return null;
                    const num = q.itemNumber || (currentQIndex + 1);
                    const displayNum = q.parentItemNumber ? `${q.parentItemNumber}.${num}` : `${num}`;
                    let label = `კითხვა N${displayNum}`;
                    if (q.questionType === 'chronology') label = `ქრონოლოგია N${num}`;
                    else if (selectedCategoryKey === 'map') label = `რუკა N${displayNum}`;
                    else if (selectedCategoryKey === 'analogies') label = `ანალოგია N${displayNum}`;
                    else if (selectedCategoryKey === 'source') label = `წყარო N${displayNum}`;
                    else if (selectedCategoryKey === 'illustrations') label = `ილუსტრაცია N${displayNum}`;

                    return (
                      <span className="px-3.5 py-1 bg-[#0D1B2A] text-[#C79B3A] text-xs font-mono font-bold rounded-full border border-[#C79B3A]/40 shadow-xs">
                        {label}
                      </span>
                    );
                  })()}
                </div>

                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A] leading-snug">
                  {activeInlineTest.questions[currentQIndex]?.prompt}
                </h2>
              </div>

              {/* Source Context Text if present */}
              {activeInlineTest.questions[currentQIndex]?.sourceContext && (
                <div className="p-6 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] space-y-2 shadow-inner">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#C79B3A] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> ტექსტური წყარო / კონტექსტი:
                  </span>
                  <p className="font-serif italic text-sm sm:text-base text-[#0D1B2A] leading-relaxed whitespace-pre-line">
                    {activeInlineTest.questions[currentQIndex]?.sourceContext}
                  </p>
                </div>
              )}

              {/* Map / Illustration Image if present */}
              {activeInlineTest.questions[currentQIndex]?.mapImage && (
                <div className="rounded-2xl overflow-hidden border border-[#E6DDCB] shadow-md bg-[#0D1B2A] max-h-[480px]">
                  <img 
                    src={activeInlineTest.questions[currentQIndex]?.mapImage} 
                    alt="დავალების სურათი/რუკა" 
                    className="w-full h-full object-contain max-h-[480px] mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* QUESTION TYPE RENDERERS */}
              {(() => {
                const currentQ = activeInlineTest.questions[currentQIndex];
                if (!currentQ) return null;

                /* 1. CHRONOLOGY ORDERING QUESTION TYPE (Mouse Reorder 3 Items) */
                if (currentQ.questionType === 'chronology') {
                  const currentItems = chronologyOrders[currentQIndex] || currentQ.chronologyItems || [];
                  const isChecked = chronologyChecked[currentQIndex];
                  const isCorrect = isChecked && checkChronologyItemsMatch(
                    currentItems, 
                    currentQ.chronologyItems || [], 
                    currentQ.correctSequence || [0, 1, 2]
                  );

                  return (
                    <div className="space-y-6 pt-4 border-t border-[#E6DDCB]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider block">
                            დაალაგეთ ქრონოლოგიური თანმიმდევრობა:
                          </span>

                          {/* Explicit Chronology Number Display (chronology_number) */}
                          <span className="px-3 py-1 bg-[#FAF8F3] text-[#0D1B2A] text-xs font-mono font-bold rounded-lg border border-[#C79B3A]/40 shadow-xs">
                            ქრონოლოგია N{currentQ.itemNumber || (currentQIndex + 1)}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666]">
                          ისრებით (▲ / ▼) გადააადგილეთ 3 მოვლენა სწორი თანმიმდევრობით (1-ლიდან 3-მდე).
                        </p>
                      </div>

                      <div className="space-y-3">
                        {currentItems.map((itemText, idx) => (
                          <div
                            key={idx}
                            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 bg-white shadow-xs ${
                              isChecked
                                ? isCorrect
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-rose-400 bg-rose-50'
                                : 'border-[#E6DDCB] hover:border-[#C79B3A]'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="w-8 h-8 rounded-xl bg-[#0D1B2A] text-[#C79B3A] text-xs font-bold flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="text-sm sm:text-base text-[#0D1B2A] font-medium leading-relaxed">
                                {itemText}
                              </span>
                            </div>

                            {!isChecked && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleMoveChronologyItem(idx, idx - 1)}
                                  disabled={idx === 0}
                                  className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#C79B3A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] transition-colors disabled:opacity-30 cursor-pointer"
                                  title="ზემოთ გადაადგილება"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleMoveChronologyItem(idx, idx + 1)}
                                  disabled={idx === currentItems.length - 1}
                                  className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#C79B3A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] transition-colors disabled:opacity-30 cursor-pointer"
                                  title="ქვემოთ გადაადგილება"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isChecked ? (
                        <button
                          onClick={handleCheckChronology}
                          className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>თანმიმდევრობის შემოწმება</span>
                        </button>
                      ) : (
                        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                          isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                          <span>
                            {isCorrect 
                              ? 'სწორია! თანმიმდევრობა ზუსტად არის დალაგებული.' 
                              : `არასწორია. სწორი თანმიმდევრობა: ${(currentQ.correctSequence || [1, 2, 3]).join(' ➔ ')}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                /* 2. OPEN-ENDED TYPED TEXT QUESTION TYPE */
                if (currentQ.questionType === 'open_text') {
                  const typed = openTextAnswers[currentQIndex] || '';
                  const isChecked = openTextChecked[currentQIndex];
                  const isCorrect = isChecked && checkOpenAnswerMatch(typed, currentQ.correctAnswerText || '');

                  return (
                    <div className="space-y-5 pt-4 border-t border-[#E6DDCB]">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider block">
                          ჩაწერეთ ღია პასუხი:
                        </label>
                        <p className="text-xs text-[#666666]">
                          შეიყვანეთ პასუხი ტექსტურად. ბაზის სწორ პასუხთან დაახლოებითი დამთხვევაც ჩაითვლება სწორად.
                        </p>
                      </div>

                      <textarea
                        value={typed}
                        disabled={isChecked}
                        onChange={(e) => setOpenTextAnswers({ ...openTextAnswers, [currentQIndex]: e.target.value })}
                        placeholder="ჩაწერეთ თქვენი პასუხი აქ..."
                        rows={3}
                        className="w-full bg-[#FAF8F3] border-2 border-[#E6DDCB] focus:border-[#C79B3A] rounded-2xl p-4 text-sm sm:text-base text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]/30 resize-none disabled:opacity-80"
                      />

                      {!isChecked ? (
                        <button
                          onClick={handleCheckOpenText}
                          disabled={!typed.trim()}
                          className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>პასუხის გაგზავნა</span>
                        </button>
                      ) : (
                        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${
                          isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          <div className="flex items-center gap-2">
                            {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                            <div>
                              <div>{isCorrect ? 'სწორია! თქვენი პასუხი ემთხვევა სწორ პასუხს.' : 'არასწორია.'}</div>
                              {currentQ.correctAnswerText && (
                                <div className="text-xs font-normal opacity-90 mt-0.5">
                                  ბაზის სწორი პასუხი: <strong>{currentQ.correctAnswerText}</strong>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setOpenTextChecked({ ...openTextChecked, [currentQIndex]: false });
                              setOpenTextAnswers({ ...openTextAnswers, [currentQIndex]: '' });
                            }}
                            className="px-3 py-1.5 bg-white border border-[#E6DDCB] hover:bg-[#FAF8F3] text-[#0D1B2A] text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
                          >
                            ხელახლა აკრეფა
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                /* 3. MULTIPLE CHOICE QUESTION TYPE (MCQ) */
                return (
                  <div className="space-y-3 pt-4 border-t border-[#E6DDCB]">
                    {currentQ.options.map((optText, optIdx) => {
                      const isSelected = selectedAnswers[currentQIndex] === optIdx;
                      const isCorrect = currentQ.correctAnswerIndex === optIdx;
                      const isAnswered = selectedAnswers[currentQIndex] !== -1;

                      let borderClass = 'border-[#E6DDCB] bg-white hover:border-[#C79B3A] hover:bg-[#FAF8F3]';
                      let badgeClass = 'bg-[#F5F2EA] text-[#0D1B2A]';

                      if (isAnswered) {
                        if (isCorrect) {
                          borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          badgeClass = 'bg-emerald-600 text-white';
                        } else if (isSelected) {
                          borderClass = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                          badgeClass = 'bg-rose-600 text-white';
                        }
                      } else if (isSelected) {
                        borderClass = 'border-[#C79B3A] bg-[#FAF8F3] ring-2 ring-[#C79B3A]/30 font-bold';
                        badgeClass = 'bg-[#C79B3A] text-white';
                      }

                      const optLabels = ['ა', 'ბ', 'გ', 'დ'];

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOptionInline(optIdx)}
                          className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${borderClass}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeClass}`}>
                            {optLabels[optIdx] || optIdx + 1}
                          </div>
                          <span className="text-sm sm:text-base leading-relaxed flex-1">
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Instant Explanation when answered */}
              {selectedAnswers[currentQIndex] !== -1 && activeInlineTest.questions[currentQIndex]?.explanation && (
                <div className="p-5 bg-[#FAF8F3] rounded-2xl border border-[#C79B3A]/40 space-y-1.5 animate-fade-in">
                  <span className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider block">
                    განმარტება:
                  </span>
                  <p className="text-xs sm:text-sm text-[#0D1B2A] leading-relaxed">
                    {activeInlineTest.questions[currentQIndex]?.explanation}
                  </p>
                </div>
              )}

              {/* Navigation Controls: Previous, Next, Finish */}
              <div className="flex items-center justify-between pt-6 border-t border-[#E6DDCB]">
                <button
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-5 py-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                >
                  წინა შეკითხვა
                </button>

                {currentQIndex < activeInlineTest.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => Math.min(activeInlineTest.questions.length - 1, prev + 1))}
                    className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    შემდეგი შეკითხვა
                  </button>
                ) : (
                  <button
                    onClick={handleFinishInlineTest}
                    className="px-6 py-3 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    ტესტის დასრულება
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* FINISHED TEST SUMMARY SCREEN */
            <div className="bg-white rounded-3xl border-2 border-[#C79B3A] p-8 sm:p-12 text-center space-y-8 shadow-xl animate-fade-in">
              {(() => {
                let correctCount = 0;
                activeInlineTest.questions.forEach((q, idx) => {
                  if (q.questionType === 'chronology') {
                    const order = chronologyOrders[idx] || q.chronologyItems || [];
                    if (checkChronologyItemsMatch(order, q.chronologyItems || [], q.correctSequence || [0, 1, 2])) correctCount++;
                  } else if (q.questionType === 'open_text') {
                    const typed = openTextAnswers[idx] || '';
                    if (checkOpenAnswerMatch(typed, q.correctAnswerText || '')) correctCount++;
                  } else {
                    if (selectedAnswers[idx] === q.correctAnswerIndex) correctCount++;
                  }
                });
                const totalCount = activeInlineTest.questions.length;
                const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

                return (
                  <div className="space-y-6 max-w-lg mx-auto">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FAF8F3] border-2 border-[#C79B3A] flex items-center justify-center shadow-md">
                      <Award className="w-10 h-10 text-[#C79B3A]" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-serif font-bold text-3xl text-[#0D1B2A]">
                        ტესტი დასრულებულია!
                      </h2>
                      <p className="text-sm text-[#666666]">
                        {activeInlineTest.title}
                      </p>
                    </div>

                    <div className="p-6 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-4">
                      <div className="text-4xl font-serif font-bold text-[#C79B3A]">
                        {scorePct}%
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-[#E6DDCB]">
                        <div className="text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                          სწორი: {correctCount}
                        </div>
                        <div className="text-rose-700 bg-rose-50 py-2 rounded-xl border border-rose-200">
                          არასწორი: {totalCount - correctCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                      <button
                        onClick={handleRestartInlineTest}
                        className="w-full py-3.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4 text-[#C79B3A]" />
                        <span>თავიდან გაკეთება</span>
                      </button>

                      <button
                        onClick={() => setActiveInlineTest(null)}
                        className="w-full py-3.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>ტესტებში დაბრუნება</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      ) : (
        /* STANDARD CATEGORIES & TESTS SELECTION VIEW */
        <>
          {/* Header */}
          {!loading && !selectedCategoryKey ? (
            <>
              <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
                <span className="px-3.5 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[11px] font-bold uppercase tracking-[0.25em] rounded-full inline-flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>აკადემიური ტესტირება</span>
                </span>
                <h1 className="font-serif font-bold text-3xl sm:text-5xl text-[#0D1B2A] leading-tight">
                  ისტორიის ტესტები და გამოცდები
                </h1>
                <p className="text-sm sm:text-base text-[#666666] max-w-2xl mx-auto">
                  აირჩიეთ სასურველი კატეგორია. ბაზაში დამატებულია 11-ვე თავის რეალური კითხვები, რუკები, წყაროები და ილუსტრაციები.
                </p>
              </div>

              {/* 1. ეროვნული გამოცდების კატეგორიები */}
              <div className="space-y-6">
                <div className="border-b border-[#E6DDCB] pb-3 flex items-center justify-between">
                  <h2 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                    ეროვნულის ტესტები
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {TEST_CATEGORIES.slice(0, 4).map((cat) => {
                    const details = categoryItemDetailsMap[cat.key];
                    return (
                      <div
                        key={cat.key}
                        onClick={() => handleSelectCategory(cat.key)}
                        className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:bg-[#FAF8F3]/40 hover:shadow-md transition-all duration-300 cursor-pointer group flex items-start gap-5 relative overflow-hidden"
                      >
                        <div className="w-14 h-14 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0 group-hover:bg-[#C79B3A] group-hover:border-[#C79B3A] transition-all duration-300 shadow-xs">
                          {getCategoryIcon(cat.key)}
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 bg-[#FAF8F3] text-[#C79B3A] text-[10px] font-bold rounded uppercase tracking-wider border border-[#E6DDCB]">
                              {cat.badge}
                            </span>
                            
                            <span className="px-2.5 py-0.5 bg-[#FAF8F3] text-[#13253D] text-[11px] font-bold rounded-full border border-[#E6DDCB] flex items-center gap-1">
                              <Database className="w-3 h-3 text-[#C79B3A]" />
                              <span>
                                {loading ? 'ტვირთვა...' : details && details.count > 0 ? `${details.count} ${details.unitLabel} ბაზაში` : 'ბაზა ემზადება'}
                              </span>
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug">
                            {cat.title}
                          </h3>
                          <p className="text-xs text-[#666666] leading-relaxed">
                            {cat.subtitle}
                          </p>

                          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#C79B3A]">
                            <span>ტესტების გახსნა</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. სხვა ტესტები */}
              <div className="space-y-6">
                <div className="border-b border-[#E6DDCB] pb-3">
                  <h2 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                    სხვა ტესტები
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {TEST_CATEGORIES.slice(4).map((cat) => {
                    const details = categoryItemDetailsMap[cat.key];
                    return (
                      <div
                        key={cat.key}
                        onClick={() => handleSelectCategory(cat.key)}
                        className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:bg-[#FAF8F3]/40 hover:shadow-md transition-all duration-300 cursor-pointer group flex items-start gap-5"
                      >
                        <div className="w-14 h-14 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0 group-hover:bg-[#C79B3A] group-hover:border-[#C79B3A] transition-all duration-300 shadow-xs">
                          {getCategoryIcon(cat.key)}
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 bg-[#FAF8F3] text-[#C79B3A] text-[10px] font-bold rounded uppercase tracking-wider border border-[#E6DDCB]">
                              {cat.badge}
                            </span>

                            <span className="px-2.5 py-0.5 bg-[#FAF8F3] text-[#13253D] text-[11px] font-bold rounded-full border border-[#E6DDCB] flex items-center gap-1">
                              <Database className="w-3 h-3 text-[#C79B3A]" />
                              <span>
                                {loading ? 'ტვირთვა...' : details && details.count > 0 ? `${details.count} ${details.unitLabel} ბაზაში` : 'ბაზა ემზადება'}
                              </span>
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug">
                            {cat.title}
                          </h3>
                          <p className="text-xs text-[#666666] leading-relaxed">
                            {cat.subtitle}
                          </p>

                          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#C79B3A]">
                            <span>დავალებების გახსნა</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : !loading && selectedCategoryKey ? (
            /* CATEGORY SELECTED VIEW */
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Back & Category Header */}
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedCategoryKey(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#13253D] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-[#C79B3A]" />
                  <span>ყველა ტესტში დაბრუნება</span>
                </button>

                <div className="bg-[#0D1B2A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-[#C79B3A]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="space-y-2 z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-widest rounded-full">
                        არჩეული კატეგორია
                      </span>
                      <span className="px-3 py-1 bg-white/10 text-[#FAF8F3] text-[11px] font-bold rounded-full border border-white/20">
                        ბაზაშია {categoryItemDetailsMap[selectedCategoryKey]?.count || 0} {categoryItemDetailsMap[selectedCategoryKey]?.unitLabel || 'კითხვა'}
                      </span>
                    </div>
                    <h2 className="font-serif font-bold text-2xl sm:text-4xl text-[#FAF8F3]">
                      {activeCategoryMeta?.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#FAF8F3]/80 max-w-xl">
                      {activeCategoryMeta?.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGY SPECIAL CATEGORY WORKFLOW (INDEPENDENT & OPEN TO ALL) */}
              {selectedCategoryKey === 'chronology' ? (
                <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-[#C79B3A] shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-[#FAF8F3] border border-[#C79B3A]/40 flex items-center justify-center mx-auto text-[#C79B3A] shadow-xs">
                    <Clock className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="px-3.5 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[10px] font-bold uppercase tracking-widest rounded-full inline-block">
                      დამოუკიდებელი დავალება
                    </span>
                    <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
                      ქრონოლოგიის დავალებები
                    </h3>
                    <p className="text-xs sm:text-sm text-[#666666] leading-relaxed max-w-md mx-auto">
                      ქრონოლოგიის კითხვებში მოსწავლემ უნდა დაალაგოს 3 მოვლენის სწორი თანმიმდევრობა (1-ლიდან 3-მდე).
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1.5 bg-[#FAF8F3] border border-[#E6DDCB] text-[#13253D] text-xs font-bold rounded-full">
                        სულ ბაზაშია {categoryTotalCounts['chronology'] || categoryQuestions.length || 0} კითხვა (თანმიმდევრობით)
                      </span>
                    </div>
                  </div>

                  {/* Chronology Progress Bar or Auth Notice */}
                  {(() => {
                    if (!isLoggedIn) {
                      return (
                        <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex items-center justify-between gap-3 max-w-xl mx-auto">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#0D1B2A] text-left">
                            <Lock className="w-4 h-4 text-[#C79B3A] shrink-0" />
                            <span>პროგრესის სანახავად: გთხოვთ გაიაროთ ავტორიზაცია</span>
                          </div>
                          {onOpenAuth && (
                            <button
                              onClick={onOpenAuth}
                              className="px-3.5 py-1.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
                            >
                              ავტორიზაცია
                            </button>
                          )}
                        </div>
                      );
                    }

                    const totalQ = categoryTotalCounts['chronology'] || categoryQuestions.length || 0;
                    const stats = getChapterStats('chronology', 'all', totalQ);

                    return (
                      <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-3 max-w-xl mx-auto text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0D1B2A]">
                            ქრონოლოგიის პროგრესი
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#C79B3A]">
                            {stats.pct}% შესრულებული
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="w-full h-3 bg-[#E6DDCB] rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}%` }}
                              className="bg-emerald-500 h-full transition-all duration-500"
                              title={`სწორი: ${stats.correct}`}
                            />
                            <div 
                              style={{ width: `${stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0}%` }}
                              className="bg-rose-500 h-full transition-all duration-500"
                              title={`არასწორი: ${stats.incorrect}`}
                            />
                            <div 
                              style={{ width: `${stats.total > 0 ? (stats.unattempted / stats.total) * 100 : 0}%` }}
                              className="bg-gray-200 h-full transition-all duration-500"
                              title={`არ გაუკეთებია: ${stats.unattempted}`}
                            />
                          </div>

                          <div className="grid grid-cols-3 text-center text-[11px] font-semibold pt-1">
                            <div className="flex items-center justify-center gap-1 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>სწორი: {stats.correct}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1 text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>არასწორი: {stats.incorrect}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1 text-gray-600">
                              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                              <span>დარჩა: {stats.unattempted}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={handleResetCategoryProgress}
                            disabled={isResetting}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            <span>დარესეტება</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    onClick={handleStartRandomTest}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>ქრონოლოგიის ტესტის დაწყება</span>
                  </button>
                </div>
              ) : selectedCategoryKey === 'mcq' ? (
                /* MCQ CATEGORY WORKFLOW (2 BOXES) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* BOX 1: RANDOM QUESTIONS ALL CHAPTERS */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#E6DDCB] shadow-md hover:border-[#C79B3A] transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group">
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] border border-[#C79B3A]/40 flex items-center justify-center group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
                        <Shuffle className="w-7 h-7 text-[#C79B3A] group-hover:text-white" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C79B3A]">
                          ბოქსი 1 • სწრაფი ტესტირება
                        </span>
                        <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                          რენდომ კითხვები ყველა თავიდან
                        </h3>
                        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                          გააკეთეთ ტესტი, სადაც კითხვები შემთხვევითად არის შერჩეული პროგრამის ყველა 11-ვე თავიდან.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#E6DDCB]">
                      <button
                        onClick={handleStartRandomTest}
                        disabled={loading}
                        className="w-full py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Shuffle className="w-4 h-4" />
                        <span>ტესტის დაწყება (ყველა თავიდან)</span>
                      </button>
                    </div>
                  </div>

                  {/* BOX 2: SELECT BY PROGRAM CHAPTER */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C79B3A] shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] border border-[#C79B3A]/40 flex items-center justify-center">
                        <BookMarked className="w-7 h-7 text-[#C79B3A]" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C79B3A]">
                          ბოქსი 2 • პროგრამის თავები ({programs.length} თავი)
                        </span>
                        <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                          არჩევა თავის / პროგრამის მიხედვით
                        </h3>
                        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                          აირჩიეთ კონკრეტული თავი 11 თავიდან და გააკეთეთ მხოლოდ იმ თავის კითხვები.
                        </p>
                      </div>

                      {/* Chapter Selector Dropdown */}
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider block">
                          აირჩიეთ პროგრამის თავი:
                        </label>
                        <select
                          value={selectedChapterId}
                          onChange={(e) => setSelectedChapterId(e.target.value)}
                          className="w-full bg-[#FAF8F3] border border-[#C79B3A] rounded-xl px-4 py-3 text-xs font-bold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]"
                        >
                          {programs.map((prog) => (
                            <option key={prog.id} value={prog.id}>
                              {prog.title} ({getChapterItemDisplay(prog.id)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Selected Chapter Details & Action */}
                    <div className="space-y-4 pt-4 border-t border-[#E6DDCB]">
                      {(() => {
                        const currProg = programs.find(p => p.id === selectedChapterId);
                        const totalQ = questionsCountMap[selectedChapterId] ?? 0;
                        const stats = getChapterStats(selectedCategoryKey, selectedChapterId, totalQ);

                        return (
                          <div className="space-y-4">
                            {isLoggedIn ? (
                              <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#0D1B2A]">
                                    {currProg?.title}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-[#C79B3A]">
                                    {stats.pct}% შესრულებული
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="w-full h-3 bg-[#E6DDCB] rounded-full overflow-hidden flex">
                                    <div 
                                      style={{ width: `${stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}%` }}
                                      className="bg-emerald-500 h-full transition-all duration-500"
                                      title={`სწორი: ${stats.correct}`}
                                    />
                                    <div 
                                      style={{ width: `${stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0}%` }}
                                      className="bg-rose-500 h-full transition-all duration-500"
                                      title={`არასწორი: ${stats.incorrect}`}
                                    />
                                    <div 
                                      style={{ width: `${stats.total > 0 ? (stats.unattempted / stats.total) * 100 : 0}%` }}
                                      className="bg-gray-200 h-full transition-all duration-500"
                                      title={`არ გაუკეთებია: ${stats.unattempted}`}
                                    />
                                  </div>

                                  <div className="grid grid-cols-3 text-center text-[11px] font-semibold pt-1">
                                    <div className="flex items-center justify-center gap-1 text-emerald-700">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>სწორი: {stats.correct}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-rose-700">
                                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>არასწორი: {stats.incorrect}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-gray-600">
                                      <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                      <span>დარჩა: {stats.unattempted}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#0D1B2A]">
                                  <Lock className="w-4 h-4 text-[#C79B3A] shrink-0" />
                                  <span>პროგრესის შესანახად და სანახავად: გთხოვთ გაიაროთ ავტორიზაცია</span>
                                </div>
                                {onOpenAuth && (
                                  <button
                                    onClick={onOpenAuth}
                                    className="px-3.5 py-1.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
                                  >
                                    ავტორიზაცია
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <button
                                onClick={() => handleStartChapterTest(selectedChapterId)}
                                disabled={loading}
                                className="w-full sm:flex-1 py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <BookMarked className="w-4 h-4" />
                                <span>ამ თავის ტესტის დაწყება</span>
                              </button>

                              {isLoggedIn && (
                                <button
                                  onClick={handleResetCategoryProgress}
                                  disabled={isResetting}
                                  title="ამ თავის მონაცემების განულება / დარესეტება"
                                  className="px-4 py-3.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                  <span>დარესეტება</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                </div>
              ) : (
                /* MAPS, ANALOGIES, SOURCES, ILLUSTRATIONS WORKFLOW (TASK BOXES BY CHAPTER) */
                <div className="space-y-6">
                  
                  {/* Chapter Selector & Progress Bar Header */}
                  <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#E6DDCB] shadow-sm space-y-4">
                    <label className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider block">
                      აირჩიეთ პროგრამის თავი (11 თავი):
                    </label>
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full bg-[#FAF8F3] border border-[#C79B3A] rounded-xl px-4 py-3 text-xs font-bold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]"
                    >
                      {isLoggedIn ? (
                        <option value="all">
                          ყველა თავი (სულ {categoryItemDetailsMap[selectedCategoryKey]?.count || 0} {categoryItemDetailsMap[selectedCategoryKey]?.unitLabel || 'დავალება'})
                        </option>
                      ) : (
                        <option value="all">
                          🔒 ყველა თავი (საჭიროებს ავტორიზაციას)
                        </option>
                      )}
                      {programs.map((prog) => {
                        const isLocked = !isLoggedIn && prog.chapterNumber !== 1;
                        return (
                          <option key={prog.id} value={prog.id}>
                            {isLocked ? `🔒 ${prog.title} (საჭიროებს ავტორიზაციას)` : `${prog.title} (${getChapterItemDisplay(prog.id)})`}
                          </option>
                        );
                      })}
                    </select>

                    {/* Progress Bar or Auth Notice Header */}
                    {(() => {
                      if (!isLoggedIn) {
                        return (
                          <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0D1B2A]">
                              <Lock className="w-4 h-4 text-[#C79B3A] shrink-0" />
                              <span>დანარჩენი თავების და პროგრესის სანახავად: გთხოვთ გაიაროთ ავტორიზაცია</span>
                            </div>
                            {onOpenAuth && (
                              <button
                                onClick={onOpenAuth}
                                className="px-4 py-2 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
                              >
                                ავტორიზაცია
                              </button>
                            )}
                          </div>
                        );
                      }

                      const currProg = programs.find(p => p.id === selectedChapterId);
                      const displayTitle = selectedChapterId === 'all'
                        ? 'ყველა თავი'
                        : currProg?.title || 'არჩეული თავი';
                      const totalQ = selectedChapterId === 'all'
                        ? categoryQuestions.length
                        : (questionsCountMap[selectedChapterId] ?? 0);
                      const stats = getChapterStats(selectedCategoryKey, selectedChapterId, totalQ);

                      return (
                        <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-3 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0D1B2A]">
                              {displayTitle} — პროგრესი
                            </span>
                            <span className="text-[11px] font-mono font-bold text-[#C79B3A]">
                              {stats.pct}% შესრულებული
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="w-full h-3 bg-[#E6DDCB] rounded-full overflow-hidden flex">
                              <div 
                                style={{ width: `${stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}%` }}
                                className="bg-emerald-500 h-full transition-all duration-500"
                                title={`სწორი: ${stats.correct}`}
                              />
                              <div 
                                style={{ width: `${stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0}%` }}
                                className="bg-rose-500 h-full transition-all duration-500"
                                title={`არასწორი: ${stats.incorrect}`}
                              />
                              <div 
                                style={{ width: `${stats.total > 0 ? (stats.unattempted / stats.total) * 100 : 0}%` }}
                                className="bg-gray-200 h-full transition-all duration-500"
                                title={`არ გაუკეთებია: ${stats.unattempted}`}
                              />
                            </div>

                            <div className="grid grid-cols-3 text-center text-[11px] font-semibold pt-1">
                              <div className="flex items-center justify-center gap-1 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>სწორი: {stats.correct}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 text-rose-700">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>არასწორი: {stats.incorrect}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 text-gray-600">
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                <span>დარჩა: {stats.unattempted}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Task Groups / Boxes for Selected Chapter (or Lock Screen for Unregistered on Ch2-11) */}
                  {isLoggedIn || selectedChapterId === 'ch-1' ? (
                    taskGroups.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                          ამ თავის დავალებები ({taskGroups.length} დავალების ბოქსი)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {taskGroups.map((task) => (
                            <div
                              key={task.id}
                              className="bg-white rounded-3xl border-2 border-[#E6DDCB] hover:border-[#C79B3A] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group overflow-hidden"
                            >
                              <div className="space-y-3">
                                {/* Task Thumbnail Image if available (Map / Illustration) */}
                                {task.image && (
                                  <div className="rounded-2xl overflow-hidden aspect-video bg-[#0D1B2A] border border-[#E6DDCB] shadow-inner max-h-48">
                                    <img 
                                      src={task.image} 
                                      alt={task.title} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}

                                {/* Task Text snippet if available (Source / Analogy) */}
                                {task.sourceContext && (
                                  <div className="p-4 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] text-xs font-serif italic text-[#0D1B2A] line-clamp-3">
                                    „{task.sourceContext}“
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 bg-[#FAF8F3] text-[#C79B3A] text-[10px] font-bold uppercase rounded border border-[#E6DDCB]">
                                      {task.subtitle}
                                    </span>
                                  </div>

                                  <h4 className="font-serif font-bold text-xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors">
                                    {task.title}
                                  </h4>
                                </div>
                              </div>

                              <button
                                onClick={() => handleStartTaskGroupTest(task)}
                                className="w-full py-3.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-current" />
                                <span>ამ დავალების დაწყება</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-10 rounded-3xl border border-[#E6DDCB] text-center space-y-3">
                        <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">
                          ამ თავში დავალებები ჯერ არ არის
                        </h4>
                        <p className="text-xs text-[#666666]">
                          აირჩიეთ სხვა თავი ჩამონათვალიდან.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-[#C79B3A]/60 shadow-xl text-center space-y-6 max-w-2xl mx-auto my-6 animate-fade-in">
                      <div className="w-20 h-20 rounded-3xl bg-[#FAF8F3] border-2 border-[#C79B3A] flex items-center justify-center mx-auto text-[#C79B3A] shadow-md">
                        <Lock className="w-10 h-10" />
                      </div>
                      <div className="space-y-3">
                        <span className="px-3.5 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[11px] font-bold uppercase tracking-[0.2em] rounded-full inline-flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>წვდომა შეზღუდულია</span>
                        </span>
                        <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
                          ავტორიზაცია აუცილებელია
                        </h3>
                        <p className="text-sm sm:text-base text-[#666666] leading-relaxed font-medium max-w-md mx-auto">
                          დანარჩენი თავების და პროგრესის სანახავად: გთხოვთ გაიაროთ ავტორიზაცია
                        </p>
                      </div>
                      {onOpenAuth && (
                        <button
                          onClick={onOpenAuth}
                          className="px-8 py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>ავტორიზაციის გავლა</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : null}
        </>
      )}

    </div>
  );
};
