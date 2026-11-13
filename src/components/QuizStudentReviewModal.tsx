import { useState, useEffect, type FC } from 'react';
import { X, CheckCircle2, XCircle, HelpCircle, Trophy, RotateCcw, AlertCircle } from 'lucide-react';
import { QuizAttempt, QuizQuestionItem } from '../types';
import { fetchQuizQuestionsWithAnswers, getQuizResultFeedback, getQuizImageUrl, getLocalAttempts } from '../lib/quizService';

interface QuizStudentReviewModalProps {
  attempt: QuizAttempt;
  onClose: () => void;
  onRetake?: (quizId: string) => void;
}

interface ParsedUserAnswerEntry {
  answerId: string;
  answerOrder?: number;
  answerText?: string;
}

export const QuizStudentReviewModal: FC<QuizStudentReviewModalProps> = ({
  attempt,
  onClose,
  onRetake
}) => {
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');

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

  // Resolve user_answers from attempt prop, or fallback to localStorage if DB row had null user_answers
  const resolvedRawUserAnswers = (() => {
    const rawAttemptAnswers: unknown = attempt.user_answers;
    if (rawAttemptAnswers) {
      if (Array.isArray(rawAttemptAnswers) && rawAttemptAnswers.length > 0) {
        return rawAttemptAnswers;
      }
      if (typeof rawAttemptAnswers === 'string' && rawAttemptAnswers.trim().length > 2) {
        return rawAttemptAnswers;
      }
      if (typeof rawAttemptAnswers === 'object' && Object.keys(rawAttemptAnswers as object).length > 0) {
        return rawAttemptAnswers;
      }
    }
    const localMatches = getLocalAttempts(attempt.quiz_id);
    const exactMatch = localMatches.find(a => a.id === attempt.id && a.user_answers);
    if (exactMatch?.user_answers) return exactMatch.user_answers;
    const quizMatch = localMatches.find(a => a.user_answers && (
      Array.isArray(a.user_answers) ? a.user_answers.length > 0 : Object.keys(a.user_answers).length > 0
    ));
    return quizMatch?.user_answers || null;
  })();

  // Robust parse of user answers into map of question_id -> ParsedUserAnswerEntry
  const userAnswersMap: Record<string, ParsedUserAnswerEntry> = {};
  if (resolvedRawUserAnswers) {
    let raw: any = resolvedRawUserAnswers;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse user_answers string:', e);
      }
    }
    if (Array.isArray(raw)) {
      raw.forEach((item: any, idx: number) => {
        if (!item) return;
        const qId = item.question_id || item.questionId || item.qId || item.q;
        const aId = item.answer_id || item.answerId || item.aId || item.a;
        const aOrder = typeof item.answer_order === 'number' ? item.answer_order : undefined;
        const aText = typeof item.answer_text === 'string' ? item.answer_text : undefined;
        if (qId && (aId || aOrder !== undefined || aText)) {
          userAnswersMap[String(qId).trim()] = {
            answerId: aId ? String(aId).trim() : '',
            answerOrder: aOrder,
            answerText: aText
          };
        } else if (typeof item === 'string') {
          userAnswersMap[`index_${idx}`] = { answerId: item.trim() };
        }
      });
    } else if (typeof raw === 'object' && raw !== null) {
      Object.entries(raw).forEach(([k, v]) => {
        if (v && typeof v === 'object' && ('answer_id' in (v as any) || 'answerId' in (v as any))) {
          const aId = (v as any).answer_id || (v as any).answerId;
          userAnswersMap[String(k).trim()] = {
            answerId: String(aId).trim(),
            answerOrder: typeof (v as any).answer_order === 'number' ? (v as any).answer_order : undefined,
            answerText: typeof (v as any).answer_text === 'string' ? (v as any).answer_text : undefined
          };
        } else if (v) {
          userAnswersMap[String(k).trim()] = { answerId: String(v).trim() };
        }
      });
    }
  }

  const hasRecordedUserAnswers = Object.keys(userAnswersMap).length > 0;

  // Evaluate each question against userAnswersMap
  const evaluatedQuestions = questions.map((q, qIndex) => {
    const qIdStr = String(q.id).trim();
    const entry = userAnswersMap[qIdStr] || userAnswersMap[q.id] || userAnswersMap[`index_${qIndex}`];
    const qAnswers = q.answers || [];
    const correctAnswer = qAnswers.find(a => Boolean(a.is_correct));

    let selectedAnswer = entry?.answerId
      ? qAnswers.find(a => String(a.id).trim() === String(entry.answerId).trim())
      : undefined;

    if (!selectedAnswer && entry?.answerText) {
      const targetText = entry.answerText.trim();
      selectedAnswer = qAnswers.find(a => (a.answer_text || '').trim() === targetText);
    }

    if (!selectedAnswer && entry?.answerOrder !== undefined) {
      selectedAnswer =
        qAnswers.find(a => a.answer_order === entry.answerOrder) ||
        qAnswers[entry.answerOrder - 1];
    }

    const selectedAnsId = selectedAnswer
      ? String(selectedAnswer.id).trim()
      : entry?.answerId;

    const isUserCorrect = Boolean(
      (selectedAnswer && Boolean(selectedAnswer.is_correct)) ||
      (selectedAnsId &&
        correctAnswer &&
        String(selectedAnsId).trim() === String(correctAnswer.id).trim())
    );

    return {
      q,
      qIndex,
      selectedAnsId,
      selectedAnswer,
      correctAnswer,
      isUserCorrect
    };
  });

  const computedCorrectCount = evaluatedQuestions.filter(item => item.isUserCorrect).length;
  const displayTotal = questions.length > 0 ? questions.length : attempt.total_questions;
  const displayCorrect = hasRecordedUserAnswers && questions.length > 0
    ? computedCorrectCount
    : attempt.correct_answers;
  const displayIncorrect = Math.max(0, displayTotal - displayCorrect);
  const displayPercentage = displayTotal > 0
    ? Math.round((displayCorrect / displayTotal) * 100)
    : Math.round(Number(attempt.percentage));

  const feedback = getQuizResultFeedback(displayPercentage);

  const filteredQuestions = evaluatedQuestions.filter(item => {
    if (!hasRecordedUserAnswers) return true;
    if (filterMode === 'incorrect') return !item.isUserCorrect;
    if (filterMode === 'correct') return item.isUserCorrect;
    return true;
  });

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

        {/* Score Banner & Filter Bar */}
        <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#E6DDCB] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] text-[#C79B3A] font-serif font-bold text-lg flex items-center justify-center shadow-sm">
                {displayPercentage}%
              </div>
              <div className="space-y-1">
                <span className="font-serif font-bold text-base text-[#0D1B2A] block">
                  {displayCorrect} / {displayTotal} სწორი პასუხი
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                    ✓ სწორი: {displayCorrect}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-md">
                    ✗ არასწორი: {displayIncorrect}
                  </span>
                </div>
              </div>
            </div>

            {/* Anti-cheating Tab Switch Status */}
            <div className="flex items-center gap-2">
              {(attempt.tab_switches ?? 0) > 0 ? (
                <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>⚠️ ტესტის მიმდინარეობისას {attempt.tab_switches}-ჯერ დატოვა გვერდი</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>✓ გვერდის დატოვება არ დაფიქსირებულა</span>
                </span>
              )}
            </div>
          </div>

          {/* Filter Tabs: All / Incorrect / Correct */}
          {!loading && questions.length > 0 && hasRecordedUserAnswers && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E6DDCB]">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#0D1B2A] text-white border-[#0D1B2A] shadow-xs'
                    : 'bg-white text-[#0D1B2A] border-[#E6DDCB] hover:border-[#C79B3A]'
                }`}
              >
                ყველა კითხვა ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('incorrect')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'incorrect'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>არასწორი პასუხები ({displayIncorrect})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('correct')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'correct'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>სწორი პასუხები ({displayCorrect})</span>
              </button>
            </div>
          )}
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
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E6DDCB] text-xs text-[#666666] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-sm text-[#0D1B2A]">
                {filterMode === 'incorrect' ? 'არასწორი პასუხები არ ფიქსირდება!' : 'სწორი პასუხები არ მოიძებნა'}
              </p>
            </div>
          ) : (
            <>
              {!hasRecordedUserAnswers && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 text-xs font-semibold flex items-start gap-2.5 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">
                      შენიშვნა ძველი მცდელობის შესახებ ({displayCorrect}/{displayTotal} სწორი, {displayIncorrect} შეცდომა):
                    </span>
                    <span className="font-normal text-amber-900 leading-relaxed block">
                      ეს მცდელობა შენახულია განახლებამდე, როდესაც ბაზაში მხოლოდ საბოლოო ქულა იწერებოდა და თითოეულ კითხვაზე მონიშნული ვარიანტი ცალ-ცალკე არ ინახებოდა. ქვემოთ ნაჩვენებია კითხვების საცნობარო სწორი პასუხები. გაიარეთ ქვიზი ხელახლა, რათა თქვენი ყველა სწორი და არასწორი პასუხი დეტალურად შეინახოს.
                    </span>
                  </div>
                </div>
              )}
              {filteredQuestions.map(({ q, qIndex, selectedAnsId, selectedAnswer, correctAnswer, isUserCorrect }) => {
                const optionLetters = ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ'];

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl p-5 border-2 shadow-sm space-y-4 ${
                      !hasRecordedUserAnswers
                        ? 'border-[#E6DDCB]'
                        : isUserCorrect
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-rose-300 bg-rose-50/40'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-[#E6DDCB]/60 pb-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            !hasRecordedUserAnswers
                              ? 'bg-[#0D1B2A] text-[#FAF8F3]'
                              : isUserCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {qIndex + 1}
                        </span>
                        <h3 className="font-serif font-bold text-sm sm:text-base text-[#0D1B2A] leading-snug whitespace-pre-line">
                          {q.question_text}
                        </h3>
                      </div>

                      {!hasRecordedUserAnswers ? (
                        <span className="px-3 py-1 bg-[#FAF8F3] border border-[#E6DDCB] text-[#666666] text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
                          <HelpCircle className="w-3.5 h-3.5 text-[#C79B3A]" />
                          <span>საცნობარო პასუხი</span>
                        </span>
                      ) : isUserCorrect ? (
                        <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>სწორია</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold rounded-full flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{selectedAnsId ? 'არასწორია' : 'არასწორია (უპასუხო)'}</span>
                        </span>
                      )}
                    </div>

                    {/* Explicit Wrong vs Correct summary box when user answered wrong */}
                    {hasRecordedUserAnswers && !isUserCorrect && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-950">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-0.5">
                            ✗ თქვენი არასწორი პასუხი:
                          </span>
                          <span className="font-bold">
                            {selectedAnswer ? selectedAnswer.answer_text : 'პასუხი არ გაცემულა'}
                          </span>
                        </div>
                        {correctAnswer && (
                          <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-950">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
                              ✓ სწორი პასუხი:
                            </span>
                            <span className="font-bold">{correctAnswer.answer_text}</span>
                          </div>
                        )}
                      </div>
                    )}

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
                        const isSelected = Boolean(
                          hasRecordedUserAnswers &&
                          selectedAnsId &&
                          String(selectedAnsId).trim() === String(ans.id).trim()
                        );
                        const isCorrect = Boolean(ans.is_correct);

                        let styleClasses = 'bg-[#FAF8F3] border-[#E6DDCB] text-[#0D1B2A]';
                        let badge = null;

                        if (!hasRecordedUserAnswers && isCorrect) {
                          styleClasses = 'bg-[#FAF8F3] border-2 border-[#C79B3A] text-[#0D1B2A] font-semibold';
                          badge = (
                            <span className="text-[11px] bg-[#0D1B2A] text-[#C79B3A] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ml-auto shrink-0">
                              <span>სწორი ვარიანტი (საცნობარო)</span>
                            </span>
                          );
                        } else if (isSelected && isCorrect) {
                          styleClasses = 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-bold shadow-xs';
                          badge = (
                            <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ml-auto shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>თქვენი სწორი პასუხი</span>
                            </span>
                          );
                        } else if (isSelected && !isCorrect) {
                          styleClasses = 'bg-rose-100 border-2 border-rose-500 text-rose-950 font-bold shadow-xs';
                          badge = (
                            <span className="text-[11px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ml-auto shrink-0">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>თქვენი პასუხი (არასწორია)</span>
                            </span>
                          );
                        } else if (isCorrect) {
                          styleClasses = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 font-semibold';
                          badge = (
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ml-auto shrink-0">
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
                                {optionLetters[aIdx] || String.fromCharCode(65 + aIdx)}
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
              })}
            </>
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
