import { useState, type FC } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  BookOpen, 
  HelpCircle, 
  Play, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { QuizQuestion } from '../types';

interface IncorrectAnswersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  categoryKey: string;
  categoryTitle: string;
  chapterId: string;
  questions: (QuizQuestion & { chapterId: string })[];
  incorrectQuestionIds: string[];
  correctQuestionIds: string[];
  onGoToTest?: (categoryKey: string, chapterId: string) => void;
}

interface TaskGroupDetails {
  id: string;
  itemNumber: number;
  title: string;
  image?: string;
  sourceContext?: string;
  questions: (QuizQuestion & { chapterId: string })[];
  hasError: boolean;
  incorrectCount: number;
}

export const IncorrectAnswersModal: FC<IncorrectAnswersModalProps> = ({
  isOpen,
  onClose,
  chapterTitle,
  categoryKey,
  categoryTitle,
  chapterId,
  questions,
  incorrectQuestionIds,
  correctQuestionIds,
  onGoToTest
}) => {
  if (!isOpen) return null;

  const isMcq = categoryKey === 'mcq';
  const isChronology = categoryKey === 'chronology';
  const isSingleQuestionCategory = isMcq || isChronology;

  const safeQuestions = questions || [];
  const safeIncorrectIds = incorrectQuestionIds || [];
  const safeCorrectIds = correctQuestionIds || [];

  // 1. For MCQ / Chronology / Single Question categories: Filter questions that are incorrect
  const incorrectMcqQuestions = safeQuestions.filter(q => q && safeIncorrectIds.includes(q.id));

  // 2. For Task-based categories (Maps, Analogies, Sources, Illustrations): Group questions into tasks
  const taskGroupMap = new Map<string, (QuizQuestion & { chapterId: string })[]>();

  safeQuestions.forEach((q, idx) => {
    if (!q) return;
    let groupKey = '';
    if (q.parentItemNumber) {
      groupKey = `parent-${q.parentItemNumber}`;
    } else if (categoryKey === 'map' || categoryKey === 'illustrations') {
      groupKey = q.mapImage || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
    } else if (categoryKey === 'source' || categoryKey === 'analogies') {
      groupKey = q.sourceContext?.substring(0, 100) || (q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`);
    } else {
      groupKey = q.itemNumber ? `item-${q.itemNumber}` : `q-${idx}`;
    }
    const existing = taskGroupMap.get(groupKey) || [];
    existing.push(q);
    taskGroupMap.set(groupKey, existing);
  });

  const taskGroups: TaskGroupDetails[] = Array.from(taskGroupMap.entries()).map(([_, qList], index) => {
    const firstQ = qList[0];
    const itemNum = firstQ.parentItemNumber || firstQ.itemNumber || (index + 1);

    let taskTitle = '';
    if (categoryKey === 'map') taskTitle = `რუკა N${itemNum}`;
    else if (categoryKey === 'analogies') taskTitle = `ანალოგია N${itemNum}`;
    else if (categoryKey === 'source') taskTitle = `წყარო N${itemNum}`;
    else if (categoryKey === 'illustrations') taskTitle = `ილუსტრაცია N${itemNum}`;
    else taskTitle = `დავალება N${itemNum}`;

    let incorrectCount = 0;
    qList.forEach(q => {
      if (safeIncorrectIds.includes(q.id)) {
        incorrectCount++;
      }
    });

    const hasError = incorrectCount > 0;

    return {
      id: `task-details-${categoryKey}-${itemNum}-${index}`,
      itemNumber: itemNum,
      title: taskTitle,
      image: firstQ.mapImage,
      sourceContext: firstQ.sourceContext,
      questions: qList,
      hasError,
      incorrectCount
    };
  });

  // Filter task groups that have AT LEAST 1 MISTAKE (incorrectCount > 0)
  const incorrectTaskGroups = taskGroups.filter(tg => tg.incorrectCount > 0);

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'mcq': return <BookOpen className="w-5 h-5 text-[#C79B3A]" />;
      case 'map': return <MapPin className="w-5 h-5 text-[#C79B3A]" />;
      case 'analogies': return <Layers className="w-5 h-5 text-[#C79B3A]" />;
      case 'source': return <FileText className="w-5 h-5 text-[#C79B3A]" />;
      case 'chronology': return <Clock className="w-5 h-5 text-[#C79B3A]" />;
      case 'illustrations': return <ImageIcon className="w-5 h-5 text-[#C79B3A]" />;
      default: return <HelpCircle className="w-5 h-5 text-[#C79B3A]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#0D1B2A]/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[#FAF8F3] rounded-3xl shadow-2xl overflow-hidden z-10 border-2 border-[#C79B3A] max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-[#0D1B2A] text-white border-b border-[#C79B3A]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C79B3A] text-[#0D1B2A] flex items-center justify-center font-bold">
              {getCategoryIcon(categoryKey)}
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#C79B3A] uppercase tracking-wider block">
                {chapterTitle}
              </span>
              <h3 className="font-serif font-bold text-lg text-[#FAF8F3]">
                {categoryTitle} — შეცდომების დეტალები
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#FAF8F3]/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          
          {/* Action Header Banner */}
          <div className="p-4 bg-white rounded-2xl border border-[#E6DDCB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#0D1B2A] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C79B3A]" />
                <span>არასწორად პასუხგაცემული დავალებები</span>
              </span>
              <p className="text-xs text-[#666666]">
                თუ ამ კითხვებს ხელახლა გაივლით და სწორად უპასუხებთ, შეცდომების სიიდან ავტომატურად ამოიშლება!
              </p>
            </div>

            {onGoToTest && (
              <button
                onClick={() => {
                  onClose();
                  onGoToTest(categoryKey, chapterId);
                }}
                className="px-5 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ტესტის დაწყება</span>
              </button>
            )}
          </div>

          {/* LIST OF INCORRECT ITEMS */}

          {/* A. SINGLE QUESTION CATEGORIES (MCQ & CHRONOLOGY) INCORRECT QUESTIONS LIST */}
          {isSingleQuestionCategory && (
            incorrectMcqQuestions.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-[#E6DDCB] p-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">შეცდომები არ არის!</h4>
                <p className="text-xs text-[#666666]">
                  ამ თავში ყველა კითხვას სწორად უპასუხეთ.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incorrectMcqQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-5 bg-white rounded-2xl border-2 border-rose-200 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <h4 className="font-serif font-bold text-base text-[#0D1B2A] leading-snug">
                          {q.prompt}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg shrink-0">
                        არასწორია
                      </span>
                    </div>

                    {/* Options list showing correct answer */}
                    {q.options && q.options.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-[#E6DDCB]">
                        {q.options.map((optText, optIdx) => {
                          const isCorrect = optIdx === q.correctAnswerIndex;
                          const optLabels = ['ა', 'ბ', 'გ', 'დ'];

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-[#FAF8F3] border-[#E6DDCB] text-[#666666] opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {optLabels[optIdx] || optIdx + 1}
                                </span>
                                <span>{optText}</span>
                              </div>

                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                                  სწორი პასუხი
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : q.correctAnswerText ? (
                      <div className="pt-2 border-t border-[#E6DDCB] text-xs font-semibold text-[#0D1B2A]">
                        სწორი პასუხი: <strong className="text-emerald-700">{q.correctAnswerText}</strong>
                      </div>
                    ) : null}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#C79B3A]/30 text-xs text-[#0D1B2A] space-y-1">
                        <span className="font-bold text-[#C79B3A] block text-[10px] uppercase tracking-wider">
                          განმარტება:
                        </span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* B. TASK-BASED INCORRECT GROUPS LIST (MAPS, ANALOGIES, SOURCES, ILLUSTRATIONS) */}
          {!isSingleQuestionCategory && (
            incorrectTaskGroups.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-[#E6DDCB] p-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">შეცდომები არ არის!</h4>
                <p className="text-xs text-[#666666]">
                  ამ თავში ყველა დავალება (ყველა კითხვასთან ერთად) სწორად გაქვთ შესრულებული.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {incorrectTaskGroups.map((tg) => (
                  <div key={tg.id} className="bg-white rounded-2xl border-2 border-rose-200 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
                    
                    {/* Task Title & Status Header */}
                    <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 bg-[#0D1B2A] text-[#C79B3A] text-xs font-mono font-bold rounded-lg">
                          {tg.title}
                        </span>
                        <span className="text-xs font-bold text-[#0D1B2A]">
                          ({tg.questions.length} კითხვა)
                        </span>
                      </div>

                      <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>შეცდომით ({tg.incorrectCount} არასწორი)</span>
                      </span>
                    </div>

                    {/* Optional Source Context */}
                    {tg.sourceContext && (
                      <div className="p-4 bg-[#FAF8F3] rounded-xl border-l-4 border-[#C79B3A] text-xs font-serif italic text-[#0D1B2A] leading-relaxed max-h-36 overflow-y-auto">
                        {tg.sourceContext}
                      </div>
                    )}

                    {/* Optional Image */}
                    {tg.image && (
                      <div className="rounded-xl overflow-hidden border border-[#E6DDCB] bg-[#0D1B2A] max-h-52">
                        <img 
                          src={tg.image} 
                          alt={tg.title} 
                          className="w-full h-full object-contain max-h-52"
                        />
                      </div>
                    )}

                    {/* Sub-questions breakdown for this task */}
                    <div className="space-y-3 pt-2">
                      {tg.questions.map((q, qIdx) => {
                        const isCorrect = safeCorrectIds.includes(q.id);
                        const isIncorrect = safeIncorrectIds.includes(q.id);

                        return (
                          <div 
                            key={q.id || qIdx}
                            className={`p-4 rounded-xl border-2 space-y-2 text-xs ${
                              isIncorrect
                                ? 'bg-rose-50/60 border-rose-300'
                                : isCorrect
                                ? 'bg-emerald-50/60 border-emerald-300'
                                : 'bg-[#FAF8F3] border-[#E6DDCB]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-serif font-bold text-sm text-[#0D1B2A]">
                                {qIdx + 1}. {q.prompt}
                              </span>

                              {isIncorrect ? (
                                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px] shrink-0">
                                  არასწორი
                                </span>
                              ) : isCorrect ? (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] shrink-0">
                                  სწორი
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 font-bold rounded text-[10px] shrink-0">
                                  შეუსრულებელი
                                </span>
                              )}
                            </div>

                            {/* Correct answer display */}
                            {q.questionType === 'open_text' ? (
                              <div className="text-xs font-semibold text-[#0D1B2A]">
                                სწორი პასუხი: <strong className="text-emerald-700">{q.correctAnswerText || '—'}</strong>
                              </div>
                            ) : q.options && q.options.length > 0 ? (
                              <div className="text-xs text-[#0D1B2A]">
                                სწორი ვარიანტი: <strong className="text-emerald-700">{q.options[q.correctAnswerIndex]}</strong>
                              </div>
                            ) : null}

                            {q.explanation && (
                              <div className="text-[11px] text-[#666666] italic pt-1 border-t border-black/5">
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            )
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F5F2EA] border-t border-[#E6DDCB] flex items-center justify-between">
          <span className="text-xs text-[#666666] font-medium">
            სულ ნაპოვნია შეცდომები: {isSingleQuestionCategory ? incorrectMcqQuestions.length : incorrectTaskGroups.length}
          </span>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            დახურვა
          </button>
        </div>

      </div>
    </div>
  );
};
