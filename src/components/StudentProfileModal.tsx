import { type FC } from 'react';
import { ProfileView } from '../views/ProfileView';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string } | null;
  onOpenQuiz?: (quizId: string) => void;
}

export const StudentProfileModal: FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenQuiz
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-[#FAF8F3] border border-[#E6DDCB] shadow-2xl rounded-3xl w-full max-w-5xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-2 bg-[#0D1B2A] text-white flex justify-end px-4">
          <button
            onClick={onClose}
            className="text-xs font-bold hover:text-[#C79B3A] cursor-pointer py-1 px-3"
          >
            ✕ დახურვა
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <ProfileView user={user} onOpenQuiz={onOpenQuiz} />
        </div>
      </div>
    </div>
  );
};
