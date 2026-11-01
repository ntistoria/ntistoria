import { useState, useEffect, type FC } from 'react';
import { MockExam } from '../types';
import { enrichMockExamWithAnswerKey } from '../lib/mockExamService';
import {
  ChevronLeft,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookOpen,
  MapPin,
  Layers,
  FileText,
  RefreshCw,
  Eye
} from 'lucide-react';

interface AdminMockExamAnswerKeyViewProps {
  exam: MockExam;
  onBack: () => void;
  onViewStudentVariant?: () => void;
}

const OPTION_LETTERS = ['ა', 'ბ', 'გ', 'დ'];

export const AdminMockExamAnswerKeyView: FC<AdminMockExamAnswerKeyViewProps> = ({
  exam: initialExam,
  onBack,
  onViewStudentVariant
}) => {
  const [exam, setExam] = useState<MockExam>(initialExam);
  const [loadingAnswers, setLoadingAnswers] = useState<boolean>(true);
  const [showMcqDetails, setShowMcqDetails] = useState<boolean>(false);
  const [showSourceText, setShowSourceText] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingAnswers(true);
      try {
        const enriched = await enrichMockExamWithAnswerKey(initialExam);
        if (mounted) setExam(enriched);
      } catch (err) {
        console.error('Error enriching answer key:', err);
      } finally {
        if (mounted) setLoadingAnswers(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [initialExam]);

  const payload = exam.questions_payload || {
    mcqQuestions: [],
    mapTask: null,
    analogyTask: null,
    sourceTask: null
  };

  const getAnswerLetter = (q: {
    correctAnswerLetter?: string;
    correctAnswerIndex?: number;
  }): string => {
    if (q.correctAnswerLetter) return q.correctAnswerLetter;
    if (typeof q.correctAnswerIndex === 'number') {
      return OPTION_LETTERS[q.correctAnswerIndex] || 'ა';
    }
    return 'ა';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 print:space-y-4">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6DDCB] shadow-xs print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#C79B3A]" />
          <span>დასრულებულ გამოცდებში დაბრუნება</span>
        </button>

        <div className="flex items-center gap-2.5">
          {onViewStudentVariant && (
            <button
              type="button"
              onClick={onViewStudentVariant}
              className="px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#C79B3A]" />
              <span>ტესტის ვარიანტის ნახვა</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ბეჭდვა / PDF შენახვა</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE ANSWER KEY SHEET */}
      <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] p-6 sm:p-10 space-y-8 shadow-sm print:border-0 print:shadow-none print:p-0">
        {/* 1. HEADER BLOCK */}
        <div className="border-b-2 border-[#0D1B2A] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#FAF8F3] border border-[#C79B3A]/50 text-[#C79B3A] text-[10px] font-bold uppercase tracking-widest rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>მასწავლებლის შესასწორებელი ფურცელი (Answer Key)</span>
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
              {exam.title} — სწორი პასუხები
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] font-medium">
              <span>
                თარიღი: {new Date(exam.created_at).toLocaleString('ka-GE')}
              </span>
              <span>•</span>
              <span>არჩეული თავები: [{exam.selected_chapters.join(', ')}]</span>
              <span>•</span>
              <span>ხანგრძლივობა: {exam.duration_minutes} წთ</span>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-[#0D1B2A] text-white rounded-2xl text-right shrink-0 print:bg-gray-100 print:text-black print:border print:border-black">
            <div className="text-[10px] uppercase tracking-wider text-[#C79B3A] font-bold print:text-black">
              ჯამური მაქსიმალური ქულა
            </div>
            <div className="font-serif font-bold text-xl">60 ქულა</div>
          </div>
        </div>

        {loadingAnswers && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C79B3A] py-2 print:hidden">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>მოწმდება ბაზის სწორი პასუხები და შეფასების სქემები...</span>
          </div>
        )}

        {/* =========================================================
            2. MULTIPLE CHOICE SECTION (N1 - N35) — 5-COLUMN COMPACT GRID
           ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DDCB] pb-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C79B3A]" />
              <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                I ნაწილი: არჩევითპასუხიანი კითხვები (N1–N{payload.mcqQuestions.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-[#FAF8F3] border border-[#E6DDCB] rounded-lg text-xs font-bold text-[#0D1B2A]">
                სულ: {payload.mcqQuestions.length} ქულა (თითო 1 ქ.)
              </span>
              <button
                type="button"
                onClick={() => setShowMcqDetails((v) => !v)}
                className="text-xs font-bold text-[#C79B3A] hover:underline flex items-center gap-1 cursor-pointer print:hidden"
              >
                <span>{showMcqDetails ? 'კითხვების დამალვა' : 'კითხვების ტექსტების ჩვენება'}</span>
                {showMcqDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* 5-Column Fast-Check Answer Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {payload.mcqQuestions.map((q, idx) => {
              const num = q.number || idx + 1;
              const letter = getAnswerLetter(q);
              return (
                <div
                  key={q.id || idx}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] font-mono text-sm"
                >
                  <span className="font-bold text-[#666666]">{num}:</span>
                  <span className="w-7 h-7 rounded-lg bg-[#0D1B2A] text-[#C79B3A] font-serif font-bold text-sm flex items-center justify-center print:border print:border-black print:bg-white print:text-black">
                    {letter}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Collapsible Full MCQ Questions & Correct Option Text */}
          {showMcqDetails && (
            <div className="mt-4 pt-4 border-t border-[#E6DDCB] space-y-2.5">
              {payload.mcqQuestions.map((q, idx) => {
                const num = q.number || idx + 1;
                const letter = getAnswerLetter(q);
                const ansIdx =
                  typeof q.correctAnswerIndex === 'number'
                    ? q.correctAnswerIndex
                    : OPTION_LETTERS.indexOf(letter);
                const fullCorrectOption =
                  q.correctAnswerText ||
                  (q.options && ansIdx >= 0 ? q.options[ansIdx] : '');

                return (
                  <div
                    key={q.id || idx}
                    className="p-3 rounded-xl bg-[#FAF8F3]/70 border border-[#E6DDCB] text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-[#0D1B2A] shrink-0">
                        N{num}.
                      </span>
                      <span className="text-[#13253D] font-medium">{q.prompt}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:pl-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs">
                        სწორია: ({letter}) {fullCorrectOption}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================
            3. N36 — MAP TASK ANSWER KEY (MAX 6 POINTS)
           ========================================================= */}
        {payload.mapTask && (
          <section className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DDCB] pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C79B3A]" />
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                  II ნაწილი: დავალება N36 — ისტორიული რუკა
                </h3>
              </div>
              <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] rounded-lg text-xs font-bold print:border print:border-black print:bg-white print:text-black">
                მაქსიმალური ქულა: 6
              </span>
            </div>

            <div className="divide-y divide-[#E6DDCB] border border-[#E6DDCB] rounded-2xl overflow-hidden">
              {payload.mapTask.questions.map((q, idx) => {
                const subNum = q.number || idx + 1;
                const isMcq = q.options && q.options.length > 1;
                const letter = isMcq ? getAnswerLetter(q) : undefined;
                const ansIdx =
                  typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;
                const rawAnsText =
                  q.correctAnswerText ||
                  (isMcq && q.options ? q.options[ansIdx] : '') ||
                  q.explanation ||
                  '—';
                const cleanedAnsText = String(rawAnsText).replace(
                  /^[აბგდ]\s*[\)\.]\s*/i,
                  ''
                );
                const pts = q.maxScore || 1;

                return (
                  <div
                    key={q.id || idx}
                    className="p-4 bg-white hover:bg-[#FAF8F3]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded shrink-0 mt-0.5">
                          36.{subNum}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#0D1B2A]">
                          {q.prompt}
                        </span>
                      </div>
                      <div className="pl-11 text-xs sm:text-sm text-emerald-900 font-bold">
                        სწორი პასუხი:{' '}
                        {letter ? `(${letter}) ${cleanedAnsText}` : cleanedAnsText}
                      </div>
                    </div>

                    <div className="pl-11 sm:pl-0 shrink-0">
                      <span className="px-2.5 py-1 bg-[#FAF8F3] border border-[#E6DDCB] rounded-lg text-xs font-bold text-[#0D1B2A]">
                        {pts} ქულა
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================
            4. N37 — ANALOGIES TASK ANSWER KEY (MAX 5 POINTS)
           ========================================================= */}
        {payload.analogyTask && (
          <section className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DDCB] pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C79B3A]" />
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                  III ნაწილი: დავალება N37 — ანალოგიები
                </h3>
              </div>
              <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] rounded-lg text-xs font-bold print:border print:border-black print:bg-white print:text-black">
                მაქსიმალური ქულა: 5
              </span>
            </div>

            {payload.analogyTask.sourceContext && (
              <div className="p-4 bg-[#FAF8F3] rounded-xl border-l-4 border-[#C79B3A] text-xs sm:text-sm text-[#0D1B2A] font-serif font-semibold">
                დებულება: {payload.analogyTask.sourceContext}
              </div>
            )}

            <div className="divide-y divide-[#E6DDCB] border border-[#E6DDCB] rounded-2xl overflow-hidden">
              {payload.analogyTask.questions.map((q, idx) => {
                const subNum = q.number || idx + 1;
                const pts = q.maxScore || (idx === 3 ? 2 : 1);
                const ansText =
                  q.correctAnswerText ||
                  q.explanation ||
                  'ეტალონური პასუხი ბაზაში მითითებული არ არის';

                return (
                  <div key={q.id || idx} className="p-4 bg-white space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded shrink-0 mt-0.5">
                          37.{subNum}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#0D1B2A]">
                          {q.prompt}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-[#FAF8F3] border border-[#E6DDCB] rounded-lg text-xs font-bold text-[#0D1B2A] shrink-0">
                        {pts} ქულა
                      </span>
                    </div>

                    <div className="pl-11 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 whitespace-pre-line leading-relaxed">
                      <span className="font-bold text-emerald-800 block mb-0.5">
                        ეტალონური პასუხი / შეფასების კრიტერიუმი:
                      </span>
                      {ansText}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================
            5. N38 — HISTORICAL SOURCE TASK ANSWER KEY (MAX 14 POINTS)
           ========================================================= */}
        {payload.sourceTask && (
          <section className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DDCB] pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C79B3A]" />
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                  IV ნაწილი: დავალება N38 — ისტორიული წყაროს ანალიზი
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] rounded-lg text-xs font-bold print:border print:border-black print:bg-white print:text-black">
                  მაქსიმალური ქულა: 14
                </span>
                {payload.sourceTask.sourceContext && (
                  <button
                    type="button"
                    onClick={() => setShowSourceText((v) => !v)}
                    className="text-xs font-bold text-[#C79B3A] hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                  >
                    <span>{showSourceText ? 'წყაროს დამალვა' : 'წყაროს ტექსტის ჩვენება'}</span>
                    {showSourceText ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {showSourceText && payload.sourceTask.sourceContext && (
              <div className="p-4 sm:p-5 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] text-xs sm:text-sm font-serif text-[#0D1B2A] whitespace-pre-line leading-relaxed">
                {payload.sourceTask.sourceContext}
              </div>
            )}

            <div className="divide-y divide-[#E6DDCB] border border-[#E6DDCB] rounded-2xl overflow-hidden">
              {payload.sourceTask.questions.map((q, idx) => {
                const subNum = q.number || idx + 1;
                const pts = q.maxScore || 1;
                const ansText =
                  q.correctAnswerText ||
                  q.explanation ||
                  'ეტალონური პასუხი ბაზაში მითითებული არ არის';

                return (
                  <div key={q.id || idx} className="p-4 bg-white space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded shrink-0 mt-0.5">
                          38.{subNum}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#0D1B2A]">
                          {q.prompt}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-[#FAF8F3] border border-[#E6DDCB] rounded-lg text-xs font-bold text-[#0D1B2A] shrink-0">
                        {pts} ქულა
                      </span>
                    </div>

                    <div className="pl-11 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 whitespace-pre-line leading-relaxed">
                      <span className="font-bold text-emerald-800 block mb-0.5">
                        სწორი პასუხი / შეფასების სქემა:
                      </span>
                      {ansText}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

