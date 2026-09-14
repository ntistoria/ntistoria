import { useState, useEffect, type FC } from 'react';
import { VideoItem } from '../types';
import { 
  fetchAllVideos, 
  extractYoutubeId, 
  getYoutubeThumbnailUrl, 
  getYoutubeEmbedUrl 
} from '../lib/videoService';
import { 
  PlayCircle, 
  Search, 
  Tag, 
  Calendar, 
  RefreshCw, 
  Film, 
  Sparkles, 
  X, 
  Play,
  Maximize2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const VideosView: FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // Track playing video inline or in modal
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null);

  const loadVideosData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVideos();
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos in VideosView:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideosData();
  }, []);

  // Collect all unique tags
  const allTags = Array.from(
    new Set(videos.flatMap(v => v.tags || []))
  ).filter(Boolean);

  const filteredVideos = videos.filter(v => {
    const matchesSearch = 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.tags && v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = selectedTag === 'all' || (v.tags && v.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-300">
      
      {/* Hero Header Section */}
      <div className="relative bg-[#0D1B2A] text-[#FAF8F3] rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl border-4 border-[#C79B3A]/30">
        
        {/* Decorative Grid & Glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#C79B3A_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#C79B3A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F3]/10 border border-[#C79B3A]/40 backdrop-blur-sm">
            <PlayCircle className="w-4 h-4 text-[#C79B3A]" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#E6C86B]">
              ონლაინ აკადემია
            </span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-5xl text-[#FAF8F3] leading-tight">
            ისტორიის ვიდეოთეკა
          </h1>

          <p className="text-sm sm:text-base text-[#FAF8F3]/85 font-normal leading-relaxed">
            საგამოცდო საკითხების სიღრმისეული ვიდეოანალიზი, ისტორიული რუკების განხილვა და ლექციები ეროვნული გამოცდებისთვის მოსამზადებლად.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-[#FAF8F3]/70">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C79B3A]" />
              {videos.length} ვიდეოგაკვეთილი
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-[#C79B3A]" />
              NAEC სტანდარტების პროგრამა
            </span>
          </div>
        </div>

      </div>

      {/* Search & Tag Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DDCB] shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#C79B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ძიება ვიდეოებში, სათაურით ან თემით..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#0D1B2A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats / Refresh */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end text-xs text-[#666666]">
            <span>ნაპოვნია: <strong className="text-[#0D1B2A]">{filteredVideos.length}</strong> ვიდეო</span>
            <button
              onClick={loadVideosData}
              title="განახლება"
              className="p-2 bg-[#FAF8F3] hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] rounded-xl text-[#13253D] transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C79B3A] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">განახლება</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tag Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedTag === 'all'
                ? 'bg-[#0D1B2A] text-[#FAF8F3] shadow-sm'
                : 'bg-[#FAF8F3] text-[#666666] border border-[#E6DDCB] hover:border-[#C79B3A] hover:text-[#0D1B2A]'
            }`}
          >
            ყველა თემა ({videos.length})
          </button>

          {allTags.map(tag => {
            const isSelected = selectedTag === tag;
            const count = videos.filter(v => v.tags && v.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#C79B3A] text-[#0D1B2A] shadow-sm'
                    : 'bg-[#FAF8F3] text-[#666666] border border-[#E6DDCB] hover:border-[#C79B3A] hover:text-[#0D1B2A]'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Videos Grid Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-[#E6DDCB] overflow-hidden shadow-sm animate-pulse space-y-3 p-4">
              <div className="aspect-video bg-[#E6DDCB]/50 rounded-xl" />
              <div className="h-4 bg-[#E6DDCB]/50 rounded w-3/4" />
              <div className="h-3 bg-[#E6DDCB]/30 rounded w-full" />
              <div className="h-3 bg-[#E6DDCB]/30 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E6DDCB] p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] text-[#C79B3A] flex items-center justify-center mx-auto shadow-inner">
            <PlayCircle className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
              ვიდეოები ვერ მოიძებნა
            </h3>
            <p className="text-xs sm:text-sm text-[#666666]">
              არჩეული ფილტრის ან ძიების პირობით მონაცემები არ არსებობს.
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setSelectedTag('all'); }}
            className="px-5 py-2.5 bg-[#FAF8F3] border border-[#E6DDCB] hover:border-[#C79B3A] text-[#0D1B2A] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            ფილტრების გასუფთავება
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredVideos.map((video) => {
            const isPlayingInline = playingVideoId === video.id;
            const thumbUrl = getYoutubeThumbnailUrl(video.youtube_url);
            const embedUrl = getYoutubeEmbedUrl(video.youtube_url);
            const formattedDate = video.created_at
              ? new Date(video.created_at).toLocaleDateString('ka-GE', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'ახალი';

            return (
              <div
                key={video.id}
                className="bg-white rounded-2xl border border-[#E6DDCB] overflow-hidden shadow-sm hover:shadow-luxury hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                {/* Video Player Display / Thumbnail Container */}
                <div className="relative aspect-video bg-[#0D1B2A] w-full overflow-hidden">
                  {isPlayingInline ? (
                    <iframe
                      src={embedUrl}
                      title={video.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0D1B2A]">
                          <PlayCircle className="w-12 h-12 text-[#C79B3A]" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/90 via-[#0D1B2A]/30 to-transparent" />

                      {/* Play Button */}
                      <button
                        onClick={() => setPlayingVideoId(video.id)}
                        title="ვიდეოს ჩართვა"
                        className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#C79B3A] hover:bg-[#D4AF37] text-[#0D1B2A] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer ring-4 ring-[#C79B3A]/30"
                      >
                        <Play className="w-6 h-6 fill-[#0D1B2A] ml-1" />
                      </button>

                      {/* Expand Fullscreen Modal Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveModalVideo(video); }}
                        title="სრულ ეკრანზე გაშლა"
                        className="absolute top-3 right-3 p-2 bg-[#0D1B2A]/80 hover:bg-[#0D1B2A] text-[#FAF8F3] rounded-lg backdrop-blur-sm border border-white/10 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4 text-[#C79B3A]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Content Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8A8A8A]">
                      <Calendar className="w-3.5 h-3.5 text-[#C79B3A]" />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => setActiveModalVideo(video)}
                      className="font-serif font-bold text-base sm:text-lg text-[#0D1B2A] hover:text-[#C79B3A] transition-colors line-clamp-2 cursor-pointer leading-snug"
                    >
                      {video.title}
                    </h3>

                    {/* Description */}
                    {video.description && (
                      <p className="text-xs text-[#666666] line-clamp-3 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Footer & Badges */}
                  <div className="pt-3 border-t border-[#E6DDCB] space-y-3">
                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {video.tags.map((tag, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedTag(tag)}
                            className="px-2.5 py-0.5 bg-[#FAF8F3] hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] text-[#C79B3A] text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Link */}
                    <button
                      onClick={() => setActiveModalVideo(video)}
                      className="w-full py-2 bg-[#FAF8F3] hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-[#FAF8F3] border border-[#E6DDCB] hover:border-[#0D1B2A] text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <PlayCircle className="w-4 h-4 text-[#C79B3A]" />
                      <span>ვიდეოს ნახვა</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* FULL SCREEN VIDEO MODAL */}
      <AnimatePresence>
        {activeModalVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0D1B2A]/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setActiveModalVideo(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-[#FAF8F3] rounded-3xl shadow-2xl overflow-hidden border border-[#E6DDCB] z-10 flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#F5F2EA] border-b border-[#E6DDCB]">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#C79B3A]/20 text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-full border border-[#C79B3A]/30">
                    ვიდეოლექცია
                  </span>
                </div>
                <button
                  onClick={() => setActiveModalVideo(null)}
                  className="p-1.5 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB] rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Player */}
              <div className="relative bg-[#0D1B2A] aspect-video w-full">
                <iframe
                  src={getYoutubeEmbedUrl(activeModalVideo.youtube_url)}
                  title={activeModalVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Details Content */}
              <div className="p-6 sm:p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-2 pb-4 border-b border-[#E6DDCB]">
                  <div className="flex items-center gap-2 text-xs text-[#666666]">
                    <Calendar className="w-4 h-4 text-[#C79B3A]" />
                    <span>
                      {activeModalVideo.created_at 
                        ? new Date(activeModalVideo.created_at).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' })
                        : ''}
                    </span>
                  </div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A]">
                    {activeModalVideo.title}
                  </h2>
                </div>

                {activeModalVideo.description && (
                  <p className="text-xs sm:text-sm text-[#1B1B1B] leading-relaxed">
                    {activeModalVideo.description}
                  </p>
                )}

                {activeModalVideo.tags && activeModalVideo.tags.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {activeModalVideo.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-[#E6DDCB] text-[#C79B3A] text-xs font-semibold rounded-full shadow-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-[#F5F2EA] border-t border-[#E6DDCB] flex items-center justify-between">
                <span className="text-xs text-[#666666]">
                  NT ისტორიის მასწავლებელი — ონლაინ აკადემია
                </span>
                <button
                  onClick={() => setActiveModalVideo(null)}
                  className="bg-[#0D1B2A] text-[#FAF8F3] text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-[#13253D] transition-colors cursor-pointer"
                >
                  დახურვა
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
