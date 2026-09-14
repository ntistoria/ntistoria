import { useState, useEffect, type FC, type FormEvent } from 'react';
import { VideoItem } from '../types';
import { 
  fetchAllVideos, 
  saveVideo, 
  deleteVideo, 
  isValidYoutubeUrl, 
  extractYoutubeId,
  getYoutubeThumbnailUrl,
  getYoutubeEmbedUrl
} from '../lib/videoService';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  PlayCircle, 
  AlertTriangle, 
  X, 
  Tag, 
  ExternalLink,
  CheckCircle2,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminVideoManager: FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // Validation and submit state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Preview modal state
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  // Delete modal state
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVideos();
      setVideos(data);
    } catch (err) {
      console.error('Error loading videos in Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract unique tags across all loaded videos for filtering
  const allTags = Array.from(
    new Set(videos.flatMap(v => v.tags || []))
  ).filter(Boolean);

  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setTagsInput('სააბიტურიენტო, ეროვნული გამოცდები');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: VideoItem) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || '');
    setYoutubeUrl(video.youtube_url);
    setTagsInput(video.tags ? video.tags.join(', ') : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('გთხოვთ შეავსოთ ვიდეოს სათაური');
      return;
    }

    if (!youtubeUrl.trim()) {
      setFormError('გთხოვთ შეყვანოთ YouTube-ის ბმული');
      return;
    }

    if (!isValidYoutubeUrl(youtubeUrl.trim())) {
      setFormError('გთხოვთ მიუთითოთ ვალიდური YouTube ბმული (მაგ. https://www.youtube.com/watch?v=...)');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    setIsSaving(true);

    try {
      const saved = await saveVideo({
        id: editingVideo?.id,
        title: title.trim(),
        description: description.trim(),
        youtube_url: youtubeUrl.trim(),
        tags: tagsArray
      });

      setVideos(prev => {
        const idx = prev.findIndex(v => v.id === saved.id || (editingVideo && v.id === editingVideo.id));
        if (idx >= 0) {
          const updatedList = [...prev];
          updatedList[idx] = saved;
          return updatedList;
        }
        return [saved, ...prev];
      });

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving video:', err);
      setFormError(err.message || 'ვიდეოს შენახვისას დაფიქსირდა შეცდომა');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVideoId) return;
    setIsDeleting(true);
    try {
      await deleteVideo(deletingVideoId);
      setVideos(prev => prev.filter(v => v.id !== deletingVideoId));
      setDeletingVideoId(null);
    } catch (err) {
      console.error('Error deleting video:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === 'all' || v.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const parsedYoutubeId = extractYoutubeId(youtubeUrl);
  const isUrlValid = parsedYoutubeId !== null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar & Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E6DDCB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#C79B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ძიება სათაურით ან ტეგებით..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A] transition-colors"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#C79B3A] shrink-0" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full sm:w-auto bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2.5 text-xs font-medium text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
            >
              <option value="all">ყველა ტეგი ({videos.length})</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Add New Video Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={loadData}
            title="მონაცემების განახლება"
            className="p-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] text-[#13253D] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#C79B3A] ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-luxury flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ახალი ვიდეოს დამატება</span>
          </button>
        </div>

      </div>

      {/* Videos List Table / Cards Container */}
      <div className="bg-white rounded-2xl border border-[#E6DDCB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E6DDCB] bg-[#FAF8F3] flex items-center justify-between">
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#13253D] flex items-center gap-2">
            <Video className="w-5 h-5 text-[#C79B3A]" />
            <span>ვიდეოების სია ({filteredVideos.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#8A8A8A]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C79B3A] mb-2" />
            <span>იტვირთება ვიდეოები Supabase-დან...</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-12 text-center text-[#8A8A8A] space-y-2">
            <PlayCircle className="w-10 h-10 text-[#C79B3A] mx-auto opacity-60" />
            <p className="font-serif text-sm font-semibold text-[#13253D]">ვიდეოები ვერ მოიძებნა</p>
            <p className="text-xs text-[#666666]">დააჭირეთ „ახალი ვიდეოს დამატება“-ს პირველი ვიდეოს დასამატებლად.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6DDCB]">
            {filteredVideos.map((video) => {
              const youtubeId = extractYoutubeId(video.youtube_url);
              const thumbUrl = getYoutubeThumbnailUrl(video.youtube_url);
              const formattedDate = video.created_at 
                ? new Date(video.created_at).toLocaleDateString('ka-GE', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'ახალი';

              return (
                <div 
                  key={video.id} 
                  className="p-4 sm:p-6 hover:bg-[#FAF8F3]/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  {/* Thumbnail & Video Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Thumbnail box with play button overlay */}
                    <div 
                      onClick={() => setPreviewVideo(video)}
                      className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden border border-[#E6DDCB] bg-[#0D1B2A] shrink-0 group cursor-pointer shadow-sm"
                    >
                      {thumbUrl ? (
                        <img 
                          src={thumbUrl} 
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0D1B2A]">
                          <PlayCircle className="w-8 h-8 text-[#C79B3A]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#C79B3A] text-[#0D1B2A] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-5 h-5 fill-[#0D1B2A]" />
                        </div>
                      </div>
                    </div>

                    {/* Text Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-[#8A8A8A]">
                          {formattedDate}
                        </span>
                        {youtubeId && (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                            YouTube ID: {youtubeId}
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#13253D] line-clamp-1">
                        {video.title}
                      </h4>

                      {video.description && (
                        <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}

                      {/* Tags */}
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {video.tags.map((tag, i) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 bg-[#FAF8F3] border border-[#E6DDCB] text-[#C79B3A] text-[10px] font-bold rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => setPreviewVideo(video)}
                      title="ვიდეოს ნახვა"
                      className="px-3 py-2 bg-[#FAF8F3] hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] text-[#13253D] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-[#C79B3A]" />
                      <span className="hidden sm:inline">ნახვა</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(video)}
                      title="რედაქტირება"
                      className="px-3 py-2 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#C79B3A]" />
                      <span>რედაქტირება</span>
                    </button>

                    <button
                      onClick={() => setDeletingVideoId(video.id)}
                      title="წაშლა"
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>წაშლა</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT VIDEO MODAL FORM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B2A]/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => !isSaving && setIsModalOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E6DDCB] z-10 my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#FAF8F3] border-b border-[#E6DDCB]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] text-[#C79B3A] flex items-center justify-center font-bold">
                    <Video className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                    {editingVideo ? 'ვიდეოს რედაქტირება' : 'ახალი ვიდეოს დამატება'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="p-1.5 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB]/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSubmit} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D1B2A]">
                    ვიდეოს სათაური <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="მაგ. დავით აღმაშენებელი და დიდგორის ომი"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3.5 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A] transition-colors"
                  />
                </div>

                {/* YouTube URL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D1B2A]">
                    YouTube ვიდეოს ბმული (URL) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className={`w-full bg-[#FAF8F3] border rounded-xl px-3.5 py-2.5 text-xs text-[#13253D] focus:outline-none transition-colors ${
                        youtubeUrl && !isUrlValid 
                          ? 'border-rose-400 focus:border-rose-500' 
                          : youtubeUrl && isUrlValid 
                          ? 'border-emerald-400 focus:border-emerald-500' 
                          : 'border-[#E6DDCB] focus:border-[#C79B3A]'
                      }`}
                    />
                    {youtubeUrl && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isUrlValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {youtubeUrl && !isUrlValid && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      არასწორი YouTube ბმულის ფორმატი. მაგალითი: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                    </p>
                  )}
                </div>

                {/* Live YouTube Preview Box */}
                {isUrlValid && parsedYoutubeId && (
                  <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] space-y-2">
                    <span className="text-[11px] font-bold text-[#C79B3A] uppercase tracking-wider block">
                      ვიდეოს წინასწარი გადახედვა (Preview)
                    </span>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#E6DDCB] bg-black">
                      <iframe
                        src={getYoutubeEmbedUrl(parsedYoutubeId)}
                        title="YouTube Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D1B2A]">
                    ვიდეოს აღწერა (არასავალდებულო)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="მოკლე ინფორმაცია ვიდეოში განხილული საკითხების შესახებ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl p-3 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A] transition-colors resize-none"
                  />
                </div>

                {/* Tags Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0D1B2A] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>ტეგები (მძიმით გამოყოფილი)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ. სააბიტურიენტო, ეროვნული გამოცდები, საქართველოს ისტორია"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3.5 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A] transition-colors"
                  />
                  <p className="text-[10px] text-[#8A8A8A]">
                    გამოყავით ტეგები მძიმეებით. მაგალითად: სააბიტურიენტო, ძველი მსოფლიო, რუკები
                  </p>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DDCB]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-4 py-2.5 border border-[#E6DDCB] text-xs font-bold rounded-xl text-[#13253D] hover:bg-[#FAF8F3] cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || (!!youtubeUrl && !isUrlValid)}
                    className="px-6 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold rounded-xl shadow-luxury disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSaving ? 'ინახება...' : editingVideo ? 'განახლება' : 'შენახვა'}</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW VIDEO MODAL */}
      <AnimatePresence>
        {previewVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B2A]/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setPreviewVideo(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E6DDCB] z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#FAF8F3] border-b border-[#E6DDCB]">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#0D1B2A] line-clamp-1">
                  {previewVideo.title}
                </h3>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="p-1 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB]/50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative bg-black aspect-video w-full">
                <iframe
                  src={getYoutubeEmbedUrl(previewVideo.youtube_url)}
                  title={previewVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-6 space-y-3">
                {previewVideo.description && (
                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                    {previewVideo.description}
                  </p>
                )}

                {previewVideo.tags && previewVideo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {previewVideo.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#FAF8F3] border border-[#E6DDCB] text-[#C79B3A] text-xs font-semibold rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      {deletingVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E6DDCB] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#13253D]">
                ნამდვილად გსურთ ვიდეოს წაშლა?
              </h3>
              <p className="text-xs text-[#666666]">
                ეს მოქმედება შეუქცევადია და ვიდეო წაიშლება მონაცემთა ბაზიდან.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingVideoId(null)}
                className="px-4 py-2 border border-[#E6DDCB] text-xs font-bold rounded-xl text-[#13253D] hover:bg-[#FAF8F3]"
              >
                გაუქმება
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'იშლება...' : 'დიახ, წაშლა'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
