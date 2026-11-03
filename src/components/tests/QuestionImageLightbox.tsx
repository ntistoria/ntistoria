import { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ZoomOut, ZoomIn, RotateCcw, Minimize2, X } from 'lucide-react';

interface QuestionImageLightboxProps {
  imageUrl: string | null;
  zoom: number;
  title?: string;
  onZoomChange: (updater: (prev: number) => number) => void;
  onResetZoom: () => void;
  onClose: () => void;
}

export const QuestionImageLightbox: FC<QuestionImageLightboxProps> = ({
  imageUrl,
  zoom,
  title = 'რუკა / ილუსტრაცია',
  onZoomChange,
  onResetZoom,
  onClose
}) => {
  useEffect(() => {
    if (!imageUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-sm flex flex-col animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Top Control Header Bar (Always above Navbar) */}
      <div
        className="px-4 sm:px-6 py-3.5 bg-[#0D1B2A] border-b-2 border-[#C79B3A] flex flex-wrap items-center justify-between gap-3 text-white shadow-xl shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#C79B3A] shrink-0" />
          <span className="font-serif font-bold text-sm sm:text-base text-[#FAF8F3]">
            {title} — მასშტაბი {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onZoomChange((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="დაპატარავება (-)"
          >
            <ZoomOut className="w-4 h-4 text-[#C79B3A]" />
            <span className="hidden sm:inline">დაპატარავება</span>
          </button>

          <button
            type="button"
            onClick={() => onZoomChange((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="გადიდება (+)"
          >
            <ZoomIn className="w-4 h-4 text-[#C79B3A]" />
            <span className="hidden sm:inline">გადიდება</span>
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="100% საწყისი მასშტაბი"
          >
            <RotateCcw className="w-4 h-4 text-[#C79B3A]" />
            <span>100%</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
            title="სრული ეკრანიდან გამოსვლა"
          >
            <Minimize2 className="w-4 h-4" />
            <span>საწყის პოზიციაზე დაბრუნება</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            title="დახურვა (ESC)"
            className="w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center cursor-pointer transition-colors shadow-lg border border-rose-400/40"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Floating Top-Right Quick Close X Button inside Canvas */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="სრული ეკრანის დახურვა (ESC)"
        className="fixed top-20 right-5 z-[10000] px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-2xl border-2 border-white/30 cursor-pointer transition-transform active:scale-95"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
        <span>დახურვა / დაპატარავება</span>
      </button>

      {/* Scrollable & Zoomable Map Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={title}
          onClick={(e) => e.stopPropagation()}
          style={
            zoom === 1
              ? { maxWidth: '92vw', maxHeight: '80vh', width: 'auto', height: 'auto' }
              : { width: `${zoom * 100}%`, maxWidth: 'none' }
          }
          className="rounded-xl shadow-2xl transition-all duration-150 object-contain border border-white/15 bg-[#0D1B2A]"
          referrerPolicy="no-referrer"
          draggable={false}
        />
      </div>

      {/* Floating Bottom Control Pill */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] bg-[#0D1B2A]/95 border-2 border-[#C79B3A] rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onZoomChange((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          title="დაპატარავება"
        >
          <ZoomOut className="w-4 h-4 text-[#C79B3A]" />
        </button>
        <span className="font-mono font-bold text-xs px-2 min-w-[52px] text-center text-[#FAF8F3]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onZoomChange((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          title="გადიდება"
        >
          <ZoomIn className="w-4 h-4 text-[#C79B3A]" />
        </button>
        <div className="h-5 w-[1px] bg-white/20 mx-1" />
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>საწყის პოზიციაზე დაბრუნება</span>
        </button>
      </div>
    </div>,
    document.body
  );
};


