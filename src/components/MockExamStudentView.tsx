import { useState, useEffect, useRef, type FC } from 'react';
import { MockExam } from '../types';
import { supabase } from '../lib/supabase';
import {
  Clock,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  FileText,
  MapPin,
  Layers,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface MockExamStudentViewProps {
  exam: MockExam;
  serverTimeOffsetMs?: number;
  onExit: () => void;
  onTimeExpired: () => void;
}

function formatExamTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

const OPTION_LABELS = ['ა', 'ბ', 'გ', 'დ'];

export const MockExamStudentView: FC<MockExamStudentViewProps> = ({
  exam,
  serverTimeOffsetMs = 0,
  onExit,
  onTimeExpired
}) => {
  const endTimeMs = exam.end_time ? new Date(exam.end_time).getTime() : 0;

  const computeRemaining = () => {
    if (!endTimeMs) return 0;
    const syncedNow = Date.now() + serverTimeOffsetMs;
    return Math.max(0, Math.floor((endTimeMs - syncedNow) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(computeRemaining);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState<boolean>(false);

  // Map Zoom State (inline & lightbox)
  const [inlineZoom, setInlineZoom] = useState<number>(1);
  const [isMapLightboxOpen, setIsMapLightboxOpen] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1.5);

  const expiredTriggeredRef = useRef<boolean>(false);

  // Countdown Timer synchronized with end_time
  useEffect(() => {
    const tick = () => {
      const rem = computeRemaining();
      setRemainingSeconds(rem);

      if (rem <= 0 && !expiredTriggeredRef.current) {
        expiredTriggeredRef.current = true;
        setIsExpiredModalOpen(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimeMs, serverTimeOffsetMs]);

  // Listen for admin deactivation in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`mock-exam-live-${exam.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mock_exams',
          filter: `id=eq.${exam.id}`
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated && updated.is_active === false && !expiredTriggeredRef.current) {
            expiredTriggeredRef.current = true;
            setIsExpiredModalOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [exam.id]);

  // Auto-redirect to home page 3.5 seconds after time expires
  useEffect(() => {
    if (!isExpiredModalOpen) return;
    const timeout = setTimeout(() => {
      onTimeExpired();
    }, 3500);
    return () => clearTimeout(timeout);
  }, [isExpiredModalOpen, onTimeExpired]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const payload = exam.questions_payload || {
    mcqQuestions: [],
    mapTask: null,
    analogyTask: null,
    sourceTask: null
  };

  const isLowTime = remainingSeconds > 0 && remainingSeconds <= 300; // last 5 mins

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-24 prevent-select select-none">
      {/* STICKY EXAM HEADER WITH COUNTDOWN TIMER */}
      <div className="sticky top-20 z-30 bg-[#0D1B2A] text-white border-b-2 border-[#C79B3A] shadow-lg">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back & Exam Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF8F3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#C79B3A]" />
              <span>გასვლა</span>
            </button>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#C79B3A] font-bold">
                იმიტირებული ეროვნული გამოცდა
              </div>
              <h1 className="font-serif font-bold text-sm sm:text-base text-[#FAF8F3] line-clamp-1">
                {exam.title}
              </h1>
            </div>
          </div>

          {/* Center: Quick Section Navigation */}
          <div className="hidden md:flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => scrollToSection('section-mcq')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#FAF8F3] hover:bg-[#C79B3A] hover:text-[#0D1B2A] transition-colors cursor-pointer"
            >
              N1–35 არჩევითი
            </button>
            {payload.mapTask && (
              <button
                type="button"
                onClick={() => scrollToSection('section-map')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#FAF8F3] hover:bg-[#C79B3A] hover:text-[#0D1B2A] transition-colors cursor-pointer"
              >
                N36 რუკა
              </button>
            )}
            {payload.analogyTask && (
              <button
                type="button"
                onClick={() => scrollToSection('section-analogy')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#FAF8F3] hover:bg-[#C79B3A] hover:text-[#0D1B2A] transition-colors cursor-pointer"
              >
                N37 ანალოგია
              </button>
            )}
            {payload.sourceTask && (
              <button
                type="button"
                onClick={() => scrollToSection('section-source')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#FAF8F3] hover:bg-[#C79B3A] hover:text-[#0D1B2A] transition-colors cursor-pointer"
              >
                N38 წყარო
              </button>
            )}
          </div>

          {/* Right: Synchronized Countdown Timer */}
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono font-bold text-base sm:text-lg ${
              isLowTime
                ? 'bg-rose-600/90 border-rose-300 text-white animate-pulse'
                : 'bg-[#13253D] border-[#C79B3A]/60 text-[#FAF8F3]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#C79B3A] shrink-0" />
            <span>{formatExamTimer(remainingSeconds)}</span>
          </div>
        </div>
      </div>

      {/* MAIN ACADEMIC EXAM PAPER */}
      <div className="max-w-[980px] mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* Academic Instruction Notice */}
        <div className="bg-white rounded-2xl border-2 border-[#E6DDCB] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#C79B3A]">
              საგამოცდო ინსტრუქცია (View-Only რეჟიმი)
            </div>
            <p className="text-xs sm:text-sm text-[#13253D] leading-relaxed">
              ყურადღებით გაეცანით დავალებებს. პასუხები დაწერეთ თქვენს სამუშაო ფურცელზე კითხვის ნომრის მითითებით (N1–N38).
            </p>
          </div>
          <div className="px-3.5 py-1.5 bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl text-xs font-bold text-[#0D1B2A] shrink-0">
            თავები: {exam.selected_chapters.join(', ')}
          </div>
        </div>

        {/* =========================================================
            SECTION 1: N1 - N35 MULTIPLE CHOICE QUESTIONS
           ========================================================= */}
        <section id="section-mcq" className="space-y-6 scroll-mt-36">
          <div className="border-b-2 border-[#0D1B2A] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#C79B3A]" />
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A]">
                I ნაწილი: არჩევითპასუხიანი კითხვები (N1–N{payload.mcqQuestions.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-[#666666]">
              თითოეული კითხვა ფასდება 1 ქულით
            </span>
          </div>

          <div className="space-y-4">
            {payload.mcqQuestions.map((q, idx) => {
              const qNum = q.number || idx + 1;
              const opts = q.options && q.options.length > 0 ? q.options : ['ა', 'ბ', 'გ', 'დ'];

              return (
                <div
                  key={q.id || idx}
                  className="bg-white rounded-2xl border border-[#E6DDCB] p-5 sm:p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2.5 py-1 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded-lg shrink-0 mt-0.5">
                      N{qNum}
                    </span>
                    <p className="font-serif font-bold text-base sm:text-lg text-[#0D1B2A] leading-snug">
                      {q.prompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-0 sm:pl-11">
                    {opts.map((optText, optIdx) => {
                      const label = OPTION_LABELS[optIdx] || String(optIdx + 1);
                      // Avoid double prefix if option text already starts with "ა)" or "ა."
                      const cleanedText = String(optText).replace(/^[აბგდ]\s*[\)\.]\s*/i, '');
                      return (
                        <div
                          key={optIdx}
                          className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] flex items-start gap-2.5 text-sm text-[#0D1B2A]"
                        >
                          <span className="font-bold text-[#C79B3A] shrink-0">
                            ({label})
                          </span>
                          <span className="leading-relaxed">{cleanedText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            SECTION 2: N36 HISTORICAL MAP TASK
           ========================================================= */}
        {payload.mapTask && (
          <section id="section-map" className="space-y-6 scroll-mt-36">
            <div className="border-b-2 border-[#0D1B2A] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#C79B3A]" />
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A]">
                  II ნაწილი: დავალება N36 — ისტორიული რუკის ანალიზი
                </h2>
              </div>
              <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] text-xs font-mono font-bold rounded-full">
                N36
              </span>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] p-5 sm:p-8 space-y-6 shadow-xs">
              {/* Map Image Viewer with Zoom Controls */}
              {payload.mapTask.mapImage && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF8F3] px-4 py-2.5 rounded-xl border border-[#E6DDCB]">
                    <span className="text-xs font-bold text-[#0D1B2A]">
                      რუკის მასშტაბირება: {Math.round(inlineZoom * 100)}%
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInlineZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                        disabled={inlineZoom <= 1}
                        className="p-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#0D1B2A] hover:border-[#C79B3A] disabled:opacity-40 cursor-pointer"
                        title="დაპატარავება"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                        disabled={inlineZoom >= 3}
                        className="p-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#0D1B2A] hover:border-[#C79B3A] disabled:opacity-40 cursor-pointer"
                        title="გადიდება"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineZoom(1)}
                        className="p-1.5 rounded-lg bg-white border border-[#E6DDCB] text-[#0D1B2A] hover:border-[#C79B3A] cursor-pointer"
                        title="საწყისი ზომა"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxZoom(1.5);
                          setIsMapLightboxOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0D1B2A] text-[#FAF8F3] hover:bg-[#C79B3A] hover:text-[#0D1B2A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>სრულ ეკრანზე</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto rounded-2xl border border-[#E6DDCB] bg-[#0D1B2A] max-h-[620px] p-2">
                    <img
                      src={payload.mapTask.mapImage}
                      alt="საგამოცდო ისტორიული რუკა N36"
                      style={{
                        width: `${inlineZoom * 100}%`,
                        maxWidth: 'none'
                      }}
                      onClick={() => setIsMapLightboxOpen(true)}
                      className="mx-auto block rounded-xl cursor-zoom-in transition-all duration-150"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* Map Task Accompanying Questions */}
              <div className="space-y-4 pt-2">
                {payload.mapTask.questions.map((q, idx) => {
                  const subNum = q.number || idx + 1;
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="px-2.5 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded-md shrink-0 mt-0.5">
                            36.{subNum}
                          </span>
                          <p className="font-serif font-bold text-base text-[#0D1B2A] leading-snug">
                            {q.prompt}
                          </p>
                        </div>
                        {q.maxScore && (
                          <span className="text-xs font-bold text-[#666666] shrink-0">
                            ({q.maxScore} ქ.)
                          </span>
                        )}
                      </div>

                      {q.options && q.options.length > 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-12">
                          {q.options.map((optText, optIdx) => {
                            const label = OPTION_LABELS[optIdx] || String(optIdx + 1);
                            const cleanedText = String(optText).replace(/^[აბგდ]\s*[\)\.]\s*/i, '');
                            return (
                              <div
                                key={optIdx}
                                className="p-2.5 rounded-xl bg-white border border-[#E6DDCB] flex items-start gap-2 text-sm text-[#0D1B2A]"
                              >
                                <span className="font-bold text-[#C79B3A] shrink-0">
                                  ({label})
                                </span>
                                <span>{cleanedText}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION 3: N37 ANALOGIES TASK
           ========================================================= */}
        {payload.analogyTask && (
          <section id="section-analogy" className="space-y-6 scroll-mt-36">
            <div className="border-b-2 border-[#0D1B2A] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#C79B3A]" />
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A]">
                  III ნაწილი: დავალება N37 — ანალოგიები
                </h2>
              </div>
              <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] text-xs font-mono font-bold rounded-full">
                N37
              </span>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] p-5 sm:p-8 space-y-6 shadow-xs">
              {payload.analogyTask.sourceContext && (
                <div className="p-5 sm:p-6 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C79B3A]">
                    ისტორიული მოვლენა / დებულება:
                  </div>
                  <p className="font-serif font-semibold text-base sm:text-lg text-[#0D1B2A] leading-relaxed whitespace-pre-line">
                    {payload.analogyTask.sourceContext}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {payload.analogyTask.questions.map((q, idx) => {
                  const subNum = q.number || idx + 1;
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="px-2.5 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded-md shrink-0 mt-0.5">
                          37.{subNum}
                        </span>
                        <p className="font-serif font-medium text-base text-[#0D1B2A] leading-relaxed">
                          {q.prompt}
                        </p>
                      </div>
                      {q.maxScore && (
                        <span className="px-2.5 py-1 bg-white border border-[#E6DDCB] rounded-lg text-xs font-bold text-[#0D1B2A] shrink-0">
                          {q.maxScore} ქულა
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION 4: N38 HISTORICAL SOURCE TASK
           ========================================================= */}
        {payload.sourceTask && (
          <section id="section-source" className="space-y-6 scroll-mt-36">
            <div className="border-b-2 border-[#0D1B2A] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#C79B3A]" />
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A]">
                  IV ნაწილი: დავალება N38 — ისტორიული წყაროს ანალიზი
                </h2>
              </div>
              <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] text-xs font-mono font-bold rounded-full">
                N38
              </span>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] p-5 sm:p-8 space-y-6 shadow-xs">
              {payload.sourceTask.sourceContext && (
                <div className="p-6 sm:p-8 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] space-y-3 shadow-inner">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C79B3A] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>ისტორიული პირველწყარო:</span>
                  </div>
                  <div className="font-serif text-sm sm:text-base text-[#0D1B2A] leading-relaxed whitespace-pre-line">
                    {payload.sourceTask.sourceContext}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {payload.sourceTask.questions.map((q, idx) => {
                  const subNum = q.number || idx + 1;
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="px-2.5 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded-md shrink-0 mt-0.5">
                          38.{subNum}
                        </span>
                        <p className="font-serif font-medium text-base text-[#0D1B2A] leading-relaxed">
                          {q.prompt}
                        </p>
                      </div>
                      {q.maxScore && (
                        <span className="px-2.5 py-1 bg-white border border-[#E6DDCB] rounded-lg text-xs font-bold text-[#0D1B2A] shrink-0">
                          {q.maxScore} ქულა
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* =========================================================
          FULLSCREEN MAP LIGHTBOX MODAL (ZOOMABLE)
         ========================================================= */}
      {isMapLightboxOpen && payload.mapTask?.mapImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col">
          <div className="px-6 py-4 bg-[#0D1B2A] border-b border-white/15 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#C79B3A]" />
              <span className="font-serif font-bold text-base">
                რუკა N36 — მასშტაბი {Math.round(lightboxZoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="დაპატარავება"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="გადიდება"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom(1)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="100%"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMapLightboxOpen(false)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>დახურვა</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
            <img
              src={payload.mapTask.mapImage}
              alt="რუკა N36 სრულ ეკრანზე"
              style={{
                width: `${lightboxZoom * 100}%`,
                maxWidth: 'none'
              }}
              className="rounded-xl shadow-2xl transition-all duration-150"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* =========================================================
          EXAM TIME EXPIRED MODAL ("გამოცდის დრო ამოიწურა!")
         ========================================================= */}
      {isExpiredModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border-2 border-[#C79B3A] max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                გამოცდის დრო ამოიწურა!
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                იმიტირებული ეროვნული გამოცდისთვის განკუთვნილი დრო დასრულდა. ახლა გადამისამართდებით მთავარ გვერდზე.
              </p>
            </div>

            <button
              type="button"
              onClick={onTimeExpired}
              className="w-full py-3.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-xl transition-all cursor-pointer"
            >
              მთავარ გვერდზე დაბრუნება
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

