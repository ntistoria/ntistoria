import React, { useState, useEffect } from 'react';
import { X, User, Award, CheckCircle2, XCircle, RotateCcw, ShieldCheck, Sparkles, BookOpen, Clock } from 'lucide-react';
import { getStudentProgress, resetStudentProgress, StudentProfileProgress, ChapterProgressStats } from '../lib/progressService';
import { TEST_CATEGORIES, fetchProgramsAndSubprograms, ProgramChapter } from '../lib/testService';
import { isAdminUser } from '../lib/blogService';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [progress, setProgress] = useState<StudentProfileProgress | null>(null);
  const [programs, setPrograms] = useState<ProgramChapter[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const userEmail = user?.email || '';

  useEffect(() => {
    if (isOpen && userEmail) {
      const load = async () => {
        const progs = await fetchProgramsAndSubprograms();
        setPrograms(progs);

        const data = await getStudentProgress(userEmail);
        setProgress(data);
      };
      load();
    }
  }, [isOpen, userEmail]);

  if (!isOpen || !user) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#E6DDCB] shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#0D1B2A] text-white border-b border-[#C79B3A]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C79B3A] text-[#0D1B2A] font-bold flex items-center justify-center text-base shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-[#FAF8F3]">
                  {user.name}
                </h2>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-[#C79B3A] text-[#0D1B2A] text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ადმინი</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#FAF8F3]/70 font-mono">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-[#FAF8F3]/30">
          
          {/* Success Banner */}
          {resetSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>მონაცემები წარმატებით განულდა/დარესეტდა! ტესტების გაკეთება შეგიძლიათ ხელახლა.</span>
            </div>
          )}

          {/* Overall Stats Cards Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E6DDCB] shadow-sm text-center space-y-1">
              <span className="text-[11px] text-[#666666] font-semibold uppercase tracking-wider block">სულ პასუხი</span>
              <span className="font-serif font-bold text-2xl text-[#0D1B2A]">{totalAttempted}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E6DDCB] shadow-sm text-center space-y-1">
              <span className="text-[11px] text-[#666666] font-semibold uppercase tracking-wider block">სწორი</span>
              <span className="font-serif font-bold text-2xl text-emerald-600">{totalCorrect}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E6DDCB] shadow-sm text-center space-y-1">
              <span className="text-[11px] text-[#666666] font-semibold uppercase tracking-wider block">სიზუსტე</span>
              <span className="font-serif font-bold text-2xl text-[#C79B3A]">{overallAccuracy}%</span>
            </div>
          </div>

          {/* Detailed Breakdown per Category */}
          <div className="bg-white rounded-2xl border border-[#E6DDCB] p-5 space-y-4 shadow-sm">
            <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C79B3A]" />
              <span>პროგრესი ტესტის კატეგორიების მიხედვით</span>
            </h3>

            <div className="divide-y divide-[#E6DDCB]">
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

                return (
                  <div key={cat.key} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#0D1B2A] block">{cat.title}</span>
                      <span className="text-[11px] text-[#666666]">
                        სწორი: {catCorrect} | არასწორი: {catIncorrect}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C79B3A]">
                      <span>{catAttempted > 0 ? Math.round((catCorrect / catAttempted) * 100) : 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset / Clear Data Action Box */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-sm text-rose-900">
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
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs uppercase tracking-wider font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isResetting ? 'განულება...' : 'ყველა მონაცემის განულება (Reset Progress)'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF8F3] border-t border-[#E6DDCB] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0D1B2A] text-white text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#C79B3A] transition-colors cursor-pointer"
          >
            დახურვა
          </button>
        </div>

      </div>
    </div>
  );
};
