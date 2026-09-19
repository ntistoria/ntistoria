import { useState, useEffect, type FC } from 'react';
import { X, CheckCircle2, XCircle, HelpCircle, Trophy, RotateCcw, AlertCircle } from 'lucide-react';
import { QuizAttempt, QuizQuestionItem } from '../types';
import { fetchQuizQuestionsWithAnswers, getQuizResultFeedback, getQuizImageUrl } from '../lib/quizService';

interface QuizStudentReviewModalProps {
  attempt: QuizAttempt;
  onClose: () => void;
  onRetake?: (quizId: string) => void;
}

export const QuizStudentReviewModal: FC<QuizStudentReviewModalProps> = ({
  attempt,
  onClose,
  onRetake
}) => {
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchQuizQuestionsWithAnswers(attempt.quiz_id);
        if (isMounted) setQuestions(data);
      } catch (err) {
        console.error('Error loading quiz review questions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [attempt.quiz_id]);

  // Parse user answers into map of question_id -> answer_id
  const userAnswersMap: Record<string, string> = {};
  if (attempt.user_answers) {
    if (Array.isArray(attempt.user_answers)) {
      attempt.user_answers.forEach((item: any) => {
        if (item.question_id && item.answer_id) {
          userAnswersMap[item.question_id] = item.answer_id;
        }
      });
    } else if (typeof attempt.user_answers === 'object') {
      Object.assign(userAnswersMap, attempt.user_answers);
    }
  }

  const feedback = getQuizResultFeedback(attempt.percentage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#E6DDCB] shadow-2xl rounded-3xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#0D1B2A] text-white border-b border-[#C79B3A]/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-widest rounded-full">
                დეტალური შედეგი
              </span>
              <span className="text-xs text-[#FAF8F3]/70 font-mono font-bold">
                {feedback.badge}
              </span>
            </div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-[#FAF8F3]">
              {attempt.quiz_title || 'ქვიზის შედეგების განხილვა'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Banner */}
        <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#E6DDCB] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] text-[#C79B3A] font-serif font-bold text-lg flex items-center justify-center shadow-sm">
              {attempt.percentage}%
            </div>
            <div>
              <span className="text-xs text-[#666666] font-semibold block">შედეგი:</span>
              <span className="font-serif font-bold text-base text-[#0D1B2A]">
                {attempt.correct_answers} / {attempt.total_questions} სწორი პასუხი
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[#C79B3A] block">{feedback.title}</span>
            <span className="text-[11px] text-[#666666] italic">{feedback.comment}</span>
          </div>
        </div>

        {/* Questions Breakdown List */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-[#FAF8F3]/30">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#666666] font-medium space-y-2">
              <div className="w-6 h-6 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
              <span>კითხვების ჩატვირთვა...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E6DDCB] text-xs text-[#666666]">
              კითხვების დეტალური მონაცემები ვერ მოიძებნა.
            </div>
          ) : (
            questions.map((q, qIndex) => {
              const selectedAnsId = userAnswersMap[q.id];
              const correctAnswer = q.answers.find(a => a.is_correct);
              const isUserCorrect = selectedAnsId && correctAnswer && selectedAnsId === correctAnswer.id;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm space-y-4 ${
                    isUserCorrect ? 'border-emerald-200 bg-emerald-50/20' : selectedAnsId ? 'border-rose-200 bg-rose-50/20' : 'border-[#E6DDCB]'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#E6DDCB]/60 pb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-[#0D1B2A] text-[#FAF8F3] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <h3 className="font-serif font-bold text-sm sm:text-base text-[#0D1B2A] leading-snug">
                        {q.question_text}
                      </h3>
                    </div>

                    {isUserCorrect ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>სწორია</span>
                      </span>
                    ) : selectedAnsId ? (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>არასწორია</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full shrink-0">
                        უპასუხო
                      </span>
                    )}
                  </div>

                  {/* Question Image if present */}
                  {q.image_path && (
                    <div className="rounded-xl overflow-hidden border border-[#E6DDCB] max-h-56 bg-[#FAF8F3]">
                      <img
                        src={getQuizImageUrl(q.image_path, 'quiz-question-images')}
                        alt="Question illustration"
                        className="w-full h-full object-contain max-h-56 mx-auto"
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-2">
                    {q.answers.map((ans, aIdx) => {
                      const isSelected = selectedAnsId === ans.id;
                      const isCorrect = ans.is_correct;

                      let styleClasses = 'bg-[#FAF8F3] border-[#E6DDCB] text-[#0D1B2A]';
                      let badge = null;

                      if (isSelected && isCorrect) {
                        styleClasses = 'bg-emerald-500/15 border-emerald-500 text-emerald-950 font-bold';
                        badge = (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 ml-auto shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>თქვენი სწორი პასუხი</span>
                          </span>
                        );
                      } else if (isSelected && !isCorrect) {
                        styleClasses = 'bg-rose-500/15 border-rose-500 text-rose-950 font-bold';
                        badge = (
                          <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1 ml-auto shrink-0">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>თქვენი პასუხი (არასწორი)</span>
                          </span>
                        );
                      } else if (isCorrect) {
                        styleClasses = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                        badge = (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 ml-auto shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>სწორი პასუხი</span>
                          </span>
                        );
                      }

                      return (
                        <div
                          key={ans.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${styleClasses}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-white/60 border border-current text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + aIdx)}
                            </span>
                            <span>{ans.answer_text}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF8F3] border-t border-[#E6DDCB] flex items-center justify-between">
          {onRetake ? (
            <button
              onClick={() => onRetake(attempt.quiz_id)}
              className="px-4 py-2 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ხელახლა გაკეთება</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0D1B2A] text-white text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#C79B3A] transition-colors cursor-pointer"
          >
            დახურვა
          </button>
        </div>

      </div>
    </div>
  );
};
