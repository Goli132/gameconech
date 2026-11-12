import React, { useEffect, useState } from 'react';
import { Swords, Check, X, Clock, ShieldCheck } from 'lucide-react';
import { GameInvitation } from '../multiplayer/lobbyManager';
import { sound } from '../audio/soundEffects';

interface IncomingInviteModalProps {
  invite: GameInvitation | null;
  onAccept: (invite: GameInvitation) => void;
  onDecline: (invite: GameInvitation) => void;
}

export const IncomingInviteModal: React.FC<IncomingInviteModalProps> = ({
  invite,
  onAccept,
  onDecline
}) => {
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!invite) return;

    // Play fanfare / alert sound when invite arrives
    sound.playVictory();
    setTimeLeft(20);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(invite);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [invite]);

  if (!invite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-500/20 text-white text-center overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Icon */}
        <div className="relative mx-auto mb-4 w-20 h-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30 border-2 border-white/30 animate-bounce">
            {invite.fromAvatar || '🥷'}
          </div>
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-rose-500 text-white shadow-md">
            <Swords className="w-4 h-4" />
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
          Lời Thách Đấu Trực Tuyến!
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 mb-4">
          <strong className="text-emerald-400 font-bold">{invite.fromName}</strong> đang mời bạn vào bàn thi đấu:{' '}
          <span className="text-cyan-300 font-bold block text-sm mt-0.5">{invite.gameTitle}</span>
        </p>

        {/* Countdown Timer Bar */}
        <div className="w-full bg-slate-950/80 rounded-full h-2 mb-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(timeLeft / 20) * 100}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-6 px-1">
          <span className="flex items-center gap-1 text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Tự động đóng sau {timeLeft}s</span>
          </span>
          <span className="text-emerald-400 font-semibold">Phòng: {invite.roomId}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              sound.playVictory();
              onAccept(invite);
            }}
            className="w-full sm:flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Chấp Nhận Vào Đấu</span>
          </button>

          <button
            onClick={() => {
              sound.playLaser(300);
              onDecline(invite);
            }}
            className="w-full sm:w-auto py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Từ Chối</span>
          </button>
        </div>
      </div>
    </div>
  );
};
