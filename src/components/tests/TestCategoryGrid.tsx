import { type FC } from 'react';
import {
  Sparkles,
  Clock,
  LogIn,
  ArrowRight,
  Database,
  BookOpen,
  MapPin,
  Layers,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { MockExamBannerInfo } from '../../types';
import { TEST_CATEGORIES, CategoryItemDetails } from '../../lib/testService';

interface TestCategoryGridProps {
  loading: boolean;
  isLoggedIn: boolean;
  isMockExamActive: boolean;
  mockBanner: MockExamBannerInfo | null;
  openingMockExam: boolean;
  categoryItemDetailsMap: Record<string, CategoryItemDetails>;
  onOpenMockExam: () => void;
  onSelectCategory: (key: string) => void;
}

const getCategoryIcon = (key: string) => {
  const iconClass = 'w-6 h-6 text-[#C79B3A] group-hover:text-white transition-colors duration-300';
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

export const TestCategoryGrid: FC<TestCategoryGridProps> = ({
  loading,
  isLoggedIn,
  isMockExamActive,
  mockBanner,
  openingMockExam,
  categoryItemDetailsMap,
  onOpenMockExam,
  onSelectCategory
}) => {
  return (
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

        {/* იმიტირებული ტესტირება (Mock Exam Banner) */}
        {isMockExamActive && mockBanner ? (
          <div
            onClick={onOpenMockExam}
            className="relative bg-[#0D1B2A] text-white p-6 sm:p-8 rounded-3xl border-2 border-[#C79B3A] shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#C79B3A_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#C79B3A] text-[#0D1B2A] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>აქტიურია</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-white/10 text-[#C79B3A] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#C79B3A]/40">
                      N1–N38 სრული ვარიანტი
                    </span>
                    <span className="px-2.5 py-0.5 bg-white/10 text-[#FAF8F3] text-[11px] font-medium rounded-full">
                      დრო: {mockBanner.duration_minutes} წთ
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F3] group-hover:text-[#C79B3A] transition-colors">
                    იმიტირებული ტესტირება — {mockBanner.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#FAF8F3]/80 max-w-2xl leading-relaxed">
                    ეროვნული გამოცდის სრული იმიტაცია (35 არჩევითპასუხიანი კითხვა, რუკა N36, ანალოგიები N37, ისტორიული წყარო N38). არჩეული თავები: {mockBanner.selected_chapters.join(', ')}.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0">
                <button
                  type="button"
                  disabled={openingMockExam}
                  className="w-full md:w-auto px-6 py-3.5 bg-[#C79B3A] group-hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {!isLoggedIn ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>შესვლა და დაწყება</span>
                    </>
                  ) : (
                    <>
                      <span>{openingMockExam ? 'იხსნება...' : 'გამოცდაზე შესვლა'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#FAF8F3] p-6 sm:p-7 rounded-2xl border border-[#E6DDCB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-80">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E6DDCB] flex items-center justify-center text-[#8A8A8A] shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                    იმიტირებული ტესტირება
                  </h3>
                  <span className="px-2.5 py-0.5 bg-white border border-[#E6DDCB] text-[#8A8A8A] text-[10px] font-bold uppercase tracking-wider rounded-full">
                    არააქტიური
                  </span>
                </div>
                <p className="text-xs text-[#666666]">
                  ამჟამად იმიტირებული გამოცდა არ მიმდინარეობს
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEST_CATEGORIES.slice(0, 4).map((cat) => {
            const details = categoryItemDetailsMap[cat.key];
            return (
              <div
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
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
                onClick={() => onSelectCategory(cat.key)}
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
  );
};

