import { type FC } from 'react';
import { NavTab } from '../types';
import { Home, BookOpen, Clock, ArrowRight, HelpCircle } from 'lucide-react';

interface NotFoundViewProps {
  setActiveTab: (tab: NavTab) => void;
}

export const NotFoundView: FC<NotFoundViewProps> = ({ setActiveTab }) => {
  return (
    <div className="max-w-[1180px] mx-auto min-h-[70vh] flex items-center justify-center py-20 px-4 animate-in fade-in duration-300">
      <div className="text-center space-y-8 max-w-xl w-full bg-white border-2 border-[#E6DDCB] p-8 sm:p-12 rounded-3xl shadow-xl">
        
        {/* Large 404 Watermark Badge */}
        <div className="relative inline-block">
          <span className="text-8xl sm:text-9xl font-bold font-mono tracking-tighter text-[#C79B3A]/15 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-4 py-1.5 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-xs font-bold uppercase tracking-[0.25em] rounded-full shadow-xs">
              შეცდომა 404
            </span>
          </div>
        </div>

        {/* Georgian Headline & Subtitle */}
        <div className="space-y-3">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#0D1B2A]">
            გვერდი ვერ მოიძებნა
          </h1>
          <p className="text-sm sm:text-base text-[#666666] leading-relaxed max-w-md mx-auto">
            სამწუხაროდ, თქვენ მიერ მოთხოვნილი მისამართი არ არსებობს ან გადაადგილდა.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>მთავარ გვერდზე დაბრუნება</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tests');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>ტესტების გახსნა</span>
          </button>
        </div>

        {/* Quick links */}
        <div className="pt-6 border-t border-[#E6DDCB]">
          <p className="text-xs text-[#666666] font-semibold uppercase tracking-wider mb-3">
            სწრაფი გადასვლები:
          </p>
          <div className="flex items-center justify-center gap-6 text-xs font-bold text-[#C79B3A]">
            <button onClick={() => setActiveTab('blog')} className="hover:underline cursor-pointer">
              ისტორიული ბლოგი
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('tests')} className="hover:underline cursor-pointer">
              ეროვნულის ტესტები
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('contact')} className="hover:underline cursor-pointer">
              კონტაქტი
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
