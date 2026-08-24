import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { formatArticleContent } from '../lib/blogService';
import { ArrowLeft, Calendar, User, Quote, BookOpen, Share2, Copy, Check } from 'lucide-react';

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

  if (!article) return null;

  const related = allArticles.filter(a => a.id !== article.id).slice(0, 3);
  const postSlugOrId = article.slug || article.id;
  const currentPostUrl = `https://ntistoria.vercel.app/blog/${encodeURIComponent(postSlugOrId)}`;

  // Update Document Title & Canonical URL on article open
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${article.title} — NT ისტორიის მასწავლებელი`;

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', currentPostUrl);

    return () => {
      document.title = originalTitle;
    };
  }, [article, currentPostUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentPostUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentPostUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentPostUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentPostUrl)}&text=${encodeURIComponent(article.title)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(currentPostUrl)}&text=${encodeURIComponent(article.title)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + currentPostUrl)}`
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
          <span>ბლოგებში დაბრუნება</span>
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

            {/* Quick Share Widget */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 text-[#13253D] text-xs font-semibold rounded-lg border border-[#E6DDCB] transition-colors cursor-pointer"
                title="ბმულის კოპირება"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#C79B3A]" />}
                <span>{copied ? 'დაკოპირდა!' : 'ბმული'}</span>
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
            dangerouslySetInnerHTML={{ __html: formatArticleContent(article.content || '') }} 
            className="prose prose-stone max-w-none space-y-5 prose-headings:font-serif prose-headings:text-[#0D1B2A] prose-headings:font-bold prose-a:text-[#C79B3A] prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto prose-img:my-6 prose-img:border prose-img:border-[#E6DDCB]"
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

        {/* Dynamic Social Sharing Section */}
        <div className="pt-6 border-t border-[#E6DDCB] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 bg-[#FAF8F3] p-5 rounded-2xl border border-[#E6DDCB]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#13253D]">
              <Share2 className="w-5 h-5 text-[#C79B3A]" />
              <span>სტატიის გაზიარება:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Facebook */}
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>

              {/* LinkedIn */}
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#0A66C2] hover:bg-[#08529C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-1.3.36-2.5 1.9-2.5s1.65 1.44 1.65 2.57v4.86h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>LinkedIn</span>
              </a>

              {/* Telegram */}
              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#26A5E4] hover:bg-[#2092CB] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Telegram</span>
              </a>

              {/* WhatsApp */}
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* Copy URL */}
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#13253D] hover:bg-[#C79B3A] hover:text-[#0D1B2A] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#C79B3A]" />}
                <span>{copied ? 'დაკოპირდა!' : 'ბმულის კოპირება'}</span>
              </button>
            </div>
          </div>
        </div>

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
                  <img src={rel.imageUrl} alt={rel.title} className="w-full h-32 rounded-xl object-cover" />
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
