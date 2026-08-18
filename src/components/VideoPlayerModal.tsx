import React, { useState } from 'react';
import { VideoLesson } from '../types';
import { X, Play, FileText, CheckCircle2, User, Eye, Calendar, Clock, Download, BookOpen, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerModalProps {
  video: VideoLesson | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'notes' | 'materials'>('topics');

  if (!video) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#0D1B2A]/85 backdrop-blur-md animate-in fade-in duration-200">
        
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl bg-[#FAF8F3] rounded-2xl shadow-2xl overflow-hidden z-10 border border-[#E6DDCB] max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#F5F2EA] border-b border-[#E6DDCB]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider bg-[#C79B3A]/20 text-[#0D1B2A] px-3 py-1 rounded-full border border-[#C79B3A]/30">
                {video.category}
              </span>
              <span className="text-xs text-[#666666] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#C79B3A]" /> {video.duration}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Video Player Display Container */}
            <div className="relative bg-[#0D1B2A] aspect-video w-full flex items-center justify-center overflow-hidden group">
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                  title={video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/40 to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="relative z-10 w-20 h-20 rounded-full bg-[#C79B3A] hover:bg-[#D4AF37] text-[#0D1B2A] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer group-hover:ring-8 ring-[#C79B3A]/30"
                  >
                    <Play className="w-8 h-8 fill-[#0D1B2A] ml-1" />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-xs text-[#E6C86B] uppercase font-semibold tracking-wider">
                      ონლაინ ვიდეოგაკვეთილი
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold line-clamp-1">
                      {video.title}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Details Info */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E6DDCB]">
                <div className="space-y-1">
                  <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A]">
                    {video.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666]">
                    <span className="flex items-center gap-1 font-medium text-[#13253D]">
                      <User className="w-3.5 h-3.5 text-[#C79B3A]" /> {video.instructor}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#C79B3A]" /> {video.views} ნახვა
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C79B3A]" /> {video.publishedDate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setCompleted(!completed)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    completed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-[#F5F2EA] text-[#13253D] border border-[#E6DDCB] hover:border-[#C79B3A]'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${completed ? 'text-emerald-600' : 'text-[#8A8A8A]'}`} />
                  <span>{completed ? 'გაკვეთილი დასრულებულია' : 'მოპასუხედ მონიშვნა'}</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-[#1B1B1B] leading-relaxed">
                {video.description}
              </p>

              {/* Tab Navigation */}
              <div className="space-y-4">
                <div className="flex border-b border-[#E6DDCB] gap-6 text-sm">
                  <button
                    onClick={() => setActiveTab('topics')}
                    className={`pb-2 font-medium cursor-pointer transition-colors relative ${
                      activeTab === 'topics' ? 'text-[#0D1B2A] font-semibold' : 'text-[#666666]'
                    }`}
                  >
                    ძირითადი თემები ({video.keyTopics.length})
                    {activeTab === 'topics' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C79B3A]" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-2 font-medium cursor-pointer transition-colors relative ${
                      activeTab === 'notes' ? 'text-[#0D1B2A] font-semibold' : 'text-[#666666]'
                    }`}
                  >
                    მასწავლებლის შენიშვნები
                    {activeTab === 'notes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C79B3A]" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`pb-2 font-medium cursor-pointer transition-colors relative ${
                      activeTab === 'materials' ? 'text-[#0D1B2A] font-semibold' : 'text-[#666666]'
                    }`}
                  >
                    სასწავლო მასალები ({video.materialsCount})
                    {activeTab === 'materials' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C79B3A]" />}
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'topics' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {video.keyTopics.map((topic, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] text-xs font-semibold text-[#13253D]">
                        <span className="w-2 h-2 rounded-full bg-[#C79B3A]" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="p-5 rounded-xl bg-white border border-[#E6DDCB] space-y-2 text-xs sm:text-sm text-[#666666] leading-relaxed">
                    <p className="font-serif italic text-[#0D1B2A]">
                      {video.notes || 'ამ გაკვეთილისთვის დამატებითი შენიშვნები ხელმისაწვდომია საგამოცდო კონსპექტში.'}
                    </p>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E6DDCB]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#C79B3A]" />
                        <div>
                          <h4 className="text-xs font-semibold text-[#0D1B2A]">{video.title} — საგამოცდო კონსპექტი (PDF)</h4>
                          <span className="text-[10px] text-[#8A8A8A]">2.4 MB • NAEC სტანდარტის რეზიუმე</span>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F5F2EA] text-[#13253D] border border-[#E6DDCB] text-xs font-semibold transition-colors cursor-pointer">
                        <Download className="w-3.5 h-3.5 text-[#C79B3A]" /> ჩამოტვირთვა
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F5F2EA] border-t border-[#E6DDCB] flex items-center justify-between">
            <span className="text-xs text-[#666666]">
              NT ისტორიის მასწავლებელი — ონლაინ აკადემია
            </span>
            <button
              onClick={onClose}
              className="bg-[#0D1B2A] text-[#FAF8F3] text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-[#13253D] transition-colors cursor-pointer"
            >
              დახურვა
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
