import { useState, useEffect, type FC } from 'react';
import {
  User, ShieldCheck, BookMarked, Award, HelpCircle, RotateCcw,
  CheckCircle2, XCircle, Trash2, Eye, Play, Sparkles, BookOpen,
  MapPin, Layers, FileText, Clock, Image as ImageIcon, Edit2, Check,
  ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';
import { getStudentProgress, resetStudentProgress, StudentProfileProgress, ChapterProgressStats } from '../lib/progressService';
import { TEST_CATEGORIES, fetchProgramsAndSubprograms, fetchQuestionsForCategory, ProgramChapter } from '../lib/testService';
import { isAdminUser } from '../lib/blogService';
import { fetchUserProfile, syncUserProfile } from '../lib/userService';
import { fetchUserQuizAttempts, deleteQuizAttempt, getQuizImageUrl, getQuizResultFeedback } from '../lib/quizService';
import { QuizAttempt, QuizQuestion } from '../types';
import { QuizStudentReviewModal } from '../components/QuizStudentReviewModal';
import { IncorrectAnswersModal } from '../components/IncorrectAnswersModal';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  user: { name: string; email: string } | null;
  onOpenQuiz?: (quizId: string) => void;
  onOpenTest?: (categoryKey: string, chapterId: string) => void;
  onOpenAuth?: () => void;
}

