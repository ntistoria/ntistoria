import React, { useState, useEffect } from 'react';
import {
  HelpCircle, ArrowRight, ArrowLeft, Trophy, CheckCircle2, RotateCcw,
  Share2, Copy, Check, Sparkles, Award, User, Clock, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { QuizItem, QuizQuestionItem, QuizAnswerItem, QuizAttempt } from '../types';
import {
  fetchPublishedQuizzes, fetchQuizQuestionsForPlay, submitQuizAttempt,
  getQuizResultFeedback, getQuizImageUrl
} from '../lib/quizService';
import { QuizLeaderboardModal } from '../components/QuizLeaderboardModal';

interface QuizzesViewProps {
  user?: { name: string; email: string } | null;
  onOpenAuth?: () => void;
  initialQuizId?: string | null;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({ user, onOpenAuth, initialQuizId }) => {
  // Master View States: 'list' | 'play' | 'result'
  const [viewState, setViewState] = useState<'list' | 'play' | 'result'>('list');

  // Quizzes list state
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Play session state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Selected answers map: question_id -> answer_id
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Guest name modal state
  const [isGuestNameModalOpen, setIsGuestNameModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestNameError, setGuestNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [attemptResult, setAttemptResult] = useState<{
    correct_answers: number;
    total_questions: number;
    percentage: number;
  } | null>(null);

  // Leaderboard modal state
  const [leaderboardQuiz, setLeaderboardQuiz] = useState<{ id: string; title: string } | null>(null);

  // Share feedback state
  const [copiedLink, setCopiedLink] = useState(false);

  // Load published quizzes
  const loadQuizzes = async () => {
    setLoadingList(true);
    try {
      const data = await fetchPublishedQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Error loading quizzes:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Handle direct link with initialQuizId
  useEffect(() => {
    if (initialQuizId && quizzes.length > 0) {
      const target = quizzes.find(q => q.id === initialQuizId);
      if (target) {
        handleStartQuiz(target);
      }
    }
  }, [initialQuizId, quizzes]);

  // Start playing a quiz
  const handleStartQuiz = async (quiz: QuizItem) => {
    setLoadingQuiz(true);
    setActiveQuiz(quiz);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setAttemptResult(null);
    setViewState('play');

    try {
      const quizData = await fetchQuizQuestionsForPlay(quiz.id);
      if (quizData && quizData.questions.length > 0) {
        setQuestions(quizData.questions);
      } else {
        alert('ამ ქვიზში კითხვები ჯერ არ არის დამატებული');
        setViewState('list');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      alert('ქვიზის ჩატვირთვა ვერ მოხერხდა');
      setViewState('list');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Select answer for current question
  const handleSelectOption = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Handle Finish Quiz (Last Question)
  const handleFinishAttempt = () => {
    // If user is not logged in, prompt for guest name
    if (!user || !user.name) {
      setGuestName('');
      setGuestNameError('');
      setIsGuestNameModalOpen(true);
    } else {
      // User is logged in, submit directly
      submitQuiz(user.name);
    }
  };

  // Submit quiz attempt to backend
  const submitQuiz = async (displayName: string) => {
    if (!activeQuiz) return;
    setIsSubmitting(true);

    try {
      // Format answers array
      const userAnswersList = Object.entries(selectedAnswers).map(([question_id, answer_id]) => ({
        question_id,
        answer_id
      }));

      const res = await submitQuizAttempt(
        activeQuiz.id,
        user?.email ? null : null, // keep guest/user clean
        displayName,
        userAnswersList
      );

      setAttemptResult({
        correct_answers: res.correct_answers,
        total_questions: res.total_questions,
        percentage: res.percentage
      });

      setIsGuestNameModalOpen(false);
      setViewState('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      alert('შედეგის შენახვისას დაფიქსირდა შეცდომა');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Guest Name Form
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setGuestNameError('გთხოვთ შეიყვანოთ სახელი');
      return;
    }
    submitQuiz(guestName.trim());
  };

  // Share Results Function (Requirement 5)
  const handleShareResult = async () => {
    if (!attemptResult || !activeQuiz) return;
    const shareText = `მე NT ისტორიის პლატფორმაზე ქვიზში „${activeQuiz.title}“ ${attemptResult.correct_answers}/${attemptResult.total_questions} (${attemptResult.percentage}%) შედეგი მივიღე! სცადე შენც.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeQuiz.title,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.warn('Share API cancelled or not supported, falling back:', err);
      }
    }

    // Fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      alert(shareText);
    }
  };

  // Share on Facebook fallback
  const handleFacebookShare = () => {
    const shareUrl = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isCurrentAnswered = currentQuestion ? !!selectedAnswers[currentQuestion.id] : false;

  return (
    <div className="max-w-[1180px] mx-auto min-h-[75vh] py-8 sm:py-12 px-4 sm:px-6">

      {/* ========================================================= */}
      {/* 1. QUIZ LISTING VIEW */}
      {/* ========================================================= */}
      {viewState === 'list' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* Header Banner */}
          <div className="relative bg-[#0D1B2A] text-white rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl border-4 border-[#C79B3A]/30">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 bg-[radial-gradient(#C79B3A_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            <div className="max-w-2xl space-y-4 relative z-10">
              <span className="px-3.5 py-1.5 bg-[#C79B3A] text-[#0D1B2A] text-[11px] font-bold uppercase tracking-[0.25em] rounded-full inline-flex items-center gap-2 shadow">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>ინტერაქტიული ქვიზები</span>
              </span>

              <h1 className="font-serif font-bold text-3xl sm:text-5xl text-[#FAF8F3] leading-tight">
                შეამოწმე შენი ცოდნა ისტორიაში
              </h1>

              <p className="text-sm sm:text-base text-[#FAF8F3]/80 leading-relaxed font-normal">
                გაიარე საინტერესო ქვიზები საქართველოსა და მსოფლიო ისტორიაში, დააგროვე ქულები და დაიკავე პირველი ადგილი ლიდერბორდზე!
              </p>
            </div>
          </div>

          {/* Quizzes List Cards Grid */}
          {loadingList ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-gray-100 rounded-3xl animate-pulse border border-[#E6DDCB]" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-[#FAF8F3] rounded-3xl border border-[#E6DDCB] p-8">
              <HelpCircle className="w-12 h-12 text-[#C79B3A] mx-auto" />
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">ქვიზები მალე დაემატება</h3>
              <p className="text-sm text-[#666666] max-w-md mx-auto">
                ამ ეტაპზე ახალი ქვიზები მზადდება. მოგვიანებით გვეწვიეთ!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {quizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="group bg-white rounded-3xl border border-[#E6DDCB] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                >
                  {/* Card Cover */}
                  <div className="relative h-48 bg-[#0D1B2A] overflow-hidden">
                    {quiz.cover_image_path ? (
                      <img
                        src={getQuizImageUrl(quiz.cover_image_path, 'quiz-covers')}
                        alt={quiz.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#1A2E40] text-[#C79B3A]">
                        <HelpCircle className="w-12 h-12 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/80 via-transparent to-transparent pointer-events-none" />

                    {/* Question Count Pill */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#0D1B2A]/90 backdrop-blur-sm text-[#FAF8F3] text-xs font-bold rounded-xl border border-[#C79B3A]/40 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#C79B3A]" />
                      <span>{quiz.question_count || 5} კითხვა</span>
                    </div>

                    {/* Leaderboard Trigger Button on Card */}
                    <button
                      onClick={() => setLeaderboardQuiz({ id: quiz.id, title: quiz.title })}
                      className="absolute top-3 right-3 p-2.5 bg-[#0D1B2A]/80 hover:bg-[#0D1B2A] text-[#C79B3A] rounded-xl backdrop-blur-sm border border-[#C79B3A]/30 transition-all cursor-pointer shadow hover:scale-105"
                      title="ლიდერბორდის ნახვა"
                    >
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-serif font-bold text-xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors line-clamp-2">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-xs text-[#666666] leading-relaxed line-clamp-3">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-[#E6DDCB] flex items-center gap-2">
                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="flex-1 py-3 bg-[#0D1B2A] hover:bg-[#1A2E40] text-[#FAF8F3] text-xs uppercase tracking-wider font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer group-hover:bg-[#C79B3A] group-hover:text-[#0D1B2A]"
                      >
                        <span>დაიწყე ქვიზი</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setLeaderboardQuiz({ id: quiz.id, title: quiz.title })}
                        className="px-3.5 py-3 bg-[#FAF8F3] hover:bg-[#F3EEDF] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        title="ლიდერბორდი"
                      >
                        <Trophy className="w-4 h-4 text-[#C79B3A]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. QUIZ PLAY VIEW (1 Question per Screen) */}
      {/* ========================================================= */}
      {viewState === 'play' && activeQuiz && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* Top Bar Navigation & Exit */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewState('list')}
              className="px-4 py-2 bg-white hover:bg-[#FAF8F3] text-[#0D1B2A] border border-[#E6DDCB] text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-[#C79B3A]" />
              <span>ქვიზებიდან გამოსვლა</span>
            </button>

            <span className="text-xs font-bold text-[#666666] font-mono">
              {activeQuiz.title}
            </span>
          </div>

          {loadingQuiz ? (
            <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-[#E6DDCB] shadow-lg">
              <div className="w-10 h-10 border-4 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#0D1B2A]">კითხვები იტვირთება...</p>
            </div>
          ) : currentQuestion ? (
            <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
              
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0D1B2A]">
                  <span className="px-3 py-1 bg-[#FAF8F3] border border-[#E6DDCB] rounded-full text-[#C79B3A]">
                    კითხვა {currentIndex + 1} / {totalQuestions}
                  </span>
                  <span className="font-mono text-[#666666]">
                    {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#FAF8F3] border border-[#E6DDCB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C79B3A] to-[#E6C86B] transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A] leading-snug">
                  {currentQuestion.question_text}
                </h2>

                {/* Optional Question Image */}
                {currentQuestion.image_path && (
                  <div className="rounded-2xl overflow-hidden border border-[#E6DDCB] max-h-72 bg-[#0D1B2A]">
                    <img
                      src={getQuizImageUrl(currentQuestion.image_path, 'quiz-question-images')}
                      alt="კითხვის ილუსტრაცია"
                      className="w-full h-full object-cover max-h-72"
                    />
                  </div>
                )}
              </div>

              {/* Answer Choices Options List */}
              <div className="space-y-3 pt-2">
                {currentQuestion.answers.map((answer, aIdx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === answer.id;
                  const optionLetters = ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ'];

                  return (
                    <button
                      key={answer.id || aIdx}
                      onClick={() => handleSelectOption(currentQuestion.id, answer.id)}
                      className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0D1B2A] border-[#C79B3A] text-white shadow-lg scale-[1.01]'
                          : 'bg-[#FAF8F3]/60 hover:bg-[#FAF8F3] border-[#E6DDCB] text-[#0D1B2A] hover:border-[#C79B3A]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#C79B3A] text-[#0D1B2A] border-[#C79B3A]'
                              : 'bg-white text-[#0D1B2A] border-[#E6DDCB]'
                          }`}
                        >
                          {optionLetters[aIdx] || aIdx + 1}
                        </span>
                        <span className="text-sm font-medium leading-relaxed">
                          {answer.answer_text}
                        </span>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[#C79B3A] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Footer (Previous / Next / Finish) */}
              <div className="pt-6 border-t border-[#E6DDCB] flex items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-5 py-3 bg-[#FAF8F3] hover:bg-[#F3EEDF] text-[#0D1B2A] text-xs font-bold rounded-xl border border-[#E6DDCB] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#C79B3A]" />
                  <span>წინა კითხვა</span>
                </button>

                {isLastQuestion ? (
                  <button
                    onClick={handleFinishAttempt}
                    disabled={!isCurrentAnswered}
                    className="px-7 py-3 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                  >
                    <span>დასრულება</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                    disabled={!isCurrentAnswered}
                    className="px-6 py-3 bg-[#0D1B2A] hover:bg-[#1A2E40] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                  >
                    <span>შემდეგი</span>
                    <ArrowRight className="w-4 h-4 text-[#C79B3A]" />
                  </button>
                )}
              </div>

            </div>
          ) : null}

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. GUEST NAME MODAL (Requirement 7) */}
      {/* ========================================================= */}
      {isGuestNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B2A]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#C79B3A] overflow-hidden p-6 sm:p-8 space-y-6">
            
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-[#FAF8F3] border border-[#E6DDCB] rounded-2xl mx-auto flex items-center justify-center text-[#C79B3A]">
                <User className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                შეიყვანე შენი სახელი
              </h3>
              <p className="text-xs text-[#666666]">
                შეიყვანე სახელი და გვარი ლიდერბორდში შედეგის ჩასაწერად:
              </p>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-4">
              {guestNameError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center">
                  {guestNameError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                  შენი სახელი ლიდერბორდისთვის *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="მაგ: გიორგი ბერიძე"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full p-3.5 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] text-sm text-[#0D1B2A] font-bold focus:outline-none focus:border-[#C79B3A]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>შედეგები ინახება...</span>
                ) : (
                  <>
                    <span>შედეგის ნახვა</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. QUIZ RESULT VIEW (Requirements 3, 4, 5) */}
      {/* ========================================================= */}
      {viewState === 'result' && attemptResult && activeQuiz && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
          
          {(() => {
            const feedback = getQuizResultFeedback(attemptResult.percentage);

            return (
              <div className="bg-white rounded-3xl border-2 border-[#C79B3A] shadow-2xl p-6 sm:p-10 space-y-8 text-center relative overflow-hidden">
                
                {/* Result Top Badge */}
                <div className="space-y-3">
                  <span className="px-4 py-1.5 bg-[#FAF8F3] border border-[#C79B3A] text-[#C79B3A] text-xs font-bold uppercase tracking-wider rounded-full inline-block">
                    {feedback.badge}
                  </span>

                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
                    {feedback.title}
                  </h2>
                </div>

                {/* Score Gauge Circle */}
                <div className="relative w-44 h-44 mx-auto rounded-full bg-gradient-to-br from-[#0D1B2A] to-[#1A2E40] text-white flex flex-col items-center justify-center shadow-xl border-4 border-[#C79B3A]">
                  <span className="font-serif font-bold text-4xl sm:text-5xl text-[#C79B3A]">
                    {attemptResult.correct_answers} / {attemptResult.total_questions}
                  </span>
                  <span className="text-xs font-mono text-[#FAF8F3]/80 mt-1">
                    {attemptResult.percentage}% სწორი პასუხი
                  </span>
                </div>

                {/* Dynamic Herodotus History Comment */}
                <div className="p-6 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-2">
                  <p className="font-serif font-bold text-base sm:text-lg text-[#0D1B2A] leading-relaxed italic">
                    {feedback.comment}
                  </p>
                </div>

                {/* Share Result Section (Requirement 5) */}
                <div className="pt-4 border-t border-[#E6DDCB] space-y-3">
                  <span className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
                    გააზიარე შენი შედეგი
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleShareResult}
                      className="px-5 py-3 bg-[#0D1B2A] hover:bg-[#1A2E40] text-white text-xs font-bold rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-[#C79B3A]" />
                      <span>{copiedLink ? 'დაკოპირდა!' : 'გაზიარება (Share)'}</span>
                    </button>

                    <button
                      onClick={handleFacebookShare}
                      className="px-4 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons (Try Again / Leaderboard / Exit) */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleStartQuiz(activeQuiz)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#FAF8F3] hover:bg-[#F3EEDF] text-[#0D1B2A] text-xs font-bold rounded-xl border border-[#E6DDCB] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#C79B3A]" />
                    <span>თავიდან ცდა</span>
                  </button>

                  <button
                    onClick={() => setLeaderboardQuiz({ id: activeQuiz.id, title: activeQuiz.title })}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>ლიდერბორდის ნახვა</span>
                  </button>

                  <button
                    onClick={() => setViewState('list')}
                    className="w-full sm:w-auto px-5 py-3.5 text-xs font-bold text-[#666666] hover:text-[#0D1B2A] cursor-pointer"
                  >
                    მთავარ გვერდზე დაბრუნება
                  </button>
                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* ========================================================= */}
      {/* LEADERBOARD MODAL */}
      {/* ========================================================= */}
      {leaderboardQuiz && (
        <QuizLeaderboardModal
          isOpen={!!leaderboardQuiz}
          onClose={() => setLeaderboardQuiz(null)}
          quizId={leaderboardQuiz.id}
          quizTitle={leaderboardQuiz.title}
        />
      )}

    </div>
  );
};
