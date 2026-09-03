import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, Filter, Image, HelpCircle, CheckCircle2,
  FileText, ArrowUp, ArrowDown, Eye, X, Upload, Save, AlertTriangle, Check, Radio
} from 'lucide-react';
import { QuizItem, QuizQuestionItem, QuizAnswerItem } from '../types';
import {
  fetchAllQuizzesAdmin, saveQuizAdmin, deleteQuizAdmin,
  fetchQuizQuestionsAdmin, saveQuestionAdmin, deleteQuestionAdmin,
  uploadQuizImage, getQuizImageUrl
} from '../lib/quizService';

export const AdminQuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Quiz Modal state
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<QuizItem> | null>(null);
  const [quizCoverFile, setQuizCoverFile] = useState<File | null>(null);
  const [quizCoverPreview, setQuizCoverPreview] = useState<string>('');
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Question Management state (When editing questions for a selected quiz)
  const [managingQuiz, setManagingQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Question Modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuizQuestionItem> | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<{ id?: string; answer_text: string; is_correct: boolean; answer_order: number }[]>([]);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Deletion confirm state
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await fetchAllQuizzesAdmin();
      setQuizzes(data);
    } catch (e) {
      console.error('Error loading admin quizzes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Load questions for managing quiz
  const loadQuestions = async (quizId: string) => {
    setLoadingQuestions(true);
    try {
      const data = await fetchQuizQuestionsAdmin(quizId);
      setQuestions(data);
    } catch (e) {
      console.error('Error loading questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Open Quiz Create/Edit Modal
  const handleOpenQuizModal = (quiz?: QuizItem) => {
    setQuizError(null);
    setQuizCoverFile(null);
    if (quiz) {
      setEditingQuiz({ ...quiz });
      setQuizCoverPreview(quiz.cover_image_path ? getQuizImageUrl(quiz.cover_image_path, 'quiz-covers') : '');
    } else {
      setEditingQuiz({
        title: '',
        description: '',
        status: 'draft',
        is_active: true
      });
      setQuizCoverPreview('');
    }
    setIsQuizModalOpen(true);
  };

  // Cover image file change
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuizCoverFile(file);
      setQuizCoverPreview(URL.createObjectURL(file));
    }
  };

  // Save Quiz
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz?.title?.trim()) {
      setQuizError('გთხოვთ შეიყვანოთ ქვიზის სათაური');
      return;
    }

    setIsSavingQuiz(true);
    setQuizError(null);
    try {
      let imagePath = editingQuiz.cover_image_path || null;
      if (quizCoverFile) {
        imagePath = await uploadQuizImage(quizCoverFile, 'quiz-covers');
      }

      await saveQuizAdmin({
        ...editingQuiz,
        cover_image_path: imagePath
      });

      setIsQuizModalOpen(false);
      loadQuizzes();
    } catch (err: any) {
      setQuizError(err.message || 'ქვიზის შენახვისას დაფიქსირდა შეცდომა');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async () => {
    if (!deletingQuizId) return;
    try {
      await deleteQuizAdmin(deletingQuizId);
      setQuizzes(prev => prev.filter(q => q.id !== deletingQuizId));
      if (managingQuiz?.id === deletingQuizId) {
        setManagingQuiz(null);
      }
      setDeletingQuizId(null);
    } catch (err: any) {
      alert(err.message || 'წაშლისას დაფიქსირდა შეცდომა');
    }
  };

  // Start managing questions for a quiz
  const handleManageQuestions = (quiz: QuizItem) => {
    setManagingQuiz(quiz);
    loadQuestions(quiz.id);
  };

  // Open Question Create/Edit Modal
  const handleOpenQuestionModal = (question?: QuizQuestionItem) => {
    setQuestionError(null);
    setQuestionImageFile(null);

    if (question) {
      setEditingQuestion({ ...question });
      setQuestionImagePreview(question.image_path ? getQuizImageUrl(question.image_path, 'quiz-question-images') : '');
      setQuestionAnswers(question.answers.map(a => ({
        id: a.id,
        answer_text: a.answer_text,
        is_correct: !!a.is_correct,
        answer_order: a.answer_order
      })));
    } else {
      setEditingQuestion({
        question_text: '',
        question_order: questions.length + 1
      });
      setQuestionImagePreview('');
      setQuestionAnswers([
        { answer_text: '', is_correct: true, answer_order: 1 },
        { answer_text: '', is_correct: false, answer_order: 2 },
        { answer_text: '', is_correct: false, answer_order: 3 },
        { answer_text: '', is_correct: false, answer_order: 4 }
      ]);
    }
    setIsQuestionModalOpen(true);
  };

  // Question Image File change
  const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuestionImageFile(file);
      setQuestionImagePreview(URL.createObjectURL(file));
    }
  };

  // Add answer choice
  const handleAddAnswerChoice = () => {
    setQuestionAnswers(prev => [
      ...prev,
      { answer_text: '', is_correct: false, answer_order: prev.length + 1 }
    ]);
  };

  // Remove answer choice
  const handleRemoveAnswerChoice = (index: number) => {
    if (questionAnswers.length <= 4) {
      alert('კითხვას უნდა ჰქონდეს მინიმუმ 4 პასუხი');
      return;
    }
    const updated = questionAnswers.filter((_, idx) => idx !== index);
    // If we removed the correct answer, set first one as correct
    if (!updated.some(a => a.is_correct) && updated.length > 0) {
      updated[0].is_correct = true;
    }
    setQuestionAnswers(updated);
  };

  // Select correct answer choice (Radio)
  const handleSetCorrectAnswer = (index: number) => {
    setQuestionAnswers(prev => prev.map((ans, idx) => ({
      ...ans,
      is_correct: idx === index
    })));
  };

  // Save Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingQuiz) return;

    if (!editingQuestion?.question_text?.trim()) {
      setQuestionError('გთხოვთ შეიყვანოთ კითხვის ტექსტი');
      return;
    }

    if (questionAnswers.some(a => !a.answer_text.trim())) {
      setQuestionError('ყველა პასუხის ვარიანტს უნდა ჰქონდეს ტექსტი');
      return;
    }

    setIsSavingQuestion(true);
    setQuestionError(null);

    try {
      let imagePath = editingQuestion.image_path || null;
      if (questionImageFile) {
        imagePath = await uploadQuizImage(questionImageFile, 'quiz-question-images');
      }

      await saveQuestionAdmin(
        managingQuiz.id,
        {
          ...editingQuestion,
          image_path: imagePath
        },
        questionAnswers
      );

      setIsQuestionModalOpen(false);
      loadQuestions(managingQuiz.id);
      loadQuizzes();
    } catch (err: any) {
      setQuestionError(err.message || 'კითხვის შენახვისას დაფიქსირდა შეცდომა');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async () => {
    if (!deletingQuestionId || !managingQuiz) return;
    try {
      await deleteQuestionAdmin(deletingQuestionId);
      setQuestions(prev => prev.filter(q => q.id !== deletingQuestionId));
      setDeletingQuestionId(null);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'კითხვის წაშლისას დაფიქსირდა შეცდომა');
    }
  };

  // Reorder Question Up/Down
  const handleReorderQuestion = async (question: QuizQuestionItem, direction: 'up' | 'down') => {
    if (!managingQuiz) return;
    const currIdx = questions.findIndex(q => q.id === question.id);
    if (currIdx < 0) return;

    const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const otherQuestion = questions[targetIdx];

    try {
      await saveQuestionAdmin(
        managingQuiz.id,
        { ...question, question_order: targetIdx + 1 },
        question.answers as any
      );
      await saveQuestionAdmin(
        managingQuiz.id,
        { ...otherQuestion, question_order: currIdx + 1 },
        otherQuestion.answers as any
      );
      loadQuestions(managingQuiz.id);
    } catch (err) {
      console.error('Error reordering questions:', err);
    }
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (q.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Quizzes Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6DDCB] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] text-[#C79B3A] flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-[#0D1B2A]">ქვიზების მართვა</h2>
            <p className="text-xs text-[#666666]">სულ: {quizzes.length} ქვიზი</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenQuizModal()}
          className="px-5 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ახალი ქვიზი</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="ძებნა სათაურით ან აღწერით..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#666666]" />
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="py-2.5 px-3 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A] cursor-pointer"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="published">გამოქვეყნებული</option>
            <option value="draft">დრაფტი (Draft)</option>
          </select>
        </div>
      </div>

      {/* Main Quizzes List Table / Cards */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-[#E6DDCB]">
          <div className="w-8 h-8 border-3 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#666666]">ქვიზები იტვირთება...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-[#E6DDCB]">
          <HelpCircle className="w-10 h-10 text-[#C79B3A]/40 mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#0D1B2A]">ქვიზები ვერ მოიძებნა</h3>
          <p className="text-xs text-[#666666]">დაამატეთ ახალი ქვიზი „ახალი ქვიზი“ ღილაკზე დაჭერით.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-sm hover:shadow-md ${
                managingQuiz?.id === quiz.id ? 'border-[#C79B3A] ring-2 ring-[#C79B3A]/20' : 'border-[#E6DDCB]'
              }`}
            >
              {/* Card Cover Image */}
              <div className="relative h-40 bg-[#0D1B2A] overflow-hidden">
                {quiz.cover_image_path ? (
                  <img
                    src={getQuizImageUrl(quiz.cover_image_path, 'quiz-covers')}
                    alt={quiz.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#1A2E40]">
                    <HelpCircle className="w-12 h-12 text-[#C79B3A]/40" />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow ${
                      quiz.status === 'published'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {quiz.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}
                  </span>
                </div>

                {/* Questions count pill */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#0D1B2A]/80 backdrop-blur-sm text-[#FAF8F3] text-[11px] font-bold rounded-lg border border-white/10">
                  {quiz.question_count || 0} კითხვა
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#0D1B2A] line-clamp-2">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[#E6DDCB] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleManageQuestions(quiz)}
                    className="px-3.5 py-2 bg-[#0D1B2A] hover:bg-[#1A2E40] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>კითხვები ({quiz.question_count || 0})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenQuizModal(quiz)}
                      className="p-2 text-[#0D1B2A] hover:bg-[#FAF8F3] rounded-lg transition-colors cursor-pointer"
                      title="რედაქტირება"
                    >
                      <Edit2 className="w-4 h-4 text-[#C79B3A]" />
                    </button>

                    <button
                      onClick={() => setDeletingQuizId(quiz.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* QUESTION MANAGEMENT PANEL FOR SELECTED QUIZ */}
      {/* ========================================================= */}
      {managingQuiz && (
        <div className="mt-8 bg-white rounded-3xl border-2 border-[#C79B3A] p-6 sm:p-8 space-y-6 shadow-lg animate-in slide-in-from-top-4 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DDCB]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C79B3A]">
                კითხვების მართვა
              </span>
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                {managingQuiz.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenQuestionModal()}
                className="px-4 py-2 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>კითხვის დამატება</span>
              </button>

              <button
                onClick={() => setManagingQuiz(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                title="დახურვა"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Questions List */}
          {loadingQuestions ? (
            <div className="py-12 text-center text-xs text-[#666666]">
              კითხვები იტვირთება...
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] p-6 space-y-2">
              <HelpCircle className="w-8 h-8 text-[#C79B3A] mx-auto" />
              <p className="font-serif font-bold text-sm text-[#0D1B2A]">ამ ქვიზს ჯერ არ აქვს კითხვები</p>
              <p className="text-xs text-[#666666]">დააჭირეთ „კითხვის დამატება“ ღილაკს ახალი კითხვის შესაქმნელად.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-[#FAF8F3]/60 p-4 sm:p-5 rounded-2xl border border-[#E6DDCB] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-[#0D1B2A] text-[#C79B3A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>

                    <div className="space-y-2 min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">
                        {q.question_text}
                      </h4>

                      {q.image_path && (
                        <div className="w-20 h-14 rounded-lg overflow-hidden border border-[#E6DDCB]">
                          <img
                            src={getQuizImageUrl(q.image_path, 'quiz-question-images')}
                            alt="კითხვის ფოტო"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Answer Choices List preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.answers.map((ans, aIdx) => (
                          <div
                            key={ans.id || aIdx}
                            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-2 ${
                              ans.is_correct
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                : 'bg-white border-[#E6DDCB] text-[#666666]'
                            }`}
                          >
                            {ans.is_correct ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            )}
                            <span className="truncate">{ans.answer_text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Reorder */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6DDCB]">
                      <button
                        onClick={() => handleReorderQuestion(q, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-600 hover:text-[#0D1B2A] disabled:opacity-30 cursor-pointer"
                        title="ზემოთ გადაადგილება"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReorderQuestion(q, 'down')}
                        disabled={idx === questions.length - 1}
                        className="p-1.5 text-gray-600 hover:text-[#0D1B2A] disabled:opacity-30 cursor-pointer"
                        title="ქვემოთ გადაადგილება"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenQuestionModal(q)}
                      className="p-2.5 bg-white hover:bg-[#FAF8F3] border border-[#E6DDCB] text-[#0D1B2A] rounded-xl transition-colors cursor-pointer"
                      title="რედაქტირება"
                    >
                      <Edit2 className="w-4 h-4 text-[#C79B3A]" />
                    </button>

                    <button
                      onClick={() => setDeletingQuestionId(q.id)}
                      className="p-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* QUIZ CREATE / EDIT MODAL */}
      {/* ========================================================= */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B2A]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E6DDCB] overflow-hidden">
            
            <div className="bg-[#0D1B2A] text-white p-6 flex items-center justify-between">
              <h3 className="font-serif font-bold text-xl text-[#FAF8F3]">
                {editingQuiz?.id ? 'ქვიზის რედაქტირება' : 'ახალი ქვიზის შექმნა'}
              </h3>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="p-2 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {quizError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{quizError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                  ქვიზის სათაური *
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: დიდგორის ბრძოლა და დავით აღმაშენებელი"
                  value={editingQuiz?.title || ''}
                  onChange={e => setEditingQuiz(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 bg-white rounded-xl border border-[#E6DDCB] text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                  მოკლე აღწერა
                </label>
                <textarea
                  rows={3}
                  placeholder="ქვიზის მოკლე შინაარსი..."
                  value={editingQuiz?.description || ''}
                  onChange={e => setEditingQuiz(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                  მთავარი ფოტო (Cover Image)
                </label>
                <div className="flex items-center gap-4">
                  {quizCoverPreview ? (
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#E6DDCB] shrink-0">
                      <img src={quizCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setQuizCoverFile(null);
                          setQuizCoverPreview('');
                          setEditingQuiz(prev => ({ ...prev, cover_image_path: null }));
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded-xl bg-[#FAF8F3] border border-dashed border-[#C79B3A]/50 flex items-center justify-center shrink-0 text-[#C79B3A]">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex-1 px-4 py-3 bg-[#FAF8F3] hover:bg-[#F3EEDF] border border-[#E6DDCB] text-xs font-bold text-[#0D1B2A] rounded-xl cursor-pointer transition-colors text-center flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-[#C79B3A]" />
                    <span>ატვირთე სურათი</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                    სტატუსი
                  </label>
                  <select
                    value={editingQuiz?.status || 'draft'}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-3 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A] cursor-pointer"
                  >
                    <option value="draft">დრაფტი (Draft)</option>
                    <option value="published">გამოქვეყნებული (Published)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                    აქტიურობა
                  </label>
                  <select
                    value={editingQuiz?.is_active ? 'true' : 'false'}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    className="w-full p-3 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A] cursor-pointer"
                  >
                    <option value="true">აქტიური</option>
                    <option value="false">არააქტიური</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DDCB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  გაუქმება
                </button>

                <button
                  type="submit"
                  disabled={isSavingQuiz}
                  className="px-6 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingQuiz ? 'ინახება...' : 'შენახვა'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUESTION CREATE / EDIT MODAL */}
      {/* ========================================================= */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B2A]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E6DDCB] overflow-hidden">
            
            <div className="bg-[#0D1B2A] text-white p-6 flex items-center justify-between">
              <h3 className="font-serif font-bold text-xl text-[#FAF8F3]">
                {editingQuestion?.id ? 'კითხვის რედაქტირება' : 'ახალი კითხვის დამატება'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-2 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {questionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{questionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                  კითხვის ტექსტი *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="მაგ: რომელ წელს მოხდა დიდგორის ბრძოლა?"
                  value={editingQuestion?.question_text || ''}
                  onChange={e => setEditingQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full p-3 bg-white rounded-xl border border-[#E6DDCB] text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider mb-1">
                  კითხვის ფოტო (არასავალდებულო)
                </label>
                <div className="flex items-center gap-4">
                  {questionImagePreview ? (
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-[#E6DDCB] shrink-0">
                      <img src={questionImagePreview} alt="Question Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionImageFile(null);
                          setQuestionImagePreview('');
                          setEditingQuestion(prev => ({ ...prev, image_path: null }));
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded-xl bg-[#FAF8F3] border border-dashed border-[#C79B3A]/50 flex items-center justify-center shrink-0 text-[#C79B3A]">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex-1 px-4 py-3 bg-[#FAF8F3] hover:bg-[#F3EEDF] border border-[#E6DDCB] text-xs font-bold text-[#0D1B2A] rounded-xl cursor-pointer transition-colors text-center flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-[#C79B3A]" />
                    <span>ატვირთე სურათი</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleQuestionImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Answers Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0D1B2A] uppercase tracking-wider">
                    პასუხების ვარიანტები (მინიმუმ 4) *
                  </label>
                  <span className="text-[11px] text-[#666666]">მონიშნეთ 1 სწორი პასუხი</span>
                </div>

                <div className="space-y-2.5">
                  {questionAnswers.map((ans, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        ans.is_correct
                          ? 'bg-emerald-50/70 border-emerald-400'
                          : 'bg-white border-[#E6DDCB]'
                      }`}
                    >
                      {/* Radio button for Correct Answer Selection */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectAnswer(idx)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                          ans.is_correct
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300 bg-white hover:border-[#C79B3A]'
                        }`}
                        title="მონიშნეთ სწორ პასუხად"
                      >
                        {ans.is_correct && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Answer Text Input */}
                      <input
                        type="text"
                        required
                        placeholder={`პასუხი #${idx + 1}`}
                        value={ans.answer_text}
                        onChange={e => {
                          const val = e.target.value;
                          setQuestionAnswers(prev => prev.map((a, i) => i === idx ? { ...a, answer_text: val } : a));
                        }}
                        className="flex-1 p-2 bg-transparent text-xs text-[#0D1B2A] focus:outline-none"
                      />

                      {/* Remove Answer choice button if > 4 choices */}
                      {questionAnswers.length > 4 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAnswerChoice(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer"
                          title="წაშლა"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddAnswerChoice}
                  className="mt-2 w-full py-2.5 border border-dashed border-[#C79B3A] text-[#0D1B2A] text-xs font-bold rounded-xl hover:bg-[#FAF8F3] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#C79B3A]" />
                  <span>დამატებითი პასუხის ვარიანტი (+1)</span>
                </button>
              </div>

              <div className="pt-4 border-t border-[#E6DDCB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  გაუქმება
                </button>

                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="px-6 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingQuestion ? 'ინახება...' : 'შენახვა'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODALS */}
      {deletingQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-[#E6DDCB] shadow-xl">
            <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">ქვიზის წაშლა</h4>
            <p className="text-xs text-[#666666]">
              ნამდვილად გსურთ ქვიზის წაშლა? წაიშლება მასთან დაკავშირებული ყველა კითხვა და შედეგი!
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingQuizId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                onClick={handleDeleteQuiz}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 cursor-pointer"
              >
                წაშლა
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-[#E6DDCB] shadow-xl">
            <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">კითხვის წაშლა</h4>
            <p className="text-xs text-[#666666]">
              ნამდვილად გსურთ ამ კითხვის წაშლა?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingQuestionId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                onClick={handleDeleteQuestion}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 cursor-pointer"
              >
                წაშლა
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
