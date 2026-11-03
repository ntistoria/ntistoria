import { type FC } from 'react';
import {
  ChevronLeft,
  Clock,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Play,
  Shuffle,
  BookMarked,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { QuizQuestion } from '../../types';
import { ProgramChapter, CategoryItemDetails, TestCategoryMeta } from '../../lib/testService';

export interface TaskGroup {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  sourceContext?: string;
  itemNumber?: number;
  questions: (QuizQuestion & { chapterId: string })[];
}

interface ChapterStats {
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
  pct: number;
}

interface TestChapterSelectorProps {
  selectedCategoryKey: string;
  activeCategoryMeta?: TestCategoryMeta;
  programs: ProgramChapter[];
  selectedChapterId: string;
  visibleChapterCount: number;
  isLoggedIn: boolean;
  loading: boolean;
  isResetting: boolean;
  categoryItemDetailsMap: Record<string, CategoryItemDetails>;
  categoryTotalCounts: Record<string, number>;
  categoryQuestionsLength: number;
  questionsCountMap: Record<string, number>;
  taskGroups: TaskGroup[];
  onBackToCategories: () => void;
  onSelectChapterId: (chId: string) => void;
  onStartRandomTest: () => void;
  onStartChapterTest: (chId: string) => void;
  onStartTaskGroupTest: (task: TaskGroup) => void;
  onResetCategoryProgress: () => void;
  onOpenAuth?: () => void;
  getChapterStats: (catKey: string, chId: string, totalQ: number) => ChapterStats;
  getChapterItemDisplay: (chId: string) => string;
}

export const TestChapterSelector: FC<TestChapterSelectorProps> = ({
  selectedCategoryKey,
  activeCategoryMeta,
  programs,
  selectedChapterId,
  visibleChapterCount,
  isLoggedIn,
  loading,
  isResetting,
  categoryItemDetailsMap,
  categoryTotalCounts,
  categoryQuestionsLength,
  questionsCountMap,
  taskGroups,
  onBackToCategories,
  onSelectChapterId,
  onStartRandomTest,
  onStartChapterTest,
  onStartTaskGroupTest,
  onResetCategoryProgress,
  onOpenAuth,
  getChapterStats,
  getChapterItemDisplay
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back & Category Header */}
      <div className="space-y-4">
        <button
          onClick={onBackToCategories}
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

      {/* CHRONOLOGY SPECIAL CATEGORY WORKFLOW */}
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
                სულ ბაზაშია {categoryTotalCounts['chronology'] || categoryQuestionsLength || 0} კითხვა (თანმიმდევრობით)
              </span>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex items-center justify-between gap-3 max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0D1B2A] text-left">
                <Lock className="w-4 h-4 text-[#C79B3A] shrink-0" />
                <span>პროგრესის შესანახად და სანახავად გაიარეთ ავტორიზაცია</span>
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
          ) : (() => {
            const totalQ = categoryTotalCounts['chronology'] || categoryQuestionsLength || 0;
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
                    onClick={onResetCategoryProgress}
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
            onClick={onStartRandomTest}
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
                onClick={onStartRandomTest}
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

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider block">
                  აირჩიეთ პროგრამის თავი:
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => onSelectChapterId(e.target.value)}
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
                        onClick={() => onStartChapterTest(selectedChapterId)}
                        disabled={loading}
                        className="w-full sm:flex-1 py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <BookMarked className="w-4 h-4" />
                        <span>ამ თავის ტესტის დაწყება</span>
                      </button>

                      {isLoggedIn && (
                        <button
                          onClick={onResetCategoryProgress}
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
          <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#E6DDCB] shadow-sm space-y-4">
            <label className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider block">
              აირჩიეთ პროგრამის თავი (11 თავი):
            </label>
            <select
              value={selectedChapterId}
              onChange={(e) => onSelectChapterId(e.target.value)}
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
              {programs.slice(0, visibleChapterCount).map((prog) => {
                const isLocked = !isLoggedIn && prog.chapterNumber !== 1;
                return (
                  <option key={prog.id} value={prog.id}>
                    {isLocked ? `🔒 ${prog.title} (საჭიროებს ავტორიზაციას)` : `${prog.title} (${getChapterItemDisplay(prog.id)})`}
                  </option>
                );
              })}
            </select>

            {!isLoggedIn ? (
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
            ) : (() => {
              const currProg = programs.find(p => p.id === selectedChapterId);
              const displayTitle = selectedChapterId === 'all'
                ? 'ყველა თავი'
                : currProg?.title || 'არჩეული თავი';
              const totalQ = selectedChapterId === 'all'
                ? categoryQuestionsLength
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
                        onClick={() => onStartTaskGroupTest(task)}
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
  );
};

