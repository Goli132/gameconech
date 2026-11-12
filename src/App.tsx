/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameType, GameCategory, GameDifficulty, GameItem, HighScoreRecord } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InstructionsModal } from './components/InstructionsModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { AddGameModal } from './components/AddGameModal';
import { PlayerNameModal } from './components/PlayerNameModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { InGameMenuModal } from './components/InGameMenuModal';
import { InviteFriendModal } from './components/InviteFriendModal';
import { SpaceShooterGame } from './games/SpaceShooterGame';
import { SnakeGame } from './games/SnakeGame';
import { BrickBreakerGame } from './games/BrickBreakerGame';
import { FlappyNeonGame } from './games/FlappyNeonGame';
import { Puzzle2048Game } from './games/Puzzle2048Game';
import { CaroGame } from './games/CaroGame';
import { CoTuongGame } from './games/CoTuongGame';
import { CustomEmbedGame } from './games/CustomEmbedGame';
import { sound } from './audio/soundEffects';
import { roomManager } from './multiplayer/roomManager';
import {
  Rocket,
  Trophy,
  Flame,
  Play,
  Star,
  Sparkles,
  Search,
  Gamepad2,
  Users,
  Bot,
  Globe,
  Share2,
  Crown
} from 'lucide-react';

const STORAGE_KEY = 'arcade_games_high_scores_v2';
const CUSTOM_GAMES_KEY = 'arcade_custom_games_v2';
const PLAYER_NAME_KEY = 'arcade_player_name';
const PLAYER_AVATAR_KEY = 'arcade_player_avatar';

const INITIAL_GAMES: GameItem[] = [
  {
    id: 'caro',
    title: 'Cờ Ca-rô 5 Quân',
    category: 'puzzle',
    description: 'Đấu trí bàn cờ ca-rô 15x15 chuẩn quốc tế cùng máy tính thông minh hoặc gửi link thi đấu 2 người trực tuyến.',
    badge: 'Đối kháng hot',
    plays: 2450,
    rating: 5.0,
    iconType: 'caro'
  },
  {
    id: 'cotuong',
    title: 'Cờ Tướng Đấu Trí',
    category: 'puzzle',
    description: 'Kỳ đài cờ tướng với Cung tướng, Sông Sở Hà Hán Giới, luật chuẩn Xe Pháo Mã và trợ lý AI tính nước.',
    badge: 'Kỳ nghệ đỉnh cao',
    plays: 3120,
    rating: 5.0,
    iconType: 'cotuong'
  },
  {
    id: 'space',
    title: 'Phi Thuyền Không Gian',
    category: 'action',
    description: 'Bắn hạ hạm đội phi thuyền ngoài hành tinh, nhặt tia laser và tiêu diệt boss hạm đội.',
    badge: 'Phổ biến nhất',
    plays: 1840,
    rating: 4.9,
    iconType: 'space'
  },
  {
    id: 'snake',
    title: 'Rắn Săn Mồi Neon',
    category: 'arcade',
    description: 'Game rắn săn mồi cổ điển với hiệu ứng phát sáng, mồi sao vàng và chuỗi combo siêu tốc.',
    badge: 'Kinh điển',
    plays: 1420,
    rating: 4.8,
    iconType: 'snake'
  },
  {
    id: 'brick',
    title: 'Đập Gạch Phá Khối',
    category: 'arcade',
    description: 'Điều khiển thanh trượt phản xạ bóng, kích nổ gạch bom và nhân 3 quả cầu phá tan màn chơi.',
    badge: 'Hấp dẫn',
    plays: 1260,
    rating: 4.7,
    iconType: 'brick'
  },
  {
    id: 'flappy',
    title: 'Flappy Neon Bird',
    category: 'arcade',
    description: 'Chạm nhẹ để đập cánh bay qua các khe ống khói neon và thu thập đồng tiền vàng.',
    badge: 'Thử thách',
    plays: 1980,
    rating: 4.9,
    iconType: 'flappy'
  },
  {
    id: '2048',
    title: 'Ghép Số 2048 Neon',
    category: 'puzzle',
    description: 'Vuốt ghép các ô số cùng giá trị để tạo nên ô 2048 huyền thoại với âm thanh êm dịu.',
    badge: 'Trí tuệ',
    plays: 940,
    rating: 4.8,
    iconType: '2048'
  }
];

