import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { GameDifficulty } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Zap, Bomb, Heart } from 'lucide-react';

interface SpaceShooterGameProps {
  difficulty: GameDifficulty;
  onGameOver: (score: number) => void;
  highScore: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isEnemy?: boolean;
  damage: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  vx: number;
  vy: number;
  type: 'scout' | 'interceptor' | 'heavy' | 'asteroid' | 'boss';
  shootCooldown: number;
  color: string;
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

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

interface DropItem {
  x: number;
  y: number;
  type: 'triple' | 'shield' | 'bomb' | 'heal' | 'laser';
  vy: number;
  radius: number;
}

export const SpaceShooterGame: React.FC<SpaceShooterGameProps> = ({
  difficulty,
  onGameOver,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [hasShield, setHasShield] = useState(false);
  const [bombsAvailable, setBombsAvailable] = useState(2);
  const [weaponType, setWeaponType] = useState<'single' | 'triple' | 'laser'>('single');
  const [weaponTimer, setWeaponTimer] = useState(0);
  const [autoFire, setAutoFire] = useState(true);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [gameOver, setGameOver] = useState(false);

  // Difficulty multipliers
  const diffMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.4 : 1.0;

  // Mutable game state held in ref for the 60fps render loop
  const stateRef = useRef({
    player: {
      x: 300,
      y: 500,
      width: 44,
      height: 48,
      speed: 6,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      shield: false,
      shieldTimer: 0,
      invulnerableTimer: 0,
      shootCooldown: 0,
      weapon: 'single' as 'single' | 'triple' | 'laser',
      weaponTimer: 0,
      bombs: 2
    },
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false
    },
    autoFire: true,
    mousePos: { x: 300, y: 500, active: false },
    score: 0,
    wave: 1,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    dropItems: [] as DropItem[],
    floatingTexts: [] as FloatingText[],
    stars: [] as Star[],
    bossActive: false,
    bossSpawnTimer: 0,
    waveSpawnCooldown: 60,
    shakeIntensity: 0,
    isPaused: false,
    isPlaying: false
  });

  // Toggle Sound
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Trigger Bomb
  const triggerBomb = useCallback(() => {
    const s = stateRef.current;
    if (s.player.bombs <= 0 || !s.isPlaying || s.isPaused) return;

    s.player.bombs--;
    setBombsAvailable(s.player.bombs);
    sound.playExplosion(true);
    s.shakeIntensity = 20;

    // Eliminate all non-boss enemies
    s.enemies = s.enemies.filter((enemy) => {
      if (enemy.type === 'boss') {
        enemy.hp -= 200;
        return enemy.hp > 0;
      }
      // Add explosion particles
      for (let i = 0; i < 20; i++) {
        s.particles.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: Math.random() * 4 + 2,
          color: '#f59e0b',
          alpha: 1,
          life: 30
        });
      }
      s.score += 50;
      return false;
    });

    s.bullets = s.bullets.filter(b => !b.isEnemy);
    s.floatingTexts.push({
      text: 'BOOOM! EMP BOMB',
      x: 300,
      y: 350,
      color: '#38bdf8',
      alpha: 1,
      vy: -1.5
    });
    setScore(s.score);
  }, []);

  // Initialize game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.player.x = 300;
    s.player.y = 520;
    s.player.hp = 100;
    s.player.maxHp = 100;
    s.player.shield = false;
    s.player.shieldTimer = 0;
    s.player.invulnerableTimer = 30;
    s.player.weapon = 'single';
    s.player.weaponTimer = 0;
    s.player.bombs = difficulty === 'easy' ? 3 : 2;

    s.score = 0;
    s.wave = 1;
    s.enemies = [];
    s.bullets = [];
    s.particles = [];
    s.dropItems = [];
    s.floatingTexts = [];
    s.bossActive = false;
    s.bossSpawnTimer = 0;
    s.waveSpawnCooldown = 40;
    s.shakeIntensity = 0;
    s.isPlaying = true;
    s.isPaused = false;

    setScore(0);
    setWave(1);
    setPlayerHp(100);
    setHasShield(false);
    setBombsAvailable(s.player.bombs);
    setWeaponType('single');
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);

    sound.playBounce(500);
  }, [difficulty]);

  // Restart
  const handleRestart = () => {
    startGame();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = true;
      if (e.code === 'Space') {
        k.shoot = true;
        e.preventDefault();
      }
      if (e.code === 'KeyB') {
        triggerBomb();
      }
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
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = false;
      if (e.code === 'Space') k.shoot = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerBomb]);

  // Main Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create stars
    const stars: Star[] = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.7 + 0.3
      });
    }
    stateRef.current.stars = stars;

    let animationFrameId: number;

    const gameLoop = () => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Update screen shake
      let shakeX = 0;
      let shakeY = 0;
      if (s.shakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * s.shakeIntensity;
        shakeY = (Math.random() - 0.5) * s.shakeIntensity;
        s.shakeIntensity *= 0.88;
        if (s.shakeIntensity < 0.2) s.shakeIntensity = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Draw Space Background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Starfield
      for (const star of s.stars) {
        if (!s.isPaused) {
          star.y += star.speed;
          if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
          }
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // If not playing or paused, render overlay & return
      if (!s.isPlaying) {
        // Draw idle player ship in center
        ctx.restore();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      if (!s.isPaused) {
        // === UPDATE LOGIC ===

        // Weapon timer countdown
        if (s.player.weaponTimer > 0) {
          s.player.weaponTimer--;
          if (s.player.weaponTimer <= 0) {
            s.player.weapon = 'single';
            setWeaponType('single');
          }
          setWeaponTimer(s.player.weaponTimer);
        }

        // Shield countdown
        if (s.player.shieldTimer > 0) {
          s.player.shieldTimer--;
          if (s.player.shieldTimer <= 0) {
            s.player.shield = false;
            setHasShield(false);
          }
        }

        // Invulnerability countdown
        if (s.player.invulnerableTimer > 0) {
          s.player.invulnerableTimer--;
        }

        // Player movement
        if (s.mousePos.active) {
          // Smooth glide toward mouse position
          const dx = s.mousePos.x - s.player.x;
          const dy = s.mousePos.y - s.player.y;
          s.player.x += dx * 0.15;
          s.player.y += dy * 0.15;
        } else {
          // Keyboard movement
          if (s.keys.left) s.player.x -= s.player.speed;
          if (s.keys.right) s.player.x += s.player.speed;
          if (s.keys.up) s.player.y -= s.player.speed;
          if (s.keys.down) s.player.y += s.player.speed;
        }

        // Clamp inside canvas
        s.player.x = Math.max(25, Math.min(width - 25, s.player.x));
        s.player.y = Math.max(50, Math.min(height - 40, s.player.y));

        // Shooting logic
        if (s.player.shootCooldown > 0) {
          s.player.shootCooldown--;
        }

        const shouldShoot = (s.autoFire || s.keys.shoot || s.mousePos.active) && s.player.shootCooldown <= 0;
        if (shouldShoot) {
          const px = s.player.x;
          const py = s.player.y - 20;

          if (s.player.weapon === 'triple') {
            s.bullets.push({ x: px, y: py, vx: 0, vy: -12, color: '#38bdf8', damage: 25 });
            s.bullets.push({ x: px - 12, y: py, vx: -3, vy: -11, color: '#38bdf8', damage: 20 });
            s.bullets.push({ x: px + 12, y: py, vx: 3, vy: -11, color: '#38bdf8', damage: 20 });
            sound.playLaser(850);
            s.player.shootCooldown = 10;
          } else if (s.player.weapon === 'laser') {
            s.bullets.push({ x: px - 8, y: py, vx: 0, vy: -16, color: '#a855f7', damage: 35 });
            s.bullets.push({ x: px + 8, y: py, vx: 0, vy: -16, color: '#a855f7', damage: 35 });
            sound.playLaser(1050);
            s.player.shootCooldown = 7;
          } else {
            s.bullets.push({ x: px, y: py, vx: 0, vy: -10, color: '#22d3ee', damage: 25 });
            sound.playLaser(750);
            s.player.shootCooldown = 12;
          }
        }

        // Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.y < -20 || b.y > height + 20 || b.x < -20 || b.x > width + 20) {
            s.bullets.splice(i, 1);
            continue;
          }

          // Check enemy bullet hit player
          if (b.isEnemy) {
            const hitDist = Math.hypot(b.x - s.player.x, b.y - s.player.y);
            if (hitDist < 24) {
              s.bullets.splice(i, 1);
              if (s.player.shield) {
                sound.playBounce(300);
                s.floatingTexts.push({
                  text: 'BLOCK!',
                  x: s.player.x,
                  y: s.player.y - 30,
                  color: '#38bdf8',
                  alpha: 1,
                  vy: -1
                });
              } else if (s.player.invulnerableTimer <= 0) {
                s.player.hp -= b.damage;
                s.player.invulnerableTimer = 20;
                s.shakeIntensity = 8;
                sound.playExplosion(false);
                setPlayerHp(Math.max(0, s.player.hp));

                if (s.player.hp <= 0) {
                  s.isPlaying = false;
                  setGameOver(true);
                  sound.playGameOver();
                  onGameOver(s.score);
                }
              }
            }
          }
        }

        // Spawn Enemies
        s.waveSpawnCooldown--;
        if (s.waveSpawnCooldown <= 0 && !s.bossActive) {
          s.waveSpawnCooldown = Math.max(30, 70 - s.wave * 3);

          // Every 5th wave spawns a boss
          if (s.wave % 5 === 0 && s.enemies.length === 0) {
            s.bossActive = true;
            s.enemies.push({
              x: width / 2 - 70,
              y: -120,
              width: 140,
              height: 90,
              hp: 450 * s.wave * diffMultiplier,
              maxHp: 450 * s.wave * diffMultiplier,
              speed: 1.2,
              vx: 2,
              vy: 0.6,
              type: 'boss',
              shootCooldown: 40,
              color: '#ef4444'
            });
            s.floatingTexts.push({
              text: `⚠️ CẢNH BÁO BOSS CẤP ${s.wave}!`,
              x: width / 2,
              y: 200,
              color: '#ef4444',
              alpha: 1,
              vy: -0.5
            });
            sound.playExplosion(true);
          } else {
            // Spawn normal wave units
            const spawnCount = Math.min(6, Math.floor(s.wave * 0.7) + 2);
            for (let c = 0; c < spawnCount; c++) {
              const types: Array<'scout' | 'interceptor' | 'heavy' | 'asteroid'> = ['scout', 'interceptor', 'heavy', 'asteroid'];
              const type = types[Math.floor(Math.random() * types.length)];
              const size = type === 'heavy' ? 48 : type === 'asteroid' ? 40 : 34;

              s.enemies.push({
                x: 30 + Math.random() * (width - 80),
                y: -60 - c * 50,
                width: size,
                height: size,
                hp: (type === 'heavy' ? 70 : type === 'asteroid' ? 50 : 25) * diffMultiplier,
                maxHp: (type === 'heavy' ? 70 : type === 'asteroid' ? 50 : 25) * diffMultiplier,
                speed: (type === 'scout' ? 2.8 : type === 'interceptor' ? 3.4 : 1.8) * diffMultiplier,
                vx: type === 'interceptor' ? (Math.random() - 0.5) * 3 : 0,
                vy: type === 'asteroid' ? 2.2 : 2.0,
                type: type,
                shootCooldown: Math.floor(Math.random() * 60) + 40,
                color: type === 'heavy' ? '#f59e0b' : type === 'interceptor' ? '#ec4899' : type === 'asteroid' ? '#94a3b8' : '#10b981'
              });
            }
          }
        }

        // Update Enemies
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          e.x += e.vx;
          e.y += e.vy;

          if (e.type === 'interceptor') {
            if (e.x < 20 || e.x > width - e.width - 20) e.vx *= -1;
          }

          if (e.type === 'boss') {
            if (e.y < 80) {
              e.vy = 0.8;
            } else {
              e.vy = 0;
              if (e.x < 30 || e.x > width - e.width - 30) e.vx *= -1;
            }

            // Boss firing
            e.shootCooldown--;
            if (e.shootCooldown <= 0) {
              e.shootCooldown = 45;
              // Spread shots
              const bx = e.x + e.width / 2;
              const by = e.y + e.height;
              s.bullets.push({ x: bx, y: by, vx: -3, vy: 5, color: '#f87171', isEnemy: true, damage: 20 });
              s.bullets.push({ x: bx, y: by, vx: 0, vy: 6, color: '#f87171', isEnemy: true, damage: 25 });
              s.bullets.push({ x: bx, y: by, vx: 3, vy: 5, color: '#f87171', isEnemy: true, damage: 20 });
              sound.playLaser(400);
            }
          } else if (e.type !== 'asteroid') {
            // Normal enemies shoot occasionally
            e.shootCooldown--;
            if (e.shootCooldown <= 0 && e.y > 0 && e.y < height - 150) {
              e.shootCooldown = Math.floor(Math.random() * 80) + 60;
              s.bullets.push({
                x: e.x + e.width / 2,
                y: e.y + e.height,
                vx: 0,
                vy: 5,
                color: '#f87171',
                isEnemy: true,
                damage: 15
              });
            }
          }

          // Offscreen
          if (e.y > height + 50) {
            s.enemies.splice(i, 1);
            continue;
          }

          // Collision with player
          const pDist = Math.hypot((e.x + e.width / 2) - s.player.x, (e.y + e.height / 2) - s.player.y);
          if (pDist < (e.width / 2 + 18)) {
            if (s.player.shield) {
              s.player.shield = false;
              setHasShield(false);
              sound.playExplosion(false);
            } else if (s.player.invulnerableTimer <= 0) {
              s.player.hp -= 30;
              s.player.invulnerableTimer = 30;
              s.shakeIntensity = 12;
              sound.playExplosion(true);
              setPlayerHp(Math.max(0, s.player.hp));

              if (s.player.hp <= 0) {
                s.isPlaying = false;
                setGameOver(true);
                sound.playGameOver();
                onGameOver(s.score);
              }
            }

            if (e.type !== 'boss') {
              s.enemies.splice(i, 1);
              continue;
            }
          }

          // Player bullets hitting enemy
          for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = s.bullets[bIdx];
            if (b.isEnemy) continue;

            if (
              b.x >= e.x &&
              b.x <= e.x + e.width &&
              b.y >= e.y &&
              b.y <= e.y + e.height
            ) {
              e.hp -= b.damage;
              s.bullets.splice(bIdx, 1);

              // Sparks
              for (let p = 0; p < 4; p++) {
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  radius: Math.random() * 2 + 1,
                  color: '#67e8f9',
                  alpha: 1,
                  life: 15
                });
              }

              if (e.hp <= 0) {
                // Destroyed enemy
                sound.playExplosion(e.type === 'boss');
                const killPoints = e.type === 'boss' ? 1000 : e.type === 'heavy' ? 120 : 60;
                s.score += killPoints;
                setScore(s.score);

                // Chance to drop power-up item
                if (Math.random() < (e.type === 'boss' ? 1 : 0.28)) {
                  const dropTypes: Array<'triple' | 'shield' | 'bomb' | 'heal' | 'laser'> = [
                    'triple', 'shield', 'bomb', 'heal', 'laser'
                  ];
                  const chosen = dropTypes[Math.floor(Math.random() * dropTypes.length)];
                  s.dropItems.push({
                    x: e.x + e.width / 2,
                    y: e.y + e.height / 2,
                    type: chosen,
                    vy: 2.2,
                    radius: 14
                  });
                }

                // Explosions
                const partCount = e.type === 'boss' ? 45 : 15;
                for (let p = 0; p < partCount; p++) {
                  s.particles.push({
                    x: e.x + e.width / 2,
                    y: e.y + e.height / 2,
                    vx: (Math.random() - 0.5) * (e.type === 'boss' ? 10 : 6),
                    vy: (Math.random() - 0.5) * (e.type === 'boss' ? 10 : 6),
                    radius: Math.random() * 4 + 2,
                    color: e.color,
                    alpha: 1,
                    life: 25
                  });
                }

                s.floatingTexts.push({
                  text: `+${killPoints}`,
                  x: e.x + e.width / 2,
                  y: e.y,
                  color: '#facc15',
                  alpha: 1,
                  vy: -1
                });

                if (e.type === 'boss') {
                  s.bossActive = false;
                  s.wave++;
                  setWave(s.wave);
                  sound.playVictory();
                }

                s.enemies.splice(i, 1);
                break;
              }
            }
          }
        }

        // Wave advancement
        if (s.enemies.length === 0 && !s.bossActive && s.waveSpawnCooldown <= 5) {
          s.wave++;
          setWave(s.wave);
        }

        // Update Drop Items
        for (let i = s.dropItems.length - 1; i >= 0; i--) {
          const item = s.dropItems[i];
          item.y += item.vy;

          if (item.y > height + 20) {
            s.dropItems.splice(i, 1);
            continue;
          }

          // Pickup check
          const dist = Math.hypot(item.x - s.player.x, item.y - s.player.y);
          if (dist < 32) {
            sound.playPowerup();
            if (item.type === 'triple') {
              s.player.weapon = 'triple';
              s.player.weaponTimer = 500;
              setWeaponType('triple');
              s.floatingTexts.push({ text: '⚡ SÚNG 3 TIA!', x: s.player.x, y: s.player.y - 40, color: '#38bdf8', alpha: 1, vy: -1.2 });
            } else if (item.type === 'laser') {
              s.player.weapon = 'laser';
              s.player.weaponTimer = 450;
              setWeaponType('laser');
              s.floatingTexts.push({ text: '🔥 TIA LASER HUỶ DIỆT!', x: s.player.x, y: s.player.y - 40, color: '#c084fc', alpha: 1, vy: -1.2 });
            } else if (item.type === 'shield') {
              s.player.shield = true;
              s.player.shieldTimer = 600;
              setHasShield(true);
              s.floatingTexts.push({ text: '🛡️ KHIÊN NĂNG LƯỢNG!', x: s.player.x, y: s.player.y - 40, color: '#34d399', alpha: 1, vy: -1.2 });
            } else if (item.type === 'heal') {
              s.player.hp = Math.min(100, s.player.hp + 35);
              setPlayerHp(s.player.hp);
              s.floatingTexts.push({ text: '💖 HỒI PHỤC +35 MÁU!', x: s.player.x, y: s.player.y - 40, color: '#f43f5e', alpha: 1, vy: -1.2 });
            } else if (item.type === 'bomb') {
              s.player.bombs = Math.min(5, s.player.bombs + 1);
              setBombsAvailable(s.player.bombs);
              s.floatingTexts.push({ text: '💣 BOM NGUYÊN TỬ +1', x: s.player.x, y: s.player.y - 40, color: '#fb923c', alpha: 1, vy: -1.2 });
            }
            s.dropItems.splice(i, 1);
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

        // Update Floating Text
        for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
          const t = s.floatingTexts[i];
          t.y += t.vy;
          t.alpha -= 0.02;
          if (t.alpha <= 0) {
            s.floatingTexts.splice(i, 1);
          }
        }
      }

      // === RENDER LOGIC ===

      // Render Drop Items
      for (const item of s.dropItems) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.type === 'triple' ? '#0284c7' :
                        item.type === 'laser' ? '#7c3aed' :
                        item.type === 'shield' ? '#059669' :
                        item.type === 'heal' ? '#e11d48' : '#ea580c';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = item.type === 'triple' ? '3X' :
                      item.type === 'laser' ? 'L' :
                      item.type === 'shield' ? 'S' :
                      item.type === 'heal' ? '+' : 'B';
        ctx.fillText(label, item.x, item.y);
        ctx.restore();
      }

      // Render Bullets
      for (const b of s.bullets) {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (b.isEnemy) {
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        } else {
          ctx.rect(b.x - 2, b.y - 7, 4, 14);
        }
        ctx.fill();
        ctx.restore();
      }

      // Render Enemies
      for (const e of s.enemies) {
        ctx.save();
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 6;

        if (e.type === 'boss') {
          // Boss Ship
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y + 20);
          ctx.lineTo(e.x + e.width - 20, e.y);
          ctx.lineTo(e.x + 20, e.y);
          ctx.lineTo(e.x, e.y + 20);
          ctx.closePath();
          ctx.fill();

          // Boss Core
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(e.x + e.width / 2, e.y + 35, 14, 0, Math.PI * 2);
          ctx.fill();

          // Boss Health Bar
          const barW = e.width;
          const hpRatio = Math.max(0, e.hp / e.maxHp);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(e.x, e.y - 14, barW, 6);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(e.x, e.y - 14, barW * hpRatio, 6);
        } else if (e.type === 'asteroid') {
          // Asteroid
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (e.type === 'heavy') {
          // Heavy Cruiser
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y);
          ctx.lineTo(e.x + e.width / 2, e.y + 10);
          ctx.lineTo(e.x, e.y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Scout / Interceptor
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y);
          ctx.lineTo(e.x, e.y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Player Ship
      if (s.player.invulnerableTimer % 6 < 3) {
        ctx.save();
        const px = s.player.x;
        const py = s.player.y;

        // Engine glow flame
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(px - 6, py + 18);
        ctx.lineTo(px + 6, py + 18);
        ctx.lineTo(px, py + 28 + Math.random() * 6);
        ctx.closePath();
        ctx.fill();

        // Ship Body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(px, py - 20); // nose
        ctx.lineTo(px + 18, py + 16); // right wing
        ctx.lineTo(px + 8, py + 12);
        ctx.lineTo(px, py + 16);
        ctx.lineTo(px - 8, py + 12);
        ctx.lineTo(px - 18, py + 16); // left wing
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(px, py - 2, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shield Bubble
        if (s.player.shield) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 32, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Render Particles
      for (const p of s.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Floating Text
      for (const t of s.floatingTexts) {
        ctx.save();
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.alpha;
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [diffMultiplier, onGameOver]);

  // Mouse / Touch handlers for intuitive controls
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    stateRef.current.mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      active: true
    };
  };

  const handlePointerLeave = () => {
    stateRef.current.mousePos.active = false;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Top HUD */}
      <div className="w-full max-w-[600px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
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
            <span className="text-xs text-slate-400 block">ĐỢT QUÂN</span>
            <span className="font-mono text-lg font-bold text-cyan-400 tabular-nums">{wave}</span>
          </div>
        </div>

        {/* Player Vital Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              MÁU {playerHp}%
            </span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
              <div
                className={`h-full transition-all duration-200 ${
                  playerHp > 50 ? 'bg-emerald-500' : playerHp > 25 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${playerHp}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="relative w-full max-w-[600px] aspect-[6/7] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0b0f19]">
        <canvas
          ref={canvasRef}
          width={600}
          height={700}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full game-canvas cursor-crosshair block"
        />

        {/* Weapons and Buff indicators overlay */}
        {isPlaying && !isPaused && (
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
            {hasShield && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" /> Khiên bảo vệ
              </span>
            )}
            {weaponType !== 'single' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-500/40 text-sky-300 text-xs font-medium">
                <Zap className="w-3.5 h-3.5" /> {weaponType === 'triple' ? '3 Tia' : 'Laser'} ({Math.ceil(weaponTimer / 60)}s)
              </span>
            )}
          </div>
        )}

        {/* In-game quick actions */}
        {isPlaying && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={triggerBomb}
              disabled={bombsAvailable <= 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-transform active:scale-95 ${
                bombsAvailable > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Bomb className="w-4 h-4" />
              Bom EMP ({bombsAvailable})
            </button>

            <button
              onClick={() => {
                const next = !isPaused;
                setIsPaused(next);
                stateRef.current.isPaused = next;
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 backdrop-blur-sm"
              title="Tạm dừng"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* TITLE / START SCREEN OVERLAY */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25">
              <Zap className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
              CHIẾN CƠ KHÔNG GIAN
            </h2>
            <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
              Điều khiển phi thuyền tiêu diệt hạm đội địch, thu thập vũ khí tối tân và hạ gục Boss hạm đội khổng lồ!
            </p>

            <div className="grid grid-cols-2 gap-2 text-left text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6 max-w-sm w-full">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Chuột / Cảm ứng:</span>
                <span>Di chuyển</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Bàn phím:</span>
                <span>WASD / Mũi tên</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Phím Cách (Space):</span>
                <span>Bắn đạn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Phím B:</span>
                <span>Kích nổ Bom EMP</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <h3 className="text-2xl font-bold mb-4">TRÒ CHƠI TẠM DỪNG</h3>
            <p className="text-slate-400 text-sm mb-6">Nghỉ tay một chút và chuẩn bị tiếp tục chiến đấu!</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsPaused(false);
                  stateRef.current.isPaused = false;
                }}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục
              </button>
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Chơi lại
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold mb-1">KẾT THÚC LƯỢT CHƠI</span>
            <h2 className="text-4xl font-black text-rose-500 mb-4">PHI THUYỀN BỊ PHÁ HUỶ</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 max-w-xs w-full">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Điểm số đạt được:</span>
                <span className="font-mono font-bold text-amber-400 text-lg tabular-nums">{score}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-sm">
                <span className="text-slate-400">Đợt quân tiến đến:</span>
                <span className="font-mono font-semibold text-cyan-400 tabular-nums">Cấp {wave}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-400">Kỷ lục cao nhất:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">{Math.max(score, highScore)}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 text-base flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Lại Ngay
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls / Quick Toggles */}
      <div className="w-full max-w-[600px] mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoFire}
            onChange={(e) => {
              setAutoFire(e.target.checked);
              stateRef.current.autoFire = e.target.checked;
            }}
            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
          />
          <span>Tự động bắn (Khuyên dùng)</span>
        </label>
        <span>Kéo chuột hoặc ngón tay để bay</span>
      </div>
    </div>
  );
};
