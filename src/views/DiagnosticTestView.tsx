import { useState, useEffect, useRef, useCallback, type FC } from 'react';
import {
  Clock, ChevronLeft, Send, MapPin, AlertTriangle, CheckCircle2,
  ZoomIn, X, Loader2, FileText, BookOpen, Map, Eye
} from 'lucide-react';
import {
  DiagnosticQuestion, DiagnosticAttempt, DiagnosticAnswer
} from '../types';
import {
  getDiagnosticQuestions, getOrCreateAttempt, getAnswersForAttempt,
  saveAnswer, submitAttempt, getRemainingSeconds, TIME_LIMIT_SECONDS
} from '../lib/diagnosticService';
import { supabase } from '../lib/supabase';

interface DiagnosticTestViewProps {
  onBack: () => void;
}

// ── Timer display helper ────────────────────────────────────────
const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ── Section header visual ───────────────────────────────────────
const SectionHeader: FC<{ roman: string; title: string; icon: React.ReactNode }> = ({ roman, title, icon }) => (
  <div className="flex items-center gap-4 py-4 border-b-2 border-[#C79B3A]/30 mb-6">
    <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] text-[#C79B3A] flex items-center justify-center font-serif font-bold text-base shrink-0">
      {roman}
    </div>
    <div className="flex items-center gap-2 flex-1">
      {icon}
      <h2 className="font-serif font-bold text-lg sm:text-xl text-[#0D1B2A]">{title}</h2>
    </div>
  </div>
);

// ── Map viewer modal ────────────────────────────────────────────
const MapViewerModal: FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D1B2A] text-white">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-[#C79B3A]" />
          <span className="text-sm font-bold">ისტორიული რუკა</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-auto flex-1 bg-[#0D1B2A] flex items-center justify-center p-2">
        <img
          src={url}
          alt="ისტორიული რუკა"
          className="max-w-full max-h-[75vh] object-contain rounded-lg"
        />
      </div>
    </div>
  </div>
);

