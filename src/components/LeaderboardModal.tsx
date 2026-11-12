import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Star,
  Flame,
  X,
  Crown,
  Shield,
  Users,
  Bot,
  Globe,
  Sparkles,
  Gamepad2,
  TrendingUp,
  Award
} from 'lucide-react';
import { HighScoreRecord, GameItem } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highScores: HighScoreRecord;
  games: GameItem[];
  playerName: string;
  playerAvatar: string;
}

type LeaderboardMode = 'all' | 'online' | 'ai' | 'arcade';

interface PlayerRankItem {
  id: string;
  name: string;
  avatar: string;
  title: string;
  score: number;
  onlineWins: number;
  aiWins: number;
  winRate: string;
  isCurrentPlayer?: boolean;
  badge?: string;
}

// Community players mock data base
const BASE_COMMUNITY_PLAYERS: Omit<PlayerRankItem, 'isCurrentPlayer'>[] = [
  {
    id: 'p1',
    name: 'Nguyễn Vũ Long',
    avatar: '👑',
    title: 'Kỳ Vương Sài Gòn',
    score: 8450,
    onlineWins: 142,
    aiWins: 89,
    winRate: '88%',
    badge: 'Đại Cao Thủ'
  },
  {
    id: 'p2',
    name: 'Trần Anh Khoa',
    avatar: '⚡',
    title: 'Thần Rắn Neon',
    score: 7890,
    onlineWins: 118,
    aiWins: 76,
    winRate: '84%',
    badge: 'Kỳ Nghệ Đỉnh Cao'
  },
  {
    id: 'p3',
    name: 'Lê Hoàng Phúc',
    avatar: '🐉',
    title: 'Bá Chủ Đập Gạch',
    score: 7120,
    onlineWins: 98,
    aiWins: 65,
    winRate: '81%',
    badge: 'Chiến Thần'
  },
  {
    id: 'p4',
    name: 'Phạm Minh Đức',
    avatar: '🥷',
    title: 'Sát Thủ Ca-rô',
    score: 6850,
    onlineWins: 89,
    aiWins: 54,
    winRate: '79%',
    badge: 'Bạch Kim I'
  },
  {
    id: 'p5',
    name: 'Đặng Thu Trang',
    avatar: '🦊',
    title: 'Phù Thủy 2048',
    score: 5940,
    onlineWins: 72,
    aiWins: 48,
    winRate: '76%',
    badge: 'Kim Cương III'
  },
  {
    id: 'p6',
    name: 'Hoàng Gia Bảo',
    avatar: '🚀',
    title: 'Hạm Trưởng Vũ Trụ',
    score: 5320,
    onlineWins: 61,
    aiWins: 42,
    winRate: '73%',
    badge: 'Vàng I'
  },
  {
    id: 'p7',
    name: 'Vũ Hải Đăng',
    avatar: '🐯',
    title: 'Đại Sư Cờ Tướng',
    score: 4890,
    onlineWins: 55,
    aiWins: 38,
    winRate: '71%',
    badge: 'Vàng II'
  },
  {
    id: 'p8',
    name: 'Bùi Quốc Huy',
    avatar: '🎯',
    title: 'Xạ Thủ Không Gian',
    score: 4210,
    onlineWins: 43,
    aiWins: 31,
    winRate: '68%',
    badge: 'Bạc I'
  }
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highScores,
  games,
  playerName,
  playerAvatar
}) => {
  const [selectedMode, setSelectedMode] = useState<LeaderboardMode>('all');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Calculate current player's overall score
  const currentPlayerTotalScore = Object.values(highScores).reduce(
    (acc, curr) => acc + (curr || 0),
    0
  );

  // Approximate online & AI wins based on games
  const caroScore = highScores.caro || 0;
  const cotuongScore = highScores.cotuong || 0;
  const onlineWinsEstimate = Math.max(0, Math.floor((caroScore + cotuongScore) / 40));
  const aiWinsEstimate = Math.max(0, Math.floor((caroScore + cotuongScore) / 25));

  let rankTitle = 'Tân Thủ Dân Chơi';
  let rankBadge = 'Đồng I';
  let rankColor = 'text-amber-500';

  if (currentPlayerTotalScore > 5000) {
    rankTitle = 'Huyền Thoại Bất Bại';
    rankBadge = 'Thách Đấu';
    rankColor = 'text-rose-400';
  } else if (currentPlayerTotalScore > 2500) {
    rankTitle = 'Cao Thủ Đỉnh Cao';
    rankBadge = 'Kim Cương';
    rankColor = 'text-cyan-400';
  } else if (currentPlayerTotalScore > 1000) {
    rankTitle = 'Dân Chơi Kỳ Cựu';
    rankBadge = 'Bạch Kim';
    rankColor = 'text-emerald-400';
  } else if (currentPlayerTotalScore > 300) {
    rankTitle = 'Kỳ Thủ Tiềm Năng';
    rankBadge = 'Vàng III';
    rankColor = 'text-amber-300';
  }

  // Create current player's record
  const currentPlayerItem: PlayerRankItem = {
    id: 'current_user',
    name: playerName || 'Dân Chơi (Bạn)',
    avatar: playerAvatar || '🥷',
    title: rankTitle,
    score: currentPlayerTotalScore,
    onlineWins: onlineWinsEstimate,
    aiWins: aiWinsEstimate,
    winRate: onlineWinsEstimate > 0 ? '75%' : '0%',
    isCurrentPlayer: true,
    badge: rankBadge
  };

  // Build full leaderboard list merged with current player
  let allPlayers: PlayerRankItem[] = [...BASE_COMMUNITY_PLAYERS, currentPlayerItem];

  // Sort players based on current mode
  allPlayers.sort((a, b) => {
    if (selectedMode === 'online') {
      return b.onlineWins - a.onlineWins || b.score - a.score;
    }
    if (selectedMode === 'ai') {
      return b.aiWins - a.aiWins || b.score - a.score;
    }
    return b.score - a.score;
  });

  // Find player's standing
  const currentPlayerRank = allPlayers.findIndex(p => p.isCurrentPlayer) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Bảng Xếp Hạng Kỷ Lục Toàn Server
                </h2>
                <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>
              <p className="text-xs text-slate-400">
                Thành tích của tất cả người chơi ở các chế độ: Online, Đấu Máy & Arcade
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

        {/* Current Player Status Highlight Card */}
        <div className="my-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/40 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-2xl border-2 border-cyan-400/40 shadow-md">
                {playerAvatar || '🥷'}
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black uppercase">
                BẠN
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base">
                  {playerName || 'Dân Chơi'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  {rankBadge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-semibold ${rankColor}`}>{rankTitle}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">Hạng #{currentPlayerRank}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Điểm của bạn:</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono tabular-nums">
              {currentPlayerTotalScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs (Các Chế Độ Chơi) */}
        <div className="mb-3 flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedMode('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMode === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🌟 Tất Cả Chế Độ</span>
          </button>

          <button
            onClick={() => setSelectedMode('online')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMode === 'online'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 Đấu Online Bạn Bè</span>
          </button>

          <button
            onClick={() => setSelectedMode('ai')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMode === 'ai'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>🤖 Đấu Máy AI</span>
          </button>

          <button
            onClick={() => setSelectedMode('arcade')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMode === 'arcade'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🚀 Kỷ Lục Arcade</span>
          </button>
        </div>

        {/* Players List Table */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1 no-scrollbar">
          {allPlayers.map((player, idx) => {
            const rank = idx + 1;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;
            const isCurrent = !!player.isCurrentPlayer;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                    : isTop1
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className="w-7 text-center font-black text-xs font-mono">
                    {isTop1 ? (
                      <span className="text-lg">🥇</span>
                    ) : isTop2 ? (
                      <span className="text-lg">🥈</span>
                    ) : isTop3 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-slate-400">#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-slate-700 shadow-sm">
                    {player.avatar}
                  </div>

                  {/* Name & Title */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-bold ${isCurrent ? 'text-cyan-300' : 'text-white'}`}>
                        {player.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-black">
                          BẠN
                        </span>
                      )}
                      {player.badge && (
                        <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {player.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{player.title}</span>
                  </div>
                </div>

                {/* Right: Scores & Stats by Mode */}
                <div className="text-right flex items-center gap-3 sm:gap-4 font-mono">
                  {selectedMode === 'online' && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">
                        {player.onlineWins} trận thắng
                      </span>
                      <span className="text-[10px] text-slate-400">Tỉ lệ: {player.winRate}</span>
                    </div>
                  )}

                  {selectedMode === 'ai' && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-400 block">
                        {player.aiWins} ván thắng AI
                      </span>
                      <span className="text-[10px] text-slate-400">Cấp độ Khó</span>
                    </div>
                  )}

                  {selectedMode === 'arcade' && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-400 block">
                        {player.score.toLocaleString()} điểm
                      </span>
                      <span className="text-[10px] text-slate-400">Điểm Arcade cao</span>
                    </div>
                  )}

                  {selectedMode === 'all' && (
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-amber-300 block tabular-nums">
                        {player.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Tổng điểm</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notice */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-cyan-300">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Điểm tự động cập nhật khi bạn chiến thắng hoặc phá kỷ lục</span>
          </span>
          <span className="hidden sm:inline text-slate-500">Khu Xếp Hạng Toàn Quốc</span>
        </div>
      </div>
    </div>
  );
};
