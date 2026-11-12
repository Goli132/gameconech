import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { RotateCcw, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

interface Puzzle2048Props {
  onGameOver: (score: number) => void;
  highScore: number;
}

type Board = number[][];

export const Puzzle2048Game: React.FC<Puzzle2048Props> = ({
  onGameOver,
  highScore
}) => {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Add random 2 or 4 to board
  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  // Start / Reset
  const startNewGame = useCallback(() => {
    let newBoard: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    sound.playBounce(500);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Check if moves are still possible
  const checkGameOver = (b: Board): boolean => {
    // Check empty cells
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
      }
    }
    // Check adjacent matches
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = b[r][c];
        if (r < 3 && b[r + 1][c] === val) return false;
        if (c < 3 && b[r][c + 1] === val) return false;
      }
    }
    return true;
  };

  // Move and merge rows
  const moveLeft = (b: Board): { board: Board; scoreAdded: number; moved: boolean } => {
    let scoreAdded = 0;
    let moved = false;
    const newBoard = b.map(row => {
      // 1. Filter non-zeros
      const filtered = row.filter(val => val !== 0);
      const newRow: number[] = [];

      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const merged = filtered[i] * 2;
          newRow.push(merged);
          scoreAdded += merged;
          if (merged === 2048) setHasWon(true);
          i++; // skip next
        } else {
          newRow.push(filtered[i]);
        }
      }

      while (newRow.length < 4) newRow.push(0);

      for (let c = 0; c < 4; c++) {
        if (row[c] !== newRow[c]) moved = true;
      }

      return newRow;
    });

    return { board: newBoard, scoreAdded, moved };
  };

  const rotateClockwise = (b: Board): Board => {
    const rotated: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        rotated[c][3 - r] = b[r][c];
      }
    }
    return rotated;
  };

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;

    let current = board;
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    if (direction === 'right') rotations = 2;
    if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) {
      current = rotateClockwise(current);
    }

    const { board: shifted, scoreAdded, moved } = moveLeft(current);

    let finalBoard = shifted;
    const reverseRotations = (4 - rotations) % 4;
    for (let i = 0; i < reverseRotations; i++) {
      finalBoard = rotateClockwise(finalBoard);
    }

    if (moved) {
      const withNewTile = addRandomTile(finalBoard);
      setBoard(withNewTile);
      const newScore = score + scoreAdded;
      setScore(newScore);

      if (scoreAdded > 0) {
        sound.playBounce(Math.min(900, 350 + scoreAdded * 5));
      } else {
        sound.playBounce(300);
      }

      if (checkGameOver(withNewTile)) {
        setGameOver(true);
        sound.playGameOver();
        onGameOver(newScore);
      }
    }
  }, [board, gameOver, onGameOver, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        handleMove('left');
        e.preventDefault();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        handleMove('right');
        e.preventDefault();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        handleMove('up');
        e.preventDefault();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        handleMove('down');
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Tile styles according to value
  const getTileStyle = (val: number) => {
    switch (val) {
      case 2: return 'bg-slate-800 text-slate-100 border border-slate-700';
      case 4: return 'bg-slate-700 text-slate-100 border border-slate-600';
      case 8: return 'bg-amber-600 text-white shadow-md shadow-amber-600/30';
      case 16: return 'bg-orange-600 text-white shadow-md shadow-orange-600/30';
      case 32: return 'bg-rose-600 text-white shadow-md shadow-rose-600/30';
      case 64: return 'bg-red-600 text-white shadow-md shadow-red-600/30';
      case 128: return 'bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/30';
      case 256: return 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30';
      case 512: return 'bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/30';
      case 1024: return 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30';
      case 2048: return 'bg-purple-600 text-white font-black shadow-xl shadow-purple-600/40 animate-pulse';
      default: return 'bg-pink-600 text-white font-black';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Top HUD */}
      <div className="w-full max-w-[460px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-400 block">ĐIỂM SỐ</span>
            <span className="font-mono text-lg font-bold text-amber-400 tabular-nums">{score}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">KỶ LỤC</span>
            <span className="font-mono text-lg font-bold text-slate-300 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startNewGame}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ván mới
          </button>
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            aria-label="Âm thanh"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* 2048 Board Container */}
      <div className="relative w-full max-w-[460px] aspect-square p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-full h-full rounded-xl flex items-center justify-center font-mono font-bold text-xl md:text-2xl transition-all duration-150 select-none ${
                  cell === 0 ? 'bg-slate-950/60 border border-slate-800/60' : getTileStyle(cell)
                }`}
              >
                {cell > 0 ? cell : ''}
              </div>
            ))
          )}
        </div>

        {/* Win Screen */}
        {hasWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <Trophy className="w-14 h-14 text-yellow-400 mb-2 animate-bounce" />
            <h2 className="text-3xl font-black text-yellow-400 mb-2">CHẠM MỐC 2048!</h2>
            <p className="text-slate-300 text-sm mb-6">Bạn là bậc thầy ghép số! Bạn có muốn tiếp tục ghép điểm cao hơn?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setHasWon(false)}
                className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl transition-all"
              >
                Chơi tiếp
              </button>
              <button
                onClick={startNewGame}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                Ván mới
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">HẾT NƯỚC ĐI</span>
            <h2 className="text-3xl font-black text-rose-500 mb-3">KHÔNG CÒN Ô TRỐNG</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 w-48 text-center">
              <span className="text-xs text-slate-400 block">Điểm số</span>
              <span className="font-mono text-2xl font-bold text-amber-400">{score}</span>
            </div>
            <button
              onClick={startNewGame}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Lại Ván Mới
            </button>
          </div>
        )}
      </div>

      {/* Virtual D-pad for mobile */}
      <div className="mt-4 flex flex-col items-center gap-1.5 md:hidden">
        <button
          onClick={() => handleMove('up')}
          className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
          aria-label="Lên"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMove('left')}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
            aria-label="Trái"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleMove('down')}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
            aria-label="Xuống"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleMove('right')}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
            aria-label="Phải"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
