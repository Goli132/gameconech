import React from 'react';
import { GameType } from '../types';
import { Gamepad2, Plus, HelpCircle, BookOpen, Trophy, User, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeGame: GameType;
  playerName: string;
  playerAvatar: string;
  onOpenHelp: () => void;
  onOpenGuide: () => void;
  onOpenAddGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenChangeName: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  playerName,
  playerAvatar,
  onOpenHelp,
  onOpenGuide,
  onOpenAddGame,
  onOpenLeaderboard,
  onOpenChangeName
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-3 px-3.5 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Brand title & Player */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white block leading-tight">
              Game Cổ Đánh Đỗ Dân Chơi
            </span>
            <span className="text-[11px] text-cyan-400 hidden sm:block">
              Khu Trò Chơi Trực Tuyến Đa Năng
            </span>
          </div>
        </div>

        {/* Player Profile Chip */}
        <button
          onClick={onOpenChangeName}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          title="Bấm để đổi tên hoặc avatar"
        >
          <span className="text-lg leading-none">{playerAvatar || '🥷'}</span>
          <div className="text-left">
            <span className="text-xs font-bold text-white block group-hover:text-cyan-300 transition-colors">
              {playerName || 'Dân Chơi'}
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Đổi tên</span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation & Action Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile profile button */}
        <button
          onClick={onOpenChangeName}
          className="sm:hidden flex items-center gap-1 p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold"
          title="Hồ sơ người chơi"
        >
          <span className="text-base">{playerAvatar || '🥷'}</span>
          <span className="max-w-[70px] truncate text-slate-200">{playerName || 'Dân Chơi'}</span>
        </button>

        {/* Leaderboard button */}
        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Bảng xếp hạng & Kỷ lục"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Bảng</span> Xếp Hạng
        </button>

        {/* Guide button */}
        <button
          onClick={onOpenGuide}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Cách đưa web lên mạng và cập nhật trò chơi"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Cẩm nang Web</span>
        </button>

        {/* Add custom game button */}
        <button
          onClick={onOpenAddGame}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Thêm trò chơi mới vào hệ thống"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Thêm game</span>
        </button>

        {/* Zip Download */}
        <a
          href="/arcade-games-hub.zip"
          download="arcade-games-hub.zip"
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Tải toàn bộ mã nguồn (.zip)"
        >
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Mã Nguồn</span>
        </a>

        <PWAInstallButton />

        <button
          onClick={onOpenHelp}
          className="p-1.5 sm:p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors shrink-0 cursor-pointer"
          title="Hướng dẫn chơi và điều khiển"
          aria-label="Hướng dẫn"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};

