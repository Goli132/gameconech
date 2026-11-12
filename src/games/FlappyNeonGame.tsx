import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { GameDifficulty } from '../types';
import { Play, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface FlappyNeonProps {
  difficulty: GameDifficulty;
  onGameOver: (score: number) => void;
  highScore: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  hasCoin: boolean;
  coinCollected: boolean;
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

export const FlappyNeonGame: React.FC<FlappyNeonProps> = ({
  difficulty,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [gameOver, setGameOver] = useState(false);

  // Difficulty parameters
  const gapSize = difficulty === 'easy' ? 175 : difficulty === 'hard' ? 125 : 150;
  const pipeSpeed = difficulty === 'easy' ? 2.3 : difficulty === 'hard' ? 3.5 : 2.8;

  const stateRef = useRef({
    bird: {
      x: 100,
      y: 260,
      radius: 14,
      vy: 0,
      gravity: 0.38,
      jump: -7.2,
      rotation: 0
    },
    pipes: [] as Pipe[],
    particles: [] as Particle[],
    pipeSpawnTimer: 0,
    score: 0,
    coins: 0,
    isPlaying: false
  });

  // Toggle Sound
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Jump / Flap action
  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlaying) return;

    s.bird.vy = s.bird.jump;
    sound.playBounce(550);

    // Flap spark particles
    for (let i = 0; i < 6; i++) {
      s.particles.push({
        x: s.bird.x - 10,
        y: s.bird.y + (Math.random() - 0.5) * 8,
        vx: -Math.random() * 3 - 1,
        vy: (Math.random() - 0.5) * 3,
        radius: Math.random() * 2 + 1,
        color: '#facc15',
        alpha: 1,
        life: 18
      });
    }
  }, []);

  // Start / Restart
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.bird.y = 260;
    s.bird.vy = -3;
    s.pipes = [];
    s.particles = [];
    s.pipeSpawnTimer = 0;
    s.score = 0;
    s.coins = 0;
    s.isPlaying = true;

    setScore(0);
    setCoins(0);
    setIsPlaying(true);
    setGameOver(false);
    sound.playBounce(600);
  }, []);

  // Keyboard trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!stateRef.current.isPlaying) {
          startGame();
        } else {
          jump();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, startGame]);

  // Main Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Update
      if (s.isPlaying) {
        // Bird physics
        s.bird.vy += s.bird.gravity;
        s.bird.y += s.bird.vy;

        // Rotation according to velocity
        s.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.bird.vy * 0.08));

        // Floor and ceiling collisions
        if (s.bird.y - s.bird.radius < 0) {
          s.bird.y = s.bird.radius;
          s.bird.vy = 0;
        }

        if (s.bird.y + s.bird.radius > height - 30) {
          // Crash on floor
          s.isPlaying = false;
          setGameOver(true);
          sound.playGameOver();
          onGameOver(s.score);
        }

        // Spawn pipes
        s.pipeSpawnTimer--;
        if (s.pipeSpawnTimer <= 0) {
          s.pipeSpawnTimer = 95;
          const minPipe = 70;
          const maxPipe = height - gapSize - minPipe - 30;
          const topH = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          const bottomH = height - topH - gapSize - 30;

          s.pipes.push({
            x: width + 20,
            topHeight: topH,
            bottomHeight: bottomH,
            passed: false,
            hasCoin: Math.random() < 0.45,
            coinCollected: false
          });
        }

        // Update Pipes
        const pipeWidth = 56;
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const p = s.pipes[i];
          p.x -= pipeSpeed;

          // Remove offscreen pipes
          if (p.x + pipeWidth < -20) {
            s.pipes.splice(i, 1);
            continue;
          }

          // Check score passed
          if (!p.passed && p.x + pipeWidth < s.bird.x) {
            p.passed = true;
            s.score++;
            setScore(s.score);
            sound.playEat();
          }

          // Check Coin Collection
          if (p.hasCoin && !p.coinCollected) {
            const coinX = p.x + pipeWidth / 2;
            const coinY = p.topHeight + gapSize / 2;
            const dist = Math.hypot(s.bird.x - coinX, s.bird.y - coinY);

            if (dist < s.bird.radius + 12) {
              p.coinCollected = true;
              s.coins++;
              s.score += 5;
              setCoins(s.coins);
              setScore(s.score);
              sound.playPowerup();

              // Spark particles
              for (let cp = 0; cp < 10; cp++) {
                s.particles.push({
                  x: coinX,
                  y: coinY,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  radius: Math.random() * 3 + 1,
                  color: '#facc15',
                  alpha: 1,
                  life: 20
                });
              }
            }
          }

          // Collision check with pipes
          const birdBox = {
            left: s.bird.x - s.bird.radius + 2,
            right: s.bird.x + s.bird.radius - 2,
            top: s.bird.y - s.bird.radius + 2,
            bottom: s.bird.y + s.bird.radius - 2
          };

          // Top pipe collision
          if (
            birdBox.right > p.x &&
            birdBox.left < p.x + pipeWidth &&
            birdBox.top < p.topHeight
          ) {
            s.isPlaying = false;
            setGameOver(true);
            sound.playGameOver();
            onGameOver(s.score);
          }

          // Bottom pipe collision
          const bottomPipeY = height - 30 - p.bottomHeight;
          if (
            birdBox.right > p.x &&
            birdBox.left < p.x + pipeWidth &&
            birdBox.bottom > bottomPipeY
          ) {
            s.isPlaying = false;
            setGameOver(true);
            sound.playGameOver();
            onGameOver(s.score);
          }
        }

        // Update Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const part = s.particles[i];
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= 1 / part.life;
          if (part.alpha <= 0) {
            s.particles.splice(i, 1);
          }
        }
      }

      // === DRAW SCENE ===
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Distant neon skyline grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Pipes
      const pipeW = 56;
      for (const p of s.pipes) {
        ctx.save();
        ctx.fillStyle = '#065f46';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;

        // Top Pipe
        ctx.beginPath();
        ctx.roundRect(p.x, 0, pipeW, p.topHeight, [0, 0, 8, 8]);
        ctx.fill();
        ctx.stroke();

        // Top pipe lip
        ctx.fillStyle = '#047857';
        ctx.fillRect(p.x - 3, p.topHeight - 16, pipeW + 6, 16);
        ctx.strokeRect(p.x - 3, p.topHeight - 16, pipeW + 6, 16);

        // Bottom Pipe
        const bottomY = height - 30 - p.bottomHeight;
        ctx.beginPath();
        ctx.roundRect(p.x, bottomY, pipeW, p.bottomHeight, [8, 8, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Bottom pipe lip
        ctx.fillRect(p.x - 3, bottomY, pipeW + 6, 16);
        ctx.strokeRect(p.x - 3, bottomY, pipeW + 6, 16);

        // Draw Coin if exists and not collected
        if (p.hasCoin && !p.coinCollected) {
          const cx = p.x + pipeW / 2;
          const cy = p.topHeight + gapSize / 2;
          ctx.save();
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#78350f';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', cx, cy);
          ctx.restore();
        }

        ctx.restore();
      }

      // Draw Floor Ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, height - 30, width, 30);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, height - 30);
      ctx.lineTo(width, height - 30);
      ctx.stroke();

      // Draw Particles
      for (const part of s.particles) {
        ctx.save();
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.alpha;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Bird
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      ctx.rotate(s.bird.rotation);

      // Bird body glow
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(19, 1);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.fill();

      // Wing
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gapSize, onGameOver, pipeSpeed]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Top HUD */}
      <div className="w-full max-w-[500px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-400 block">ĐIỂM SỐ</span>
            <span className="font-mono text-lg font-bold text-amber-400 tabular-nums">{score}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">KỶ LỤC</span>
            <span className="font-mono text-lg font-bold text-slate-300 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">TIỀN VÀNG</span>
            <span className="font-mono text-lg font-bold text-yellow-300 tabular-nums">{coins}</span>
          </div>
        </div>

        <button
          onClick={handleToggleSound}
          aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* Main Canvas */}
      <div
        onClick={isPlaying ? jump : startGame}
        className="relative w-full max-w-[500px] aspect-[5/6] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090d16] cursor-pointer select-none"
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={600}
          className="w-full h-full game-canvas block"
        />

        {/* Start Game Overlay */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
              FLAPPY NEON BIRD
            </h2>
            <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
              Chạm vào màn hình hoặc ấn phím Space để đập cánh bay qua các chướng ngại vật ống khói neon!
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              Bắt Đầu Bay
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">RƠI XUỐNG</span>
            <h2 className="text-4xl font-black text-rose-500 mb-4">CHẠM VẬT CẢN!</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 max-w-xs w-full">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Điểm số đạt được:</span>
                <span className="font-mono font-bold text-amber-400 text-lg tabular-nums">{score}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Tiền vàng nhặt được:</span>
                <span className="font-mono font-semibold text-yellow-300 tabular-nums">{coins}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-400">Kỷ lục cao nhất:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">{Math.max(score, highScore)}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Bay Lại Ngay
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[500px] mt-3 text-center text-xs text-slate-400">
        <span>Nhấp chuột hoặc chạm bất kỳ đâu trên màn hình / Phím Cách (Space) để bay</span>
      </div>
    </div>
  );
};
