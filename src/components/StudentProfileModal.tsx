import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, XCircle, RotateCcw, ShieldCheck, BookOpen, MapPin, Layers, FileText, Clock, Image as ImageIcon, BookMarked, HelpCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'chapters' | 'categories'>('chapters');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#E6DDCB] shadow-2xl rounded-3xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#0D1B2A] text-white border-b border-[#C79B3A]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C79B3A] text-[#0D1B2A] font-bold flex items-center justify-center text-lg shadow-sm">
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

        {/* Navigation Sub-Tabs */}
        <div className="px-6 pt-3 bg-[#FAF8F3] border-b border-[#E6DDCB] flex items-center gap-4">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'chapters'
                ? 'border-[#C79B3A] text-[#0D1B2A]'
                : 'border-transparent text-[#666666] hover:text-[#0D1B2A]'
            }`}
          >
            <BookMarked className="w-4 h-4 text-[#C79B3A]" />
            <span>პროგრამის თავების პროგრესი ({programs.length} თავი)</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-[#C79B3A] text-[#0D1B2A]'
                : 'border-transparent text-[#666666] hover:text-[#0D1B2A]'
            }`}
          >
            <Award className="w-4 h-4 text-[#C79B3A]" />
            <span>დავალების ტიპების პროგრესი</span>
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

          {/* TAB 1: 11 PROGRAM CHAPTERS PROGRESS */}
          {activeTab === 'chapters' && (
            <div className="bg-white rounded-2xl border border-[#E6DDCB] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-3">
                <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#C79B3A]" />
                  <span>პროგრამის თავები (11 თავი)</span>
                </h3>
                <span className="text-xs font-mono text-[#666666]">სტატისტიკა თავების მიხედვით</span>
              </div>

              <div className="space-y-4">
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
                    <div key={prog.id} className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-serif font-bold text-[#0D1B2A]">{prog.title}</span>
                        <div className="flex items-center gap-3 text-[11px] font-semibold">
                          <span className="text-emerald-700 font-bold">სწორი: {chCorrect}</span>
                          <span className="text-rose-700">არასწორი: {chIncorrect}</span>
                          <span className="text-[#C79B3A] font-bold font-mono">{chPct}%</span>
                        </div>
                      </div>

                      {/* Visual Segmented Progress Bar */}
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

          {/* TAB 2: TASK TYPES PROGRESS (CATEGORIES) */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-[#E6DDCB] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-3">
                <h3 className="font-serif font-bold text-base text-[#0D1B2A] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C79B3A]" />
                  <span>დავალების ტიპები</span>
                </h3>
                <span className="text-xs font-mono text-[#666666]">სტატისტიკა ტიპის მიხედვით</span>
              </div>

              <div className="space-y-4">
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
                    <div key={cat.key} className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#E6DDCB] flex items-center justify-center shrink-0">
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

                      {/* Visual Segmented Progress Bar */}
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
