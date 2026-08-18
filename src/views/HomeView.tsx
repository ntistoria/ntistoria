import React, { useState } from 'react';
import { NavTab, Article, HistoryTest, VideoLesson } from '../types';
import { HERO_IMAGE, ABOUT_IMAGE, HISTORICAL_EPOCHS, ARTICLES } from '../data/historyData';
import { Video, BookOpen, FileText, ArrowRight, CheckCircle2, MapPin, Wifi, Phone, GraduationCap, Award, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { CatalogModal } from '../components/CatalogModal';

interface HomeViewProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenArticle: (article: Article) => void;
  onOpenTest?: (test: HistoryTest) => void;
  onOpenVideo?: (video: VideoLesson) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setActiveTab,
  onOpenArticle
}) => {
  const [catalogType, setCatalogType] = useState<'universities' | 'colleges' | 'programs' | null>(null);
  const featuredArticles = ARTICLES.slice(0, 3);

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION (Split 50/50 Layout) */}
      <section className="relative py-8 lg:py-12">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Content (50% Width) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-5 text-left flex flex-col justify-center"
            >
              {/* Prestigious Eyebrow Header Line */}
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-10 bg-[#C79B3A]" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#C79B3A] font-bold">
                  NT ისტორიის მასწავლებელი
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#13253D] leading-[1.15] tracking-tight font-bold">
                მომზადება ისტორიაში <br className="hidden sm:inline" /> <span className="text-[#C79B3A] italic font-light">მაღალი სტანდარტით</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[#666666] leading-relaxed text-sm sm:text-base max-w-lg font-normal">
                მოემზადე ეროვნული გამოცდებისთვის ისტორიის პედაგოგ ნოდარ თოთაძესთან ერთად. პროფესიონალური ტესტები, ვიდეო გაკვეთილები, ისტორიული ბლოგები და ყველა საჭირო რესურსი უმაღლესი შედეგებისთვის.
              </p>

              {/* Social Media Links */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a 
                  href="https://www.facebook.com/profile.php?id=61593642503126" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#13253D] text-xs font-semibold hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all duration-200 shadow-sm cursor-pointer"
                  title="Facebook"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>

                <a 
                  href="https://www.instagram.com/ntistoria/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#13253D] text-xs font-semibold hover:bg-gradient-to-r hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F56040] hover:text-white hover:border-transparent transition-all duration-200 shadow-sm cursor-pointer"
                  title="Instagram"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>

                <a 
                  href="https://www.tiktok.com/@nt.istoria" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#13253D] text-xs font-semibold hover:bg-black hover:text-white hover:border-black transition-all duration-200 shadow-sm cursor-pointer"
                  title="TikTok"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.42V8.9a6.34 6.34 0 0 0-6.33 6.34 6.34 6.34 0 0 0 10.83 4.47 6.27 6.27 0 0 0 1.84-4.47V9.07a8.28 8.28 0 0 0 5.2 1.82V7.44a4.83 4.83 0 0 1-1.43-.75z"/>
                  </svg>
                  <span>TikTok</span>
                </a>

                <a 
                  href="https://www.youtube.com/@NTIstoria" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#13253D] text-xs font-semibold hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] transition-all duration-200 shadow-sm cursor-pointer"
                  title="YouTube"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.017 3.017 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>YouTube</span>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => setActiveTab('tests')}
                  className="px-6 py-3.5 bg-[#C79B3A] text-white text-[12px] uppercase tracking-widest font-bold rounded-[2px] shadow-md shadow-[#C79B3A]/20 hover:bg-[#D4AF37] transition-all cursor-pointer active:scale-[0.98]"
                >
                  საგამოცდო ტესტები
                </button>

                <button
                  onClick={() => setActiveTab('videos')}
                  className="px-6 py-3.5 border border-[#E6DDCB] text-[#13253D] text-[12px] uppercase tracking-widest font-bold hover:bg-[#F5F2EA] transition-colors rounded-[2px] cursor-pointer"
                >
                  ვიდეოთეკა
                </button>
              </div>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E6DDCB] max-w-md">
                <div className="space-y-0.5">
                  <div className="font-serif font-bold text-lg sm:text-xl text-[#13253D]">98%</div>
                  <div className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">წარმატებული სტუდენტი</div>
                </div>
                <div className="space-y-0.5 border-x border-[#E6DDCB] px-3">
                  <div className="font-serif font-bold text-lg sm:text-xl text-[#C79B3A]">8+</div>
                  <div className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">წლის გამოცდილება</div>
                </div>
                <div className="space-y-0.5 pl-2">
                  <div className="font-serif font-bold text-lg sm:text-xl text-[#13253D]">100+</div>
                  <div className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">მოსწავლე</div>
                </div>
              </div>

            </motion.div>

            {/* Right Hero Image (Enlarged 50% Width Composition) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative flex flex-col space-y-3 justify-center"
            >
              {/* Header Badges above photo: ადგილზე, ონლაინ, Phone & 574 122 193 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[2px] bg-white border border-[#E6DDCB] text-[#13253D] text-xs font-semibold shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>ადგილზე</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[2px] bg-white border border-[#E6DDCB] text-[#13253D] text-xs font-semibold shadow-sm">
                    <Wifi className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>ონლაინ</span>
                  </div>
                </div>

                <a 
                  href="tel:574122193" 
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] bg-[#13253D] text-white text-xs font-semibold shadow-sm hover:bg-[#C79B3A] transition-colors cursor-pointer"
                  title="დარეკვა"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C79B3A]" />
                  <span className="font-mono tracking-wider">574 122 193</span>
                </a>
              </div>

              <div className="relative w-full bg-[#F5F2EA] border border-[#E6DDCB] overflow-hidden rounded-[2px] p-4 sm:p-6 flex items-center justify-center">
                {/* Radial grid dot pattern overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#13253D_1px,transparent_1px)] bg-[size:20px_20px]" />

                <div className="relative w-full aspect-[16/11] bg-[#13253D] border border-[#E6DDCB] shadow-2xl overflow-hidden rounded-[2px] group">
                  <img 
                    src={HERO_IMAGE} 
                    alt="NT ისტორიის მასწავლებელი — აკადემიური პლატფორმა" 
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#13253D]/80 via-transparent to-transparent" />
                  
                  {/* Golden decorative corner accents */}
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#C79B3A] pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#C79B3A] pointer-events-none" />

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <p className="font-serif text-2xl sm:text-3xl italic opacity-95 text-[#FAF8F3]">ACADEMIA</p>
                    <p className="text-[#C79B3A] text-[10px] sm:text-[11px] tracking-[0.4em] uppercase font-bold">Archives • 2026</p>
                  </div>
                </div>

                {/* Editorial Badge */}
                <div className="absolute bottom-10 right-0 bg-[#C79B3A] py-2.5 px-5 text-white text-[10px] font-bold tracking-[0.2em] uppercase rounded-l-[2px] shadow-md">
                  Academic Edition
                </div>
              </div>

              {/* Symmetrical Quote Card below photo */}
              <div className="bg-[#FAF8F3] border border-[#E6DDCB] border-l-4 border-l-[#C79B3A] p-3.5 sm:p-4 rounded-[2px] shadow-sm flex items-start gap-3">
                <Quote className="w-4 h-4 text-[#C79B3A] shrink-0 mt-0.5" />
                <p className="font-serif italic text-xs sm:text-sm text-[#13253D] leading-relaxed font-medium">
                  „ერთ წიგნს, ერთ კალამს, ერთ ბავშვს და ერთ მასწავლებელს შეუძლია შეცვალოს სამყარო!“
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED SECTION (Three Professional Cards Row) */}
      <section className="border-y border-[#E6DDCB] bg-white py-6">
        <div className="max-w-[1180px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E6DDCB]">
            
            {/* Card 1 */}
            <div 
              onClick={() => setActiveTab('videos')}
              className="flex items-center gap-6 p-6 cursor-pointer group hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-14 h-14 bg-[#F8F9FA] border border-[#E6DDCB] flex items-center justify-center shrink-0 rounded-[2px] group-hover:border-[#C79B3A] transition-colors">
                <Video className="w-6 h-6 text-[#C79B3A]" />
              </div>
              <div>
                <h3 className="text-[13px] uppercase tracking-widest font-bold text-[#13253D] mb-1 group-hover:text-[#C79B3A] transition-colors">
                  ვიდეო გაკვეთილები
                </h3>
                <p className="text-[11px] text-[#8A8A8A]">საგამოცდო პროგრამა</p>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => setActiveTab('tests')}
              className="flex items-center gap-6 p-6 cursor-pointer group hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-14 h-14 bg-[#F8F9FA] border border-[#E6DDCB] flex items-center justify-center shrink-0 rounded-[2px] group-hover:border-[#C79B3A] transition-colors">
                <BookOpen className="w-6 h-6 text-[#C79B3A]" />
              </div>
              <div>
                <h3 className="text-[13px] uppercase tracking-widest font-bold text-[#13253D] mb-1 group-hover:text-[#C79B3A] transition-colors">
                  ინტერაქტიული ტესტები
                </h3>
                <p className="text-[11px] text-[#8A8A8A]">თვითშემოწმებისთვის</p>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => setActiveTab('blog')}
              className="flex items-center gap-6 p-6 cursor-pointer group hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-14 h-14 bg-[#F8F9FA] border border-[#E6DDCB] flex items-center justify-center shrink-0 rounded-[2px] group-hover:border-[#C79B3A] transition-colors">
                <FileText className="w-6 h-6 text-[#C79B3A]" />
              </div>
              <div>
                <h3 className="text-[13px] uppercase tracking-widest font-bold text-[#13253D] mb-1 group-hover:text-[#C79B3A] transition-colors">
                  ისტორიული ბლოგი
                </h3>
                <p className="text-[11px] text-[#8A8A8A]">დამხმარე თემატური მასალები</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CATALOGS SECTION (3 Blocks above Blog) */}
      <section className="max-w-[1180px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setCatalogType('universities')}
            className="bg-white p-6 rounded-[2px] border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all group cursor-pointer flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-[2px] bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center text-[#C79B3A] group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#13253D] group-hover:text-[#C79B3A] transition-colors">
                უნივერსიტეტები
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-0.5">უმაღლესი სასწავლებლების კატალოგი</p>
            </div>
          </div>

          <div 
            onClick={() => setCatalogType('colleges')}
            className="bg-white p-6 rounded-[2px] border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all group cursor-pointer flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-[2px] bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center text-[#C79B3A] group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#13253D] group-hover:text-[#C79B3A] transition-colors">
                კოლეჯები კატალოგი
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-0.5">პროფესიული სასწავლებლები</p>
            </div>
          </div>

          <div 
            onClick={() => setCatalogType('programs')}
            className="bg-white p-6 rounded-[2px] border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all group cursor-pointer flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-[2px] bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center text-[#C79B3A] group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#13253D] group-hover:text-[#C79B3A] transition-colors">
                პროგრამების კატალოგი 2026
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-0.5">განახლებული აკადემიური პროგრამები</p>
            </div>
          </div>
        </div>
      </section>

      <CatalogModal 
        type={catalogType} 
        onClose={() => setCatalogType(null)} 
      />

      {/* 3. BLOG SECTION (Editorial Magazine Layout) */}
      <section className="max-w-[1180px] mx-auto space-y-10">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6DDCB] pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C79B3A]">
              საინტერესო საკითხავი
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#0D1B2A]">
              ისტორიული ბლოგი
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('blog')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#13253D] hover:text-[#C79B3A] transition-colors cursor-pointer"
          >
            <span>ყველა სტატია</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Magazine Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Featured Large Lead Article (7 cols) */}
          {featuredArticles[0] && (
            <div 
              onClick={() => onOpenArticle(featuredArticles[0])}
              className="lg:col-span-7 bg-white rounded-2xl border border-[#E6DDCB] shadow-luxury shadow-luxury-hover overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] bg-[#0D1B2A] overflow-hidden">
                <img 
                  src={featuredArticles[0].imageUrl} 
                  alt={featuredArticles[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 text-xs font-semibold bg-[#0D1B2A] text-[#FAF8F3] px-3 py-1 rounded-full border border-[#C79B3A]">
                  {featuredArticles[0].category}
                </span>
              </div>

              <div className="p-8 space-y-4">
                <h3 className="font-serif font-bold text-2xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-tight">
                  {featuredArticles[0].title}
                </h3>
                <p className="text-sm text-[#666666] line-clamp-2 leading-relaxed">
                  {featuredArticles[0].excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-[#8A8A8A] pt-4 border-t border-[#E6DDCB]/60">
                  <span className="font-medium text-[#13253D]">{featuredArticles[0].author}</span>
                  <div className="flex items-center gap-3">
                    <span>{featuredArticles[0].date}</span>
                    <span>•</span>
                    <span>{featuredArticles[0].readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Article Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {featuredArticles.slice(1, 3).map((article) => (
              <div 
                key={article.id}
                onClick={() => onOpenArticle(article)}
                className="bg-white p-6 rounded-2xl border border-[#E6DDCB] shadow-luxury shadow-luxury-hover cursor-pointer group flex gap-5 items-center"
              >
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-24 h-24 rounded-xl object-cover shrink-0 border border-[#E6DDCB]"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C79B3A]">
                    {article.category}
                  </span>
                  <h4 className="font-serif font-bold text-base text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="text-[11px] text-[#8A8A8A] flex items-center gap-2">
                    <span>{article.readTime}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. ABOUT SECTION (Teacher Profile) */}
      <section id="about-section" className="bg-[#F5F2EA] py-16 border-y border-[#E6DDCB]">
        <div className="max-w-[1180px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C79B3A]">
                პედაგოგის პროფილი
              </span>

              <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#0D1B2A] leading-tight">
                მისია და პედაგოგიური ფილოსოფია
              </h2>

              <p className="text-base text-[#666666] leading-relaxed font-medium">
                ისტორია არის კრიტიკული აზროვნების, მიზეზ-შედეგობრივი კავშირების გააზრებისა და ეროვნული თვითშეგნების ჩამოყალიბების უმთავრესი ინსტრუმენტი!
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#0D1B2A]">სერტიფიცირებული უფროსი პედაგოგი</h4>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#0D1B2A]">სისტემური - ხარისხიანი მომზადება NAEC სტანდარტით</h4>
                    <p className="text-xs text-[#666666] mt-0.5">საგამოცდო პროგრამის ყოველი დეტალისა და კრიტერიუმის სიღრმისეული დამუშავება.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#0D1B2A]">მოსწავლის საჭიროებებზე მორგებული სასწავლო პროგრამა</h4>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Image */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border-2 border-[#E6DDCB] shadow-2xl aspect-[4/3] bg-[#0D1B2A]">
                <img 
                  src={ABOUT_IMAGE} 
                  alt="ნოდარ თოთაძე — ისტორიის მასწავლებელი" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
