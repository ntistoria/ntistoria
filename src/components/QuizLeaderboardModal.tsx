import { useEffect, useState, type FC } from 'react';
import { Trophy, X, Medal, Calendar, User, Award, RefreshCw } from 'lucide-react';
import { QuizLeaderboardItem } from '../types';
import { fetchQuizLeaderboard } from '../lib/quizService';

interface QuizLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
}

export const QuizLeaderboardModal: FC<QuizLeaderboardModalProps> = ({
  isOpen,
  onClose,
  quizId,
  quizTitle
}) => {
  const [items, setItems] = useState<QuizLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await fetchQuizLeaderboard(quizId);
      setItems(data);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, quizId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B2A]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E6DDCB] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="relative bg-[#0D1B2A] text-white p-6 sm:p-8 overflow-hidden shrink-0">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#C79B3A]/10 blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="დახურვა"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C79B3A] text-[#0D1B2A] flex items-center justify-center shadow-lg shrink-0">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="px-3 py-0.5 bg-[#C79B3A]/20 text-[#C79B3A] text-[10px] font-bold uppercase tracking-wider rounded-full inline-block mb-1">
                ლიდერბორდი
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#FAF8F3] line-clamp-1">
                {quizTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#666666] pb-2 border-b border-[#E6DDCB]">
            <span>რეიტინგი ეფუძნება საუკეთესო შედეგს</span>
            <button
              onClick={loadData}
              className="flex items-center gap-1 text-[#C79B3A] hover:underline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>განახლება</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#666666]">ლიდერბორდის ჩატვირთვა...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB] p-6">
              <Award className="w-10 h-10 text-[#C79B3A]/60 mx-auto" />
              <h3 className="font-serif font-bold text-base text-[#0D1B2A]">შედეგები ჯერ არ არის</h3>
              <p className="text-xs text-[#666666]">იყავი პირველი, ვინც გაივლის ამ ქვიზს და დაიკავებს პირველ ადგილს!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;

                return (
                  <div
                    key={item.id || idx}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isTop1
                        ? 'bg-gradient-to-r from-[#FAF8F3] to-[#FFF9EA] border-[#C79B3A] shadow-sm'
                        : isTop2
                        ? 'bg-[#FAF8F3]/60 border-[#D1D5DB]'
                        : isTop3
                        ? 'bg-[#FAF8F3]/40 border-[#E5E7EB]'
                        : 'bg-white border-[#E6DDCB]/60 hover:bg-[#FAF8F3]/30'
                    }`}
                  >
                    {/* Left Rank & Participant */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="shrink-0 flex items-center justify-center">
                        {isTop1 ? (
                          <div className="w-8 h-8 rounded-full bg-[#C79B3A] text-[#0D1B2A] flex items-center justify-center font-bold shadow">
                            👑
                          </div>
                        ) : isTop2 ? (
                          <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-bold">
                            🥈
                          </div>
                        ) : isTop3 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-700/80 text-amber-100 flex items-center justify-center font-bold">
                            🥉
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FAF8F3] border border-[#E6DDCB] text-xs font-bold text-[#666666] flex items-center justify-center">
                            #{rank}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#0D1B2A] truncate">
                          {item.guest_name || 'ანონიმი სტუმარი'}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#666666]">
                          <Calendar className="w-3 h-3 text-[#C79B3A]" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString('ka-GE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Score Badges */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-bold text-[#0D1B2A]">
                          {item.correct_answers} / {item.total_questions}
                        </span>
                        <span className="block text-[10px] text-[#666666]">ქულა</span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          item.percentage >= 90
                            ? 'bg-[#C79B3A] text-[#0D1B2A]'
                            : item.percentage >= 70
                            ? 'bg-[#0D1B2A] text-white'
                            : item.percentage >= 40
                            ? 'bg-[#FAF8F3] text-[#0D1B2A] border border-[#C79B3A]'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF8F3] border-t border-[#E6DDCB] text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0D1B2A] hover:bg-[#1A2E40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            დახურვა
          </button>
        </div>

      </div>
    </div>
  );
};
