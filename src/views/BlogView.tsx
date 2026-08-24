import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { fetchAllArticles, getInitialArticles } from '../lib/blogService';
import { Search, Clock, Calendar, User, ArrowRight, BookOpen } from 'lucide-react';

interface BlogViewProps {
  onOpenArticle: (article: Article) => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ onOpenArticle }) => {
  const [articles, setArticles] = useState<Article[]>(() => getInitialArticles());
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ყველა');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: string[] = [
    'ყველა',
    'საქართველოს ისტორია',
    'ძველი მსოფლიო',
    'შუა საუკუნეები',
    'ახალი და უახლესი ისტორია',
    'ეროვნული გამოცდები'
  ];

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const fetched = await fetchAllArticles();
        if (isMounted) {
          setArticles(fetched);
        }
      } catch (err) {
        console.error('Error loading articles:', err);
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredArticles = articles.filter(art => {
    if (art.status === 'draft') return false;
    const matchesCat = selectedCategory === 'ყველა' || art.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const featured = filteredArticles.find(a => a.featured) || filteredArticles[0];
  const listArticles = filteredArticles.filter(a => a.id !== featured?.id);

  return (
    <div className="max-w-[1180px] mx-auto space-y-12 pb-20 py-6 px-4 sm:px-6 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-8 bg-[#C79B3A]" />
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#C79B3A]">
            აკადემიური პუბლიკაციები
          </span>
          <div className="h-[1px] w-8 bg-[#C79B3A]" />
        </div>
        <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#13253D]">
          ისტორიული ბლოგი
        </h1>
        <p className="text-sm sm:text-base text-[#666666] leading-relaxed">
          სიღრმისეული სტატიები, ისტორიული წყაროების კრიტიკული ანალიზი და ეროვნული გამოცდების დამხმარე თემატური მასალები.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E6DDCB] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-[#13253D] text-white shadow-sm' 
                      : 'bg-[#F8F9FA] text-[#666666] hover:text-[#13253D] border border-[#E6DDCB]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#C79B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="სტატიის ან თემის ძებნა..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E6DDCB] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
            />
          </div>

        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E6DDCB] text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-[#FAF8F3] border border-[#C79B3A]/40 rounded-2xl flex items-center justify-center mx-auto text-[#C79B3A]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">სტატიები ჯერ არ არის</h3>
          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            ადმინისტრატორი მალე გამოაქვეყნებს ახალ საინტერესო ისტორიულ სტატიებსა და მასალებს.
          </p>
        </div>
      ) : (
        <>
          {/* Featured Main Article */}
          {featured && (
            <div 
              onClick={() => onOpenArticle(featured)}
              className="bg-white rounded-2xl border border-[#E6DDCB] shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-7 relative aspect-[16/10] bg-[#0D1B2A] overflow-hidden">
                <img 
                  src={featured.imageUrl} 
                  alt={featured.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 text-xs font-semibold bg-[#C79B3A] text-[#0D1B2A] px-3.5 py-1 rounded-full shadow-md font-sans">
                  რჩეული სტატია
                </span>
              </div>

              <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#C79B3A]">
                    {featured.category}
                  </span>
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-[#666666] leading-relaxed line-clamp-3">
                    {featured.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#E6DDCB] flex items-center justify-between text-xs text-[#8A8A8A]">
                  <span className="font-medium text-[#13253D]">{featured.author}</span>
                  <span>{featured.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {listArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => onOpenArticle(article)}
                className="bg-white rounded-2xl border border-[#E6DDCB] shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] bg-[#0D1B2A] overflow-hidden">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-semibold bg-[#0D1B2A]/90 text-[#FAF8F3] px-3 py-1 rounded-full border border-[#C79B3A]/40">
                    {article.category}
                  </span>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif font-bold text-lg text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E6DDCB]/60 flex items-center justify-between text-[11px] text-[#8A8A8A]">
                    <span>{article.date}</span>
                    <span className="text-[#C79B3A] font-medium">{article.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};
