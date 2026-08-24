import React, { useState } from 'react';
import { Article } from '../types';
import { X, Clock, Calendar, User, Bookmark, Share2, BookOpen, Quote, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  onSelectRelated?: (article: Article) => void;
  allArticles?: Article[];
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ 
  article, 
  onClose,
  onSelectRelated,
  allArticles = []
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  const articleSlugOrId = article.slug || article.id;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?article=${encodeURIComponent(articleSlugOrId)}`
    : `https://ntistoria.vercel.app/?article=${encodeURIComponent(articleSlugOrId)}`;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy link if native share dialog is cancelled
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const related = allArticles.filter(a => a.id !== article.id).slice(0, 2);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto bg-[#0D1B2A]/70 backdrop-blur-sm animate-in fade-in duration-200">
        
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#FAF8F3] rounded-2xl shadow-2xl overflow-hidden z-10 border border-[#E6DDCB] max-h-[90vh] flex flex-col"
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#F5F2EA] border-b border-[#E6DDCB]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C79B3A] bg-[#C79B3A]/10 px-3 py-1 rounded-full border border-[#C79B3A]/20">
                {article.category}
              </span>
              <span className="text-xs text-[#666666] hidden sm:inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.readTime} კითხვა
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
                className="px-2.5 py-1 text-xs font-serif font-bold text-[#13253D] hover:bg-[#E6DDCB]/50 rounded transition-colors"
                title="შრიფტის ზომის შეცვლა"
              >
                {fontSize === 'normal' ? 'A+' : 'A-'}
              </button>

              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked ? 'text-[#C79B3A] bg-[#C79B3A]/15' : 'text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB]/50'
                }`}
                title="შენახვა"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#C79B3A]' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB]/50 rounded-full transition-colors relative"
                title="გაზიარება"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>

              <div className="w-[1px] h-5 bg-[#E6DDCB] mx-1" />

              <button
                onClick={onClose}
                className="p-2 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Content */}
          <div className="overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
            
            {/* Editorial Title Header */}
            <div className="space-y-4 max-w-3xl">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-[#0D1B2A] leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#666666] pt-1 border-b border-[#E6DDCB] pb-4">
                <span className="flex items-center gap-1.5 font-medium text-[#13253D]">
                  <User className="w-4 h-4 text-[#C79B3A]" /> {article.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#C79B3A]" /> {article.date}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative rounded-xl overflow-hidden shadow-md border border-[#E6DDCB] aspect-video max-h-[380px]">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/40 to-transparent" />
            </div>

            {/* Quote Block if available */}
            {article.quote && (
              <div className="bg-[#F5F2EA] p-6 rounded-xl border-l-4 border-[#C79B3A] space-y-2">
                <div className="flex items-center gap-2 text-[#C79B3A]">
                  <Quote className="w-5 h-5 fill-[#C79B3A]/20" />
                  <span className="text-xs uppercase tracking-wider font-semibold">ისტორიული ციტატა</span>
                </div>
                <p className="font-serif italic text-base sm:text-lg text-[#0D1B2A] leading-relaxed">
                  {article.quote.text}
                </p>
                <p className="text-xs text-[#666666] font-medium text-right">
                  — {article.quote.author}
                </p>
              </div>
            )}

            {/* Main Text Content */}
            <div className={`space-y-6 text-[#1B1B1B] leading-relaxed font-sans ${
              fontSize === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ __html: article.content }} 
                className="prose prose-stone max-w-none space-y-4 prose-headings:font-serif prose-headings:text-[#0D1B2A] prose-a:text-[#C79B3A]"
              />
            </div>

            {/* Primary Sources Section */}
            {article.primarySources && article.primarySources.length > 0 && (
              <div className="pt-6 border-t border-[#E6DDCB] space-y-4">
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#C79B3A]" /> პირველწყაროები და ისტორიული დოკუმენტები
                </h3>
                {article.primarySources.map((src, i) => (
                  <div key={i} className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6DDCB] shadow-sm space-y-2">
                    <h4 className="font-semibold text-sm text-[#13253D]">{src.title}</h4>
                    <p className="font-serif italic text-sm text-[#666666] leading-relaxed">
                      „{src.text}“
                    </p>
                    <p className="text-xs text-[#C79B3A] font-medium">{src.authorOrPeriod}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {article.tags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-[#F5F2EA] text-[#666666] px-3 py-1 rounded-md border border-[#E6DDCB]">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Related Articles Footer */}
            {related.length > 0 && onSelectRelated && (
              <div className="pt-8 border-t border-[#E6DDCB] space-y-4">
                <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">მსგავსი სტატიები</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map(rel => (
                    <div 
                      key={rel.id} 
                      onClick={() => onSelectRelated(rel)}
                      className="bg-white p-4 rounded-xl border border-[#E6DDCB] hover:border-[#C79B3A] cursor-pointer transition-all hover:shadow-md flex items-center gap-3"
                    >
                      <img src={rel.imageUrl} alt={rel.title} className="w-16 h-16 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div>
                        <h5 className="font-serif font-semibold text-xs text-[#0D1B2A] line-clamp-2">{rel.title}</h5>
                        <span className="text-[10px] text-[#C79B3A] font-medium mt-1 inline-block">{rel.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-[#F5F2EA] border-t border-[#E6DDCB] flex items-center justify-between">
            <span className="text-xs text-[#666666]">
              NT ისტორიის მასწავლებელი — აკადემიური პუბლიკაცია
            </span>
            <button
              onClick={onClose}
              className="bg-[#0D1B2A] hover:bg-[#13253D] text-[#FAF8F3] text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              დახურვა
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
