import React, { useState } from 'react';
import { User, Sparkles, Dices, Check, X, ShieldCheck, Swords } from 'lucide-react';
import { sound } from '../audio/soundEffects';

interface PlayerNameModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (name: string, avatar: string) => void;
  initialName?: string;
  initialAvatar?: string;
  canDismiss?: boolean;
  isInvited?: boolean;
  invitedGameTitle?: string;
  invitedRoomId?: string;
}

const AVATAR_OPTIONS = ['🥷', '👾', '🚀', '👑', '🐉', '⚡', '🦊', '🐯', '🐼', '🎯', '🔥', '💎'];

const RANDOM_NAMES = [
  'Chiến Hữu 88',
  'Dân Chơi Neon',
  'Kỳ Thủ Sài Gòn',
  'Chiến Binh Không Gian',
  'Sát Thủ Ca Rô',
  'Vua Cờ Tướng',
  'Thần Rắn Săn Mồi',
  'Bá Chủ Đập Gạch',
  'Phù Thủy 2048',
  'Kỳ Vương Hà Nội',
  'Chiến Thần Neon',
  'Cao Thủ Ẩn Danh'
];

export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialAvatar = '🥷',
  canDismiss = false,
  isInvited = false,
  invitedGameTitle = '',
  invitedRoomId = ''
}) => {
  // If invited and no name yet, provide a quick default name so user can join in 1 click
  const defaultInvitedName = isInvited && !initialName
    ? `Chiến Hữu ${Math.floor(100 + Math.random() * 900)}`
    : initialName;

  const [name, setName] = useState(defaultInvitedName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setName(randomName);
    setAvatar(randomAvatar);
    setError('');
    sound.playMove();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên người chơi của bạn!');
      sound.playLaser(300);
      return;
    }
    if (trimmed.length > 20) {
      setError('Tên người chơi tối đa 20 ký tự!');
      return;
    }
    sound.playVictory();
    onSave(trimmed, avatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-500/10 text-white">
        {/* Glow ambient */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-rose-500 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/30 border border-cyan-300/40 transform transition-transform hover:scale-105">
              {avatar}
            </div>
            {isInvited ? (
              <span className="absolute -bottom-1 -right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Swords className="w-3 h-3" />
                ĐỐI ĐẦU
              </span>
            ) : (
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                VIP
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1 flex items-center gap-2">
            <span>
              {isInvited ? 'Bạn Được Mời Thi Đấu!' : 'Chào Mừng Dân Chơi!'}
            </span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mb-3 max-w-xs leading-relaxed">
            {isInvited
              ? `Bạn vừa nhận được lời mời vào bàn đấu ${invitedGameTitle || 'trực tuyến'}! Chỉ cần đặt tên là vào chơi ngay.`
              : 'Hãy chọn biểu tượng và đặt tên người chơi để bước vào thế giới trò chơi đối kháng đỉnh cao.'}
          </p>

          {/* Zero-login reassurance pill */}
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vào chơi trực tiếp • Không cần đăng nhập • Không tạo tài khoản</span>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Avatar picker */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-left">
                Chọn hình đại diện:
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-slate-950/60 border border-slate-800 rounded-2xl">
                {AVATAR_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setAvatar(item);
                      sound.playMove();
                    }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      avatar === item
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 scale-105 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:scale-105'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="w-full text-left">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tên người chơi của bạn:</span>
                </label>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Đổi tên ngẫu nhiên</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Nhập tên người chơi (ví dụ: Chiến Hữu)..."
                  maxLength={20}
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-xl text-white text-sm font-semibold placeholder:text-slate-500 focus:outline-none transition-colors shadow-inner"
                />
              </div>

              {error && (
                <p className="text-rose-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                  <span>⚠️</span> {error}
                </p>
              )}
            </div>

            {/* Confirm button */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isInvited ? '🚀 Vào Bàn Chơi Ngay (Không Cần Đăng Nhập)' : 'Vào Khu Trò Chơi Ngay'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
