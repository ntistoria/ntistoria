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
    ? `${window.location.origin}/?article=${encodeURIComponent(articleSlugOrId)}`
    : `https://ntistoria.vercel.app/?article=${encodeURIComponent(articleSlugOrId)}`;

  // Update Document Title and Dynamic Meta Tags for Social Preview Scraping
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${article.title} — NT ისტორიის მასწავლებელი`;

    const updateMetaTag = (property: string, content: string, isName = false) => {
      let element = document.querySelector(
        isName ? `meta[name="${property}"]` : `meta[property="${property}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (isName) element.setAttribute('name', property);
        else element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (article.title) {
      updateMetaTag('og:title', article.title);
      updateMetaTag('twitter:title', article.title, true);
    }
    if (article.excerpt) {
      updateMetaTag('og:description', article.excerpt);
      updateMetaTag('twitter:description', article.excerpt, true);
    }
    if (article.imageUrl) {
      updateMetaTag('og:image', article.imageUrl);
      updateMetaTag('og:image:secure_url', article.imageUrl);
      updateMetaTag('twitter:image', article.imageUrl, true);
    }
    if (shareUrl) {
      updateMetaTag('og:url', shareUrl);
    }
    updateMetaTag('og:type', 'article');
    updateMetaTag('twitter:card', 'summary_large_image', true);

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
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
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

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FAF8F3] text-[#13253D] text-xs font-semibold rounded-xl border border-[#E6DDCB] transition-all shadow-sm cursor-pointer hover:border-[#C79B3A]"
        >
          <ArrowLeft className="w-4 h-4 text-[#C79B3A]" />
          <span>უკან დაბრუნება</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#13253D] text-[#FAF8F3] text-[11px] font-bold uppercase tracking-wider rounded-full">
            {article.category}
          </span>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="bg-white rounded-3xl border border-[#E6DDCB] shadow-sm overflow-hidden space-y-8 p-6 sm:p-10">
        
        {/* Header Block */}
        <header className="space-y-4 border-b border-[#E6DDCB] pb-8">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#13253D] leading-tight">
            {article.title}
          </h1>

          {/* Meta bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 text-xs text-[#666666]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-[#13253D]">
                <User className="w-4 h-4 text-[#C79B3A]" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#C79B3A]" />
                {article.date}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNativeShare}
                className="px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#E6DDCB]/50 text-[#13253D] text-xs font-semibold rounded-lg border border-[#E6DDCB] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="გაზიარება"
              >
                <Share2 className="w-3.5 h-3.5 text-[#C79B3A]" />
                <span>გაზიარება</span>
              </button>
            </div>
          </div>

          {/* Excerpt Lead */}
          {article.excerpt && (
            <p className="text-base sm:text-lg text-[#444444] font-serif italic leading-relaxed border-l-4 border-[#C79B3A] pl-4 py-1">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#E6DDCB] aspect-[16/9] sm:aspect-[21/9]">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main Content Body */}
        <div className="prose prose-serif max-w-none text-[#1B1B1B] text-base sm:text-lg leading-relaxed space-y-6">
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }} 
            className="prose prose-stone max-w-none space-y-5 prose-headings:font-serif prose-headings:text-[#0D1B2A] prose-headings:font-bold prose-a:text-[#C79B3A] prose-img:rounded-xl"
          />
        </div>

        {/* Quote Block if present */}
        {article.quote && (
          <div className="bg-[#FAF8F3] p-6 sm:p-8 rounded-2xl border border-[#E6DDCB] space-y-3">
            <Quote className="w-8 h-8 text-[#C79B3A] opacity-60" />
            <p className="font-serif italic text-lg sm:text-xl text-[#13253D] leading-snug">
              "{article.quote.text}"
            </p>
            <p className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider">
              — {article.quote.author}
            </p>
          </div>
        )}

        {/* Primary Sources if present */}
        {article.primarySources && article.primarySources.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#E6DDCB]">
            <h3 className="font-serif font-bold text-xl text-[#13253D] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C79B3A]" />
              <span>ისტორიული წყაროები & დოკუმენტები</span>
            </h3>

            <div className="grid gap-4 sm:grid-cols-1">
              {article.primarySources.map((source, sIdx) => (
                <div key={sIdx} className="bg-[#F8F9FA] p-5 rounded-2xl border border-[#E6DDCB] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-base text-[#13253D]">
                      {source.title}
                    </h4>
                    <span className="text-[11px] font-mono text-[#8A8A8A]">
                      {source.authorOrPeriod}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#555555] font-serif italic leading-relaxed bg-white p-3 rounded-xl border border-[#E6DDCB]">
                    "{source.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E6DDCB]">
            <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider mr-1">
              თეგები:
            </span>
            {article.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="px-3 py-1 bg-[#FAF8F3] border border-[#E6DDCB] text-[#13253D] text-xs font-medium rounded-lg"
              >
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
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(article.title + ' — ' + (article.excerpt || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>

            {/* WhatsApp Share */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent('*' + article.title + '*\n' + (article.excerpt ? article.excerpt + '\n\n' : '') + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <span className="font-bold">WhatsApp</span>
            </a>

            {/* Telegram Share */}
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title + (article.excerpt ? '\n' + article.excerpt : ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <span className="font-bold">Telegram</span>
            </a>

            {/* Twitter / X Share */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#000000] hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Twitter className="w-4 h-4" />
              <span>X</span>
            </a>

            {/* Copy Direct Article Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#13253D] border border-[#E6DDCB] hover:bg-[#E6DDCB]/50 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-[#C79B3A]" />}
              <span>{copied ? 'კოპირებულია' : 'ლინკის კოპირება'}</span>
            </button>
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