export const ProfileView: FC<ProfileViewProps> = ({
  user,
  onOpenQuiz,
  onOpenTest,
  onOpenAuth
}) => {
  const [progress, setProgress] = useState<StudentProfileProgress | null>(null);
  const [programs, setPrograms] = useState<ProgramChapter[]>([]);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'chapters' | 'categories'>('quizzes');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Quiz Attempts state
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedReviewAttempt, setSelectedReviewAttempt] = useState<QuizAttempt | null>(null);

  const [profileName, setProfileName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Accordion & Category Questions State for Chapters & Categories Progress
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [expandedCategoryKey, setExpandedCategoryKey] = useState<string | null>(null);
  const [categoryQuestionsMap, setCategoryQuestionsMap] = useState<Record<string, (QuizQuestion & { chapterId: string })[]>>({});
  const [loadingCategoryQuestions, setLoadingCategoryQuestions] = useState(false);

  // Incorrect Answers Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    chapterTitle: string;
    categoryKey: string;
    categoryTitle: string;
    chapterId: string;
    questions: (QuizQuestion & { chapterId: string })[];
    incorrectQuestionIds: string[];
    correctQuestionIds: string[];
  } | null>(null);

  const userEmail = user?.email || '';

  const loadData = async () => {
    if (!userEmail) return;
    
    // Load programs and progress
    const progs = await fetchProgramsAndSubprograms();
    setPrograms(progs);

    const data = await getStudentProgress(userEmail);
    setProgress(data);

    // Fetch profile name from Supabase profiles table
    const dbProf = await fetchUserProfile(userEmail);
    if (dbProf && dbProf.full_name) {
      setProfileName(dbProf.full_name);
    } else {
      setProfileName(user?.name || userEmail.split('@')[0]);
    }

    // Load Quiz attempts for logged-in user
    setLoadingQuizzes(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || '';
      const attempts = await fetchUserQuizAttempts(userId, user?.name);
      setQuizAttempts(attempts);
    } catch (err) {
      console.error('Error loading user quiz attempts:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadData();
    }
  }, [userEmail, user]);

  // Load questions for all categories when Chapters or Categories tab is opened
  useEffect(() => {
    if ((activeTab === 'chapters' || activeTab === 'categories') && Object.keys(categoryQuestionsMap).length === 0) {
      const loadAllCategoryQuestions = async () => {
        setLoadingCategoryQuestions(true);
        try {
          const catKeys = ['mcq', 'map', 'analogies', 'source', 'illustrations', 'chronology'];
          const mapResults: Record<string, (QuizQuestion & { chapterId: string })[]> = {};
          await Promise.all(
            catKeys.map(async (key) => {
              const questions = await fetchQuestionsForCategory(key);
              mapResults[key] = questions;
            })
          );
          setCategoryQuestionsMap(mapResults);
        } catch (err) {
          console.error('Error loading category questions for profile:', err);
        } finally {
          setLoadingCategoryQuestions(false);
        }
      };

      loadAllCategoryQuestions();
    }
  }, [activeTab]);

  if (!user) {
    return (
      <div className="max-w-[1280px] mx-auto py-16 px-4 sm:px-6 text-center space-y-6">
        <div className="w-20 h-20 bg-[#FAF8F3] border-2 border-[#E6DDCB] rounded-3xl mx-auto flex items-center justify-center text-[#C79B3A] shadow-md">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
            ავტორიზაცია აუცილებელია
          </h1>
          <p className="text-xs sm:text-sm text-[#666666]">
            პროფილის სანახავად და შედეგების შესანახად გაიარეთ ავტორიზაცია.
          </p>
        </div>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-7 py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            ავტორიზაციის გავლა
          </button>
        )}
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!profileName.trim() || !userEmail) return;
    setIsSavingName(true);
    try {
      await syncUserProfile({
        email: userEmail,
        full_name: profileName.trim()
      });
      user.name = profileName.trim();
      setIsEditingName(false);
    } catch (err) {
      console.error('Error saving profile name:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteQuizAttemptItem = async (attemptId: string) => {
    if (!confirm('ნამდვილად გსურთ ამ ქვიზის შედეგის წაშლა?')) return;
    await deleteQuizAttempt(attemptId);
    setQuizAttempts(prev => prev.filter(a => a.id !== attemptId));
  };

  const isAdmin = isAdminUser(user);

  // Compute Overall Stats
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalAttempted = 0;

  if (progress) {
    Object.values(progress.statsByChapter).forEach((stat: ChapterProgressStats) => {
      totalCorrect += stat.correctQuestionIds.length;
      totalIncorrect += stat.incorrectQuestionIds.length;
      totalAttempted += stat.attemptedQuestionIds.length;
    });
  }

  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const handleResetAll = async () => {
    if (!userEmail) return;
    if (!confirm('ნამდვილად გსურთ თქვენი ყველა ტესტის პროგრესისა და მონაცემების განულება/დარესეტება?')) {
      return;
    }

    setIsResetting(true);
    try {
      const fresh = await resetStudentProgress(userEmail);
      setProgress(fresh);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error('Error resetting progress:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'mcq': return <BookOpen className="w-4 h-4 text-[#C79B3A]" />;
      case 'map': return <MapPin className="w-4 h-4 text-[#C79B3A]" />;
      case 'analogies': return <Layers className="w-4 h-4 text-[#C79B3A]" />;
      case 'source': return <FileText className="w-4 h-4 text-[#C79B3A]" />;
      case 'chronology': return <Clock className="w-4 h-4 text-[#C79B3A]" />;
      case 'illustrations': return <ImageIcon className="w-4 h-4 text-[#C79B3A]" />;
      default: return <BookOpen className="w-4 h-4 text-[#C79B3A]" />;
    }
  };

  // Helper to compute category task & question stats for a specific chapter
  const getCategoryChapterTaskStats = (
    catKey: string,
    chapterId: string,
    questions: (QuizQuestion & { chapterId: string })[]
  ) => {
    const targetNum = Number(String(chapterId).replace(/[^0-9]/g, ''));
    const chQuestions = questions.filter(q => {
      const qNum = Number(String(q.chapterId).replace(/[^0-9]/g, ''));
      return qNum === targetNum || q.chapterId === chapterId || q.chapterId === `ch-${chapterId.replace('ch-', '')}`;
    });

    const statKey = `${catKey}_${chapterId}`;
    const chapterStat = progress?.statsByChapter[statKey];
    const correctIds = chapterStat?.correctQuestionIds || [];
    const incorrectIds = chapterStat?.incorrectQuestionIds || [];

    if (catKey === 'mcq' || catKey === 'chronology') {
      let correct = 0;
      let incorrect = 0;
      chQuestions.forEach(q => {
        if (incorrectIds.includes(q.id)) {
          incorrect++;
        } else if (correctIds.includes(q.id)) {
          correct++;
        }
      });
      const total = chQuestions.length;
      const unattempted = Math.max(0, total - (correct + incorrect));
      return {
        total,
        correct,
        incorrect,
        unattempted,
        pct: total > 0 ? Math.round((correct / total) * 100) : 0,
        questions: chQuestions,
        incorrectIds,
        correctIds
      };
    }

    // Task Group based (Maps, Analogies, Sources, Illustrations)
    const groupMap = new Map<string, (QuizQuestion & { chapterId: string })[]>();
    chQuestions.forEach((q, idx) => {
      let key = '';
      if (q.parentItemNumber) {
        key = `parent-${q.parentItemNumber}`;
      } else if (catKey === 'map' || catKey === 'illustrations') {
        key = q.mapImage || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
      } else if (catKey === 'source' || catKey === 'analogies') {
        key = q.sourceContext?.substring(0, 100) || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
      } else {
        key = q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`;
      }
      const existing = groupMap.get(key) || [];
      existing.push(q);
      groupMap.set(key, existing);
    });

    const taskGroups = Array.from(groupMap.values());
    let correctTasks = 0;
    let incorrectTasks = 0;
    let unattemptedTasks = 0;

    taskGroups.forEach(g => {
      let hasAttempted = false;
      let isAllCorrect = true;
      let hasMistake = false;

      g.forEach(q => {
        if (correctIds.includes(q.id) || incorrectIds.includes(q.id)) {
          hasAttempted = true;
        }
        if (incorrectIds.includes(q.id)) {
          hasMistake = true;
        }
        if (!correctIds.includes(q.id)) {
          isAllCorrect = false;
        }
      });

      if (hasMistake) {
        incorrectTasks++;
      } else if (hasAttempted && isAllCorrect) {
        correctTasks++;
      } else {
        unattemptedTasks++;
      }
    });

    const total = taskGroups.length;
    const pct = total > 0 ? Math.round((correctTasks / total) * 100) : 0;

    return {
      total,
      correct: correctTasks,
      incorrect: incorrectTasks,
      unattempted: unattemptedTasks,
      pct,
      questions: chQuestions,
      incorrectIds,
      correctIds
    };
  };

  return (
    <div className="max-w-[1280px] mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Profile Top Banner */}
      <div className="relative bg-[#0D1B2A] text-white rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl border-4 border-[#C79B3A]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Background Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#C79B3A_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-6 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#C79B3A] text-[#0D1B2A] font-serif font-bold flex items-center justify-center text-2xl sm:text-3xl shadow-luxury shrink-0 border-2 border-white/20">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="px-3 py-1 bg-[#FAF8F3] text-[#0D1B2A] rounded-xl text-lg font-serif font-bold focus:outline-none border-2 border-[#C79B3A]"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-2 bg-[#C79B3A] text-[#0D1B2A] rounded-xl hover:bg-[#E6C86B] transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F3]">
                    {profileName}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-white/60 hover:text-[#C79B3A] transition-colors cursor-pointer"
                    title="სახელის რედაქტირება"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {isAdmin && (
                <span className="px-3 py-1 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Администратор
                </span>
              )}
            </div>

            <p className="text-xs text-[#FAF8F3]/70 font-mono">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Overall Profile Accuracy Box */}
        <div className="z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 self-stretch md:self-auto justify-around">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-[#C79B3A] font-bold block">
              საერთო სიზუსტე
            </span>
            <span className="font-serif font-bold text-2xl text-[#FAF8F3]">
              {overallAccuracy}%
            </span>
          </div>

          <div className="w-px h-8 bg-white/20" />

          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-[#C79B3A] font-bold block">
              სწორი პასუხები
            </span>
            <span className="font-serif font-bold text-2xl text-emerald-400">
              {totalCorrect}
            </span>
          </div>

          <div className="w-px h-8 bg-white/20" />

          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-[#C79B3A] font-bold block">
              არასწორი
            </span>
            <span className="font-serif font-bold text-2xl text-rose-400">
              {totalIncorrect}
            </span>
          </div>
        </div>

      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6DDCB] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'quizzes'
              ? 'bg-[#0D1B2A] text-white shadow-md'
              : 'bg-white text-[#0D1B2A] border border-[#E6DDCB] hover:bg-[#FAF8F3]'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#C79B3A]" />
          <span>ქვიზების შედეგები ({quizAttempts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'chapters'
              ? 'bg-[#0D1B2A] text-white shadow-md'
              : 'bg-white text-[#0D1B2A] border border-[#E6DDCB] hover:bg-[#FAF8F3]'
          }`}
        >
          <BookMarked className="w-4 h-4 text-[#C79B3A]" />
          <span>11 თავის პროგრესი</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'categories'
              ? 'bg-[#0D1B2A] text-white shadow-md'
              : 'bg-white text-[#0D1B2A] border border-[#E6DDCB] hover:bg-[#FAF8F3]'
          }`}
        >
          <Award className="w-4 h-4 text-[#C79B3A]" />
          <span>დავალების ტიპები</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="space-y-8">
        
        {/* Success Alert Banner */}
        {resetSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>მონაცემები წარმატებით განულდა/დარესეტდა!</span>
          </div>
        )}

        {/* TAB 1: QUIZ RESULTS */}
        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#C79B3A]" />
                  <span>ნაპასუხები ქვიზების ისტორია</span>
                </h3>
                <p className="text-xs text-[#666666]">
                  აქ ჩანს თქვენ მიერ გავლილი ქვიზების ბოლო შედეგები, მიღებული ქულები და დეტალური პასუხები.
                </p>
              </div>

              <span className="px-3 py-1 bg-[#FAF8F3] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-mono font-bold rounded-xl">
                {quizAttempts.length} შედეგი
              </span>
            </div>

            {loadingQuizzes ? (
              <div className="py-16 text-center text-xs text-[#666666] font-medium space-y-3">
                <div className="w-7 h-7 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
                <span>ქვიზების ჩატვირთვა...</span>
              </div>
            ) : quizAttempts.length === 0 ? (
              <div className="p-12 bg-[#FAF8F3] rounded-3xl border border-[#E6DDCB] text-center space-y-3">
                <div className="w-16 h-16 bg-white border border-[#E6DDCB] rounded-2xl mx-auto flex items-center justify-center text-[#C79B3A] shadow-xs">
                  <HelpCircle className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">
                  ქვიზი ჯერ არ შეგივსიათ
                </h4>
                <p className="text-xs text-[#666666] max-w-sm mx-auto">
                  გადადით ქვიზების გვერდზე, გაიარეთ ისტორიული ტესტები და თქვენი შედეგები აქ აისახება.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {quizAttempts.map((attempt) => {
                  const feedback = getQuizResultFeedback(attempt.percentage);
                  const coverUrl = getQuizImageUrl(attempt.quiz_cover_image_path, 'quiz-covers');

                  return (
                    <div
                      key={attempt.id}
                      className="bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#C79B3A]/60 transition-all group"
                    >
                      <div>
                        {/* Card Cover */}
                        <div className="relative h-32 bg-[#0D1B2A] overflow-hidden flex items-center justify-center">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={attempt.quiz_title || 'Quiz'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A] to-[#13253D] flex items-center justify-center">
                              <HelpCircle className="w-10 h-10 text-[#C79B3A]/40" />
                            </div>
                          )}

                          <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-[#0D1B2A]/90 backdrop-blur-xs text-[#C79B3A] font-bold text-xs font-mono rounded-xl border border-[#C79B3A]/40 shadow-sm">
                            {attempt.percentage}%
                          </div>

                          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-[#FAF8F3] text-[10px] font-bold rounded-lg border border-white/20">
                            {feedback.badge}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-serif font-bold text-base text-[#0D1B2A] line-clamp-1">
                            {attempt.quiz_title || 'ისტორიული ქვიზი'}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-[#666666]">
                            <span>შედეგი: <strong className="text-[#0D1B2A] font-mono font-bold">{attempt.correct_answers}/{attempt.total_questions}</strong></span>
                            <span className="text-[10px] font-mono">{new Date(attempt.created_at).toLocaleDateString('ka-GE')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-3 bg-white border-t border-[#E6DDCB] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedReviewAttempt(attempt)}
                          className="flex-1 py-2 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>დეტალები</span>
                        </button>

                        {onOpenQuiz && (
                          <button
                            onClick={() => onOpenQuiz(attempt.quiz_id)}
                            className="px-3 py-2 bg-[#FAF8F3] hover:bg-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl border border-[#E6DDCB] transition-all cursor-pointer flex items-center gap-1"
                            title="ხელახლა გაკეთება"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#C79B3A]" />
                            <span className="hidden sm:inline">ხელახლა</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteQuizAttemptItem(attempt.id)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="წაშლა"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROGRAM CHAPTERS ACCORDION WITH DETAILED ERRORS AND TASK BREAKDOWN */}
        {activeTab === 'chapters' && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6DDCB] pb-4 gap-2">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-[#C79B3A]" />
                  <span>პროგრამის 11 თავის დეტალური პროგრესი</span>
                </h3>
                <p className="text-xs text-[#666666]">
                  დააჭირეთ თავს ჩამოსაშლელად და იხილეთ არჩევითპასუხიანი კითხვების, რუკების, ანალოგიებისა და წყაროების ზუსტი შეცდომები.
                </p>
              </div>

              <span className="text-xs font-mono text-[#666666] self-start sm:self-auto">
                სულ 11 თავი
              </span>
            </div>

            {loadingCategoryQuestions ? (
              <div className="py-16 text-center text-xs text-[#666666] space-y-3">
                <div className="w-7 h-7 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
                <span>თავების დეტალური მონაცემების ჩატვირთვა...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {programs.map((prog) => {
                  const isExpanded = expandedChapterId === prog.id;

                  // Overall chapter summary stats
                  let chCorrect = 0;
                  let chIncorrect = 0;

                  if (progress) {
                    Object.entries(progress.statsByChapter).forEach(([key, stat]: [string, ChapterProgressStats]) => {
                      if (key.endsWith(`_${prog.id}`)) {
                        chCorrect += stat.correctQuestionIds.length;
                        chIncorrect += stat.incorrectQuestionIds.length;
                      }
                    });
                  }

                  const chAttempted = chCorrect + chIncorrect;
                  const chPct = chAttempted > 0 ? Math.round((chCorrect / chAttempted) * 100) : 0;

                  return (
                    <div 
                      key={prog.id} 
                      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        isExpanded ? 'border-[#C79B3A] bg-white shadow-md' : 'border-[#E6DDCB] bg-[#FAF8F3] hover:border-[#C79B3A]/60'
                      }`}
                    >
                      {/* Chapter Accordion Header */}
                      <button
                        onClick={() => setExpandedChapterId(isExpanded ? null : prog.id)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isExpanded ? 'bg-[#0D1B2A] text-[#C79B3A]' : 'bg-white border border-[#E6DDCB] text-[#0D1B2A]'
                          }`}>
                            {prog.title.match(/\d+/)?.[0] || '1'}
                          </div>
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#0D1B2A] truncate">
                            {prog.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              სწორი: {chCorrect}
                            </span>
                            <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              არასწორი: {chIncorrect}
                            </span>
                            <span className="text-[#C79B3A] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E6DDCB]">
                              {chPct}%
                            </span>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-[#C79B3A]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#666666]" />
                          )}
                        </div>
                      </button>

                      {/* Chapter Accordion Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 sm:p-6 bg-white border-t border-[#E6DDCB] space-y-6 animate-in fade-in duration-200">
                          
                          <div className="text-xs text-[#666666] bg-[#FAF8F3] p-3.5 rounded-xl border border-[#E6DDCB]">
                            💡 <strong>წესი:</strong> რუკებში, ანალოგიებში, წყაროებსა და ილუსტრაციებში დავალება სწორად ითვლება მხოლოდ მაშინ, თუ <strong>ყველა კითხვას</strong> სწორად უპასუხეთ. 1 შეცდომაც კი დავალებას თვლის არასწორად.
                          </div>

                          {/* Categories Grid for this Chapter */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {TEST_CATEGORIES.map((cat) => {
                              const stats = getCategoryChapterTaskStats(cat.key, prog.id, categoryQuestionsMap[cat.key] || []);

                              const isMcq = cat.key === 'mcq';
                              const unitText = isMcq ? 'კითხვა' : cat.key === 'map' ? 'რუკა' : cat.key === 'analogies' ? 'ანალოგია' : cat.key === 'source' ? 'წყარო' : cat.key === 'illustrations' ? 'ილუსტრაცია' : 'დავალება';

                              return (
                                <div 
                                  key={cat.key}
                                  className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] space-y-3.5 flex flex-col justify-between"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-[#E6DDCB] flex items-center justify-center shrink-0">
                                          {getCategoryIcon(cat.key)}
                                        </div>
                                        <span className="font-bold text-xs text-[#0D1B2A]">
                                          {cat.title}
                                        </span>
                                      </div>

                                      <span className="text-[10px] font-mono font-bold text-[#666666] bg-white px-2 py-0.5 rounded border border-[#E6DDCB]">
                                        სულ: {stats.total} {unitText}
                                      </span>
                                    </div>

                                    {/* Stats breakdown row */}
                                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                                      <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                                        სწორი: {stats.correct}
                                      </div>
                                      <div className="p-1.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
                                        არასწორი: {stats.incorrect}
                                      </div>
                                      <div className="p-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-200">
                                        დარჩენილი: {stats.unattempted}
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                      <div 
                                        style={{ width: `${stats.pct}%` }}
                                        className="bg-emerald-500 h-full transition-all duration-300"
                                      />
                                      <div 
                                        style={{ width: `${stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0}%` }}
                                        className="bg-rose-500 h-full transition-all duration-300"
                                      />
                                    </div>
                                  </div>

                                  {/* Error Viewer Trigger Button */}
                                  <button
                                    onClick={() => {
                                      setModalState({
                                        isOpen: true,
                                        chapterTitle: prog.title,
                                        categoryKey: cat.key,
                                        categoryTitle: cat.title,
                                        chapterId: prog.id,
                                        questions: stats.questions,
                                        incorrectQuestionIds: stats.incorrectIds,
                                        correctQuestionIds: stats.correctIds
                                      });
                                    }}
                                    className="w-full py-2 bg-white hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#C79B3A]" />
                                    <span>{isMcq ? 'ნახე არასწორი პასუხები' : 'ნახე შეცდომები'} ({stats.incorrect})</span>
                                  </button>

                                </div>
                              );
                            })}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TASK CATEGORIES ACCORDION WITH 11 CHAPTERS BREAKDOWN */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6DDCB] pb-4 gap-2">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#C79B3A]" />
                  <span>დავალების ტიპები (11 თავის სტატისტიკა)</span>
                </h3>
                <p className="text-xs text-[#666666]">
                  დააჭირეთ სასურველ კატეგორიას ჩამოსაშლელად და იხილეთ 11-ვე თავის მიხედვით სწორი/არასწორი დავალებების დეტალური სტატისტიკა.
                </p>
              </div>

              <span className="text-xs font-mono text-[#666666] self-start sm:self-auto">
                6 კატეგორია
              </span>
            </div>

            {loadingCategoryQuestions ? (
              <div className="py-16 text-center text-xs text-[#666666] space-y-3">
                <div className="w-7 h-7 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
                <span>კატეგორიების მონაცემების ჩატვირთვა...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {TEST_CATEGORIES.map((cat) => {
                  const isCategoryExpanded = expandedCategoryKey === cat.key;

                  // Calculate overall task stats for this category across all 11 chapters
                  let catTotalTasks = 0;
                  let catCorrectTasks = 0;
                  let catIncorrectTasks = 0;

                  programs.forEach((prog) => {
                    const stats = getCategoryChapterTaskStats(cat.key, prog.id, categoryQuestionsMap[cat.key] || []);
                    catTotalTasks += stats.total;
                    catCorrectTasks += stats.correct;
                    catIncorrectTasks += stats.incorrect;
                  });

                  const catAttempted = catCorrectTasks + catIncorrectTasks;
                  const catPct = catTotalTasks > 0 ? Math.round((catCorrectTasks / catTotalTasks) * 100) : 0;
                  const isMcq = cat.key === 'mcq';
                  const unitText = isMcq ? 'კითხვა' : cat.key === 'map' ? 'რუკა' : cat.key === 'analogies' ? 'ანალოგია' : cat.key === 'source' ? 'წყარო' : cat.key === 'illustrations' ? 'ილუსტრაცია' : 'დავალება';

                  return (
                    <div
                      key={cat.key}
                      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        isCategoryExpanded ? 'border-[#C79B3A] bg-white shadow-md' : 'border-[#E6DDCB] bg-[#FAF8F3] hover:border-[#C79B3A]/60'
                      }`}
                    >
                      {/* Category Accordion Header */}
                      <button
                        onClick={() => setExpandedCategoryKey(isCategoryExpanded ? null : cat.key)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${
                            isCategoryExpanded ? 'bg-[#0D1B2A] text-[#C79B3A]' : 'bg-white border border-[#E6DDCB]'
                          }`}>
                            {getCategoryIcon(cat.key)}
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-base text-[#0D1B2A]">
                              {cat.title}
                            </h4>
                            <span className="text-xs text-[#666666]">
                              {cat.subtitle} — სულ: {catTotalTasks} {unitText}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              სწორი: {catCorrectTasks}
                            </span>
                            <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              არასწორი: {catIncorrectTasks}
                            </span>
                            <span className="text-[#C79B3A] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E6DDCB]">
                              {catPct}%
                            </span>
                          </div>

                          {isCategoryExpanded ? (
                            <ChevronUp className="w-5 h-5 text-[#C79B3A]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#666666]" />
                          )}
                        </div>
                      </button>

                      {/* Category Accordion Expanded Content: 11 Chapters Breakdown for this Category */}
                      {isCategoryExpanded && (
                        <div className="p-4 sm:p-6 bg-white border-t border-[#E6DDCB] space-y-5 animate-in fade-in duration-200">
                          
                          <div className="text-xs text-[#666666] bg-[#FAF8F3] p-3.5 rounded-xl border border-[#E6DDCB]">
                            💡 <strong>11 თავის სტატისტიკა ({cat.title}):</strong> ქვემოთ მოცემულია თითოეულ თავში ჩატარებული {unitText}ების შედეგები. დააჭირეთ „ნახე შეცდომები“ იმ თავის შეცდომების სანახავად.
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {programs.map((prog) => {
                              const stats = getCategoryChapterTaskStats(cat.key, prog.id, categoryQuestionsMap[cat.key] || []);

                              return (
                                <div
                                  key={prog.id}
                                  className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] space-y-3 flex flex-col justify-between"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-serif font-bold text-[#0D1B2A] line-clamp-1">
                                        {prog.title}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-[#666666] bg-white px-2 py-0.5 rounded border border-[#E6DDCB] shrink-0">
                                        სულ: {stats.total} {unitText}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                                      <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                                        სწორი: {stats.correct}
                                      </div>
                                      <div className="p-1.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
                                        არასწორი: {stats.incorrect}
                                      </div>
                                      <div className="p-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-200">
                                        დარჩენილი: {stats.unattempted}
                                      </div>
                                    </div>

                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                      <div 
                                        style={{ width: `${stats.pct}%` }}
                                        className="bg-emerald-500 h-full transition-all duration-300"
                                      />
                                      <div 
                                        style={{ width: `${stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0}%` }}
                                        className="bg-rose-500 h-full transition-all duration-300"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setModalState({
                                        isOpen: true,
                                        chapterTitle: prog.title,
                                        categoryKey: cat.key,
                                        categoryTitle: cat.title,
                                        chapterId: prog.id,
                                        questions: stats.questions,
                                        incorrectQuestionIds: stats.incorrectIds,
                                        correctQuestionIds: stats.correctIds
                                      });
                                    }}
                                    className="w-full py-2 bg-white hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#C79B3A]" />
                                    <span>{isMcq ? 'ნახე არასწორი პასუხები' : 'ნახე შეცდომები'} ({stats.incorrect})</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reset / Clear Data Action Box */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-rose-900">
                მონაცემების განულება / დარესეტება
              </h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                ნებისმიერ დროს შეგიძლიათ წაშალოთ თქვენი ნაპასუხები ტესტების ისტორია და ტესტები გააკეთოთ სუფთა ფურცლიდან.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAll}
            disabled={isResetting}
            className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs uppercase tracking-wider font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isResetting ? 'განულება...' : 'ყველა მონაცემის განულება (Reset Progress)'}</span>
          </button>
        </div>

      </div>

      {/* Detailed Quiz Attempt Review Modal */}
      {selectedReviewAttempt && (
        <QuizStudentReviewModal
          attempt={selectedReviewAttempt}
          onClose={() => setSelectedReviewAttempt(null)}
          onRetake={(quizId) => {
            setSelectedReviewAttempt(null);
            onOpenQuiz?.(quizId);
          }}
        />
      )}

      {/* Detailed Incorrect Answers & Errors Modal for Chapters & Categories */}
      {modalState && (
        <IncorrectAnswersModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(null)}
          chapterTitle={modalState.chapterTitle}
          categoryKey={modalState.categoryKey}
          categoryTitle={modalState.categoryTitle}
          chapterId={modalState.chapterId}
          questions={modalState.questions}
          incorrectQuestionIds={modalState.incorrectQuestionIds}
          correctQuestionIds={modalState.correctQuestionIds}
          onGoToTest={onOpenTest}
        />
      )}

    </div>
  );
};
