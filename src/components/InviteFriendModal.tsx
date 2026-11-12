import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users, Sparkles, MessageSquare } from 'lucide-react';
import { roomManager } from '../multiplayer/roomManager';

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  inviteUrl: string;
  roomId: string;
  isConnected: boolean;
  onSendChat?: (text: string) => void;
}

export const InviteFriendModal: React.FC<InviteFriendModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  inviteUrl,
  roomId,
  isConnected,
  onSendChat
}) => {
  const [copied, setCopied] = useState(false);
  const [chatSent, setChatSent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Thách đấu ${gameTitle} cùng mình!`,
          text: `Vào đây đánh ${gameTitle} đối kháng trực tiếp cùng mình ngay trên web nhé!`,
          url: inviteUrl
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const quickMessages = [
    'Chào bạn nhé! 👋',
    'Nước cờ hay quá! 👏',
    'Cẩn thận coi chừng thua nha! 😎',
    'Chiếu tướng! ⚔️',
    'Cho mình xin đi lại nước vừa rồi! 🙏',
    'Làm ván nữa phục thù không? 🔥'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Mời Bạn Bè Đấu {gameTitle}
            </h3>
            <p className="text-xs text-slate-400">
              Gửi link để bạn bè mở ra chơi đối kháng trực tiếp tức thì
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className={isConnected ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
              {isConnected ? '✓ Bạn bè đã vào phòng, sẵn sàng đấu!' : 'Đang chờ bạn bè bấm vào link...'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
            Phòng: {roomId.replace(/^(caro|cotuong)_/, '#')}
          </span>
        </div>

        {/* Invite Link Box */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            ĐƯỜNG LINK THAM GIA PHÒNG
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm shadow-cyan-500/20"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            onClick={handleShare}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Gửi qua Zalo / SMS</span>
          </button>

          <a
            href={`https://zalo.me/share?url=${encodeURIComponent(inviteUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>💬 Chia sẻ Zalo</span>
          </a>
        </div>

        {/* Quick in-game chat emotes */}
        {isConnected && onSendChat && (
          <div className="pt-3 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              Gửi biểu cảm nhanh tới đối thủ
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {quickMessages.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSendChat(text);
                    setChatSent(text);
                    setTimeout(() => setChatSent(null), 1500);
                  }}
                  className="px-2.5 py-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 rounded-lg text-left truncate transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
            {chatSent && (
              <span className="text-[11px] text-emerald-400 block mt-1.5 animate-pulse">
                Đã gửi: "{chatSent}"
              </span>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          {isConnected ? 'Bắt Đầu Trận Đấu' : 'Đóng (Vẫn chờ kết nối)'}
        </button>
      </div>
    </div>
  );
};
