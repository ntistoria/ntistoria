import React, { useState, useEffect } from 'react';
import { HistoryTest, TestResult } from '../types';
import { X, CheckCircle2, XCircle, Clock, AlertCircle, Award, RotateCcw, ChevronRight, HelpCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { recordUserAnswers } from '../lib/progressService';


interface TestRunnerModalProps {
  test: HistoryTest | null;
  onClose: () => void;
  onSaveResult?: (result: TestResult) => void;
  userEmail?: string;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  test,
  onClose,
  onSaveResult,
  userEmail = 'guest_user'
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    if (test) {
      setSelectedAnswers(new Array(test.questions.length).fill(-1));
      setTimeRemaining(test.timeLimitMinutes * 60);
      setCurrentQuestionIndex(0);
      setIsFinished(false);
      setShowExplanation(false);
    }
  }, [test]);

  // Timer effect
  useEffect(() => {
    if (!test || isFinished || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, isFinished, timeRemaining]);

  if (!test) return null;

  const currentQ = test.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const currentSelected = selectedAnswers[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (showExplanation || isFinished) return;
    const updated = [...selectedAnswers];
    updated[currentQuestionIndex] = index;
    setSelectedAnswers(updated);
  };

  const handleConfirmAnswer = () => {
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (isLastQuestion) {
      finishTest();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const finishTest = async () => {
    setIsFinished(true);
    let correct = 0;
    const answerRecords: { questionId: string; isCorrect: boolean }[] = [];

    test.questions.forEach((q, idx) => {
      const isRight = selectedAnswers[idx] === q.correctAnswerIndex;
      if (isRight) correct += 1;
      if (selectedAnswers[idx] !== -1) {
        answerRecords.push({
          questionId: q.id,
          isCorrect: isRight
        });
      }
    });

    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
    const percentage = Math.round((correct / test.questions.length) * 100);

    const resultObj: TestResult = {
      testId: test.id,
      testTitle: test.title,
      score: correct,
      totalQuestions: test.questions.length,
      percentage,
      timeSpentSeconds,
      date: new Date().toLocaleDateString('ka-GE'),
      userAnswers: test.questions.map((q, idx) => ({
        questionIndex: idx,
        selectedIndex: selectedAnswers[idx],
        isCorrect: selectedAnswers[idx] === q.correctAnswerIndex
      }))
    };

    // Save to Progress Service
    try {
      const parts = test.id.split('-');
      const categoryKey = parts[0] || 'mcq';
      const chapterId = parts[1] || 'ch-1';
      await recordUserAnswers(userEmail, categoryKey, chapterId, answerRecords);
    } catch (err) {
      console.warn('Error recording progress stats:', err);
    }

    if (onSaveResult) {
      onSaveResult(resultObj);
    }
  };


  const restartTest = () => {
    setSelectedAnswers(new Array(test.questions.length).fill(-1));
    setCurrentQuestionIndex(0);
    setShowExplanation(false);
    setIsFinished(false);
    setTimeRemaining(test.timeLimitMinutes * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Results calculation
  let correctCount = 0;
  test.questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correctAnswerIndex) correctCount++;
  });
  const scorePct = Math.round((correctCount / test.questions.length) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#0D1B2A]/80 backdrop-blur-md animate-in fade-in duration-200">
        
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-3xl bg-[#FAF8F3] rounded-2xl shadow-2xl overflow-hidden z-10 border border-[#E6DDCB] max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#F5F2EA] border-b border-[#E6DDCB]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0D1B2A] bg-[#C79B3A] text-[#0D1B2A] px-3 py-0.5 rounded-full font-sans">
                {test.difficulty}
              </span>
              <h3 className="font-serif font-bold text-base text-[#0D1B2A] truncate max-w-[280px] sm:max-w-md">
                {test.title}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              {!isFinished && (
                <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#13253D] bg-white px-3 py-1 rounded-lg border border-[#E6DDCB]">
                  <Clock className="w-4 h-4 text-[#C79B3A]" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-[#666666] hover:text-[#0D1B2A] hover:bg-[#E6DDCB] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
            
            {!isFinished ? (
              <>
                {/* Stepper Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#666666] font-medium">
                    <span>კითხვა {currentQuestionIndex + 1} / {test.questions.length}</span>
                    <span>{Math.round(((currentQuestionIndex + 1) / test.questions.length) * 100)}% შესრულებულია</span>
                  </div>
                  <div className="w-full h-2 bg-[#E6DDCB] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C79B3A] transition-all duration-300" 
                      style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Card */}
                <div className="bg-white p-6 rounded-xl border border-[#E6DDCB] shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#13253D] text-[#FAF8F3] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {currentQuestionIndex + 1}
                    </span>
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-[#0D1B2A] leading-relaxed">
                      {currentQ.prompt}
                    </h2>
                  </div>

                  {currentQ.sourceContext && (
                    <div className="p-4 bg-[#F5F2EA] rounded-lg border-l-3 border-[#C79B3A] text-xs font-serif italic text-[#666666]">
                      {currentQ.sourceContext}
                    </div>
                  )}

                  {/* Options list */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((optionText, optIdx) => {
                      const isSelected = currentSelected === optIdx;
                      const isCorrect = optIdx === currentQ.correctAnswerIndex;

                      let btnStyle = "bg-[#FAF8F3] border-[#E6DDCB] text-[#1B1B1B] hover:border-[#C79B3A]";

                      if (showExplanation) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-50 border-rose-400 text-rose-900 font-semibold";
                        } else {
                          btnStyle = "bg-[#FAF8F3]/50 border-[#E6DDCB] text-[#8A8A8A] opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-[#13253D] border-[#13253D] text-[#FAF8F3] font-medium shadow-sm";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          disabled={showExplanation}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                              isSelected && !showExplanation 
                                ? 'border-[#C79B3A] text-[#C79B3A]' 
                                : 'border-[#666666]/30 text-[#666666]'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-sm sm:text-base">{optionText}</span>
                          </div>

                          {showExplanation && (
                            <div>
                              {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                              {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Immediate Explanation Card */}
                {showExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-xl border bg-[#F5F2EA] border-[#C79B3A] space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[#C79B3A] font-semibold text-xs uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4 text-[#C79B3A]" /> განმარტება & ისტორიული კონტექსტი
                    </div>
                    <p className="text-sm text-[#0D1B2A] leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  </motion.div>
                )}

              </>
            ) : (
              /* Finish Score Screen */
              <div className="py-6 text-center space-y-8 animate-in zoom-in-95 duration-300">
                <div className="inline-flex p-4 rounded-full bg-[#C79B3A]/15 text-[#C79B3A] border border-[#C79B3A]/30">
                  <Award className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif font-bold text-3xl text-[#0D1B2A]">
                    ტესტი დასრულებულია!
                  </h2>
                  <p className="text-sm text-[#666666]">
                    თქვენი შედეგი {test.title}-ში
                  </p>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-white p-6 rounded-2xl border border-[#E6DDCB] shadow-sm">
                  <div className="space-y-1 border-r border-[#E6DDCB] pr-2">
                    <div className="text-2xl font-serif font-bold text-[#13253D]">
                      {correctCount} / {test.questions.length}
                    </div>
                    <div className="text-[11px] text-[#666666] uppercase tracking-wider font-medium">სწორი პასუხი</div>
                  </div>

                  <div className="space-y-1 border-r border-[#E6DDCB] px-2">
                    <div className="text-2xl font-serif font-bold text-[#C79B3A]">
                      {scorePct}%
                    </div>
                    <div className="text-[11px] text-[#666666] uppercase tracking-wider font-medium">სიზუსტე</div>
                  </div>

                  <div className="space-y-1 pl-2">
                    <div className="text-2xl font-serif font-bold text-[#0D1B2A]">
                      {scorePct >= 80 ? 'მაღალი' : scorePct >= 50 ? 'საშუალო' : 'საჭიროებს ვარჯიშს'}
                    </div>
                    <div className="text-[11px] text-[#666666] uppercase tracking-wider font-medium">შეფასება</div>
                  </div>
                </div>

                {/* Feedback Message */}
                <div className="p-4 bg-[#F5F2EA] rounded-xl text-sm text-[#13253D] max-w-md mx-auto border border-[#E6DDCB]">
                  {scorePct >= 80 
                    ? 'ბრწყინვალე შედეგია! თქვენ კარგად ფლობთ ამ ისტორიულ თემატიკას.' 
                    : 'კარგი მცდელობაა! გირჩევთ გადახედოთ შესაბამის ვიდეოლექციას და სტატიას ცოდნის გასაღრმავებლად.'}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <button
                    onClick={restartTest}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#C79B3A] text-[#13253D] hover:bg-[#C79B3A]/10 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#C79B3A]" /> ხელახლა ცდა
                  </button>

                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C79B3A] text-[#0D1B2A] hover:bg-[#D4AF37] font-semibold text-sm shadow-md transition-colors cursor-pointer"
                  >
                    <span>ტესტების სიაში დაბრუნება</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Footer Controls */}
          {!isFinished && (
            <div className="px-6 py-4 bg-[#F5F2EA] border-t border-[#E6DDCB] flex items-center justify-between">
              <span className="text-xs text-[#666666]">
                აირჩიეთ სწორი პასუხი და დააჭირეთ დადასტურებას
              </span>

              <div className="flex items-center gap-3">
                {!showExplanation ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={currentSelected === -1}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      currentSelected !== -1 
                        ? 'bg-[#13253D] text-[#FAF8F3] hover:bg-[#0D1B2A] shadow-sm' 
                        : 'bg-[#E6DDCB] text-[#8A8A8A] cursor-not-allowed'
                    }`}
                  >
                    პასუხის დადასტურება
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg bg-[#C79B3A] text-[#0D1B2A] hover:bg-[#D4AF37] text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <span>{isLastQuestion ? 'შედეგების ნახვა' : 'შემდეგი კითხვა'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
