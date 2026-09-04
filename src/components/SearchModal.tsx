import { useState, type FC } from 'react';
import { Article, HistoryTest, VideoLesson, NavTab } from '../types';
import { ARTICLES, TESTS, VIDEOS, HISTORICAL_EPOCHS } from '../data/historyData';
import { Search, X, BookOpen, FileText, Play, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenArticle: (article: Article) => void;
  onOpenTest: (test: HistoryTest) => void;
  onOpenVideo: (video: VideoLesson) => void;
}

export const SearchModal: FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onOpenArticle,
  onOpenTest,
  onOpenVideo
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingArticles = q ? ARTICLES.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q))) : [];
  const matchingTests = q ? TESTS.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : [];
  const matchingVideos = q ? VIDEOS.filter(v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)) : [];

  const totalResults = matchingArticles.length + matchingTests.length + matchingVideos.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#0D1B2A]/70 backdrop-blur-md animate-in fade-in duration-200">
        
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-[#E6DDCB] max-h-[80vh] flex flex-col"
        >
          {/* Search Bar Header */}
          <div className="relative p-4 bg-white border-b border-[#E6DDCB]">
            <Search className="w-5 h-5 text-[#C79B3A] absolute left-6 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="ძებნა პლატფორმაზე (სტატიები, ტესტები, ვიდეოები)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent pl-10 pr-10 py-2 text-base font-serif font-semibold text-[#0D1B2A] focus:outline-none placeholder:font-sans placeholder:text-sm placeholder:text-[#8A8A8A]"
            />
            <button
              onClick={onClose}
              className="p-1.5 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#F5F2EA] rounded-full absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results Area */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
            {!query ? (
              <div className="text-center py-8 space-y-3">
                <Search className="w-8 h-8 text-[#C79B3A] mx-auto opacity-60" />
                <p className="text-xs text-[#666666]">
                  ჩაწერეთ საკვანძო სიტყვა (მაგ: „დიდგორი“, „გეორგიევსკი“, „ფარნავაზი“)
                </p>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-8 text-xs text-[#8A8A8A]">
                შედეგი ვერ მოიძებნა სიტყვაზე „{query}“
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Articles */}
                {matchingArticles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#C79B3A] flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> სტატიები ({matchingArticles.length})
                    </h4>
                    <div className="space-y-2">
                      {matchingArticles.map(art => (
                        <div
                          key={art.id}
                          onClick={() => {
                            onOpenArticle(art);
                            onClose();
                          }}
                          className="p-3 bg-white rounded-xl border border-[#E6DDCB] hover:border-[#C79B3A] cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div>
                            <h5 className="font-serif font-bold text-sm text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors">{art.title}</h5>
                            <span className="text-[10px] text-[#8A8A8A]">{art.category} • {art.readTime}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#C79B3A]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tests */}
                {matchingTests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#C79B3A] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> ტესტები ({matchingTests.length})
                    </h4>
                    <div className="space-y-2">
                      {matchingTests.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            onOpenTest(t);
                            onClose();
                          }}
                          className="p-3 bg-white rounded-xl border border-[#E6DDCB] hover:border-[#C79B3A] cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div>
                            <h5 className="font-serif font-bold text-sm text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors">{t.title}</h5>
                            <span className="text-[10px] text-[#8A8A8A]">{t.category} • {t.difficulty}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#C79B3A]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {matchingVideos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-[#C79B3A] flex items-center gap-1.5">
                      <Play className="w-4 h-4" /> ვიდეო გაკვეთილები ({matchingVideos.length})
                    </h4>
                    <div className="space-y-2">
                      {matchingVideos.map(v => (
                        <div
                          key={v.id}
                          onClick={() => {
                            onOpenVideo(v);
                            onClose();
                          }}
                          className="p-3 bg-white rounded-xl border border-[#E6DDCB] hover:border-[#C79B3A] cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div>
                            <h5 className="font-serif font-bold text-sm text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors">{v.title}</h5>
                            <span className="text-[10px] text-[#8A8A8A]">{v.category} • {v.duration}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#C79B3A]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
