import React from 'react';
import { GameType } from '../types';
import { Gamepad2, Plus, HelpCircle, BookOpen } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
  onOpenHelp: () => void;
  onOpenGuide: () => void;
  onOpenAddGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeGame,
  onSelectGame,
  onOpenHelp,
  onOpenGuide,
  onOpenAddGame
}) => {
  return (
    <header className="flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Brand title */}
      <div
        onClick={() => onSelectGame('space')}
        className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base md:text-lg font-bold tracking-tight text-white block leading-tight">
            Cổng Game Arcade
          </span>
          <span className="text-[11px] text-cyan-400 hidden sm:block">
            Khu trò chơi trực tuyến đa năng
          </span>
        </div>
      </div>

      {/* Zone 2: Fast Action Navigation */}
      <nav className="flex items-center gap-2">
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Cách đưa web lên mạng và cập nhật trò chơi"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cẩm nang</span> Web & Host
        </button>

        <button
          onClick={onOpenAddGame}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm game</span>
        </button>
      </nav>

      {/* Zone 3: Install, Download & Guide Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/arcade-games-hub.zip"
          download="arcade-games-hub.zip"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Tải toàn bộ file mã nguồn dự án (.zip)"
        >
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Tải Mã Nguồn (.zip)</span>
        </a>

        <PWAInstallButton />

        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors shrink-0 cursor-pointer"
          title="Hướng dẫn chơi và điều khiển"
          aria-label="Hướng dẫn"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};

