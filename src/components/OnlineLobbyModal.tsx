import React, { useState, useEffect } from 'react';
import {
  Users,
  Swords,
  Globe,
  Share2,
  Copy,
  Check,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  Radio,
  UserCheck
} from 'lucide-react';
import { OnlineUser, lobbyManager } from '../multiplayer/lobbyManager';
import { sound } from '../audio/soundEffects';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  currentRoomId: string;
  inviteUrl: string;
  myUserName: string;
  myUserAvatar: string;
  onInviteAccepted: (roomId: string, gameId: string, opponentName: string) => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  currentRoomId,
  inviteUrl,
  myUserName,
  myUserAvatar,
  onInviteAccepted
}) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingTimeout, setPendingTimeout] = useState<number>(20);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Subscribe to live online presence
  useEffect(() => {
    if (!isOpen) {
      setPendingUserId(null);
      setStatusMessage(null);
      return;
    }

    lobbyManager.onUsersUpdated((users) => {
      setOnlineUsers(users);
    });

    // Listen for responses to sent invites
    lobbyManager.onInviteResponse((res) => {
      if (res.accepted) {
        setStatusMessage(`🎉 ${res.responderName} đã CHẤP NHẬN lời mời! Đang kết nối...`);
        sound.playVictory();
        setTimeout(() => {
          onClose();
          onInviteAccepted(res.roomId, res.game, res.responderName);
        }, 1000);
      } else {
        setStatusMessage(`❌ ${res.responderName} đã từ chối lời mời.`);
        sound.playLaser(300);
        setPendingUserId(null);
        setTimeout(() => setStatusMessage(null), 3500);
      }
    });
  }, [isOpen, onInviteAccepted, onClose]);

  // Countdown timer when waiting for opponent
  useEffect(() => {
    if (!pendingUserId) return;

    setPendingTimeout(20);
    const timer = setInterval(() => {
      setPendingTimeout((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPendingUserId(null);
          setStatusMessage('⏳ Lời mời đã hết hạn (đối thủ không phản hồi kịp).');
          setTimeout(() => setStatusMessage(null), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingUserId]);

  if (!isOpen) return null;

  const handleSendInvite = (user: OnlineUser) => {
    setPendingUserId(user.id);
    setStatusMessage(`Đã gửi lời mời đến ${user.name}. Đang đợi phản hồi...`);
    sound.playClick();

    lobbyManager.sendDirectInvite(
      user,
      gameId,
      gameTitle,
      currentRoomId
    );
  };

  const handleCancelInvite = () => {
    setPendingUserId(null);
    setStatusMessage(null);
    sound.playLaser(300);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      sound.playClick();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Mời Cờ Thủ Đang Online</span>
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-400">
                Bấm "Mời Đấu" để gửi lời mời trực tiếp. Đối phương chấp nhận sẽ tự động cùng vào phòng!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="my-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
              {myUserAvatar || '🥷'}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{myUserName || 'Dân Chơi'}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Đang trực tuyến trên website</span>
              </span>
            </div>
          </div>

          <div className="text-right text-[11px]">
            <span className="text-slate-400 block">Trò chơi:</span>
            <span className="text-cyan-300 font-bold">{gameTitle}</span>
          </div>
        </div>

        {/* Toast / Status feedback message */}
        {statusMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center justify-between animate-in fade-in duration-150">
            <span>{statusMessage}</span>
            {pendingUserId && (
              <button
                onClick={handleCancelInvite}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
              >
                Hủy mời
              </button>
            )}
          </div>
        )}

        {/* Online Players List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1 no-scrollbar">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-1 font-semibold">
            <span>DANH SÁCH NGƯỜI CHƠI TRỰC TUYẾN ({onlineUsers.length})</span>
            <span className="text-emerald-400">Tự động cập nhật 🟢</span>
          </div>

          {onlineUsers.map((user) => {
            const isPending = pendingUserId === user.id;

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  user.isReal
                    ? 'bg-slate-900 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-slate-700">
                      {user.avatar}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white">{user.name}</span>
                      {user.isReal && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                          🟢 Đang Online
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {user.status === 'in_game' ? '⚔️ Đang trong trận' : '🟢 Sẵn sàng thi đấu'}
                    </span>
                  </div>
                </div>

                {/* Right: Invite Button */}
                <div>
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Đợi ({pendingTimeout}s)...</span>
                      </button>
                      <button
                        onClick={handleCancelInvite}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                        title="Hủy lời mời"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendInvite(user)}
                      disabled={!!pendingUserId}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Mời Đấu</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {onlineUsers.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Đang quét tìm người chơi trực tuyến trên hệ thống...
            </div>
          )}
        </div>

        {/* Fallback Section: Share link if opponent is not yet on the website */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hoặc gửi link cho bạn chưa vào web:</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">Phòng: {currentRoomId}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