export default function App() {
  // Player Profile States
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem(PLAYER_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const [playerAvatar, setPlayerAvatar] = useState<string>(() => {
    try {
      return localStorage.getItem(PLAYER_AVATAR_KEY) || '🥷';
    } catch {
      return '🥷';
    }
  });

  const [isPlayerNameModalOpen, setIsPlayerNameModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(PLAYER_NAME_KEY);
    } catch {
      return true;
    }
  });

  const [canDismissPlayerModal, setCanDismissPlayerModal] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(PLAYER_NAME_KEY);
    } catch {
      return false;
    }
  });

  // Check URL query parameters for game invitations (e.g. ?game=caro&room=caro_abc123)
  const [initialRoom] = useState<{ game: GameType; roomId: string } | null>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const gameParam = params.get('game') as GameType;
        const roomParam = params.get('room');
        if (gameParam && (gameParam === 'caro' || gameParam === 'cotuong') && roomParam) {
          return { game: gameParam, roomId: roomParam };
        }
      }
    } catch {
      // Ignore
    }
    return null;
  });

  // Navigation & View Mode: 'menu' (trang menu chọn game) hoặc 'game' (full màn hình chơi game)
  const [viewMode, setViewMode] = useState<'menu' | 'game'>(() => {
    // If invited via link, go straight to game if name is set
    try {
      const hasName = !!localStorage.getItem(PLAYER_NAME_KEY);
      if (initialRoom && hasName) return 'game';
    } catch {
      // Ignore
    }
    return 'menu';
  });

  const [activeGame, setActiveGame] = useState<GameType>(() => {
    if (initialRoom) return initialRoom.game;
    return 'caro';
  });

  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isInGameMenuOpen, setIsInGameMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Invite modal state
  const [inviteData, setInviteData] = useState<{
    gameTitle: string;
    inviteUrl: string;
    roomId: string;
    isConnected: boolean;
  }>({
    gameTitle: '',
    inviteUrl: '',
    roomId: '',
    isConnected: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [games, setGames] = useState<GameItem[]>(INITIAL_GAMES);

  const [highScores, setHighScores] = useState<HighScoreRecord>({
    space: 0,
    snake: 0,
    brick: 0,
    flappy: 0,
    '2048': 0,
    caro: 0,
    cotuong: 0
  });

  // Load custom games and high scores
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem(STORAGE_KEY);
      if (savedScores) {
        setHighScores(JSON.parse(savedScores));
      }

      const savedCustomGames = localStorage.getItem(CUSTOM_GAMES_KEY);
      if (savedCustomGames) {
        const parsed: GameItem[] = JSON.parse(savedCustomGames);
        setGames([...INITIAL_GAMES, ...parsed]);
      }
    } catch {
      // Storage fallback
    }
  }, []);

  // Save player profile
  const handleSavePlayerProfile = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    try {
      localStorage.setItem(PLAYER_NAME_KEY, name);
      localStorage.setItem(PLAYER_AVATAR_KEY, avatar);
    } catch {
      // Ignore
    }
    setIsPlayerNameModalOpen(false);
    setCanDismissPlayerModal(true);

    // If was an initial room invite, go directly to game
    if (initialRoom) {
      setActiveGame(initialRoom.game);
      setViewMode('game');
    } else {
      // Otherwise ensure we are at menu
      setViewMode('menu');
    }
  };

  // Update high score
  const handleGameOver = (score: number) => {
    setHighScores(prev => {
      const currentBest = prev[activeGame] || 0;
      if (score > currentBest) {
        const updated = { ...prev, [activeGame]: score };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      }
      return prev;
    });
  };

  // Add new game handler
  const handleAddNewGame = (newGame: GameItem) => {
    const updated = [...games, newGame];
    setGames(updated);
    setActiveGame(newGame.id);
    setViewMode('game');

    try {
      const customOnes = updated.filter(g => g.isCustom);
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customOnes));
    } catch {
      // Ignore
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  };

  // Open invite friend modal from anywhere
  const handleOpenInvite = () => {
    const current = games.find(g => g.id === activeGame) || games[0];
    if (activeGame === 'caro' || activeGame === 'cotuong') {
      const { roomId, inviteUrl } = roomManager.createRoom(
        activeGame as 'caro' | 'cotuong',
        () => sound.playVictory(),
        () => {}
      );
      setInviteData({
        gameTitle: current.title,
        inviteUrl,
        roomId,
        isConnected: false
      });
      setIsInviteModalOpen(true);
    } else {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}?game=${activeGame}`;
      setInviteData({
        gameTitle: current.title,
        inviteUrl: url,
        roomId: `game_${activeGame}`,
        isConnected: true
      });
      setIsInviteModalOpen(true);
    }
  };

  // Filter games based on category and search query
  const filteredGames = games.filter(g => {
    let matchCategory = true;
    if (selectedCategory === 'all') {
      matchCategory = true;
    } else if (selectedCategory === 'custom') {
      matchCategory = !!g.isCustom;
    } else {
      matchCategory = g.category === selectedCategory;
    }

    const matchSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  const currentGame = games.find(g => g.id === activeGame) || games[0];

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'caro': return <span className="text-xl font-bold text-rose-500">❌⭕</span>;
      case 'cotuong': return <span className="text-2xl font-bold text-amber-300">帥</span>;
      case 'space': return <Rocket className="w-5 h-5 text-cyan-400" />;
      case 'snake': return <span className="text-xl">🐍</span>;
      case 'brick': return <span className="text-xl">🧱</span>;
      case 'flappy': return <span className="text-xl">🐥</span>;
      case '2048': return <span className="text-lg font-bold text-yellow-400">2048</span>;
      default: return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* ================= VIEW 1: MENU CHỌN GAME ================= */}
      {viewMode === 'menu' && (
        <div className="min-h-screen flex flex-col">
          {/* Main Top Header */}
          <Header
            activeGame={activeGame}
            playerName={playerName}
            playerAvatar={playerAvatar}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            onOpenAddGame={() => setIsAddGameOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenChangeName={() => {
              setCanDismissPlayerModal(true);
              setIsPlayerNameModalOpen(true);
            }}
          />

          {/* Main Menu Hub Container */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
            {/* Player Welcome Hero Banner */}
            <div className="w-full mb-6 p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-rose-500 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-cyan-500/25 border-2 border-white/20">
                      {playerAvatar || '🥷'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      VIP
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                        Xin chào, {playerName || 'Dân Chơi'}!
                      </h1>
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                      Chào mừng bạn đến với khu trò chơi đối kháng & giải trí đỉnh cao. Chọn một game bên dưới để vào bàn đấu full màn hình ngay!
                    </p>
                  </div>
                </div>

                {/* Quick Action Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsLeaderboardOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Xem Kỷ Lục Của Bạn</span>
                  </button>

                  <button
                    onClick={() => {
                      setCanDismissPlayerModal(true);
                      setIsPlayerNameModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer hover:scale-105"
                  >
                    <span>Đổi Biệt Danh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Selection Tabs & Search Bar */}
            <div className="w-full mb-6 flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* Category Pills (Chia theo thể loại game) */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto w-full lg:w-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🌟 Tất cả ({games.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('puzzle')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'puzzle'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🧠 Trí tuệ & Đối kháng
                </button>
                <button
                  onClick={() => setSelectedCategory('action')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'action'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🚀 Bắn súng & Hành động
                </button>
                <button
                  onClick={() => setSelectedCategory('arcade')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'arcade'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🕹️ Cổ điển & Arcade
                </button>
                <button
                  onClick={() => setSelectedCategory('custom')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'custom'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🌐 Game Tự Thêm ({games.filter(g => g.isCustom).length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trò chơi..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500 transition-colors"
                />
              </div>
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700/80 group-hover:scale-105 transition-transform shadow-md">
                        {getGameIcon(game.iconType)}
                      </div>

                      {game.badge && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                          {game.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {game.description}
                    </p>
                  </div>

                  <div>
                    {/* Game Stats */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 py-2.5 border-t border-slate-800/80 mb-3.5">
                      <span className="flex items-center gap-1 font-semibold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {game.rating}
                      </span>
                      <span>{game.plays.toLocaleString()} lượt chơi</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        Kỷ lục: {highScores[game.id] || 0}
                      </span>
                    </div>

                    {/* Launch Full Screen Game Button */}
                    <button
                      onClick={() => {
                        setActiveGame(game.id);
                        setViewMode('game');
                        sound.playClick();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20 active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Chơi Ngay (Full Màn Hình)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm">
                Không tìm thấy trò chơi phù hợp với từ khóa của bạn.
              </div>
            )}
          </main>

          {/* Footer */}
          <Footer
            activeGame={activeGame}
            onSelectGame={(g) => {
              setActiveGame(g);
              setViewMode('game');
            }}
          />
        </div>
      )}

      {/* ================= VIEW 2: GIAO DIỆN GAME FULL MÀN HÌNH ================= */}
      {viewMode === 'game' && (
        <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
          {/* FLOATING TOP-LEFT "..." BUTTON (CHỈ THỂ HIỆN DẤU ... ĐỂ VÀO MENU) */}
          <button
            onClick={() => {
              sound.playClick();
              setIsInGameMenuOpen(true);
            }}
            className="fixed top-3 left-3 z-50 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-white border border-cyan-500/40 backdrop-blur-md shadow-xl shadow-black/80 hover:shadow-cyan-500/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer group"
            title="Menu: Trở về home, Các chế độ chơi, Mời bạn bè, Bảng xếp hạng..."
            aria-label="Menu"
          >
            <span className="font-mono text-2xl tracking-widest font-black leading-none pb-1 group-hover:scale-110 transition-transform">
              ...
            </span>
            <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">
              Menu
            </span>
          </button>

          {/* Floating Online Invite Status (if joined room) */}
          {initialRoom && activeGame === initialRoom.game && (
            <div className="fixed top-3 right-3 z-40 px-3 py-1.5 bg-slate-900/90 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 backdrop-blur-md shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Phòng online:</span>
              <span className="font-mono font-bold text-white">{initialRoom.roomId}</span>
            </div>
          )}

          {/* Full-Screen Game Arena */}
          <div className="w-full max-w-4xl flex flex-col items-center justify-center pt-10 sm:pt-4 pb-4">
            {activeGame === 'space' && (
              <SpaceShooterGame
                difficulty={difficulty}
                onGameOver={handleGameOver}
                highScore={highScores.space || 0}
              />
            )}

            {activeGame === 'snake' && (
              <SnakeGame
                difficulty={difficulty}
                onGameOver={handleGameOver}
                highScore={highScores.snake || 0}
              />
            )}

            {activeGame === 'brick' && (
              <BrickBreakerGame
                difficulty={difficulty}
                onGameOver={handleGameOver}
                highScore={highScores.brick || 0}
              />
            )}

            {activeGame === 'flappy' && (
              <FlappyNeonGame
                difficulty={difficulty}
                onGameOver={handleGameOver}
                highScore={highScores.flappy || 0}
              />
            )}

            {activeGame === '2048' && (
              <Puzzle2048Game
                onGameOver={handleGameOver}
                highScore={highScores['2048'] || 0}
              />
            )}

            {activeGame === 'caro' && (
              <CaroGame
                onGameOver={handleGameOver}
                highScore={highScores.caro || 0}
                initialRoomId={initialRoom?.game === 'caro' ? initialRoom.roomId : null}
              />
            )}

            {activeGame === 'cotuong' && (
              <CoTuongGame
                onGameOver={handleGameOver}
                highScore={highScores.cotuong || 0}
                initialRoomId={initialRoom?.game === 'cotuong' ? initialRoom.roomId : null}
              />
            )}

            {currentGame.isCustom && currentGame.embedUrl && (
              <CustomEmbedGame
                title={currentGame.title}
                embedUrl={currentGame.embedUrl}
              />
            )}
          </div>
        </div>
      )}

      {/* ================= ALL MODALS & IN-GAME MENU ================= */}

      {/* 1. Onboarding / Player Name Prompt Modal */}
      <PlayerNameModal
        isOpen={isPlayerNameModalOpen}
        onClose={() => setIsPlayerNameModalOpen(false)}
        onSave={handleSavePlayerProfile}
        initialName={playerName}
        initialAvatar={playerAvatar}
        canDismiss={canDismissPlayerModal}
        isInvited={!!initialRoom}
        invitedGameTitle={
          initialRoom?.game === 'caro'
            ? 'Cờ Ca-rô 5 Quân'
            : initialRoom?.game === 'cotuong'
            ? 'Cờ Tướng Đấu Trí'
            : ''
        }
        invitedRoomId={initialRoom?.roomId || ''}
      />

      {/* 2. In-Game Menu Drawer (KHI BẤM DẤU "...") */}
      <InGameMenuModal
        isOpen={isInGameMenuOpen}
        onClose={() => setIsInGameMenuOpen(false)}
        activeGame={activeGame}
        currentGame={currentGame}
        playerName={playerName}
        playerAvatar={playerAvatar}
        isMuted={isMuted}
        difficulty={difficulty}
        games={games}
        onGoHome={() => {
          setViewMode('menu');
        }}
        onOpenInvite={handleOpenInvite}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenChangeName={() => {
          setCanDismissPlayerModal(true);
          setIsPlayerNameModalOpen(true);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onToggleSound={handleToggleMute}
        onChangeDifficulty={(d) => setDifficulty(d)}
        onSwitchGame={(gameId) => {
          setActiveGame(gameId);
          setViewMode('game');
        }}
      />

      {/* 3. Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        highScores={highScores}
        games={games}
        playerName={playerName}
        playerAvatar={playerAvatar}
      />

      {/* 4. Invite Friend Modal */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        gameTitle={inviteData.gameTitle}
        inviteUrl={inviteData.inviteUrl}
        roomId={inviteData.roomId}
        isConnected={inviteData.isConnected}
      />

      {/* 5. Instructions Modal */}
      <InstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        activeGame={activeGame}
        difficulty={difficulty}
        onSelectDifficulty={(d) => setDifficulty(d)}
      />

      {/* 6. Deployment Guide Modal */}
      <DeploymentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* 7. Add Custom Game Modal */}
      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={() => setIsAddGameOpen(false)}
        onAddGame={handleAddNewGame}
      />
    </div>
  );
}