// ── Multiple Choice Question ────────────────────────────────────
const MultipleChoiceQuestion: FC<{
  question: DiagnosticQuestion;
  qNum: number;
  selectedOption: string;
  disabled: boolean;
  onChange: (val: string) => void;
}> = ({ question, qNum, selectedOption, disabled, onChange }) => {
  const opts = question.options || [];
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="min-w-[2rem] h-8 rounded-lg bg-[#0D1B2A] text-[#C79B3A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {qNum}
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-serif text-base sm:text-lg text-[#0D1B2A] leading-relaxed font-medium">
            {question.question_text}
          </p>
          <span className="text-[11px] text-[#C79B3A] font-bold">({question.max_points} ქულა)</span>
        </div>
      </div>
      <div className="ml-11 grid gap-2 sm:grid-cols-2">
        {opts.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          return (
            <button
              key={idx}
              onClick={() => !disabled && onChange(opt)}
              disabled={disabled}
              className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#C79B3A] bg-[#C79B3A]/10 text-[#0D1B2A]'
                  : 'border-[#E6DDCB] bg-white hover:border-[#C79B3A]/60 hover:bg-[#FAF8F3] text-[#1B1B1B]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Open Text Question ──────────────────────────────────────────
const OpenTextQuestion: FC<{
  question: DiagnosticQuestion;
  qNum: number;
  value: string;
  disabled: boolean;
  onChange: (val: string) => void;
}> = ({ question, qNum, value, disabled, onChange }) => (
  <div className="space-y-3">
    <div className="flex items-start gap-3">
      <span className="min-w-[2rem] h-8 rounded-lg bg-[#0D1B2A] text-[#C79B3A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {qNum}
      </span>
      <div className="flex-1 space-y-1">
        <p className="font-serif text-base sm:text-lg text-[#0D1B2A] leading-relaxed font-medium">
          {question.question_text}
        </p>
        <span className="text-[11px] text-[#C79B3A] font-bold">({question.max_points} ქულა)</span>
      </div>
    </div>
    <div className="ml-11">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        placeholder="ჩაწერეთ პასუხი..."
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-sm text-[#0D1B2A] font-sans leading-relaxed resize-y transition-colors focus:outline-none ${
          disabled
            ? 'border-[#E6DDCB] opacity-60 cursor-not-allowed bg-[#FAF8F3]'
            : 'border-[#E6DDCB] hover:border-[#C79B3A]/60 focus:border-[#C79B3A]'
        }`}
      />
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export const DiagnosticTestView: FC<DiagnosticTestViewProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [attempt, setAttempt] = useState<DiagnosticAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});  // { questionId: answerText }
  const [remainingSecs, setRemainingSecs] = useState<number>(TIME_LIMIT_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [mapModalUrl, setMapModalUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load questions & attempt ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const [qs, att] = await Promise.all([
        getDiagnosticQuestions(),
        getOrCreateAttempt(session.user.id, session.user.email || ''),
      ]);

      if (!isMounted) return;
      setQuestions(qs);

      if (att) {
        setAttempt(att);
        if (att.status !== 'in_progress') {
          setSubmitted(true);
          setLoading(false);
          return;
        }
        // Restore answers
        const saved = await getAnswersForAttempt(att.id);
        if (isMounted) {
          const restored: Record<string, string> = {};
          saved.forEach((a: DiagnosticAnswer) => {
            if (a.question_id && a.answer_text) restored[a.question_id] = a.answer_text;
          });
          setAnswers(restored);
          const rem = getRemainingSeconds(att.started_at);
          setRemainingSecs(rem);
          if (rem <= 0) {
            setIsTimeUp(true);
          }
        }
      }
      setLoading(false);
    };
    init();
    return () => { isMounted = false; };
  }, []);

  // ── Timer tick ───────────────────────────────────────────────
  useEffect(() => {
    if (submitted || !attempt || attempt.status !== 'in_progress') return;
    const initialRem = getRemainingSeconds(attempt.started_at);
    setRemainingSecs(initialRem);
    if (initialRem <= 0) {
      setIsTimeUp(true);
      return;
    }

    timerRef.current = setInterval(() => {
      const rem = getRemainingSeconds(attempt.started_at);
      setRemainingSecs(rem);
      if (rem <= 0) {
        setIsTimeUp(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [attempt, submitted]);

  // ── Debounced answer save ────────────────────────────────────
  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      if (attempt?.id) await saveAnswer(attempt.id, questionId, value);
    }, 600);
  }, [attempt]);

  // ── Submit logic ─────────────────────────────────────────────
  const handleDoSubmit = async (isAuto = false) => {
    if (!attempt) return;
    setSubmitting(true);
    setSubmitError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    // save all current answers first
    const saveOps = Object.entries(answers).map(([qId, ans]) =>
      saveAnswer(attempt.id, qId, ans)
    );
    await Promise.all(saveOps);

    const ok = await submitAttempt(attempt.id);
    if (ok) {
      setSubmitted(true);
    } else {
      setSubmitError('ტესტის გაგზავნა ვერ მოხერხდა. გთხოვთ, სცადოთ ხელახლა.');
      if (!isAuto) setSubmitting(false);
    }
    setShowConfirm(false);
    setSubmitting(false);
  };

  const handleSubmitClick = () => {
    const unanswered = questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      setShowConfirm(true);
    } else {
      handleDoSubmit();
    }
  };

  // ── Group questions by section ───────────────────────────────
  const sections = ['I', 'II', 'III', 'IV'] as const;
  const sectionTitles: Record<string, string> = {
    I: 'I ნაწილი — არჩევითპასუხიანი კითხვები',
    II: 'II ნაწილი — ისტორიული რუკის დავალება',
    III: 'III ნაწილი — ისტორიული მოვლენის/პროცესის ანალიზი',
    IV: 'IV ნაწილი — ისტორიული წყაროს ანალიზი',
  };
  const sectionIcons: Record<string, React.ReactNode> = {
    I: <BookOpen className="w-5 h-5 text-[#C79B3A]" />,
    II: <Map className="w-5 h-5 text-[#C79B3A]" />,
    III: <FileText className="w-5 h-5 text-[#C79B3A]" />,
    IV: <FileText className="w-5 h-5 text-[#C79B3A]" />,
  };
  const bySection = (sec: string) => questions.filter((q) => q.section === sec);
  const isDisabled = submitted || submitting || isTimeUp;

  // ── Timer color ──────────────────────────────────────────────
  const timerColor = remainingSecs <= 120
    ? 'text-rose-600 animate-pulse'
    : remainingSecs <= 300
    ? 'text-amber-600'
    : 'text-[#0D1B2A]';

  // ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-[#C79B3A]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold text-[#666666]">ტესტი იტვირთება...</span>
        </div>
      </div>
    );
  }

  // ── Submitted screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FAF8F3] border-2 border-[#C79B3A] flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-10 h-10 text-[#C79B3A]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-3xl text-[#0D1B2A]">
            ტესტი გაიგზავნა!
          </h2>
          <p className="text-sm text-[#666666]">
            სადიაგნოსტიკო ტესტი N1 — ისტორია
          </p>
        </div>
        <div className="p-6 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] text-sm text-[#666666] leading-relaxed">
          თქვენი პასუხები მასწავლებელს გადაეცა. შეფასების შემდეგ შეძლებთ
          შედეგის ნახვას პროფილის გვერდზე.
        </div>
        <button
          onClick={onBack}
          className="px-8 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] font-bold rounded-xl transition-all text-sm cursor-pointer"
        >
          ← ტესტებში დაბრუნება
        </button>
      </div>
    );
  }

  // ── Map URL for section II ───────────────────────────────────
  const sectionIIQuestions = bySection('II');
  const mapUrl = sectionIIQuestions.find((q) => q.map_url)?.map_url;

  // ── Main test UI ─────────────────────────────────────────────
  return (
    <div className="max-w-[900px] mx-auto pb-32 px-4 sm:px-6 animate-in fade-in duration-300">

      {/* STICKY TIMER HEADER */}
      <div className="sticky top-[73px] z-30 bg-white/95 backdrop-blur-sm border-b border-[#E6DDCB] shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#13253D] text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#C79B3A]" />
          <span className="hidden sm:inline">უკან</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#666666] hidden sm:inline">დარჩენილი დრო:</span>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-xl ${timerColor}`}>
            <Clock className="w-5 h-5 shrink-0" />
            <span>{formatTime(remainingSecs)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmitClick}
          disabled={isDisabled}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>გაგზავნა</span>
        </button>
      </div>

      {/* TEST META HEADER */}
      <div className="mt-6 mb-8 p-6 sm:p-8 bg-[#0D1B2A] rounded-3xl text-white shadow-xl border-4 border-[#C79B3A]/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#C79B3A_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        <div className="space-y-3 z-10 relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-widest rounded-full">
              სადიაგნოსტიკო
            </span>
            <span className="px-3 py-1 bg-white/10 text-[#FAF8F3] text-[11px] font-bold rounded-full border border-white/20">
              N1
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F3]">
            სადიაგნოსტიკო ტესტი N1
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#FAF8F3]/80 pt-1">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#C79B3A]" />
              <span>საგანი: ისტორია</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#C79B3A]" />
              <span>მაქსიმალური ქულა: 40</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C79B3A]" />
              <span>დრო: 25 წუთი</span>
            </span>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {submitError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-sm text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="ml-auto text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTIONS */}
      <div className="space-y-12">

        {/* ── I ნაწილი ── */}
        {bySection('I').length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 shadow-sm space-y-6">
            <SectionHeader roman="I" title={sectionTitles['I']} icon={sectionIcons['I']} />
            <div className="space-y-8">
              {bySection('I').map((q) => (
                <div key={q.id} className="border-b border-[#F5F2EA] pb-6 last:border-0 last:pb-0">
                  <MultipleChoiceQuestion
                    question={q}
                    qNum={q.question_order}
                    selectedOption={answers[q.id] || ''}
                    disabled={isDisabled}
                    onChange={(val) => handleAnswerChange(q.id, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── II ნაწილი ── */}
        {sectionIIQuestions.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 shadow-sm space-y-6">
            <SectionHeader roman="II" title={sectionTitles['II']} icon={sectionIcons['II']} />

            {/* Map viewer button */}
            {mapUrl && mapUrl !== 'REPLACE_WITH_YOUR_MAP_URL' && (
              <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#C79B3A]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0D1B2A]">ისტორიული რუკა</p>
                    <p className="text-xs text-[#666666]">დავალების შესასრულებლად გახსენით რუკა</p>
                  </div>
                </div>
                <button
                  onClick={() => setMapModalUrl(mapUrl)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>რუკის გახსნა</span>
                </button>
              </div>
            )}

            <div className="space-y-8">
              {sectionIIQuestions.map((q) => (
                <div key={q.id} className="border-b border-[#F5F2EA] pb-6 last:border-0 last:pb-0">
                  {q.question_type === 'multiple_choice' ? (
                    <MultipleChoiceQuestion
                      question={q}
                      qNum={q.question_order}
                      selectedOption={answers[q.id] || ''}
                      disabled={isDisabled}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  ) : (
                    <OpenTextQuestion
                      question={q}
                      qNum={q.question_order}
                      value={answers[q.id] || ''}
                      disabled={isDisabled}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── III ნაწილი ── */}
        {bySection('III').length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 shadow-sm space-y-6">
            <SectionHeader roman="III" title={sectionTitles['III']} icon={sectionIcons['III']} />

            {/* Task prompt / context box — like Section IV */}
            <div className="p-5 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C79B3A] uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>დავალების პირობა</span>
              </div>
              <p className="font-serif font-bold text-base sm:text-lg text-[#0D1B2A] leading-relaxed">
                {bySection('III')[0]?.source_text || '1799 წელს გენერალი ბონაპარტე პირველი კონსული გახდა.'}
              </p>
            </div>

            <div className="space-y-8">
              {bySection('III').map((q) => (
                <div key={q.id} className="border-b border-[#F5F2EA] pb-6 last:border-0 last:pb-0">
                  <OpenTextQuestion
                    question={q}
                    qNum={q.question_order}
                    value={answers[q.id] || ''}
                    disabled={isDisabled}
                    onChange={(val) => handleAnswerChange(q.id, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IV ნაწილი ── */}
        {bySection('IV').length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 sm:p-8 shadow-sm space-y-6">
            <SectionHeader roman="IV" title={sectionTitles['IV']} icon={sectionIcons['IV']} />

            {/* Source text — one per section (all IV questions share same source) */}
            {bySection('IV')[0]?.source_text && (
              <div className="p-5 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C79B3A] uppercase tracking-wider">
                  <Eye className="w-4 h-4" />
                  <span>ისტორიული წყარო</span>
                </div>
                <p className="font-serif italic text-sm sm:text-base text-[#0D1B2A] leading-relaxed whitespace-pre-line">
                  {bySection('IV')[0].source_text}
                </p>
              </div>
            )}

            <div className="space-y-8">
              {bySection('IV').map((q) => (
                <div key={q.id} className="border-b border-[#F5F2EA] pb-6 last:border-0 last:pb-0">
                  <OpenTextQuestion
                    question={q}
                    qNum={q.question_order}
                    value={answers[q.id] || ''}
                    disabled={isDisabled}
                    onChange={(val) => handleAnswerChange(q.id, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON (bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-[#E6DDCB] shadow-xl px-4 py-4">
        <div className="max-w-[900px] mx-auto flex items-center gap-4">
          <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timerColor}`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(remainingSecs)}</span>
          </div>
          <button
            onClick={handleSubmitClick}
            disabled={isDisabled}
            className="flex-1 py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-sm font-bold rounded-2xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>იგზავნება...</span></>
            ) : (
              <><Send className="w-5 h-5" /><span>ტესტის გაგზავნა</span></>
            )}
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E6DDCB] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#13253D]">
                პასუხები სრულყოფილი არ არის
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                თქვენ არ გაქვთ პასუხი გაცემული ყველა კითხვაზე. ნამდვილად გსურთ ტესტის გაგზავნა?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 border border-[#E6DDCB] text-xs font-bold rounded-xl text-[#13253D] hover:bg-[#FAF8F3] cursor-pointer"
              >
                გაგრძელება
              </button>
              <button
                onClick={() => handleDoSubmit()}
                disabled={submitting}
                className="px-5 py-2 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'იგზავნება...' : 'დიახ, გაგზავნა'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIME UP MODAL */}
      {isTimeUp && !submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white border-2 border-[#C79B3A] rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-rose-100 border border-rose-300 text-rose-600 mx-auto flex items-center justify-center shadow-md animate-pulse">
              <Clock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-widest rounded-full inline-block">
                დრო ამოიწურა
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                საგამოცდო დრო ამოიწურა!
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                თქვენთვის განკუთვნილი 25 წუთი ამოიწურა. გთხოვთ გააგზავნოთ თქვენ მიერ შევსებული პასუხები შეფასებისთვის.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => handleDoSubmit()}
                disabled={submitting}
                className="w-full py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>იგზავნება...</span></>
                ) : (
                  <><Send className="w-5 h-5" /><span>პასუხების გაგზავნა</span></>
                )}
              </button>
              <button
                onClick={onBack}
                disabled={submitting}
                className="w-full py-3 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                ტესტებში დაბრუნება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAP MODAL */}
      {mapModalUrl && (
        <MapViewerModal url={mapModalUrl} onClose={() => setMapModalUrl(null)} />
      )}
    </div>
  );
};

