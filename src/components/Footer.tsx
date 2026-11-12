import React from 'react';
import { GameType } from '../types';

interface FooterProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeGame, onSelectGame }) => {
  return (
    <footer className="mt-12 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Game switcher for mobile */}
        <div className="flex md:hidden items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => onSelectGame('space')}
            className={`px-3 py-1.5 rounded-md font-medium ${
              activeGame === 'space' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Phi thuyền
          </button>
          <button
            onClick={() => onSelectGame('snake')}
            className={`px-3 py-1.5 rounded-md font-medium ${
              activeGame === 'snake' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Rắn săn mồi
          </button>
          <button
            onClick={() => onSelectGame('brick')}
            className={`px-3 py-1.5 rounded-md font-medium ${
              activeGame === 'brick' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Đập gạch
          </button>
        </div>

        <div>
          Trò chơi web arcade thuần HTML5 Canvas & Web Audio API
        </div>

        <div className="text-slate-500">
          Tương thích mượt mà trên bàn phím, chuột và màn hình cảm ứng
        </div>
      </div>
    </footer>
  );
};
