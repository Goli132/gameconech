/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameType, GameCategory, GameDifficulty, GameItem, HighScoreRecord } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { InstructionsModal } from './components/InstructionsModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { AddGameModal } from './components/AddGameModal';
import { SpaceShooterGame } from './games/SpaceShooterGame';
import { SnakeGame } from './games/SnakeGame';
import { BrickBreakerGame } from './games/BrickBreakerGame';
import { FlappyNeonGame } from './games/FlappyNeonGame';
import { Puzzle2048Game } from './games/Puzzle2048Game';
import { CaroGame } from './games/CaroGame';
import { CoTuongGame } from './games/CoTuongGame';
import { CustomEmbedGame } from './games/CustomEmbedGame';
import { Rocket, Trophy, Flame, Play, Star, Sparkles, Search, ArrowLeft, Gamepad2 } from 'lucide-react';

const STORAGE_KEY = 'arcade_games_high_scores_v2';
const CUSTOM_GAMES_KEY = 'arcade_custom_games_v2';

const INITIAL_GAMES: GameItem[] = [
  {
    id: 'space',
    title: 'Phi Thuyền Không Gian',
    category: 'action',
    description: 'Bắn hạ hạm đội phi thuyền ngoài hành tinh, nhặt tia laser và tiêu diệt boss hạm đội.',
    badge: 'Phổ biến nhất',
    plays: 1240,
    rating: 4.9,
    iconType: 'space'
  },
  {
    id: 'snake',
    title: 'Rắn Săn Mồi Neon',
    category: 'arcade',
    description: 'Game rắn săn mồi cổ điển với hiệu ứng phát sáng, mồi sao vàng và chuỗi combo siêu tốc.',
    badge: 'Kinh điển',
    plays: 980,
    rating: 4.8,
    iconType: 'snake'
  },
  {
    id: 'brick',
    title: 'Đập Gạch Phá Khối',
    category: 'arcade',
    description: 'Điều khiển thanh trượt phản xạ bóng, kích nổ gạch bom và nhân 3 quả cầu phá tan màn chơi.',
    badge: 'Hấp dẫn',
    plays: 860,
    rating: 4.7,
    iconType: 'brick'
  },
  {
    id: 'flappy',
    title: 'Flappy Neon Bird',
    category: 'arcade',
    description: 'Chạm nhẹ để đập cánh bay qua các khe ống khói neon và thu thập đồng tiền vàng.',
    badge: 'Thử thách',
    plays: 1510,
    rating: 4.9,
    iconType: 'flappy'
  },
  {
    id: '2048',
    title: 'Ghép Số 2048 Neon',
    category: 'puzzle',
    description: 'Vuốt ghép các ô số cùng giá trị để tạo nên ô 2048 huyền thoại với âm thanh êm dịu.',
    badge: 'Trí tuệ',
    plays: 740,
    rating: 4.8,
    iconType: '2048'
  },
  {
    id: 'caro',
    title: 'Cờ Ca-rô 5 Quân',
    category: 'puzzle',
    description: 'Đấu trí bàn cờ ca-rô 15x15 chuẩn quốc tế cùng máy tính thông minh hoặc thi đấu 2 người chơi.',
    badge: 'Dân gian',
    plays: 1820,
    rating: 4.9,
    iconType: 'caro'
  },
  {
    id: 'cotuong',
    title: 'Cờ Tướng Đấu Trí',
    category: 'puzzle',
    description: 'Kỳ đài cờ tướng với Cung tướng, Sông Sở Hà Hán Giới, luật chuẩn Xe Pháo Mã và trợ lý AI tính nước.',
    badge: 'Kỳ nghệ đỉnh cao',
    plays: 2150,
    rating: 5.0,
    iconType: 'cotuong'
  }
];

