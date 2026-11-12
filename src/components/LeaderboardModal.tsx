import React from 'react';
import { Trophy, Medal, Star, Flame, X, Crown, Shield } from 'lucide-react';
import { HighScoreRecord, GameItem } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highScores: HighScoreRecord;
  games: GameItem[];
  playerName: string;
  playerAvatar: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highScores,
  games,
  playerName,
  playerAvatar
}) => {
  if (!isOpen) return null;

  // Calculate total score & rank title
  const totalScore = Object.values(highScores).reduce((acc, curr) => acc + (curr || 0), 0);

  let rankTitle = 'Tân Thủ Dân Chơi';
  let rankBadge = 'Đồng I';
  let rankColor = 'text-amber-600';

  if (totalScore > 5000) {
    rankTitle = 'Huyền Thoại Bất Bại';
    rankBadge = 'Thách Đấu';
    rankColor = 'text-rose-400';
  } else if (totalScore > 2500) {
    rankTitle = 'Cao Thủ Đỉnh Cao';
    rankBadge = 'Kim Cương';
    rankColor = 'text-cyan-400';
  } else if (totalScore > 1000) {
    rankTitle = 'Dân Chơi Kỳ Cựu';
    rankBadge = 'Bạch Kim';
    rankColor = 'text-emerald-400';
  } else if (totalScore > 300) {
    rankTitle = 'Kỳ Thủ Tiềm Năng';
    rankBadge = 'Vàng III';
    rankColor = 'text-amber-300';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>Bảng Xếp Hạng & Kỷ Lục</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">Vinh danh thành tích cao nhất của bạn</p>
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

        {/* Player Profile Summary */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-slate-950/80 to-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-2xl border border-cyan-400/30 shadow-md">
              {playerAvatar || '🥷'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{playerName || 'Dân Chơi'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-semibold">
                  {rankBadge}
                </span>
              </div>
              <span className={`text-xs font-semibold ${rankColor}`}>{rankTitle}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Tổng điểm tích luỹ:</span>
            <span className="text-lg font-black text-amber-400 font-mono tabular-nums">
              {totalScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Game scores list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 no-scrollbar">
          {games.map((g, idx) => {
            const score = highScores[g.id] || 0;
            return (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{g.title}</h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      Thể loại: {g.category === 'action' ? 'Bắn súng' : g.category === 'puzzle' ? 'Trí tuệ' : 'Cổ điển'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  {score > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold text-xs">
                      {score.toLocaleString()} điểm
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Chưa có điểm</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Chơi nhiều game hơn để nâng cấp bậc vinh danh của bạn!</span>
          </p>
        </div>
      </div>
    </div>
  );
};
