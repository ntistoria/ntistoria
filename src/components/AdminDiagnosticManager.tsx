import { useState, useEffect, type FC } from 'react';
import {
  ClipboardCheck, ChevronLeft, CheckCircle2, Clock, Loader2,
  AlertTriangle, Save, User, Calendar, Star
} from 'lucide-react';
import {
  DiagnosticAttemptWithAnswers, DiagnosticQuestion, DiagnosticAnswer
} from '../types';
import {
  getAllAttemptsAdmin, getAttemptWithAnswers, getDiagnosticQuestions, finalizeGrading
} from '../lib/diagnosticService';

// ── Status badge ────────────────────────────────────────────────
const StatusBadge: FC<{ status: string }> = ({ status }) => {
  if (status === 'graded') return (
    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> შეფასდა
    </span>
  );
  if (status === 'submitted') return (
    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full flex items-center gap-1">
      <Clock className="w-3 h-3" /> შეფასება ელოდება
    </span>
  );
  return (
    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full flex items-center gap-1">
      <Clock className="w-3 h-3" /> მიმდინარე
    </span>
  );
};

// ── Grading sub-view ────────────────────────────────────────────
interface GradingViewProps {
  attempt: DiagnosticAttemptWithAnswers;
  questions: DiagnosticQuestion[];
  onBack: () => void;
  onSaved: () => void;
}