export default function App() {
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

  const [activeGame, setActiveGame] = useState<GameType>(() => {
    if (initialRoom) return initialRoom.game;
    return 'space';
  });
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [games, setGames] = useState<GameItem[]>(INITIAL_GAMES);
  const [viewMode, setViewMode] = useState<'play' | 'catalog'>('play');

  const [highScores, setHighScores] = useState<HighScoreRecord>({
    space: 0,
    snake: 0,
    brick: 0,
    flappy: 0,
    '2048': 0
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
    setViewMode('play');

    try {
      const customOnes = updated.filter(g => g.isCustom);
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customOnes));
    } catch {
      // Ignore
    }
  };

  // Filter games
  const filteredGames = games.filter(g => {
    const matchCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'custom'
        ? g.isCustom
        : g.category === selectedCategory;

    const matchSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  const currentGame = games.find(g => g.id === activeGame) || games[0];

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'space': return <Rocket className="w-5 h-5 text-cyan-400" />;
      case 'snake': return <span className="text-xl">🐍</span>;
      case 'brick': return <span className="text-xl">🧱</span>;
      case 'flappy': return <span className="text-xl">🐥</span>;
      case '2048': return <span className="text-lg font-bold text-yellow-400">2048</span>;
      case 'caro': return <span className="text-lg font-bold text-rose-500">❌⭕</span>;
      case 'cotuong': return <span className="text-lg font-bold text-amber-300">帥</span>;
      default: return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeGame={activeGame}
        onSelectGame={(g) => {
          setActiveGame(g);
          setViewMode('play');
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAddGame={() => setIsAddGameOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-5 pb-24 md:pb-6 flex flex-col items-center">
        {/* Navigation Bar / Quick Switcher */}
        <div className="w-full max-w-[620px] mb-3 sm:mb-4 flex items-center justify-between gap-2">
          {/* View toggle (Chơi ngay / Thư viện game) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('play')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'play'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang chơi: {currentGame.title}
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'catalog'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thư viện ({games.length} game)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/30 border border-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cập nhật game?</span>
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: ACTIVE GAME ARENA ================= */}
        {viewMode === 'play' && (
          <div className="w-full flex flex-col items-center">
            {/* Quick switcher buttons */}
            <div className="w-full max-w-[620px] mb-3 sm:mb-4 overflow-x-auto no-scrollbar scroll-smooth pb-1 flex items-center gap-1.5 touch-pan-x">
              {games.map(g => {
                const isActive = activeGame === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGame(g.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {getGameIcon(g.iconType)}
                    <span>{g.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Score & Difficulty Strip */}
            {initialRoom && activeGame === initialRoom.game && (
              <div className="w-full max-w-[600px] mb-3 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/70 to-cyan-950/70 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Đang vào phòng đấu bạn bè: <strong className="font-mono text-white">{initialRoom.roomId}</strong></span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Phòng Online
                </span>
              </div>
            )}

            <div className="w-full max-w-[600px] mb-3 flex items-center justify-between text-xs text-slate-400 px-3 py-2 bg-slate-900/60 border border-slate-800/60 rounded-xl">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Kỷ lục trò chơi:</span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {highScores[activeGame] || 0} điểm
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span className="capitalize">
                  Độ khó: {difficulty === 'easy' ? 'Dễ' : difficulty === 'normal' ? 'Vừa' : 'Khó'}
                </span>
              </div>
            </div>

            {/* Render Active Game */}
            <section className="w-full flex justify-center">
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
            </section>
          </div>
        )}

        {/* ================= VIEW 2: GAME CATALOG & MANAGEMENT ================= */}
        {viewMode === 'catalog' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Search and Category Filters */}
            <div className="w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({games.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('action')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === 'action'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bắn súng
                </button>
                <button
                  onClick={() => setSelectedCategory('arcade')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === 'arcade'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cổ điển
                </button>
                <button
                  onClick={() => setSelectedCategory('puzzle')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === 'puzzle'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Trí tuệ
                </button>
                <button
                  onClick={() => setSelectedCategory('custom')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === 'custom'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tự thêm ({games.filter(g => g.isCustom).length})
                </button>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trò chơi..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-cyan-500/5"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:scale-105 transition-transform">
                        {getGameIcon(game.iconType)}
                      </div>

                      {game.badge && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                          {game.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {game.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 py-2 border-t border-slate-800/80 mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {game.rating}
                      </span>
                      <span>{game.plays} lượt chơi</span>
                      <span className="font-mono text-emerald-400">
                        Kỷ lục: {highScores[game.id] || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveGame(game.id);
                        setViewMode('play');
                      }}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      Chơi Trò Này
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                Không tìm thấy trò chơi phù hợp với tìm kiếm của bạn.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        activeGame={activeGame}
        onSelectGame={(g) => {
          setActiveGame(g);
          setViewMode('play');
        }}
      />

      {/* Modals */}
      <InstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        activeGame={activeGame}
        difficulty={difficulty}
        onSelectDifficulty={(d) => setDifficulty(d)}
      />

      <DeploymentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={() => setIsAddGameOpen(false)}
        onAddGame={handleAddNewGame}
      />

      {/* Mobile Bottom Navigation Bar (Thumb ergonomic zone) */}
      <MobileBottomNav
        activeGame={activeGame}
        viewMode={viewMode}
        onSelectGame={(g) => {
          setActiveGame(g);
          setViewMode('play');
        }}
        onSetViewMode={(m) => setViewMode(m)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAddGame={() => setIsAddGameOpen(true)}
      />
    </div>
  );
}
