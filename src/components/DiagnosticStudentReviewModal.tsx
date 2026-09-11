import { useState, useEffect, type FC } from 'react';
import { X, CheckCircle2, Clock, Loader2, Star, MessageSquare, BookOpen, Map, FileText, AlertTriangle } from 'lucide-react';
import { DiagnosticAttemptWithAnswers, DiagnosticQuestion } from '../types';
import { getAttemptWithAnswers, getDiagnosticQuestions } from '../lib/diagnosticService';

interface DiagnosticStudentReviewModalProps {
  attemptId: string;
  onClose: () => void;
}

export const DiagnosticStudentReviewModal: FC<DiagnosticStudentReviewModalProps> = ({ attemptId, onClose }) => {
  const [attempt, setAttempt] = useState<DiagnosticAttemptWithAnswers | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [att, qs] = await Promise.all([
        getAttemptWithAnswers(attemptId),
        getDiagnosticQuestions(),
      ]);
      if (mounted) {
        setAttempt(att);
        setQuestions(qs);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [attemptId]);

  if (!attemptId) return null;

  const sectionOrder = ['I', 'II', 'III', 'IV'];
  const bySection = (s: string) => questions.filter((q) => q.section === s);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#E6DDCB] shadow-2xl rounded-3xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#0D1B2A] text-white border-b border-[#C79B3A]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C79B3A] text-[#0D1B2A] font-bold flex items-center justify-center text-lg">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#FAF8F3]">
                ტესტის შეფასება და უკუკავშირი
              </h2>
              <p className="text-xs text-[#FAF8F3]/70">
                სადიაგნოსტიკო ტესტი N1 · ისტორია
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-[#FAF8F3]/30">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#C79B3A]" />
            </div>
          ) : !attempt ? (
            <div className="p-8 text-center text-sm text-rose-600 flex flex-col items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              <span>მონაცემების ჩატვირთვა ვერ მოხერხდა</span>
            </div>
          ) : (
            <>
              {/* Score Banner */}
              <div className="bg-gradient-to-br from-[#0D1B2A] to-[#13253D] rounded-2xl p-6 text-white border border-[#C79B3A]/40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="px-2.5 py-0.5 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {attempt.status === 'graded' ? 'შეფასებულია ✓' : 'შეფასება ელოდება'}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-[#FAF8F3]">
                    {attempt.student_name || attempt.user_email}
                  </h3>
                  <p className="text-xs text-[#FAF8F3]/70">
                    გაგზავნილია: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('ka-GE') : '—'}
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl text-center">
                  <span className="text-xs text-[#C79B3A] font-bold uppercase tracking-wider block">საბოლოო ქულა</span>
                  <span className="font-mono font-bold text-3xl text-emerald-400">
                    {attempt.total_score !== null && attempt.total_score !== undefined ? attempt.total_score : '—'} / {attempt.max_score}
                  </span>
                </div>
              </div>

              {/* Questions + Answers + Teacher Feedback */}
              <div className="space-y-6">
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

                      {/* Prompt / Source context */}
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
                        const pts = ans?.points_awarded;
                        const comment = ans?.teacher_comment;

                        return (
                          <div key={q.id} className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-[#0D1B2A] leading-relaxed flex-1">
                                <span className="text-[#C79B3A] font-mono mr-1">{q.question_order}.</span>
                                {q.question_text}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {pts !== null && pts !== undefined ? (
                                  <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                                    pts === q.max_points
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : pts > 0
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}>
                                    {pts} / {q.max_points} ქულა
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-[#C79B3A]">
                                    მაქს: {q.max_points} ქ.
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Student's submitted answer */}
                            <div className="p-3 bg-white border border-[#E6DDCB] rounded-lg">
                              <p className="text-[10px] text-[#666666] font-semibold uppercase tracking-wider mb-1">თქვენი პასუხი:</p>
                              <p className="text-sm text-[#0D1B2A] leading-relaxed whitespace-pre-wrap">
                                {ans?.answer_text || <em className="text-[#999]">პასუხი არ გაგიციათ</em>}
                              </p>
                            </div>

                            {/* Teacher's Feedback Comment */}
                            {comment && (
                              <div className="p-3.5 bg-amber-500/10 border-l-4 border-[#C79B3A] rounded-r-xl space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#C79B3A] uppercase tracking-wider">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>მასწავლებლის უკუკავშირი:</span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#0D1B2A] font-medium leading-relaxed">
                                  {comment}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF8F3] border-t border-[#E6DDCB] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0D1B2A] text-white text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#C79B3A] hover:text-[#0D1B2A] transition-colors cursor-pointer"
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
};
