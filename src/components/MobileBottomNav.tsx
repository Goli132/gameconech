import React from 'react';
import { GameType } from '../types';
import { Gamepad2, Play, Grid, BookOpen, Download } from 'lucide-react';

interface MobileBottomNavProps {
  activeGame: GameType;
  viewMode: 'play' | 'catalog';
  onSelectGame: (game: GameType) => void;
  onSetViewMode: (mode: 'play' | 'catalog') => void;
  onOpenGuide: () => void;
  onOpenAddGame: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeGame,
  viewMode,
  onSelectGame,
  onSetViewMode,
  onOpenGuide
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 pb-safe md:hidden shadow-2xl">
      <div className="grid grid-cols-4 items-center h-14 px-2 max-w-md mx-auto">
        {/* Tab 1: Đang chơi */}
        <button
          onClick={() => onSetViewMode('play')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            viewMode === 'play' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="text-[10px] tracking-tight mt-0.5">Đang Chơi</span>
        </button>

        {/* Tab 2: Cờ Dân Gian */}
        <button
          onClick={() => {
            onSelectGame(activeGame === 'cotuong' ? 'caro' : 'cotuong');
            onSetViewMode('play');
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeGame === 'cotuong' || activeGame === 'caro' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base leading-none">帥/❌</span>
          <span className="text-[10px] tracking-tight mt-0.5">Cờ Dân Gian</span>
        </button>

        {/* Tab 3: Thư viện game */}
        <button
          onClick={() => onSetViewMode('catalog')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            viewMode === 'catalog' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Thư Viện</span>
        </button>

        {/* Tab 4: Cẩm nang & Cài App */}
        <button
          onClick={onOpenGuide}
          className="flex flex-col items-center justify-center min-h-[44px] py-1 text-slate-400 hover:text-amber-300 transition-colors"
        >
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] tracking-tight mt-0.5">Cẩm Nang</span>
        </button>
      </div>
    </nav>
  );
};
