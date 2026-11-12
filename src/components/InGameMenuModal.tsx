import React, { useState } from 'react';
import {
  Home,
  Users,
  Trophy,
  Share2,
  Volume2,
  VolumeX,
  HelpCircle,
  User,
  Gamepad2,
  X,
  ChevronRight,
  Bot,
  Flame,
  Globe,
  Sparkles
} from 'lucide-react';
import { GameType, GameItem, GameDifficulty } from '../types';
import { sound } from '../audio/soundEffects';

interface InGameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: GameType;
  currentGame: GameItem;
  playerName: string;
  playerAvatar: string;
  isMuted: boolean;
  difficulty: GameDifficulty;
  games: GameItem[];
  onGoHome: () => void;
  onOpenInvite: () => void;
  onOpenLeaderboard: () => void;
  onOpenChangeName: () => void;
  onOpenHelp: () => void;
  onToggleSound: () => void;
  onChangeDifficulty: (diff: GameDifficulty) => void;
  onSwitchGame: (gameId: GameType) => void;
}

export const InGameMenuModal: React.FC<InGameMenuModalProps> = ({
  isOpen,
  onClose,
  activeGame,
  currentGame,
  playerName,
  playerAvatar,
  isMuted,
  difficulty,
  games,
  onGoHome,
  onOpenInvite,
  onOpenLeaderboard,
  onOpenChangeName,
  onOpenHelp,
  onToggleSound,
  onChangeDifficulty,
  onSwitchGame
}) => {
  const [showGameModes, setShowGameModes] = useState(false);
  const [showSwitchGames, setShowSwitchGames] = useState(false);

  if (!isOpen) return null;

  const isVersusGame = activeGame === 'caro' || activeGame === 'cotuong';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-start sm:justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xl shadow-md">
              {playerAvatar || '🥷'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm">{playerName || 'Dân Chơi'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  Player
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Đang chơi: <strong className="text-cyan-400">{currentGame.title}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar pr-0.5">
          {/* 1. Trở về Home (Menu chọn game) */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onGoHome();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-850 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all text-left cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 group-hover:scale-105 transition-transform">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Trở về Home (Menu Game)</span>
                <span className="text-[11px] text-slate-400">Chọn trò chơi khác trong thư viện</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 2. Các chế độ chơi */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-2.5">
            <button
              onClick={() => {
                setShowGameModes(!showGameModes);
                sound.playClick();
              }}
              className="w-full flex items-center justify-between p-1.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Các Chế Độ Chơi</span>
                  <span className="text-[11px] text-slate-400">
                    {isVersusGame ? 'Đấu AI, 2 Người, Online P2P' : `Độ khó: ${difficulty === 'easy' ? 'Dễ' : difficulty === 'normal' ? 'Vừa' : 'Khó'}`}
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${showGameModes ? 'rotate-90 text-cyan-400' : ''}`}
              />
            </button>

            {showGameModes && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                {isVersusGame ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-400 mb-1">
                      Tuỳ chọn chế độ bàn cờ ({currentGame.title}):
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => {
                          onClose();
                          sound.playClick();
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-center hover:border-cyan-400 text-xs font-semibold text-slate-200 cursor-pointer"
                      >
                        <Bot className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                        Đấu Máy AI
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          sound.playClick();
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-center hover:border-indigo-400 text-xs font-semibold text-slate-200 cursor-pointer"
                      >
                        <Users className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                        2 Người Máy
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenInvite();
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-center hover:border-emerald-400 text-xs font-semibold text-emerald-300 cursor-pointer"
                      >
                        <Globe className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                        Đấu Online
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5">Chọn mức độ thử thách:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            onChangeDifficulty(d);
                            sound.playMove();
                          }}
                          className={`p-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                            difficulty === d
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {d === 'easy' ? 'Dễ' : d === 'normal' ? 'Vừa' : 'Khó'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Mời bạn bè */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenInvite();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Mời Bạn Bè Cùng Chơi</span>
                <span className="text-[11px] text-emerald-300">Tạo link gửi qua Zalo / Messenger</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 4. Bảng xếp hạng */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenLeaderboard();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-950/20 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-105 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Bảng Xếp Hạng & Kỷ Lục</span>
                <span className="text-[11px] text-slate-400">Xem điểm cao nhất và danh hiệu</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 5. Đổi tên người chơi / Hồ sơ */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenChangeName();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 hover:bg-purple-950/20 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40 group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Hồ Sơ & Đổi Tên</span>
                <span className="text-[11px] text-slate-400">Đổi biệt danh và avatar của bạn</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 6. Bật / Tắt âm thanh */}
          <button
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-teal-500/20 text-teal-400 border-teal-500/40'
              }`}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Âm Thanh Trò Chơi</span>
                <span className="text-[11px] text-slate-400">
                  {isMuted ? 'Đang tắt âm thanh' : 'Đang bật âm thanh sống động'}
                </span>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
              isMuted
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                : 'bg-teal-950/60 border-teal-500/30 text-teal-300'
            }`}>
              {isMuted ? 'Tắt' : 'Bật'}
            </span>
          </button>

          {/* 7. Hướng dẫn cách chơi */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenHelp();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Hướng Dẫn Cách Chơi</span>
                <span className="text-[11px] text-slate-400">Luật chơi & mẹo đạt điểm cao</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 8. Đổi game nhanh */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-2.5">
            <button
              onClick={() => {
                setShowSwitchGames(!showSwitchGames);
                sound.playClick();
              }}
              className="w-full flex items-center justify-between p-1.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Đổi Game Nhanh</span>
                  <span className="text-[11px] text-slate-400">Chuyển sang trò khác ngay</span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${showSwitchGames ? 'rotate-90 text-cyan-400' : ''}`}
              />
            </button>

            {showSwitchGames && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                {games.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onSwitchGame(g.id);
                      onClose();
                      sound.playClick();
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                      activeGame === g.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="block truncate">{g.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer close button */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Tiếp Tục Chơi Game
          </button>
        </div>
      </div>
    </div>
  );
};
