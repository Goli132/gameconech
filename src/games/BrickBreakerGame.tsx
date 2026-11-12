import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { GameDifficulty } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Heart, Zap, Sparkles } from 'lucide-react';

interface BrickBreakerProps {
  difficulty: GameDifficulty;
  onGameOver: (score: number) => void;
  highScore: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
  isBomb?: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'multiball' | 'wide' | 'life' | 'laser' | 'slow';
  radius: number;
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

export const BrickBreakerGame: React.FC<BrickBreakerProps> = ({
  difficulty,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [gameOver, setGameOver] = useState(false);
  const [levelWon, setLevelWon] = useState(false);

  const initialPaddleWidth = difficulty === 'easy' ? 120 : difficulty === 'hard' ? 80 : 100;
  const baseSpeed = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 7 : 6;

  const stateRef = useRef({
    paddle: {
      x: 250,
      y: 640,
      width: initialPaddleWidth,
      height: 14,
      speed: 9,
      laserActive: false,
      laserTimer: 0,
      shootCooldown: 0
    },
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    lasers: [] as Array<{ x: number; y: number; vy: number }>,
    keys: { left: false, right: false, space: false },
    mouseActive: false,
    mouseX: 300,
    score: 0,
    lives: 3,
    level: 1,
    isPlaying: false,
    isPaused: false
  });

  // Toggle Sound
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Generate bricks for a level
  const generateLevelBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const rows = Math.min(8, 4 + Math.floor(lvl * 0.7));
    const cols = 8;
    const padding = 6;
    const brickWidth = (600 - padding * (cols + 1)) / cols;
    const brickHeight = 22;
    const offsetY = 60;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip some bricks in later levels to make interesting patterns
        if (lvl % 2 === 0 && (r + c) % 4 === 0) continue;

        let hp = 1;
        let color = '#38bdf8'; // Blue
        let isBomb = false;

        if (r === 0) {
          hp = Math.min(3, 1 + Math.floor(lvl / 2));
          color = hp >= 3 ? '#ec4899' : '#f59e0b';
        } else if (r === 1) {
          hp = Math.min(2, lvl > 1 ? 2 : 1);
          color = hp === 2 ? '#10b981' : '#38bdf8';
        }

        // Bomb brick chance
        if (Math.random() < 0.08) {
          isBomb = true;
          color = '#ef4444';
          hp = 1;
        }

        bricks.push({
          x: padding + c * (brickWidth + padding),
          y: offsetY + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          hp,
          maxHp: hp,
          color,
          isBomb
        });
      }
    }
    return bricks;
  }, []);

  // Reset ball on paddle
  const resetBall = useCallback(() => {
    const s = stateRef.current;
    s.balls = [
      {
        x: s.paddle.x + s.paddle.width / 2,
        y: s.paddle.y - 12,
        vx: (Math.random() > 0.5 ? 1 : -1) * (baseSpeed * 0.6),
        vy: -baseSpeed,
        radius: 7,
        speed: baseSpeed
      }
    ];
  }, [baseSpeed]);

  // Start new game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.paddle.x = 300 - initialPaddleWidth / 2;
    s.paddle.width = initialPaddleWidth;
    s.paddle.laserActive = false;
    s.paddle.laserTimer = 0;
    s.score = 0;
    s.lives = 3;
    s.level = 1;
    s.powerUps = [];
    s.particles = [];
    s.lasers = [];
    s.bricks = generateLevelBricks(1);
    s.isPlaying = true;
    s.isPaused = false;

    resetBall();

    setScore(0);
    setLives(3);
    setLevel(1);
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
    setLevelWon(false);

    sound.playBounce(600);
  }, [generateLevelBricks, initialPaddleWidth, resetBall]);

  // Advance level
  const advanceLevel = useCallback(() => {
    const s = stateRef.current;
    s.level++;
    setLevel(s.level);
    s.bricks = generateLevelBricks(s.level);
    s.powerUps = [];
    s.lasers = [];
    resetBall();
    setLevelWon(false);
    sound.playVictory();
  }, [generateLevelBricks, resetBall]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = true;
      if (e.code === 'Space') k.space = true;
      if (e.code === 'KeyP') {
        setIsPaused(prev => {
          const next = !prev;
          stateRef.current.isPaused = next;
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = false;
      if (e.code === 'Space') k.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Render & Physics Loop
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
      if (s.isPlaying && !s.isPaused) {
        // Paddle movement
        if (s.mouseActive) {
          s.paddle.x = s.mouseX - s.paddle.width / 2;
        } else {
          if (s.keys.left) s.paddle.x -= s.paddle.speed;
          if (s.keys.right) s.paddle.x += s.paddle.speed;
        }
        // Clamp paddle
        s.paddle.x = Math.max(0, Math.min(width - s.paddle.width, s.paddle.x));

        // Laser paddle timer & shooting
        if (s.paddle.laserTimer > 0) {
          s.paddle.laserTimer--;
          if (s.paddle.laserTimer <= 0) {
            s.paddle.laserActive = false;
          }
          s.paddle.shootCooldown--;
          if (s.paddle.shootCooldown <= 0) {
            s.paddle.shootCooldown = 18;
            s.lasers.push({ x: s.paddle.x + 8, y: s.paddle.y, vy: -12 });
            s.lasers.push({ x: s.paddle.x + s.paddle.width - 8, y: s.paddle.y, vy: -12 });
            sound.playLaser(900);
          }
        }

        // Update Lasers
        for (let lIdx = s.lasers.length - 1; lIdx >= 0; lIdx--) {
          const l = s.lasers[lIdx];
          l.y += l.vy;
          if (l.y < 0) {
            s.lasers.splice(lIdx, 1);
            continue;
          }

          // Laser hit brick
          for (let bIdx = s.bricks.length - 1; bIdx >= 0; bIdx--) {
            const br = s.bricks[bIdx];
            if (l.x >= br.x && l.x <= br.x + br.width && l.y >= br.y && l.y <= br.y + br.height) {
              s.lasers.splice(lIdx, 1);
              br.hp--;
              sound.playBrickHit(true);

              if (br.hp <= 0) {
                s.score += 25;
                setScore(s.score);
                s.bricks.splice(bIdx, 1);
              }
              break;
            }
          }
        }

        // Update Balls
        for (let bIdx = s.balls.length - 1; bIdx >= 0; bIdx--) {
          const ball = s.balls[bIdx];
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall bounces
          if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            sound.playBounce(480);
          } else if (ball.x + ball.radius > width) {
            ball.x = width - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            sound.playBounce(480);
          }

          if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sound.playBounce(520);
          }

          // Paddle collision
          if (
            ball.y + ball.radius >= s.paddle.y &&
            ball.y - ball.radius <= s.paddle.y + s.paddle.height &&
            ball.x >= s.paddle.x &&
            ball.x <= s.paddle.x + s.paddle.width &&
            ball.vy > 0
          ) {
            sound.playBounce(400);

            // Angle reflection based on hit position
            const hitOffset = (ball.x - (s.paddle.x + s.paddle.width / 2)) / (s.paddle.width / 2);
            const maxAngle = Math.PI * 0.42; // ~75 degrees
            const angle = hitOffset * maxAngle;
            const currentSpeed = Math.hypot(ball.vx, ball.vy);

            ball.vx = currentSpeed * Math.sin(angle);
            ball.vy = -Math.abs(currentSpeed * Math.cos(angle));

            // Paddle bounce particles
            for (let i = 0; i < 6; i++) {
              s.particles.push({
                x: ball.x,
                y: s.paddle.y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                radius: Math.random() * 2 + 1,
                color: '#38bdf8',
                alpha: 1,
                life: 15
              });
            }
          }

          // Check brick collisions
          for (let brIdx = s.bricks.length - 1; brIdx >= 0; brIdx--) {
            const br = s.bricks[brIdx];

            // Nearest point on brick to ball
            const closeX = Math.max(br.x, Math.min(ball.x, br.x + br.width));
            const closeY = Math.max(br.y, Math.min(ball.y, br.y + br.height));
            const dist = Math.hypot(ball.x - closeX, ball.y - closeY);

            if (dist < ball.radius) {
              // Determine which face was hit
              const overlapLeft = (ball.x + ball.radius) - br.x;
              const overlapRight = (br.x + br.width) - (ball.x - ball.radius);
              const overlapTop = (ball.y + ball.radius) - br.y;
              const overlapBottom = (br.y + br.height) - (ball.y - ball.radius);

              const minOverlapX = Math.min(overlapLeft, overlapRight);
              const minOverlapY = Math.min(overlapTop, overlapBottom);

              if (minOverlapX < minOverlapY) {
                ball.vx *= -1;
              } else {
                ball.vy *= -1;
              }

              br.hp--;
              sound.playBrickHit(br.hp <= 0);

              // Brick hit particles
              for (let i = 0; i < 8; i++) {
                s.particles.push({
                  x: closeX,
                  y: closeY,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  radius: Math.random() * 2.5 + 1,
                  color: br.color,
                  alpha: 1,
                  life: 20
                });
              }

              // Destroy brick if HP depleted
              if (br.hp <= 0) {
                s.score += br.maxHp * 20;
                setScore(s.score);

                // Bomb detonation: destroys adjacent bricks!
                if (br.isBomb) {
                  sound.playExplosion(false);
                  for (let nIdx = s.bricks.length - 1; nIdx >= 0; nIdx--) {
                    if (nIdx === brIdx) continue;
                    const neighbor = s.bricks[nIdx];
                    const ndist = Math.hypot((neighbor.x + neighbor.width / 2) - (br.x + br.width / 2), (neighbor.y + neighbor.height / 2) - (br.y + br.height / 2));
                    if (ndist < 80) {
                      s.bricks.splice(nIdx, 1);
                      s.score += 20;
                    }
                  }
                }

                // Power up drop
                if (Math.random() < 0.28) {
                  const types: Array<'multiball' | 'wide' | 'life' | 'laser' | 'slow'> = [
                    'multiball', 'wide', 'life', 'laser', 'slow'
                  ];
                  s.powerUps.push({
                    x: br.x + br.width / 2,
                    y: br.y + br.height / 2,
                    vy: 2.2,
                    type: types[Math.floor(Math.random() * types.length)],
                    radius: 12
                  });
                }

                s.bricks.splice(brIdx, 1);

                // Level win check
                if (s.bricks.length === 0) {
                  setLevelWon(true);
                  s.isPlaying = false;
                  sound.playVictory();
                }
              }
              break;
            }
          }

          // Ball falls below screen
          if (ball.y - ball.radius > height) {
            s.balls.splice(bIdx, 1);
          }
        }

        // If all balls lost
        if (s.balls.length === 0 && s.isPlaying) {
          s.lives--;
          setLives(s.lives);
          sound.playGameOver();

          if (s.lives <= 0) {
            s.isPlaying = false;
            setGameOver(true);
            onGameOver(s.score);
          } else {
            resetBall();
          }
        }

        // Update Powerups
        for (let pIdx = s.powerUps.length - 1; pIdx >= 0; pIdx--) {
          const pup = s.powerUps[pIdx];
          pup.y += pup.vy;

          if (pup.y > height + 20) {
            s.powerUps.splice(pIdx, 1);
            continue;
          }

          // Catch powerup with paddle
          if (
            pup.y + pup.radius >= s.paddle.y &&
            pup.y - pup.radius <= s.paddle.y + s.paddle.height &&
            pup.x >= s.paddle.x &&
            pup.x <= s.paddle.x + s.paddle.width
          ) {
            sound.playPowerup();
            if (pup.type === 'multiball') {
              if (s.balls.length > 0) {
                const mainB = s.balls[0];
                s.balls.push({
                  x: mainB.x,
                  y: mainB.y,
                  vx: mainB.vx + 2,
                  vy: mainB.vy,
                  radius: mainB.radius,
                  speed: mainB.speed
                });
                s.balls.push({
                  x: mainB.x,
                  y: mainB.y,
                  vx: mainB.vx - 2,
                  vy: mainB.vy,
                  radius: mainB.radius,
                  speed: mainB.speed
                });
              }
            } else if (pup.type === 'wide') {
              s.paddle.width = 160;
              setTimeout(() => {
                stateRef.current.paddle.width = initialPaddleWidth;
              }, 12000);
            } else if (pup.type === 'life') {
              s.lives = Math.min(5, s.lives + 1);
              setLives(s.lives);
            } else if (pup.type === 'laser') {
              s.paddle.laserActive = true;
              s.paddle.laserTimer = 500;
              s.paddle.shootCooldown = 0;
            } else if (pup.type === 'slow') {
              for (const b of s.balls) {
                b.vx *= 0.7;
                b.vy *= 0.7;
              }
            }
            s.powerUps.splice(pIdx, 1);
          }
        }

        // Update Particles
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

      // Draw Bricks
      for (const br of s.bricks) {
        ctx.save();
        ctx.fillStyle = br.color;
        ctx.shadowColor = br.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.width, br.height, 4);
        ctx.fill();

        // Brick HP indicator or bomb icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (br.isBomb) {
          ctx.fillText('💣', br.x + br.width / 2, br.y + br.height / 2);
        } else if (br.maxHp > 1) {
          ctx.fillText(String(br.hp), br.x + br.width / 2, br.y + br.height / 2);
        }
        ctx.restore();
      }

      // Draw PowerUps
      for (const pup of s.powerUps) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pup.x, pup.y, pup.radius, 0, Math.PI * 2);
        ctx.fillStyle = pup.type === 'multiball' ? '#38bdf8' :
                        pup.type === 'wide' ? '#10b981' :
                        pup.type === 'life' ? '#f43f5e' :
                        pup.type === 'laser' ? '#a855f7' : '#fbbf24';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = pup.type === 'multiball' ? '3X' :
                      pup.type === 'wide' ? 'W' :
                      pup.type === 'life' ? '♥' :
                      pup.type === 'laser' ? 'L' : 'S';
        ctx.fillText(label, pup.x, pup.y);
        ctx.restore();
      }

      // Draw Lasers
      for (const l of s.lasers) {
        ctx.save();
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 8;
        ctx.fillRect(l.x - 2, l.y, 4, 12);
        ctx.restore();
      }

      // Draw Balls
      for (const b of s.balls) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Paddle
      ctx.save();
      ctx.fillStyle = s.paddle.laserActive ? '#c084fc' : '#38bdf8';
      ctx.shadowColor = s.paddle.laserActive ? '#c084fc' : '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(s.paddle.x, s.paddle.y, s.paddle.width, s.paddle.height, 6);
      ctx.fill();

      // Laser cannons on sides if laser is active
      if (s.paddle.laserActive) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(s.paddle.x + 4, s.paddle.y - 4, 6, 6);
        ctx.fillRect(s.paddle.x + s.paddle.width - 10, s.paddle.y - 4, 6, 6);
      }
      ctx.restore();

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

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [baseSpeed, initialPaddleWidth, onGameOver]);

  // Pointer controls for paddle
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
    stateRef.current.mouseActive = true;
  };

  const handlePointerLeave = () => {
    stateRef.current.mouseActive = false;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Header HUD */}
      <div className="w-full max-w-[600px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-400 block">ĐIỂM SỐ</span>
            <span className="font-mono text-lg font-bold text-sky-400 tabular-nums">{score}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">KỶ LỤC</span>
            <span className="font-mono text-lg font-bold text-slate-300 tabular-nums">{Math.max(score, highScore)}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">MÀN CHƠI</span>
            <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">{level}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative w-full max-w-[600px] aspect-[6/7] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0f172a]">
        <canvas
          ref={canvasRef}
          width={600}
          height={700}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full game-canvas cursor-pointer block"
        />

        {/* Start Game Modal */}
        {!isPlaying && !gameOver && !levelWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
              <Zap className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
              ĐẬP GẠCH PHÁ KHỐI NEON
            </h2>
            <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
              Dùng thanh trượt điều khiển quả cầu phá tan các khối gạch, nhặt vật phẩm nảy bóng và mở khóa cấp độ mới!
            </p>

            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Level Clear Modal */}
        {levelWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-emerald-400 mb-2">QUA MÀN XUẤT SẮC!</h2>
            <p className="text-slate-300 text-sm mb-6">Bạn đã dọn sạch toàn bộ các khối gạch ở Cấp {level}.</p>
            <button
              onClick={advanceLevel}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 text-base cursor-pointer"
            >
              Tiến Vào Cấp {level + 1}
            </button>
          </div>
        )}

        {/* Pause Screen */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <h3 className="text-2xl font-bold mb-4">TRÒ CHƠI TẠM DỪNG</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsPaused(false);
                  stateRef.current.isPaused = false;
                }}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-all cursor-pointer"
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
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">HẾT MẠNG</span>
            <h2 className="text-4xl font-black text-rose-500 mb-4">BÓNG ĐÃ RƠI HẾT</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 max-w-xs w-full">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Điểm số đạt được:</span>
                <span className="font-mono font-bold text-sky-400 text-lg tabular-nums">{score}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Cấp độ đạt được:</span>
                <span className="font-mono font-semibold text-emerald-400 tabular-nums">Cấp {level}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-400">Kỷ lục cao nhất:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">{Math.max(score, highScore)}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Lại Ngay
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[600px] mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
        <span>Rê chuột hoặc kéo ngón tay trên màn hình để di chuyển thanh trượt</span>
        <span>Phím A/D hoặc Mũi tên Trái/Phải</span>
      </div>
    </div>
  );
};