const GradingView: FC<GradingViewProps> = ({ attempt, questions, onBack, onSaved }) => {
  type GradeRow = { answerId: string; points: number; comment: string; maxPoints: number };
  const [grades, setGrades] = useState<Record<string, GradeRow>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialise from existing answers
  useEffect(() => {
    const init: Record<string, GradeRow> = {};
    questions.forEach((q) => {
      const ans: DiagnosticAnswer | undefined = attempt.answers.find((a) => a.question_id === q.id);
      init[q.id] = {
        answerId: ans?.id || '',
        points: ans?.points_awarded ?? 0,
        comment: ans?.teacher_comment || '',
        maxPoints: q.max_points,
      };
    });
    setGrades(init);
  }, [attempt, questions]);

  const totalAwarded = Object.values(grades).reduce((s, g) => s + (g.points || 0), 0);
  const totalMax = questions.reduce((s, q) => s + q.max_points, 0);

  const handleFinalize = async () => {
    setSaving(true);
    setSaveError(null);
    const payload = questions.map((q) => {
      const g = grades[q.id];
      return {
        questionId: q.id,
        points_awarded: g?.points ?? 0,
        teacher_comment: g?.comment || '',
      };
    });

    const ok = await finalizeGrading(attempt.id, payload);
    if (ok) {
      onSaved();
    } else {
      setSaveError('შეფასება ვერ შეინახა. სცადეთ ხელახლა.');
    }
    setSaving(false);
  };

  const sectionOrder = ['I', 'II', 'III', 'IV'];
  const bySection = (s: string) => questions.filter((q) => q.section === s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] text-[#0D1B2A] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
            {attempt.student_name || attempt.user_email}
          </h3>
          <p className="text-xs text-[#666666]">
            სადიაგნოსტიკო ტესტი N1 · გაგზავნილია: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString('ka-GE') : '—'}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={attempt.status} />
        </div>
      </div>

      {/* Score summary */}
      <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] flex items-center justify-between">
        <span className="text-sm font-bold text-[#0D1B2A]">მიმდინარე ჯამი:</span>
        <span className="font-mono font-bold text-2xl text-[#C79B3A]">
          {totalAwarded} / {totalMax}
        </span>
      </div>

      {saveError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Questions + grading */}
      {sectionOrder.map((sec) => {
        const qs = bySection(sec);
        if (!qs.length) return null;
        return (
          <div key={sec} className="bg-white rounded-2xl border border-[#E6DDCB] p-5 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E6DDCB] pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] text-[#C79B3A] text-sm font-bold flex items-center justify-center">
                {sec}
              </div>
              <h4 className="font-serif font-bold text-base text-[#0D1B2A]">
                {qs[0]?.section_title || `${sec} ნაწილი`}
              </h4>
            </div>

            {/* Task Prompt / Source Text Header if present */}
            {qs[0]?.source_text ? (
              <div className="p-4 bg-[#FAF8F3] rounded-xl border-l-4 border-[#C79B3A] text-xs font-serif font-semibold text-[#0D1B2A] leading-relaxed">
                <span className="text-[#C79B3A] font-bold block uppercase tracking-wider text-[10px] mb-1">
                  {sec === 'IV' ? 'ისტორიული წყარო:' : 'დავალების პირობა:'}
                </span>
                {qs[0].source_text}
              </div>
            ) : sec === 'III' ? (
              <div className="p-4 bg-[#FAF8F3] rounded-xl border-l-4 border-[#C79B3A] text-xs font-serif font-bold text-[#0D1B2A]">
                <span className="text-[#C79B3A] font-bold block uppercase tracking-wider text-[10px] mb-1">
                  დავალების პირობა:
                </span>
                1799 წელს გენერალი ბონაპარტე პირველი კონსული გახდა.
              </div>
            ) : null}
            {qs.map((q) => {
              const ans = attempt.answers.find((a) => a.question_id === q.id);
              const g = grades[q.id];
              return (
                <div key={q.id} className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0D1B2A] leading-relaxed flex-1">
                      <span className="text-[#C79B3A] font-mono mr-1">{q.question_order}.</span>
                      {q.question_text}
                    </p>
                    <span className="text-[11px] font-bold text-[#C79B3A] shrink-0 pt-0.5">
                      მაქს: {q.max_points}
                    </span>
                  </div>

                  {/* Student's answer */}
                  <div className="p-3 bg-white border border-[#E6DDCB] rounded-lg">
                    <p className="text-[10px] text-[#666666] font-semibold uppercase tracking-wider mb-1">მოსწავლის პასუხი:</p>
                    <p className="text-sm text-[#0D1B2A] leading-relaxed whitespace-pre-wrap">
                      {ans?.answer_text || <em className="text-[#999]">პასუხი არ გაუცია</em>}
                    </p>
                  </div>

                  {/* Grading controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-[#0D1B2A] whitespace-nowrap">
                        ქულა (0–{q.max_points}):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={q.max_points}
                        value={g?.points ?? 0}
                        onChange={(e) => {
                          const val = Math.min(q.max_points, Math.max(0, parseInt(e.target.value) || 0));
                          setGrades((prev) => ({ ...prev, [q.id]: { ...prev[q.id], points: val } }));
                        }}
                        className="w-16 px-2 py-1.5 border-2 border-[#C79B3A] rounded-lg text-center font-mono font-bold text-[#0D1B2A] focus:outline-none text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="კომენტარი (სურ.)..."
                        value={g?.comment || ''}
                        onChange={(e) =>
                          setGrades((prev) => ({ ...prev, [q.id]: { ...prev[q.id], comment: e.target.value } }))
                        }
                        className="w-full px-3 py-1.5 border border-[#E6DDCB] rounded-lg text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Finalize button */}
      <div className="pt-2">
        <button
          onClick={handleFinalize}
          disabled={saving}
          className="w-full py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] font-bold rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>ინახება...</span></>
          ) : (
            <><Save className="w-5 h-5" /><span>შეფასების დასრულება ({totalAwarded}/{totalMax} ქულა)</span></>
          )}
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export const AdminDiagnosticManager: FC = () => {
  const [attempts, setAttempts] = useState<DiagnosticAttemptWithAnswers[]>([]);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<DiagnosticAttemptWithAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('submitted');

  const loadData = async () => {
    setLoading(true);
    const [ats, qs] = await Promise.all([getAllAttemptsAdmin(), getDiagnosticQuestions()]);
    setAttempts(ats);
    setQuestions(qs);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSelectAttempt = async (att: DiagnosticAttemptWithAnswers) => {
    setLoading(true);
    const full = await getAttemptWithAnswers(att.id);
    setSelectedAttempt(full);
    setLoading(false);
  };

  const handleGradingSaved = () => {
    setSelectedAttempt(null);
    loadData();
  };

  const filtered = filter === 'all' ? attempts : attempts.filter((a) => a.status === filter);

  if (selectedAttempt && questions.length > 0) {
    return (
      <GradingView
        attempt={selectedAttempt}
        questions={questions}
        onBack={() => setSelectedAttempt(null)}
        onSaved={handleGradingSaved}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-[#C79B3A]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">სადიაგნოსტიკო ტესტი N1</h3>
            <p className="text-xs text-[#666666]">სულ {attempts.length} გაგზავნილი ტესტი</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 border border-[#E6DDCB] text-xs font-bold rounded-xl hover:bg-[#FAF8F3] cursor-pointer"
        >
          განახლება
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([['submitted', 'შეფასება ელოდება'], ['graded', 'შეფასდა'], ['all', 'ყველა']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              filter === key
                ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                : 'bg-white text-[#666666] border-[#E6DDCB] hover:border-[#C79B3A]'
            }`}
          >
            {label} ({key === 'all' ? attempts.length : attempts.filter((a) => a.status === key).length})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#C79B3A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#666666]">
          Attempt-ები არ არის
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((att) => (
            <div
              key={att.id}
              onClick={() => handleSelectAttempt(att)}
              className="p-4 bg-white rounded-xl border border-[#E6DDCB] hover:border-[#C79B3A] hover:shadow-sm transition-all cursor-pointer flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-[#C79B3A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0D1B2A] truncate">
                  {att.student_name || att.user_email}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#666666] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {att.created_at ? new Date(att.created_at).toLocaleDateString('ka-GE') : '—'}
                  </span>
                  {att.status === 'graded' && att.total_score !== null && (
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Star className="w-3 h-3" />
                      {att.total_score}/{att.max_score}
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={att.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

