import { useState, useEffect, type FC, type FormEvent } from 'react';
import { MockExam } from '../types';
import { DEFAULT_PROGRAMS, fetchProgramsAndSubprograms, ProgramChapter } from '../lib/testService';
import {
  fetchAllMockExamsForAdmin,
  generateAndActivateMockExam,
  deactivateMockExam
} from '../lib/mockExamService';
import { MockExamStudentView } from './MockExamStudentView';
import { AdminMockExamAnswerKeyView } from './AdminMockExamAnswerKeyView';
import {
  Clock,
  CheckSquare,
  Square,
  Play,
  StopCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  MapPin,
  Layers,
  FileText,
  History,
  Eye,
  KeyRound
} from 'lucide-react';

function formatCountdown(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return '00:00:00';
  const hrs = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export const AdminMockExamManager: FC = () => {
  const [programs, setPrograms] = useState<ProgramChapter[]>(DEFAULT_PROGRAMS);
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin sub-views for viewing Student Variant or Answer Key
  const [viewingTestExam, setViewingTestExam] = useState<MockExam | null>(null);
  const [viewingAnswerKeyExam, setViewingAnswerKeyExam] = useState<MockExam | null>(null);

  // Generator Form State
  const [title, setTitle] = useState<string>('იმიტირებული გამოცდა #1');
  const [selectedChapters, setSelectedChapters] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  ]);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);

  // Live ticker for remaining time display
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const loadData = async () => {
    setLoading(true);
    try {
      const [progs, allExams] = await Promise.all([
        fetchProgramsAndSubprograms(),
        fetchAllMockExamsForAdmin()
      ]);
      if (progs && progs.length > 0) {
        setPrograms(progs);
      }
      setExams(allExams);

      // Suggest next exam number in title
      const nextNum = allExams.length + 1;
      setTitle(`იმიტირებული გამოცდა #${nextNum}`);
    } catch (err) {
      console.error('Error loading mock exam admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1-second interval for live remaining time
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Find currently active and non-expired exam
  const activeExam = exams.find((ex) => {
    if (!ex.is_active || !ex.end_time) return false;
    return new Date(ex.end_time).getTime() > nowMs;
  });

  // Completed exams: either is_active === false OR end_time <= nowMs
  const completedExams = exams.filter((ex) => {
    if (!ex.is_active) return true;
    if (!ex.end_time) return true;
    return new Date(ex.end_time).getTime() <= nowMs;
  });

  // Auto-mark expired active exams as inactive in DB when their time runs out
  useEffect(() => {
    const expiredStillMarkedActive = exams.filter(
      (ex) => ex.is_active && ex.end_time && new Date(ex.end_time).getTime() <= nowMs
    );
    if (expiredStillMarkedActive.length > 0) {
      expiredStillMarkedActive.forEach((ex) => {
        deactivateMockExam(ex.id).catch(() => {});
      });
      setExams((prev) =>
        prev.map((ex) =>
          ex.is_active && ex.end_time && new Date(ex.end_time).getTime() <= nowMs
            ? { ...ex, is_active: false }
            : ex
        )
      );
    }
  }, [exams, nowMs]);

  const activeRemainingSeconds = activeExam?.end_time
    ? Math.max(0, Math.floor((new Date(activeExam.end_time).getTime() - nowMs) / 1000))
    : 0;

  const toggleChapter = (chapterNum: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterNum)
        ? prev.filter((c) => c !== chapterNum)
        : [...prev, chapterNum].sort((a, b) => a - b)
    );
  };

  const handleSelectAllChapters = () => {
    if (selectedChapters.length === programs.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(programs.map((p) => p.chapterNumber));
    }
  };

  const handleGenerateAndActivate = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedChapters.length === 0) {
      setErrorMsg('გთხოვთ მონიშნოთ მინიმუმ ერთი თავი.');
      return;
    }

    if (!durationMinutes || durationMinutes < 1) {
      setErrorMsg('გთხოვთ მიუთითოთ გამოცდის ხანგრძლივობა წუთებში (მინ. 1 წუთი).');
      return;
    }

    setIsGenerating(true);
    try {
      const created = await generateAndActivateMockExam({
        title,
        selectedChapters,
        durationMinutes: Number(durationMinutes)
      });

      setExams((prev) => [
        created,
        ...prev.map((item) => ({ ...item, is_active: false }))
      ]);
      setSuccessMsg(`„${created.title}“ წარმატებით დაგენერირდა და გააქტიურდა!`);
      setTitle(`იმიტირებული გამოცდა #${exams.length + 2}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'ტესტის გენერაციისას დაფიქსირდა შეცდომა.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopActiveExam = async (examId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsStopping(true);
    try {
      await deactivateMockExam(examId);
      setExams((prev) =>
        prev.map((ex) => (ex.id === examId ? { ...ex, is_active: false } : ex))
      );
      setSuccessMsg('მიმდინარე იმიტირებული გამოცდა დასრულდა და გადავიდა დასრულებულების სიაში.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'ტესტის გაუქმება ვერ მოხერხდა.');
    } finally {
      setIsStopping(false);
    }
  };

  // Sub-view 1: Admin viewing full Student Exam Variant (N1-N38)
  if (viewingTestExam) {
    return (
      <MockExamStudentView
        exam={viewingTestExam}
        isAdminPreview
        onExit={() => {
          setViewingTestExam(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTimeExpired={() => {
          setViewingTestExam(null);
        }}
      />
    );
  }

  // Sub-view 2: Admin viewing Answer Key Sheet (სწორი პასუხები / შესასწორებელი ფურცელი)
  if (viewingAnswerKeyExam) {
    return (
      <AdminMockExamAnswerKeyView
        exam={viewingAnswerKeyExam}
        onBack={() => {
          setViewingAnswerKeyExam(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onViewStudentVariant={() => {
          const target = viewingAnswerKeyExam;
          setViewingAnswerKeyExam(null);
          setViewingTestExam(target);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Status Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. CURRENT ACTIVE MOCK EXAM MANAGEMENT PANEL */}
      <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#0D1B2A] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#C79B3A]" />
            <h3 className="font-serif font-bold text-lg text-[#FAF8F3]">
              მიმდინარე ტესტის მართვის პანელი
            </h3>
          </div>
          <button
            onClick={loadData}
            className="text-xs text-[#C79B3A] hover:underline font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>განახლება</span>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeExam ? (
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#FAF8F3] p-6 rounded-2xl border-2 border-emerald-500/40">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>აქტიურია</span>
                  </span>
                  <span className="px-3 py-1 bg-white border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-full">
                    ხანგრძლივობა: {activeExam.duration_minutes} წთ
                  </span>
                  <span className="px-3 py-1 bg-white border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-full">
                    თავები: {activeExam.selected_chapters.join(', ')}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                  {activeExam.title}
                </h4>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666] font-semibold">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#C79B3A]" />
                    N1-35: {activeExam.questions_payload?.mcqQuestions?.length || 0} კითხვა
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C79B3A]" />
                    N36 რუკა: {activeExam.questions_payload?.mapTask ? '1 დავალება' : 'არ არის'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#C79B3A]" />
                    N37 ანალოგია: {activeExam.questions_payload?.analogyTask ? '1 დავალება' : 'არ არის'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#C79B3A]" />
                    N38 წყარო: {activeExam.questions_payload?.sourceTask ? '1 დავალება' : 'არ არის'}
                  </span>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingTestExam(activeExam);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>ტესტის ნახვა</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingAnswerKeyExam(activeExam);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>სწორი პასუხები</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                <div className="px-5 py-3 bg-[#0D1B2A] text-white rounded-2xl text-center border border-[#C79B3A]/40">
                  <div className="text-[10px] uppercase tracking-widest text-[#C79B3A] font-bold">
                    დარჩენილი დრო
                  </div>
                  <div className="font-mono font-bold text-2xl text-[#FAF8F3]">
                    {formatCountdown(activeRemainingSeconds)}
                  </div>
                </div>

                <button
                  onClick={() => handleStopActiveExam(activeExam.id)}
                  disabled={isStopping}
                  className="px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white text-xs uppercase tracking-wider font-bold rounded-2xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>{isStopping ? 'ითიშება...' : 'ტესტის გაუქმება / დასრულება'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] space-y-2">
              <Clock className="w-8 h-8 text-[#C79B3A] mx-auto opacity-70" />
              <p className="font-serif font-bold text-base text-[#0D1B2A]">
                ამჟამად აქტიური იმიტირებული გამოცდა არ მიმდინარეობს
              </p>
              <p className="text-xs text-[#666666]">
                ქვემოთ მოცემული ფორმიდან შეგიძლიათ აირჩიოთ სასურველი თავები, მიუთითოთ დრო და დააგენერიროთ ახალი ტესტი.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. MOCK EXAM GENERATOR FORM */}
      <form
        onSubmit={handleGenerateAndActivate}
        className="bg-white rounded-3xl border-2 border-[#E6DDCB] shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#E6DDCB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#C79B3A]" />
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
              ახალი იმიტირებული გამოცდის გენერაცია
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#666666]">
            N1–35 (35 კითხვა) • N36 (რუკა) • N37 (ანალოგია) • N38 (წყარო)
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1B2A]">
                გამოცდის დასახელება
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="მაგ. იმიტირებული გამოცდა #1"
                className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-4 py-3 text-sm font-medium text-[#0D1B2A] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1B2A]">
                გამოცდის ხანგრძლივობა (წუთებში)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-4 py-3 text-sm font-bold text-[#0D1B2A] focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#666666]">
                  წუთი
                </span>
              </div>
            </div>
          </div>

          {/* Chapters Multi-Select Checkboxes (1 to 11) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1B2A]">
                აირჩიეთ საგამოცდო თავები ({selectedChapters.length} / {programs.length} მონიშნული)
              </label>
              <button
                type="button"
                onClick={handleSelectAllChapters}
                className="text-xs font-bold text-[#C79B3A] hover:underline cursor-pointer"
              >
                {selectedChapters.length === programs.length ? 'ყველას მოხსნა' : 'ყველას მონიშვნა'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {programs.map((prog) => {
                const isSelected = selectedChapters.includes(prog.chapterNumber);
                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => toggleChapter(prog.chapterNumber)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-[#C79B3A] bg-[#FAF8F3] shadow-xs'
                        : 'border-[#E6DDCB] bg-white hover:border-[#C79B3A]/50 opacity-75'
                    }`}
                  >
                    <div className="mt-0.5 text-[#C79B3A] shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 fill-[#C79B3A]/15" />
                      ) : (
                        <Square className="w-5 h-5 text-[#8A8A8A]" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#0D1B2A] leading-snug">
                        {prog.title}
                      </div>
                      <div className="text-[11px] text-[#666666] line-clamp-1">
                        {prog.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit / Generate Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E6DDCB]">
            <p className="text-xs text-[#666666]">
              ახალი ტესტის გააქტიურებისას წინა აქტიური იმიტირებული გამოცდა ავტომატურად დაარქივდება.
            </p>
            <button
              type="submit"
              disabled={isGenerating || selectedChapters.length === 0}
              className="w-full sm:w-auto px-7 py-4 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-2xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isGenerating
                  ? 'მიმდინარეობს გენერაცია...'
                  : 'ტესტის გენერაცია და გააქტიურება'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* 3. COMPLETED MOCK EXAMS ARCHIVE SECTION („დასრულებული იმიტირებული გამოცდები“) */}
      <div className="bg-white rounded-3xl border-2 border-[#E6DDCB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#E6DDCB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#C79B3A]" />
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
              დასრულებული იმიტირებული გამოცდები ({completedExams.length})
            </h3>
          </div>
          <span className="text-xs text-[#666666] font-medium">
            ტესტის ნახვა და სწორი პასუხების (შესასწორებელი ფურცლის) ბეჭდვა
          </span>
        </div>

        {completedExams.length === 0 ? (
          <div className="p-10 text-center text-[#8A8A8A] space-y-2">
            <History className="w-8 h-8 text-[#C79B3A] mx-auto opacity-60" />
            <p className="font-serif text-sm font-semibold text-[#0D1B2A]">
              დასრულებული იმიტირებული გამოცდები ჯერ არ არის
            </p>
            <p className="text-xs text-[#666666]">
              როდესაც იმიტირებული გამოცდის დრო ამოიწურება ან მას დაასრულებთ, იგი ავტომატურად გამოჩნდება ამ სიაში.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6DDCB]">
            {completedExams.map((ex) => (
              <div
                key={ex.id}
                className="p-5 sm:p-6 hover:bg-[#FAF8F3]/60 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Left Info: Title, Date/Time, Selected Chapters, Status */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">
                      {ex.title}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 text-[11px] font-bold rounded-full">
                      დასრულებული
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666] font-medium">
                    <span>
                      ჩატარების თარიღი: <strong>{new Date(ex.created_at).toLocaleString('ka-GE')}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      არჩეული თავები: <strong>[{ex.selected_chapters.join(', ')}]</strong>
                    </span>
                    <span>•</span>
                    <span>ხანგრძლივობა: {ex.duration_minutes} წთ</span>
                  </div>
                </div>

                {/* Right Actions: View Test Variant & View Answer Key */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingTestExam(ex);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 lg:flex-initial px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#C79B3A]" />
                    <span>ტესტის ნახვა</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewingAnswerKeyExam(ex);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 lg:flex-initial px-4 py-2.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#C79B3A] group-hover:text-[#0D1B2A]" />
                    <span>სწორი პასუხები (შესასწორებელი ფურცელი)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
