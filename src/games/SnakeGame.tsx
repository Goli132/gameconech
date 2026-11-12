import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { GameDifficulty } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Sparkles } from 'lucide-react';

interface SnakeGameProps {
  difficulty: GameDifficulty;
  onGameOver: (score: number) => void;
  highScore: number;
}

interface Point {
  x: number;
  y: number;
}

interface FoodItem {
  x: number;
  y: number;
  type: 'normal' | 'golden' | 'speed';
  timer?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({
  difficulty,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [applesEaten, setApplesEaten] = useState(0);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [gameOver, setGameOver] = useState(false);
  const [wrapWalls, setWrapWalls] = useState(true);

  // Speed tick interval based on difficulty and score
  const baseTick = difficulty === 'easy' ? 120 : difficulty === 'hard' ? 70 : 95;

  const stateRef = useRef({
    gridSize: 20, // 20x20 grid
    snake: [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ] as Point[],
    direction: { x: 0, y: -1 } as Point,
    nextDirection: { x: 0, y: -1 } as Point,
    food: { x: 10, y: 5, type: 'normal' } as FoodItem,
    goldenFood: null as FoodItem | null,
    particles: [] as Particle[],
    score: 0,
    apples: 0,
    combo: 1,
    comboTimer: 0,
    lastTickTime: 0,
    isPlaying: false,
    isPaused: false,
    wrapWalls: true,
    tickInterval: baseTick
  });

  stateRef.current.wrapWalls = wrapWalls;

  // Toggle Sound
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Generate random food position not on snake
  const getRandomFreePos = useCallback((): Point => {
    const s = stateRef.current;
    const occupied = new Set(s.snake.map(p => `${p.x},${p.y}`));
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      x = Math.floor(Math.random() * s.gridSize);
      y = Math.floor(Math.random() * s.gridSize);
      tries++;
    } while (occupied.has(`${x},${y}`) && tries < 200);

    return { x, y };
  }, []);

  // Spawn food
  const spawnFood = useCallback(() => {
    const pos = getRandomFreePos();
    stateRef.current.food = {
      x: pos.x,
      y: pos.y,
      type: 'normal'
    };
  }, [getRandomFreePos]);

  // Spawn bonus golden food occasionally
  const spawnGoldenFood = useCallback(() => {
    const pos = getRandomFreePos();
    stateRef.current.goldenFood = {
      x: pos.x,
      y: pos.y,
      type: Math.random() > 0.5 ? 'golden' : 'speed',
      timer: 180 // 3 seconds at 60fps
    };
  }, [getRandomFreePos]);

  // Start / Restart game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    s.direction = { x: 0, y: -1 };
    s.nextDirection = { x: 0, y: -1 };
    s.score = 0;
    s.apples = 0;
    s.combo = 1;
    s.comboTimer = 0;
    s.particles = [];
    s.goldenFood = null;
    s.isPlaying = true;
    s.isPaused = false;
    s.tickInterval = baseTick;

    spawnFood();

    setScore(0);
    setApplesEaten(0);
    setCombo(1);
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
    sound.playBounce(600);
  }, [baseTick, spawnFood]);

  // Direction input handler
  const setDirection = useCallback((dir: Point) => {
    const s = stateRef.current;
    if (!s.isPlaying || s.isPaused) return;

    // Prevent immediate reverse direction into itself
    if (s.direction.x + dir.x === 0 && s.direction.y + dir.y === 0) {
      return;
    }
    s.nextDirection = dir;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        setDirection({ x: 0, y: -1 });
        e.preventDefault();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setDirection({ x: 0, y: 1 });
        e.preventDefault();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setDirection({ x: -1, y: 0 });
        e.preventDefault();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setDirection({ x: 1, y: 0 });
        e.preventDefault();
      } else if (e.code === 'KeyP') {
        setIsPaused(prev => {
          const next = !prev;
          stateRef.current.isPaused = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection]);

  // Swipe gesture support for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.hypot(dx, dy) > 25) {
          if (Math.abs(dx) > Math.abs(dy)) {
            setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
          } else {
            setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
          }
        }
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [setDirection]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderLoop = (timestamp: number) => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const cellSize = width / s.gridSize;

      // Update game step when tick interval passes
      if (s.isPlaying && !s.isPaused) {
        if (!s.lastTickTime) s.lastTickTime = timestamp;
        const elapsed = timestamp - s.lastTickTime;

        if (elapsed >= s.tickInterval) {
          s.lastTickTime = timestamp;
          s.direction = s.nextDirection;

          // Head next pos
          const head = s.snake[0];
          let nextX = head.x + s.direction.x;
          let nextY = head.y + s.direction.y;

          // Wall handling
          if (s.wrapWalls) {
            if (nextX < 0) nextX = s.gridSize - 1;
            if (nextX >= s.gridSize) nextX = 0;
            if (nextY < 0) nextY = s.gridSize - 1;
            if (nextY >= s.gridSize) nextY = 0;
          } else {
            if (nextX < 0 || nextX >= s.gridSize || nextY < 0 || nextY >= s.gridSize) {
              // Hit wall
              s.isPlaying = false;
              setGameOver(true);
              sound.playGameOver();
              onGameOver(s.score);
              return;
            }
          }

          // Self collision check
          const selfCollision = s.snake.some((seg, idx) => {
            return idx > 0 && seg.x === nextX && seg.y === nextY;
          });

          if (selfCollision) {
            s.isPlaying = false;
            setGameOver(true);
            sound.playGameOver();
            onGameOver(s.score);
            return;
          }

          const newHead = { x: nextX, y: nextY };
          s.snake.unshift(newHead);

          // Check normal food collision
          let ate = false;
          if (nextX === s.food.x && nextY === s.food.y) {
            ate = true;
            sound.playEat();
            s.apples++;
            setApplesEaten(s.apples);

            const pointsEarned = 10 * s.combo;
            s.score += pointsEarned;
            setScore(s.score);

            // Combo streak
            s.comboTimer = 120;
            s.combo = Math.min(5, s.combo + 1);
            setCombo(s.combo);

            // Food particles
            for (let i = 0; i < 14; i++) {
              s.particles.push({
                x: (nextX + 0.5) * cellSize,
                y: (nextY + 0.5) * cellSize,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: Math.random() * 3 + 1.5,
                color: '#22c55e',
                alpha: 1,
                life: 20
              });
            }

            // Gradually increase speed
            s.tickInterval = Math.max(50, baseTick - Math.floor(s.apples * 1.5));
            spawnFood();

            // Random chance for golden bonus fruit
            if (Math.random() < 0.28 && !s.goldenFood) {
              spawnGoldenFood();
            }
          }

          // Check golden bonus food collision
          if (s.goldenFood && nextX === s.goldenFood.x && nextY === s.goldenFood.y) {
            ate = true;
            sound.playPowerup();
            const bonus = s.goldenFood.type === 'golden' ? 50 : 35;
            s.score += bonus;
            setScore(s.score);

            // Sparks
            for (let i = 0; i < 20; i++) {
              s.particles.push({
                x: (nextX + 0.5) * cellSize,
                y: (nextY + 0.5) * cellSize,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: '#fbbf24',
                alpha: 1,
                life: 25
              });
            }

            s.goldenFood = null;
          }

          // If did not eat, remove tail
          if (!ate) {
            s.snake.pop();
          }
        }

        // Combo timer fade
        if (s.comboTimer > 0) {
          s.comboTimer--;
          if (s.comboTimer <= 0) {
            s.combo = 1;
            setCombo(1);
          }
        }

        // Golden food timer
        if (s.goldenFood && s.goldenFood.timer) {
          s.goldenFood.timer--;
          if (s.goldenFood.timer <= 0) {
            s.goldenFood = null;
          }
        }

        // Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 1 / p.life;
          if (p.alpha <= 0) {
            s.particles.splice(i, 1);
          }
        }
      }

      // === DRAW SCENE ===
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Border outline if wall collision active
      if (!s.wrapWalls) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, width - 4, height - 4);
      }

      // Draw Normal Food
      const fx = s.food.x * cellSize + cellSize / 2;
      const fy = s.food.y * cellSize + cellSize / 2;
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(fx, fy, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Stem & Leaf
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(fx - 1, fy - cellSize * 0.45, 2, 4);
      ctx.restore();

      // Draw Golden Bonus Food
      if (s.goldenFood) {
        const gx = s.goldenFood.x * cellSize + cellSize / 2;
        const gy = s.goldenFood.y * cellSize + cellSize / 2;
        ctx.save();
        ctx.fillStyle = s.goldenFood.type === 'golden' ? '#fbbf24' : '#38bdf8';
        ctx.shadowColor = s.goldenFood.type === 'golden' ? '#fbbf24' : '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(gx, gy, cellSize * 0.44, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.goldenFood.type === 'golden' ? '★' : '⚡', gx, gy);
        ctx.restore();
      }

      // Draw Snake Body
      for (let i = s.snake.length - 1; i >= 0; i--) {
        const seg = s.snake[i];
        const isHead = i === 0;
        const segX = seg.x * cellSize;
        const segY = seg.y * cellSize;

        ctx.save();
        if (isHead) {
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.roundRect(segX + 1, segY + 1, cellSize - 2, cellSize - 2, 6);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          const eyeSize = 3;
          let ex1 = segX + 5;
          let ey1 = segY + 5;
          let ex2 = segX + cellSize - 8;
          let ey2 = segY + 5;

          if (s.direction.y === 1) {
            ey1 = ey2 = segY + cellSize - 7;
          } else if (s.direction.x === 1) {
            ex1 = ex2 = segX + cellSize - 7;
            ey1 = segY + 5;
            ey2 = segY + cellSize - 8;
          } else if (s.direction.x === -1) {
            ex1 = ex2 = segX + 5;
            ey1 = segY + 5;
            ey2 = segY + cellSize - 8;
          }

          ctx.fillRect(ex1, ey1, eyeSize, eyeSize);
          ctx.fillRect(ex2, ey2, eyeSize, eyeSize);
        } else {
          // Body gradient
          const alpha = 0.5 + (0.5 * (s.snake.length - i)) / s.snake.length;
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.beginPath();
          ctx.roundRect(segX + 2, segY + 2, cellSize - 4, cellSize - 4, 4);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Particles
      for (const p of s.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [baseTick, onGameOver, spawnFood, spawnGoldenFood]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* HUD Header */}
      <div className="w-full max-w-[560px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-400 block">ĐIỂM SỐ</span>
            <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">{score}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">KỶ LỤC</span>
            <span className="font-mono text-lg font-bold text-slate-300 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">ĐÃ ĂN</span>
            <span className="font-mono text-lg font-bold text-rose-400 tabular-nums">{applesEaten}</span>
          </div>
          {combo > 1 && (
            <div className="animate-pulse">
              <span className="text-xs text-amber-400 block font-bold">COMBO</span>
              <span className="font-mono text-base font-black text-amber-300 tabular-nums">x{combo}!</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWrapWalls(prev => !prev)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              wrapWalls
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}
            title="Bật/Tắt chế độ xuyên tường"
          >
            {wrapWalls ? 'Xuyên tường' : 'Đâm vào tường chết'}
          </button>

          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <canvas
          ref={canvasRef}
          width={560}
          height={560}
          className="w-full h-full game-canvas block"
        />

        {/* Start Game Modal */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
              RẮN SĂN MỒI NEON
            </h2>
            <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
              Thu thập mồi đỏ, bắt sao vàng tăng tốc và kéo dài chuỗi combo kỷ lục mà không cắn vào đuôi!
            </p>

            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <h3 className="text-2xl font-bold mb-4">TRÒ CHƠI TẠM DỪNG</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsPaused(false);
                  stateRef.current.isPaused = false;
                }}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục
              </button>
              <button
                onClick={startGame}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Chơi lại
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">TRÒ CHƠI KẾT THÚC</span>
            <h2 className="text-4xl font-black text-rose-500 mb-4">RẮN ĐÃ BỊ ĐỨT ĐOẠN</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 max-w-xs w-full">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Điểm số đạt được:</span>
                <span className="font-mono font-bold text-emerald-400 text-lg tabular-nums">{score}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Mồi đã thu hoạch:</span>
                <span className="font-mono font-semibold text-rose-400 tabular-nums">{applesEaten} trái</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-400">Kỷ lục cao nhất:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">{Math.max(score, highScore)}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Lại Ngay
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch D-Pad */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <button
          onClick={() => setDirection({ x: 0, y: -1 })}
          className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
          aria-label="Lên"
        >
          <ArrowUp className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDirection({ x: -1, y: 0 })}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
            aria-label="Trái"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setDirection({ x: 0, y: 1 })}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
            aria-label="Xuống"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => setDirection({ x: 1, y: 0 })}
            className="w-14 h-12 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-slate-200 shadow-md transition-colors"
            aria-label="Phải"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
