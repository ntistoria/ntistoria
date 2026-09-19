import { useState, useEffect, type FC } from 'react';
import {
  User, ShieldCheck, BookMarked, Award, HelpCircle, RotateCcw,
  CheckCircle2, XCircle, Trash2, Eye, Play, Sparkles, BookOpen,
  MapPin, Layers, FileText, Clock, Image as ImageIcon, Edit2, Check
} from 'lucide-react';
import { getStudentProgress, resetStudentProgress, StudentProfileProgress, ChapterProgressStats } from '../lib/progressService';
import { TEST_CATEGORIES, fetchProgramsAndSubprograms, ProgramChapter } from '../lib/testService';
import { isAdminUser } from '../lib/blogService';
import { fetchUserProfile, syncUserProfile } from '../lib/userService';
import { fetchUserQuizAttempts, deleteQuizAttempt, getQuizImageUrl, getQuizResultFeedback } from '../lib/quizService';
import { QuizAttempt } from '../types';
import { QuizStudentReviewModal } from '../components/QuizStudentReviewModal';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  user: { name: string; email: string } | null;
  onOpenQuiz?: (quizId: string) => void;
  onOpenAuth?: () => void;
}

export const ProfileView: FC<ProfileViewProps> = ({
  user,
  onOpenQuiz,
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
                    className="bg-white/10 text-white border border-[#C79B3A] px-3 py-1 rounded-xl text-base font-bold focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="px-3 py-1 bg-[#C79B3A] text-[#0D1B2A] text-xs font-bold rounded-xl hover:bg-[#E6C86B] transition-all cursor-pointer"
                  >
                    {isSavingName ? '...' : 'შენახვა'}
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F3]">
                    {profileName || user.name}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-[#C79B3A] hover:text-white transition-colors cursor-pointer"
                    title="სახელის შეცვლა"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {isAdmin && (
                <span className="px-3 py-1 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ადმინისტრატორი</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#FAF8F3]/70 font-mono">
              {user.email}
            </p>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-3 gap-3 z-10 w-full md:w-auto shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="text-center px-3 py-1.5">
            <span className="text-[10px] text-[#FAF8F3]/60 font-semibold uppercase tracking-wider block">ქვიზები</span>
            <span className="font-serif font-bold text-xl text-[#C79B3A]">{quizAttempts.length}</span>
          </div>

          <div className="text-center px-3 py-1.5 border-x border-white/10">
            <span className="text-[10px] text-[#FAF8F3]/60 font-semibold uppercase tracking-wider block">სულ პასუხი</span>
            <span className="font-serif font-bold text-xl text-[#FAF8F3]">{totalAttempted}</span>
          </div>

          <div className="text-center px-3 py-1.5">
            <span className="text-[10px] text-[#FAF8F3]/60 font-semibold uppercase tracking-wider block">სიზუსტე</span>
            <span className="font-serif font-bold text-xl text-emerald-400">{overallAccuracy}%</span>
          </div>
        </div>

      </div>

      {/* Navigation In-Page Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#E6DDCB] shadow-sm w-full max-w-full overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'bg-[#0D1B2A] text-[#FAF8F3] shadow-md'
              : 'text-[#666666] hover:bg-[#FAF8F3] hover:text-[#0D1B2A]'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#C79B3A]" />
          <span>ქვიზების შედეგები ({quizAttempts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'chapters'
              ? 'bg-[#0D1B2A] text-[#FAF8F3] shadow-md'
              : 'text-[#666666] hover:bg-[#FAF8F3] hover:text-[#0D1B2A]'
          }`}
        >
          <BookMarked className="w-4 h-4 text-[#C79B3A]" />
          <span>თავების პროგრესი ({programs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-[#0D1B2A] text-[#FAF8F3] shadow-md'
              : 'text-[#666666] hover:bg-[#FAF8F3] hover:text-[#0D1B2A]'
          }`}
        >
          <Award className="w-4 h-4 text-[#C79B3A]" />
          <span>ტიპების პროგრესი</span>
        </button>
      </div>

      {/* Main Tab Content */}
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
                  აქ ჩანს თქვენ მიერ გავლილი ყველა ქვიზი, მიღებული ქულები და დეტალური პასუხები.
                </p>
              </div>

              <span className="px-3 py-1 bg-[#FAF8F3] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-mono font-bold rounded-xl">
                {quizAttempts.length} მცდელობა
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

        {/* TAB 2: PROGRAM CHAPTERS */}
        {activeTab === 'chapters' && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#C79B3A]" />
                <span>პროგრამის 11 თავის პროგრესი</span>
              </h3>
              <span className="text-xs font-mono text-[#666666]">სტატისტიკა თავების მიხედვით</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((prog) => {
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
                  <div key={prog.id} className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-serif font-bold text-[#0D1B2A]">{prog.title}</span>
                      <div className="flex items-center gap-3 text-[11px] font-semibold">
                        <span className="text-emerald-700 font-bold">სწორი: {chCorrect}</span>
                        <span className="text-rose-700">არასწორი: {chIncorrect}</span>
                        <span className="text-[#C79B3A] font-bold font-mono">{chPct}%</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-[#E6DDCB] rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${chAttempted > 0 ? (chCorrect / chAttempted) * 100 : 0}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                      />
                      <div 
                        style={{ width: `${chAttempted > 0 ? (chIncorrect / chAttempted) * 100 : 0}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TASK CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C79B3A]" />
                <span>დავალების ტიპები</span>
              </h3>
              <span className="text-xs font-mono text-[#666666]">სტატისტიკა ტიპის მიხედვით</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEST_CATEGORIES.map((cat) => {
                let catCorrect = 0;
                let catIncorrect = 0;

                if (progress) {
                  Object.entries(progress.statsByChapter).forEach(([key, stat]: [string, ChapterProgressStats]) => {
                    if (key.startsWith(`${cat.key}_`)) {
                      catCorrect += stat.correctQuestionIds.length;
                      catIncorrect += stat.incorrectQuestionIds.length;
                    }
                  });
                }

                const catAttempted = catCorrect + catIncorrect;
                const catPct = catAttempted > 0 ? Math.round((catCorrect / catAttempted) * 100) : 0;

                return (
                  <div key={cat.key} className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-[#E6DDCB] flex items-center justify-center shrink-0">
                          {getCategoryIcon(cat.key)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#0D1B2A] block">{cat.title}</span>
                          <span className="text-[10px] text-[#666666]">{cat.subtitle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-semibold">
                        <span className="text-emerald-700 font-bold">სწორი: {catCorrect}</span>
                        <span className="text-rose-700">არასწორი: {catIncorrect}</span>
                        <span className="text-[#C79B3A] font-bold font-mono">{catPct}%</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-[#E6DDCB] rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${catAttempted > 0 ? (catCorrect / catAttempted) * 100 : 0}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                      />
                      <div 
                        style={{ width: `${catAttempted > 0 ? (catIncorrect / catAttempted) * 100 : 0}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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

    </div>
  );
};
