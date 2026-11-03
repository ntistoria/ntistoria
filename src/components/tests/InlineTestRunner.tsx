import { type FC } from 'react';
import {
  AlertCircle,
  FileText,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle2,
  XCircle,
  Send,
  Keyboard
} from 'lucide-react';
import { HistoryTest } from '../../types';
import { checkOpenAnswerMatch } from '../../lib/answerMatching';

// Chronology sequence matching helper
export const checkChronologyItemsMatch = (
  userItemsOrder: string[],
  originalItems: string[],
  correctSeq: number[]
): boolean => {
  if (!userItemsOrder || !originalItems || !correctSeq) return false;

  const expectedOrder = correctSeq.map(seqIdx => {
    const idx = seqIdx > 0 && seqIdx <= originalItems.length ? seqIdx - 1 : seqIdx;
    return originalItems[idx] || '';
  });

  return userItemsOrder.every((item, i) => item === expectedOrder[i]);
};

interface InlineTestRunnerProps {
  activeInlineTest: HistoryTest;
  selectedCategoryKey: string | null;
  currentQIndex: number;
  selectedAnswers: number[];
  tabSwitchCount: number;
  chronologyOrders: Record<number, string[]>;
  chronologyChecked: Record<number, boolean>;
  openTextAnswers: Record<number, string>;
  openTextChecked: Record<number, boolean>;
  openTextScores: Record<number, { score: number; maxScore: number; feedback: string; correctAnswer: string }>;
  openTextGrading: Record<number, boolean>;
  openTextError: Record<number, string>;
  onSelectQuestionIndex: (idx: number) => void;
  onSelectOptionInline: (optIdx: number) => void;
  onMoveChronologyItem: (fromIdx: number, toIdx: number) => void;
  onCheckChronology: () => void;
  onChangeOpenTextAnswer: (qIdx: number, val: string) => void;
  onCheckOpenText: () => void;
  onFinishTest: () => void;
  onOpenLightbox: (url: string) => void;
}

