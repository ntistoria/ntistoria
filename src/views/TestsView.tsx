import React, { useState, useEffect } from 'react';
import { HistoryTest } from '../types';

import { 
  TEST_CATEGORIES, 
  ProgramChapter, 
  fetchProgramsAndSubprograms, 
  fetchQuestionsForCategory, 
  fetchCategoryQuestionsCount,
  buildHistoryTest 
} from '../lib/testService';
import { 
  getStudentProgress, 
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
  Database
} from 'lucide-react';

interface TestsViewProps {
  onOpenTest: (test: HistoryTest) => void;
  user?: { name: string; email: string } | null;
}

export const TestsView: React.FC<TestsViewProps> = ({ onOpenTest, user }) => {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramChapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ch-1');
  const [questionsCountMap, setQuestionsCountMap] = useState<Record<string, number>>({});
  const [categoryTotalCounts, setCategoryTotalCounts] = useState<Record<string, number>>({});
  const [progressData, setProgressData] = useState<StudentProfileProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const userEmail = user?.email || 'guest_user';

  // Load programs, total question counts per category, and student progress
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      try {
        // 1. Fetch programs (fast or instant default fallback)
        const progs = await fetchProgramsAndSubprograms();
        if (isMounted) {
          setPrograms(progs);
          if (progs.length > 0) {
            setSelectedChapterId(progs[0].id);
          }
          // Turn off initial loading spinner immediately so the UI is interactive
          setLoading(false);
        }

        // 2. Fetch question counts in PARALLEL for all categories concurrently
        const catEntries = await Promise.all(
          TEST_CATEGORIES.map(async (cat) => {
            const count = await fetchCategoryQuestionsCount(cat.key);
            return [cat.key, count] as [string, number];
          })
        );

        if (isMounted) {
          const totalCounts: Record<string, number> = Object.fromEntries(catEntries);
          setCategoryTotalCounts(totalCounts);
        }

        // 3. Load student progress
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

  // When a category is selected, calculate question counts per chapter
  useEffect(() => {
    if (!selectedCategoryKey) return;

    const countQuestions = async () => {
      const allQ = await fetchQuestionsForCategory(selectedCategoryKey);
      const counts: Record<string, number> = {};
      allQ.forEach(q => {
        counts[q.chapterId] = (counts[q.chapterId] || 0) + 1;
      });
      setQuestionsCountMap(counts);
    };

    countQuestions();
  }, [selectedCategoryKey]);

  const handleSelectCategory = (key: string) => {
    setSelectedCategoryKey(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartRandomTest = async () => {
    if (!selectedCategoryKey) return;
    setLoading(true);
    try {
      const testObj = await buildHistoryTest(selectedCategoryKey, 'all');
      onOpenTest(testObj);
    } catch (err) {
      console.error('Error starting random test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChapterTest = async (chId: string) => {
    if (!selectedCategoryKey) return;
    setLoading(true);
    try {
      const testObj = await buildHistoryTest(selectedCategoryKey, chId);
      onOpenTest(testObj);
    } catch (err) {
      console.error('Error starting chapter test:', err);
    } finally {
      setLoading(false);
    }
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
    switch (key) {
      case 'mcq': return <BookOpen className="w-6 h-6 text-[#C79B3A]" />;
      case 'map': return <MapPin className="w-6 h-6 text-[#C79B3A]" />;
      case 'analogies': return <Layers className="w-6 h-6 text-[#C79B3A]" />;
      case 'source': return <FileText className="w-6 h-6 text-[#C79B3A]" />;
      case 'chronology': return <Clock className="w-6 h-6 text-[#C79B3A]" />;
      case 'illustrations': return <ImageIcon className="w-6 h-6 text-[#C79B3A]" />;
      default: return <BookOpen className="w-6 h-6 text-[#C79B3A]" />;
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
                const totalInDb = categoryTotalCounts[cat.key] || 0;
                return (
                  <div
                    key={cat.key}
                    onClick={() => handleSelectCategory(cat.key)}
                    className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all cursor-pointer group flex items-start gap-5 relative overflow-hidden"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0 group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
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
                            {loading ? 'ტვირთვა...' : totalInDb > 0 ? `${totalInDb} კითხვა ბაზაში` : 'ბაზა ემზადება'}
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
                        <span>ტესტების გახსნა (2 რეჟიმი)</span>
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
                const totalInDb = categoryTotalCounts[cat.key] || 0;
                return (
                  <div
                    key={cat.key}
                    onClick={() => handleSelectCategory(cat.key)}
                    className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all cursor-pointer group flex items-start gap-5"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0 group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
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
                            {loading ? 'ტვირთვა...' : totalInDb > 0 ? `${totalInDb} კითხვა ბაზაში` : 'ბაზა ემზადება'}
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
        /* CATEGORY SELECTED VIEW WITH 2 MODE BOXES */
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
                    ბაზაშია {categoryTotalCounts[selectedCategoryKey] || 0} კითხვა
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

          {/* TWO MAIN CHOICE BOXES */}
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
                    გააკეთეთ ტესტი, სადაც კითხვები შემთხვევითად არის შერჩეული პროგრამის ყველა 11-ვე თავიდან და ბაზიდან.
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
                        {prog.title} ({questionsCountMap[prog.id] ?? 0} კითხვა)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Chapter Details & Action */}
              <div className="space-y-4 pt-4 border-t border-[#E6DDCB]">
                {(() => {
                  const currProg = programs.find(p => p.id === selectedChapterId);
                  const totalQ = questionsCountMap[selectedChapterId] || 3;
                  const stats = getChapterStats(selectedCategoryKey, selectedChapterId, totalQ);

                  return (
                    <div className="space-y-4">
                      {/* Chapter Summary Box */}
                      <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0D1B2A]">
                            {currProg?.title}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#C79B3A]">
                            {stats.pct}% შესრულებული
                          </span>
                        </div>

                        {/* Visual Segmented Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="w-full h-3 bg-[#E6DDCB] rounded-full overflow-hidden flex">
                            {/* Correct (Green) */}
                            <div 
                              style={{ width: `${stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}%` }}
                              className="bg-emerald-500 h-full transition-all duration-500"
                              title={`სწორი: ${stats.correct}`}
                            />
                            {/* Incorrect (Red) */}
                            <div 
                              style={{ width: `${stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0}%` }}
                              className="bg-rose-500 h-full transition-all duration-500"
                              title={`არასწორი: ${stats.incorrect}`}
                            />
                            {/* Remaining (Gray) */}
                            <div 
                              style={{ width: `${stats.total > 0 ? (stats.unattempted / stats.total) * 100 : 0}%` }}
                              className="bg-gray-200 h-full transition-all duration-500"
                              title={`არ გაუკეთებია: ${stats.unattempted}`}
                            />
                          </div>

                          {/* Progress Legend */}
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

                      {/* Action Buttons: Start Chapter Test & Reset Stats */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={() => handleStartChapterTest(selectedChapterId)}
                          disabled={loading}
                          className="w-full sm:flex-1 py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <BookMarked className="w-4 h-4" />
                          <span>ამ თავის ტესტის დაწყება</span>
                        </button>

                        <button
                          onClick={handleResetCategoryProgress}
                          disabled={isResetting}
                          title="ამ თავის მონაცემების განულება / დარესეტება"
                          className="px-4 py-3.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          <span>დარესეტება</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
};
