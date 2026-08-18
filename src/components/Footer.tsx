import React from 'react';
import { NavTab } from '../types';
import { Logo } from './Logo';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D1B2A] text-[#FAF8F3] pt-16 pb-12 border-t-4 border-[#C79B3A]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Quote & Emblem Bar */}
        <div className="text-center max-w-2xl mx-auto pb-12 border-b border-[#FAF8F3]/10">
          <p className="font-serif italic text-lg sm:text-xl text-[#E6C86B] font-light leading-relaxed">
            „დიდ-ბუნებოვან კაცთა და სახელოვან გმირთა მაგალითებით ისტორია სწურთნის ერსა...“
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-[#FAF8F3]/60 mt-3 font-medium">
            ილია ჭავჭავაძე
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-12">
          
          {/* Brand Info (4 cols) */}
          <div className="md:col-span-4 space-y-5">
            <Logo 
              variant="compact" 
              src="https://vqkpacwswksgvhuczrbw.supabase.co/storage/v1/object/public/photos/logooo.png"
              imgClassName="h-16 sm:h-20 md:h-24 max-w-[280px]" 
              onClick={() => setActiveTab('home')} 
            />
            <p className="text-sm text-[#FAF8F3]/85 leading-relaxed max-w-[340px] font-normal">
              ისტორიის პედაგოგ ნოდარ თოთაძის მოსამზადებელი პორტალი. მოემზადე ეროვნული გამოცდებისთვის საგამოცდო რესურსებით, ტესტებითა და ვიდეო გაკვეთილებით.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a 
                href="https://www.facebook.com/profile.php?id=61593642503126" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] flex items-center justify-center transition-all cursor-pointer border border-[#FAF8F3]/10"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://www.instagram.com/ntistoria/?hl=en" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] flex items-center justify-center transition-all cursor-pointer border border-[#FAF8F3]/10"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://www.tiktok.com/@nt.istoria" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] flex items-center justify-center transition-all cursor-pointer border border-[#FAF8F3]/10"
                title="TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.83.12V9.32a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.33 8.33 0 0 0 4.96 1.62V7.22a4.85 4.85 0 0 1-1.01-.53z" />
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@NTIstoria" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] flex items-center justify-center transition-all cursor-pointer border border-[#FAF8F3]/10"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C79B3A]">
              ნავიგაცია
            </h4>
            <ul className="space-y-2 text-sm text-[#FAF8F3]/80 font-normal">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-[#C79B3A] transition-colors cursor-pointer">
                  მთავარი გვერდი
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('blog')} className="hover:text-[#C79B3A] transition-colors cursor-pointer">
                  ისტორიული ბლოგი
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('tests')} className="hover:text-[#C79B3A] transition-colors cursor-pointer">
                  ინტერაქტიული ტესტები
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('videos')} className="hover:text-[#C79B3A] transition-colors cursor-pointer">
                  ვიდეოთეკა
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('quizzes')} className="hover:text-[#C79B3A] transition-colors cursor-pointer">
                  ქვიზები
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contact')} className="hover:text-[#C79B3A] transition-colors cursor-pointer">
                  კონსულტაცია & FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C79B3A]">
              საკონტაქტო ინფორმაცია
            </h4>
            <ul className="space-y-3 text-sm text-[#FAF8F3]/80">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C79B3A] shrink-0 mt-1" />
                <span>თბილისი, ვაზისუბნის დასახლება</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C79B3A] shrink-0" />
                <span>574 122 193</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C79B3A] shrink-0" />
                <span>ntistoria@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Gold Divider Line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C79B3A]/40 to-transparent my-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF8F3]/60 pt-2">
          <div className="flex items-center gap-4 text-[11px] font-mono tracking-wider uppercase">
            <span>© {currentYear} NT HISTORY ACADEMY</span>
            <span>•</span>
            <span>Tbilisi, Georgia</span>
          </div>

          <div className="flex items-center gap-[6px]">
            <div className="w-2 h-2 rounded-full bg-[#E6DDCB]" />
            <div className="w-2 h-2 rounded-full bg-[#C79B3A]" />
            <div className="w-2 h-2 rounded-full bg-[#13253D]" />
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-[#C79B3A] transition-colors cursor-pointer">კონფიდენციალურობა</span>
            <span className="hover:text-[#C79B3A] transition-colors cursor-pointer">სარგებლობის პირობები</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