export const InlineTestRunner: FC<InlineTestRunnerProps> = ({
  activeInlineTest,
  selectedCategoryKey,
  currentQIndex,
  selectedAnswers,
  tabSwitchCount,
  chronologyOrders,
  chronologyChecked,
  openTextAnswers,
  openTextChecked,
  openTextScores,
  openTextGrading,
  openTextError,
  onSelectQuestionIndex,
  onSelectOptionInline,
  onMoveChronologyItem,
  onCheckChronology,
  onChangeOpenTextAnswer,
  onCheckOpenText,
  onFinishTest,
  onOpenLightbox
}) => {
  return (
    <>
      {/* 3.2 Question Navigator / Palette */}
      {activeInlineTest.questions.length > 1 && (
        <div className="bg-white rounded-2xl border border-[#E6DDCB] p-4 shadow-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#666666]">
            <span className="uppercase tracking-wider text-[#0D1B2A]">
              კითხვების ნავიგატორი
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>სწორი</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>შეცდომა</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E6DDCB]" />
                <span>პასუხგაუცემელი</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {activeInlineTest.questions.map((q, idx) => {
              const isCurrent = idx === currentQIndex;
              let isAnswered = false;
              let isCorrect = false;

              if (q.questionType === 'chronology') {
                isAnswered = !!chronologyChecked[idx];
                if (isAnswered) {
                  const order = chronologyOrders[idx] || q.chronologyItems || [];
                  isCorrect = checkChronologyItemsMatch(order, q.chronologyItems || [], q.correctSequence || [0, 1, 2]);
                }
              } else if (q.questionType === 'open_text') {
                isAnswered = !!openTextChecked[idx];
                if (isAnswered) {
                  const graded = openTextScores[idx];
                  const typed = openTextAnswers[idx] || '';
                  isCorrect = graded
                    ? graded.score >= graded.maxScore
                    : checkOpenAnswerMatch(typed, q.correctAnswerText || '');
                }
              } else {
                isAnswered = selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== -1;
                if (isAnswered) {
                  isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
                }
              }

              let btnClass = 'bg-[#FAF8F3] border-[#E6DDCB] text-[#0D1B2A] hover:border-[#C79B3A]';
              if (isAnswered) {
                btnClass = isCorrect
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-rose-50 border-rose-400 text-rose-800';
              }
              if (isCurrent) {
                btnClass += ' ring-2 ring-[#C79B3A] font-extrabold scale-105';
              }

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => onSelectQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg border text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
                  title={`კითხვა #${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE INLINE QUESTION VIEW */}
      <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] p-6 sm:p-10 space-y-8 shadow-md prevent-select select-none">
        {/* Anti-cheating Warning Banner */}
        {tabSwitchCount > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>⚠️ გაფრთხილება: ტესტის მიმდინარეობისას გვერდი/ტაბი დატოვეთ {tabSwitchCount}-ჯერ!</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-extrabold shrink-0">
              დაფიქსირდა
            </span>
          </div>
        )}

        {/* Question Header & Title */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[10px] font-bold uppercase tracking-widest rounded-full">
              {activeInlineTest.title}
            </span>

            {(() => {
              const q = activeInlineTest.questions[currentQIndex];
              if (!q) return null;
              const num = q.itemNumber || (currentQIndex + 1);
              const displayNum = q.parentItemNumber ? `${q.parentItemNumber}.${num}` : `${num}`;
              let label = `კითხვა N${displayNum}`;
              if (q.questionType === 'chronology') label = `ქრონოლოგია N${num}`;
              else if (selectedCategoryKey === 'map') label = `რუკა N${displayNum}`;
              else if (selectedCategoryKey === 'analogies') label = `ანალოგია N${displayNum}`;
              else if (selectedCategoryKey === 'source') label = `წყარო N${displayNum}`;
              else if (selectedCategoryKey === 'illustrations') label = `ილუსტრაცია N${displayNum}`;

              return (
                <span className="px-3.5 py-1 bg-[#0D1B2A] text-[#C79B3A] text-xs font-mono font-bold rounded-full border border-[#C79B3A]/40 shadow-xs">
                  {label}
                </span>
              );
            })()}
          </div>

          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A] leading-snug">
            {activeInlineTest.questions[currentQIndex]?.prompt}
          </h2>
        </div>

        {/* Source Context Text if present */}
        {activeInlineTest.questions[currentQIndex]?.sourceContext && (
          <div className="p-6 bg-[#FAF8F3] rounded-2xl border-l-4 border-[#C79B3A] space-y-2 shadow-inner">
            <span className="text-xs uppercase tracking-wider font-bold text-[#C79B3A] flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> ტექსტური წყარო / კონტექსტი:
            </span>
            <p className="font-serif italic text-sm sm:text-base text-[#0D1B2A] leading-relaxed whitespace-pre-line">
              {activeInlineTest.questions[currentQIndex]?.sourceContext}
            </p>
          </div>
        )}

        {/* Map / Illustration Image if present */}
        {activeInlineTest.questions[currentQIndex]?.mapImage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB]">
              <span className="text-xs font-bold text-[#0D1B2A]">
                სურათი / რუკა (დააჭირეთ გასადიდებლად)
              </span>
              <button
                type="button"
                onClick={() => {
                  const url = activeInlineTest.questions[currentQIndex]?.mapImage;
                  if (url) onOpenLightbox(url);
                }}
                className="px-3 py-1 rounded-lg bg-[#0D1B2A] text-[#FAF8F3] hover:bg-[#C79B3A] hover:text-[#0D1B2A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>სრულ ეკრანზე</span>
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#E6DDCB] shadow-md bg-[#0D1B2A] max-h-[480px]">
              <img
                src={activeInlineTest.questions[currentQIndex]?.mapImage}
                alt="დავალების სურათი/რუკა"
                onClick={() => {
                  const url = activeInlineTest.questions[currentQIndex]?.mapImage;
                  if (url) onOpenLightbox(url);
                }}
                className="w-full h-full object-contain max-h-[480px] mx-auto cursor-zoom-in"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        {/* QUESTION TYPE RENDERERS */}
        {(() => {
          const currentQ = activeInlineTest.questions[currentQIndex];
          if (!currentQ) return null;

          /* 1. CHRONOLOGY ORDERING QUESTION TYPE */
          if (currentQ.questionType === 'chronology') {
            const currentItems = chronologyOrders[currentQIndex] || currentQ.chronologyItems || [];
            const isChecked = chronologyChecked[currentQIndex];
            const isCorrect = isChecked && checkChronologyItemsMatch(
              currentItems,
              currentQ.chronologyItems || [],
              currentQ.correctSequence || [0, 1, 2]
            );

            return (
              <div className="space-y-6 pt-4 border-t border-[#E6DDCB]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider block">
                      დაალაგეთ ქრონოლოგიური თანმიმდევრობა:
                    </span>
                    <span className="px-3 py-1 bg-[#FAF8F3] text-[#0D1B2A] text-xs font-mono font-bold rounded-lg border border-[#C79B3A]/40 shadow-xs">
                      ქრონოლოგია N{currentQ.itemNumber || (currentQIndex + 1)}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666]">
                    ისრებით (▲ / ▼) გადააადგილეთ 3 მოვლენა სწორი თანმიმდევრობით (1-ლიდან 3-მდე).
                  </p>
                </div>

                <div className="space-y-3">
                  {currentItems.map((itemText, idx) => (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 bg-white shadow-xs ${
                        isChecked
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-rose-400 bg-rose-50'
                          : 'border-[#E6DDCB] hover:border-[#C79B3A]'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-8 h-8 rounded-xl bg-[#0D1B2A] text-[#C79B3A] text-xs font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-sm sm:text-base text-[#0D1B2A] font-medium leading-relaxed">
                          {itemText}
                        </span>
                      </div>

                      {!isChecked && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onMoveChronologyItem(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#C79B3A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] transition-colors disabled:opacity-30 cursor-pointer"
                            title="ზემოთ გადაადგილება"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onMoveChronologyItem(idx, idx + 1)}
                            disabled={idx === currentItems.length - 1}
                            className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#C79B3A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] transition-colors disabled:opacity-30 cursor-pointer"
                            title="ქვემოთ გადაადგილება"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!isChecked ? (
                  <button
                    onClick={onCheckChronology}
                    className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>თანმიმდევრობის შემოწმება</span>
                  </button>
                ) : (
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                    isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                    <span>
                      {isCorrect
                        ? 'სწორია! თანმიმდევრობა ზუსტად არის დალაგებული.'
                        : `არასწორია. სწორი თანმიმდევრობა: ${(currentQ.correctSequence || [1, 2, 3]).join(' ➔ ')}`}
                    </span>
                  </div>
                )}
              </div>
            );
          }

          /* 2. OPEN-ENDED TYPED TEXT QUESTION TYPE */
          if (currentQ.questionType === 'open_text') {
            const typed = openTextAnswers[currentQIndex] || '';
            const isChecked = openTextChecked[currentQIndex];
            const aiResult = openTextScores[currentQIndex];
            const isGrading = !!openTextGrading[currentQIndex];
            const gradeError = openTextError[currentQIndex];
            const isCorrect = isChecked && (aiResult
              ? aiResult.score >= aiResult.maxScore
              : checkOpenAnswerMatch(typed, currentQ.correctAnswerText || ''));

            return (
              <div className="space-y-5 pt-4 border-t border-[#E6DDCB]">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider block">
                    ჩაწერეთ ღია პასუხი:
                  </label>
                  <p className="text-xs text-[#666666]">
                    შეიყვანეთ პასუხი ტექსტურად. ბაზის სწორ პასუხთან დაახლოებითი დამთხვევაც ჩაითვლება სწორად.
                  </p>
                </div>

                <textarea
                  value={typed}
                  disabled={isChecked}
                  onChange={(e) => onChangeOpenTextAnswer(currentQIndex, e.target.value)}
                  placeholder="ჩაწერეთ თქვენი პასუხი აქ..."
                  rows={3}
                  className="w-full bg-[#FAF8F3] border-2 border-[#E6DDCB] focus:border-[#C79B3A] rounded-2xl p-4 text-sm sm:text-base text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]/30 resize-none disabled:opacity-80"
                />

                {!isChecked ? (
                  <div className="space-y-3">
                    <button
                      onClick={onCheckOpenText}
                      disabled={!typed.trim() || isGrading}
                      className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isGrading ? 'მიმდინარეობს შეფასება...' : 'პასუხის გაგზავნა'}</span>
                    </button>
                    {gradeError && (
                      <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs font-semibold">
                        {gradeError}
                      </div>
                    )}
                  </div>
                ) : aiResult ? (
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold space-y-2 ${
                    isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : (aiResult.score > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-rose-50 border-rose-300 text-rose-800')
                  }`}>
                    <div className="flex items-center gap-2">
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                      <div className="text-base font-bold">ქულა: {aiResult.score} / {aiResult.maxScore}</div>
                    </div>
                    {aiResult.feedback && (
                      <div className="text-xs font-normal leading-relaxed">{aiResult.feedback}</div>
                    )}
                    {aiResult.correctAnswer && (
                      <div className="text-xs font-normal opacity-90 pt-1 border-t border-black/10">
                        სწორი პასუხის მაგალითი: <strong>{aiResult.correctAnswer}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${
                    isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                      <div>
                        <div>{isCorrect ? 'სწორია! თქვენი პასუხი ემთხვევა სწორ პასუხს.' : 'არასწორია.'}</div>
                        {currentQ.correctAnswerText && (
                          <div className="text-xs font-normal opacity-90 mt-0.5">
                            ბაზის სწორი პასუხი: <strong>{currentQ.correctAnswerText}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          /* 3. MULTIPLE CHOICE QUESTION TYPE (MCQ) */
          return (
            <div className="space-y-3 pt-4 border-t border-[#E6DDCB]">
              {currentQ.options.map((optText, optIdx) => {
                const isSelected = selectedAnswers[currentQIndex] === optIdx;
                const isCorrect = currentQ.correctAnswerIndex === optIdx;
                const isAnswered = selectedAnswers[currentQIndex] !== -1;

                let borderClass = 'border-[#E6DDCB] bg-white hover:border-[#C79B3A] hover:bg-[#FAF8F3]';
                let badgeClass = 'bg-[#F5F2EA] text-[#0D1B2A]';

                if (isAnswered) {
                  if (isCorrect) {
                    borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    badgeClass = 'bg-emerald-600 text-white';
                  } else if (isSelected) {
                    borderClass = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                    badgeClass = 'bg-rose-600 text-white';
                  }
                } else if (isSelected) {
                  borderClass = 'border-[#C79B3A] bg-[#FAF8F3] ring-2 ring-[#C79B3A]/30 font-bold';
                  badgeClass = 'bg-[#C79B3A] text-white';
                }

                const optLabels = ['ა', 'ბ', 'გ', 'დ'];

                return (
                  <button
                    key={optIdx}
                    onClick={() => onSelectOptionInline(optIdx)}
                    disabled={isAnswered}
                    className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                      isAnswered ? 'cursor-default' : 'cursor-pointer'
                    } ${borderClass}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeClass}`}>
                      {optLabels[optIdx] || optIdx + 1}
                    </div>
                    <span className="text-sm sm:text-base leading-relaxed flex-1">
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Instant Explanation when answered */}
        {selectedAnswers[currentQIndex] !== -1 && activeInlineTest.questions[currentQIndex]?.explanation && (
          <div className="p-5 bg-[#FAF8F3] rounded-2xl border border-[#C79B3A]/40 space-y-1.5 animate-fade-in">
            <span className="text-xs font-bold text-[#C79B3A] uppercase tracking-wider block">
              განმარტება:
            </span>
            <p className="text-xs sm:text-sm text-[#0D1B2A] leading-relaxed">
              {activeInlineTest.questions[currentQIndex]?.explanation}
            </p>
          </div>
        )}

        {/* Navigation Controls: Previous, Next, Finish */}
        <div className="space-y-3 pt-6 border-t border-[#E6DDCB]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectQuestionIndex(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className="px-5 py-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer"
            >
              წინა შეკითხვა
            </button>

            {currentQIndex < activeInlineTest.questions.length - 1 ? (
              <button
                onClick={() => onSelectQuestionIndex(Math.min(activeInlineTest.questions.length - 1, currentQIndex + 1))}
                className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                შემდეგი შეკითხვა
              </button>
            ) : (
              <button
                onClick={onFinishTest}
                className="px-6 py-3 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                ტესტის დასრულება
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center justify-center gap-2 text-[11px] text-[#8A8A8A] pt-1">
            <Keyboard className="w-3.5 h-3.5 text-[#C79B3A]" />
            <span>
              კლავიატურა: <strong className="text-[#0D1B2A]">1–4</strong> ან <strong className="text-[#0D1B2A]">ა–დ</strong> პასუხის ასარჩევად • <strong className="text-[#0D1B2A]">← / →</strong> გადასასვლელად
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

