import React from 'react';
import { PlayCircle, Clock } from 'lucide-react';

export const VideosView: React.FC = () => {
  return (
    <div className="max-w-[1180px] mx-auto min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="text-center space-y-6 max-w-lg w-full animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] flex items-center justify-center shadow-sm">
          <PlayCircle className="w-10 h-10 text-[#C79B3A]" />
        </div>
        <div className="space-y-3">
          <span className="px-3 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[11px] font-bold uppercase tracking-[0.25em] rounded-full inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>მალე</span>
          </span>
          <h1 className="font-serif font-bold text-4xl text-[#0D1B2A]">ვიდეოთეკა</h1>
          <p className="text-sm text-[#666666] leading-relaxed max-w-sm mx-auto">
            ისტორიის გაკვეთილები ვიდეო ფორმატში მალე დაემატება. მოგვეახლეთ!
          </p>
        </div>
        <div className="h-1 w-16 mx-auto bg-gradient-to-r from-[#C79B3A] to-[#E6C86B] rounded-full" />
      </div>
    </div>
  );
};
