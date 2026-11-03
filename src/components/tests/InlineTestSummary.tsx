import { useState, type FC } from 'react';
import {
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { HistoryTest } from '../../types';
import { checkOpenAnswerMatch } from '../../lib/answerMatching';
import { checkChronologyItemsMatch } from './InlineTestRunner';

interface InlineTestSummaryProps {
  activeInlineTest: HistoryTest;
  selectedAnswers: number[];
  chronologyOrders: Record<number, string[]>;
  openTextAnswers: Record<number, string>;
  openTextScores: Record<number, { score: number; maxScore: number; feedback: string; correctAnswer: string }>;
  switchCount: number;
  onRestartTest: () => void;
  onExitToTests: () => void;
}

export const InlineTestSummary: FC<InlineTestSummaryProps> = ({
  activeInlineTest,
  selectedAnswers,
  chronologyOrders,
  openTextAnswers,
  openTextScores,
  switchCount,
  onRestartTest,
  onExitToTests
}) => {
  const [reviewFilter, setReviewFilter] = useState<'mistakes' | 'all'>('mistakes');

  let correctCount = 0;
  let earnedPoints = 0;
  let totalPoints = 0;
  const pointsMode = activeInlineTest.questions.length > 0 && activeInlineTest.questions.every(q => !!q.maxScore);

  const questionOutcomes = activeInlineTest.questions.map((q, idx) => {
    if (pointsMode) {
      totalPoints += q.maxScore || 0;
      earnedPoints += openTextScores[idx]?.score || 0;
    }
    let isCorrect = false;
    if (q.questionType === 'chronology') {
      const order = chronologyOrders[idx] || q.chronologyItems || [];
      isCorrect = checkChronologyItemsMatch(order, q.chronologyItems || [], q.correctSequence || [0, 1, 2]);
    } else if (q.questionType === 'open_text') {
      const typed = openTextAnswers[idx] || '';
      const graded = openTextScores[idx];
      isCorrect = graded ? graded.score >= graded.maxScore : (!q.maxScore && checkOpenAnswerMatch(typed, q.correctAnswerText || ''));
    } else {
      isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
    }
    if (isCorrect) correctCount++;
    return { q, idx, isCorrect };
  });

  const totalCount = activeInlineTest.questions.length;
  const mistakeCount = totalCount - correctCount;
  const scorePct = pointsMode
    ? (totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0)
    : (totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);

  const displayedOutcomes = reviewFilter === 'mistakes' && mistakeCount > 0
    ? questionOutcomes.filter(item => !item.isCorrect)
    : questionOutcomes;

  const optLabels = ['ა', 'ბ', 'გ', 'დ'];

  return (
    <div className="bg-white rounded-3xl border-2 border-[#C79B3A] p-6 sm:p-12 text-center space-y-8 shadow-xl animate-fade-in">
      <div className="space-y-8">
        <div className="space-y-6 max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FAF8F3] border-2 border-[#C79B3A] flex items-center justify-center shadow-md">
            <Award className="w-10 h-10 text-[#C79B3A]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif font-bold text-3xl text-[#0D1B2A]">
              ტესტი დასრულებულია!
            </h2>
            <p className="text-sm text-[#666666]">
              {activeInlineTest.title}
            </p>
          </div>

          <div className="p-6 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-4">
            <div className="text-4xl font-serif font-bold text-[#C79B3A]">
              {pointsMode ? `${earnedPoints} / ${totalPoints} ქულა` : `${scorePct}%`}
            </div>
            {pointsMode && (
              <div className="text-xs font-semibold text-[#666666]">{scorePct}%</div>
            )}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-[#E6DDCB]">
              <div className="text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                სწორი: {correctCount}
              </div>
              <div className="text-rose-700 bg-rose-50 py-2 rounded-xl border border-rose-200">
                არასწორი: {mistakeCount}
              </div>
            </div>
          </div>

          {/* Tab Switch Anti-cheating Status */}
          <div className="p-3.5 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] text-xs font-bold shadow-xs">
            {switchCount > 0 ? (
              <span className="text-amber-800 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚠️ ტესტის მიმდინარეობისას {switchCount}-ჯერ დაფიქსირდა გვერდის/ტაბის დატოვება</span>
              </span>
            ) : (
              <span className="text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ გვერდის/ტაბის დატოვება არ დაფიქსირებულა</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={onRestartTest}
              className="w-full py-3.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-[#C79B3A]" />
              <span>თავიდან გაკეთება</span>
            </button>

            <button
              onClick={onExitToTests}
              className="w-full py-3.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>ტესტებში დაბრუნება</span>
            </button>
          </div>
        </div>

        {/* 3.3 Detailed Mistake & Question Review */}
        <div className="border-t-2 border-[#E6DDCB] pt-8 text-left space-y-5 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                შედეგების დეტალური გარჩევა
              </h3>
              <p className="text-xs text-[#666666]">
                გადახედეთ თქვენს პასუხებს, სწორ ვარიანტებსა და განმარტებებს
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReviewFilter('mistakes')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  reviewFilter === 'mistakes' && mistakeCount > 0
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-[#FAF8F3] text-[#0D1B2A] border-[#E6DDCB] hover:border-[#C79B3A]'
                }`}
              >
                შეცდომები ({mistakeCount})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  reviewFilter === 'all' || mistakeCount === 0
                    ? 'bg-[#0D1B2A] text-white border-[#0D1B2A] shadow-xs'
                    : 'bg-[#FAF8F3] text-[#0D1B2A] border-[#E6DDCB] hover:border-[#C79B3A]'
                }`}
              >
                ყველა კითხვა ({totalCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {displayedOutcomes.map(({ q, idx, isCorrect }) => {
              const userAnsIdx = selectedAnswers[idx];
              const userAnsText =
                q.questionType === 'chronology'
                  ? (chronologyOrders[idx] || q.chronologyItems || []).join(' ➔ ')
                  : q.questionType === 'open_text'
                  ? openTextAnswers[idx] || 'პასუხი არ გაცემულა'
                  : userAnsIdx !== undefined && userAnsIdx >= 0 && q.options[userAnsIdx]
                  ? `${optLabels[userAnsIdx] || userAnsIdx + 1}) ${q.options[userAnsIdx]}`
                  : 'პასუხი არ გაცემულა';

              const correctAnsText =
                q.questionType === 'chronology'
                  ? (q.correctSequence || [1, 2, 3])
                      .map(seqIdx => {
                        const orig = q.chronologyItems || [];
                        const i = seqIdx > 0 && seqIdx <= orig.length ? seqIdx - 1 : seqIdx;
                        return orig[i] || '';
                      })
                      .join(' ➔ ')
                  : q.questionType === 'open_text'
                  ? openTextScores[idx]?.correctAnswer || q.correctAnswerText || ''
                  : q.options[q.correctAnswerIndex]
                  ? `${optLabels[q.correctAnswerIndex] || q.correctAnswerIndex + 1}) ${q.options[q.correctAnswerIndex]}`
                  : '';

              return (
                <div
                  key={q.id || idx}
                  className={`p-5 rounded-2xl border-2 space-y-3 ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2.5 py-0.5 bg-[#0D1B2A] text-[#C79B3A] font-mono font-bold text-xs rounded-md shrink-0 mt-0.5">
                        #{idx + 1}
                      </span>
                      <p className="font-serif font-bold text-base text-[#0D1B2A] leading-snug">
                        {q.prompt}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 inline-flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>სწორია</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>შეცდომა</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div
                      className={`p-3 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="block font-bold uppercase tracking-wider text-[10px] opacity-75 mb-1">
                        თქვენი პასუხი:
                      </span>
                      <span className="font-semibold">{userAnsText}</span>
                    </div>

                    {!isCorrect && correctAnsText && (
                      <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900">
                        <span className="block font-bold uppercase tracking-wider text-[10px] opacity-75 mb-1">
                          სწორი პასუხი:
                        </span>
                        <span className="font-semibold">{correctAnsText}</span>
                      </div>
                    )}
                  </div>

                  {(q.explanation || openTextScores[idx]?.feedback) && (
                    <div className="p-3.5 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] space-y-1">
                      <span className="font-bold text-[#C79B3A] uppercase tracking-wider text-[10px] block">
                        განმარტება:
                      </span>
                      <p className="leading-relaxed">
                        {openTextScores[idx]?.feedback || q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

