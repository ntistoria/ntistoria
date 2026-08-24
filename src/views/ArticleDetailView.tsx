import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { ArrowLeft, Calendar, User, Share2, Check, Quote, BookOpen, Facebook, Twitter, Linkedin, Link2 } from 'lucide-react';

interface ArticleDetailViewProps {
  article: Article;
  onBack: () => void;
  onSelectRelated?: (article: Article) => void;
  allArticles?: Article[];
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  onBack,
  onSelectRelated,
  allArticles = []
}) => {
  const [copied, setCopied] = useState(false);

  // Compute exact shareable URL for this specific article
  const articleSlugOrId = article.slug || article.id;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?article=${encodeURIComponent(articleSlugOrId)}`
    : '';

  // Update Document Title and Dynamic Meta Tags for Social Preview Scraping
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${article.title} — NT ისტორიის მასწავლებელი`;

    const updateMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (article.title) updateMetaTag('og:title', article.title);
    if (article.excerpt) updateMetaTag('og:description', article.excerpt);
    if (article.imageUrl) updateMetaTag('og:image', article.imageUrl);
    if (shareUrl) updateMetaTag('og:url', shareUrl);

    return () => {
      document.title = originalTitle;
    };
  }, [article, shareUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share error/cancelled:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const related = allArticles.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-24 py-6 px-4 sm:px-6 animate-in fade-in duration-300">
      
      {/* Top Back Navigation Bar */}
      <div className="border-b border-[#E6DDCB] pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#13253D] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#C79B3A]" />
          <span>ბლოგებში დაბრუნება</span>
        </button>
      </div>

      {/* Main Article Container */}
      <article className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-10 space-y-8 shadow-sm">
        
        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[11px] font-bold uppercase tracking-wider rounded-full">
              {article.category}
            </span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#0D1B2A] leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-[#666666] leading-relaxed italic font-serif border-l-3 border-[#C79B3A] pl-4">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#666666] pt-4 border-t border-[#E6DDCB]">
            <span className="flex items-center gap-1.5 font-bold text-[#13253D]">
              <User className="w-4 h-4 text-[#C79B3A]" /> {article.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#C79B3A]" /> {article.date}
            </span>
          </div>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="relative rounded-2xl overflow-hidden border border-[#E6DDCB] shadow-md aspect-video max-h-[420px] bg-[#0D1B2A]">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Quote Block if available */}
        {article.quote && (
          <div className="bg-[#FAF8F3] p-6 rounded-2xl border-l-4 border-[#C79B3A] space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-[#C79B3A]">
              <Quote className="w-5 h-5 fill-[#C79B3A]/20" />
              <span className="text-xs uppercase tracking-wider font-bold">ისტორიული ციტატა</span>
            </div>
            <p className="font-serif italic text-base sm:text-lg text-[#0D1B2A] leading-relaxed">
              {article.quote.text}
            </p>
            <p className="text-xs text-[#666666] font-semibold text-right">
              — {article.quote.author}
            </p>
          </div>
        )}

        {/* Article Body Content */}
        <div className="text-[#1B1B1B] leading-relaxed font-sans text-base sm:text-lg">
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }} 
            className="prose prose-stone max-w-none space-y-5 prose-headings:font-serif prose-headings:text-[#0D1B2A] prose-headings:font-bold prose-a:text-[#C79B3A] prose-img:rounded-xl"
          />
        </div>

        {/* Primary Sources Section if present */}
        {article.primarySources && article.primarySources.length > 0 && (
          <div className="pt-8 border-t border-[#E6DDCB] space-y-4">
            <h3 className="font-serif font-bold text-xl text-[#0D1B2A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C79B3A]" /> პირველწყაროები და ისტორიული დოკუმენტები
            </h3>
            {article.primarySources.map((src, i) => (
              <div key={i} className="bg-[#FAF8F3] p-5 rounded-2xl border border-[#E6DDCB] space-y-2">
                <h4 className="font-semibold text-sm text-[#13253D]">{src.title}</h4>
                <p className="font-serif italic text-sm text-[#666666] leading-relaxed">
                  „{src.text}“
                </p>
                <p className="text-xs text-[#C79B3A] font-bold">{src.authorOrPeriod}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E6DDCB]">
            {article.tags.map((tag, idx) => (
              <span key={idx} className="text-xs bg-[#FAF8F3] text-[#666666] px-3 py-1 rounded-lg border border-[#E6DDCB] font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Share Section Below Tags */}
        <div className="p-6 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D1B2A] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#C79B3A]" />
              <span>გააზიარეთ ეს სტატია:</span>
            </span>
            {copied && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>ლინკი კოპირებულია!</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Facebook Share */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>

            {/* Twitter / X Share */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Twitter className="w-4 h-4" />
              <span>X (Twitter)</span>
            </a>

            {/* LinkedIn Share */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>

            {/* Copy Direct Article Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#13253D] border border-[#E6DDCB] hover:bg-[#E6DDCB]/50 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-[#C79B3A]" />}
              <span>{copied ? 'კოპირებულია' : 'ლინკის კოპირება'}</span>
            </button>

            {/* Mobile Native Share if supported */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>გაზიარება</span>
              </button>
            )}
          </div>
        </div>

        {/* Author Bio Footer */}
        <div className="p-6 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#13253D] text-[#C79B3A] font-serif font-bold text-lg flex items-center justify-center shrink-0">
            NT
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">{article.author}</h4>
            <p className="text-xs text-[#666666]">ისტორიის პედაგოგი • ეროვნული გამოცდების ექსპერტი</p>
          </div>
        </div>

      </article>

      {/* Bottom Back Button */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ბლოგების ჩამონათვალში დაბრუნება</span>
        </button>
      </div>

      {/* Related Articles Grid */}
      {related.length > 0 && onSelectRelated && (
        <div className="pt-8 space-y-6">
          <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">
            სხვა სტატიები
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map(rel => (
              <div 
                key={rel.id} 
                onClick={() => onSelectRelated(rel)}
                className="bg-white p-4 rounded-2xl border border-[#E6DDCB] hover:border-[#C79B3A] cursor-pointer transition-all hover:shadow-md flex flex-col justify-between space-y-3 group"
              >
                {rel.imageUrl && (
                  <img src={rel.imageUrl} alt={rel.title} className="w-full h-32 rounded-xl object-cover" referrerPolicy="no-referrer" />
                )}
                <div className="space-y-1">
                  <span className="text-[10px] text-[#C79B3A] font-bold uppercase tracking-wider">{rel.category}</span>
                  <h4 className="font-serif font-bold text-sm text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors line-clamp-2">{rel.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
