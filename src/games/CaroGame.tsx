import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { RotateCcw, Volume2, VolumeX, Undo2, Trophy, Bot, Users, Globe, Share2, MessageSquare } from 'lucide-react';
import { roomManager, MultiplayerRole } from '../multiplayer/roomManager';
import { InviteFriendModal } from '../components/InviteFriendModal';
import { OnlineLobbyModal } from '../components/OnlineLobbyModal';

interface CaroGameProps {
  onGameOver: (score: number) => void;
  highScore: number;
  initialRoomId?: string | null;
}

type CellValue = 'X' | 'O' | null;
type Board = CellValue[][];

const BOARD_SIZE = 15;

export const CaroGame: React.FC<CaroGameProps> = ({ onGameOver, highScore, initialRoomId }) => {
  const [board, setBoard] = useState<Board>(() =>
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [history, setHistory] = useState<Board[]>([]);
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [mode, setMode] = useState<'ai' | 'pvp' | 'online'>('ai');
  const [aiLevel, setAiLevel] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<{ r: number; c: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ r: number; c: number } | null>(null);
  const [stats, setStats] = useState({ xWins: 0, oWins: 0, draws: 0 });
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [isThinking, setIsThinking] = useState(false);

  // Online Multiplayer states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [roomId, setRoomId] = useState('');
  const [myRole, setMyRole] = useState<MultiplayerRole>('host'); // Host is X, Guest is O
  const [onlineConnected, setOnlineConnected] = useState(false);
  const [chatToast, setChatToast] = useState<string | null>(null);

  // Check 5 in a row
  const checkWin = useCallback((b: Board, lastR: number, lastC: number, player: 'X' | 'O') => {
    const directions = [
      [0, 1],  // ngang
      [1, 0],  // dọc
      [1, 1],  // chéo \
      [1, -1]  // chéo /
    ];

    for (const [dr, dc] of directions) {
      const line: { r: number; c: number }[] = [{ r: lastR, c: lastC }];

      let step = 1;
      while (true) {
        const nr = lastR + dr * step;
        const nc = lastC + dc * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === player) {
          line.push({ r: nr, c: nc });
          step++;
        } else break;
      }

      step = 1;
      while (true) {
        const nr = lastR - dr * step;
        const nc = lastC - dc * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === player) {
          line.push({ r: nr, c: nc });
          step++;
        } else break;
      }

      if (line.length >= 5) {
        return line;
      }
    }

    return null;
  }, []);

  const isBoardFull = (b: Board) => {
    return b.every(row => row.every(cell => cell !== null));
  };

  // Create Online Room (Host)
  const handleCreateRoom = () => {
    setMode('online');
    setMyRole('host');
    const { roomId: rId, inviteUrl: url } = roomManager.createRoom(
      'caro',
      () => {
        setOnlineConnected(true);
        sound.playVictory();
      },
      () => {
        setOnlineConnected(false);
      }
    );
    setRoomId(rId);
    setInviteUrl(url);
    setIsInviteModalOpen(true);
    resetBoardState();
  };

  // Join Room if initialRoomId is passed
  useEffect(() => {
    if (initialRoomId) {
      setMode('online');
      setMyRole('guest');
      setRoomId(initialRoomId);
      const fullUrl = window.location.href;
      setInviteUrl(fullUrl);

      roomManager.joinRoom(
        initialRoomId,
        () => {
          setOnlineConnected(true);
          sound.playVictory();
        },
        () => {
          setOnlineConnected(false);
        }
      );
    }
  }, [initialRoomId]);

  // Online Message Listeners
  useEffect(() => {
    if (mode === 'online') {
      // 1. Move listener
      roomManager.onMove((data: { r: number; c: number; player: 'X' | 'O' }) => {
        sound.playWoodClack();
        setBoard((prev) => {
          const newB = prev.map(row => [...row]);
          newB[data.r][data.c] = data.player;

          setLastMove({ r: data.r, c: data.c });
          const winLine = checkWin(newB, data.r, data.c, data.player);
          if (winLine) {
            setWinner(data.player);
            setWinningLine(winLine);
            if ((myRole === 'host' && data.player === 'X') || (myRole === 'guest' && data.player === 'O')) {
              sound.playVictory();
            } else {
              sound.playGameOver();
            }
          } else if (isBoardFull(newB)) {
            setWinner('draw');
          }
          return newB;
        });

        setTurn(data.player === 'X' ? 'O' : 'X');
      });

      // 2. Chat listener
      roomManager.onChat((msg: string) => {
        sound.playBounce(600);
        setChatToast(msg);
        setTimeout(() => setChatToast(null), 4000);
      });

      // 3. Restart listener
      roomManager.onRestart(() => {
        sound.playBounce(500);
        resetBoardState();
      });

      // 4. Undo listener
      roomManager.onUndo(() => {
        setHistory((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            setBoard(last);
            setLastMove(null);
            setTurn(prevTurn => (prevTurn === 'X' ? 'O' : 'X'));
            return prev.slice(0, -1);
          }
          return prev;
        });
        sound.playBounce(400);
      });
    }
  }, [checkWin, mode, myRole]);

  // Send quick chat
  const handleSendChat = (text: string) => {
    roomManager.sendChat(text);
  };

  // AI Evaluation logic
  const getAiMove = useCallback((currentBoard: Board, level: 'easy' | 'normal' | 'hard'): { r: number; c: number } => {
    if (level === 'easy' && Math.random() < 0.35) {
      const emptyCells: { r: number; c: number }[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!currentBoard[r][c]) {
            let hasNeighbor = false;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc]) {
                  hasNeighbor = true;
                }
              }
            }
            if (hasNeighbor) emptyCells.push({ r, c });
          }
        }
      }
      if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }

    let bestScore = -Infinity;
    let bestMoves: { r: number; c: number }[] = [];

    const evaluatePoint = (r: number, c: number) => {
      let score = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

      for (const [dr, dc] of directions) {
        let countO = 0;
        let openO = 0;
        for (let s = 1; s <= 4; s++) {
          const nr = r + dr * s;
          const nc = c + dc * s;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (currentBoard[nr][nc] === 'O') countO++;
            else if (currentBoard[nr][nc] === null) { openO++; break; }
            else break;
          } else break;
        }
        for (let s = 1; s <= 4; s++) {
          const nr = r - dr * s;
          const nc = c - dc * s;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (currentBoard[nr][nc] === 'O') countO++;
            else if (currentBoard[nr][nc] === null) { openO++; break; }
            else break;
          } else break;
        }

        let countX = 0;
        let openX = 0;
        for (let s = 1; s <= 4; s++) {
          const nr = r + dr * s;
          const nc = c + dc * s;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (currentBoard[nr][nc] === 'X') countX++;
            else if (currentBoard[nr][nc] === null) { openX++; break; }
            else break;
          } else break;
        }
        for (let s = 1; s <= 4; s++) {
          const nr = r - dr * s;
          const nc = c - dc * s;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (currentBoard[nr][nc] === 'X') countX++;
            else if (currentBoard[nr][nc] === null) { openX++; break; }
            else break;
          } else break;
        }

        if (countO >= 4) score += 100000;
        else if (countO === 3 && openO >= 2) score += 5000;
        else if (countO === 3 && openO === 1) score += 800;
        else if (countO === 2 && openO >= 2) score += 300;

        if (countX >= 4) score += 60000;
        else if (countX === 3 && openX >= 2) score += (level === 'hard' ? 7000 : 3500);
        else if (countX === 3 && openX === 1) score += 700;
        else if (countX === 2 && openX >= 2) score += 200;
      }

      const centerDist = Math.abs(r - 7) + Math.abs(c - 7);
      score += (14 - centerDist);

      return score;
    };

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!currentBoard[r][c]) {
          let near = false;
          for (let dr = -2; dr <= 2 && !near; dr++) {
            for (let dc = -2; dc <= 2 && !near; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc]) {
                near = true;
              }
            }
          }
          if (near || (r === 7 && c === 7)) {
            const score = evaluatePoint(r, c);
            if (score > bestScore) {
              bestScore = score;
              bestMoves = [{ r, c }];
            } else if (score === bestScore) {
              bestMoves.push({ r, c });
            }
          }
        }
      }
    }

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    return { r: 7, c: 7 };
  }, []);

  // Handle Player Move
  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] || winner || isThinking) return;

    // Online turn restriction
    if (mode === 'online') {
      const myTurnPiece = myRole === 'host' ? 'X' : 'O';
      if (turn !== myTurnPiece) {
        return; // Not your turn
      }
    }

    sound.playWoodClack();
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = turn;

    setHistory(prev => [...prev, board.map(row => [...row])]);
    setBoard(newBoard);
    setLastMove({ r, c });

    // Send move to peer if in online mode
    if (mode === 'online') {
      roomManager.sendMove({ r, c, player: turn });
    }

    // Check Win
    const winLine = checkWin(newBoard, r, c, turn);
    if (winLine) {
      setWinner(turn);
      setWinningLine(winLine);
      if (turn === 'X') {
        sound.playVictory();
        setStats(prev => ({ ...prev, xWins: prev.xWins + 1 }));
        onGameOver(100);
      } else {
        sound.playGameOver();
        setStats(prev => ({ ...prev, oWins: prev.oWins + 1 }));
      }
      return;
    }

    if (isBoardFull(newBoard)) {
      setWinner('draw');
      setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    // Switch turn
    const nextTurn = turn === 'X' ? 'O' : 'X';
    setTurn(nextTurn);
  };

  // Bot Turn Effect
  useEffect(() => {
    if (mode === 'ai' && turn === 'O' && !winner) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const move = getAiMove(board, aiLevel);
        sound.playWoodClack();

        const newBoard = board.map(row => [...row]);
        newBoard[move.r][move.c] = 'O';

        setHistory(prev => [...prev, board.map(row => [...row])]);
        setBoard(newBoard);
        setLastMove(move);
        setIsThinking(false);

        const winLine = checkWin(newBoard, move.r, move.c, 'O');
        if (winLine) {
          setWinner('O');
          setWinningLine(winLine);
          sound.playGameOver();
          setStats(prev => ({ ...prev, oWins: prev.oWins + 1 }));
          return;
        }

        if (isBoardFull(newBoard)) {
          setWinner('draw');
          setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
          return;
        }

        setTurn('X');
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [aiLevel, board, checkWin, getAiMove, mode, turn, winner]);

  // Reset internal board state
  const resetBoardState = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setHistory([]);
    setTurn('X');
    setWinner(null);
    setWinningLine([]);
    setLastMove(null);
    setIsThinking(false);
  };

  const handleRestart = () => {
    resetBoardState();
    if (mode === 'online') {
      roomManager.sendRestart();
    }
    sound.playBounce(500);
  };

  // Undo Move
  const handleUndo = () => {
    if (history.length === 0 || winner || isThinking) return;
    if (mode === 'online') {
      roomManager.sendUndo();
      return;
    }
    if (mode === 'ai' && history.length >= 2) {
      const prevBoard = history[history.length - 2];
      setBoard(prevBoard);
      setHistory(prev => prev.slice(0, -2));
      setTurn('X');
      setLastMove(null);
      sound.playBounce(400);
    } else if (mode === 'pvp' && history.length >= 1) {
      const prevBoard = history[history.length - 1];
      setBoard(prevBoard);
      setHistory(prev => prev.slice(0, -1));
      setTurn(turn === 'X' ? 'O' : 'X');
      setLastMove(null);
      sound.playBounce(400);
    }
  };

  const isMyTurnOnline = mode === 'online' && (myRole === 'host' ? turn === 'X' : turn === 'O');

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Opponent Chat Floating Toast */}
      {chatToast && (
        <div className="fixed top-16 z-50 px-4 py-2 bg-slate-900 border border-cyan-500 rounded-full shadow-2xl text-cyan-300 font-semibold text-xs flex items-center gap-2 animate-bounce">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Đối thủ: "{chatToast}"</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="w-full max-w-[620px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
            <span className="text-xs font-semibold">
              X: {stats.xWins} {mode === 'online' && myRole === 'host' && '(Bạn)'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
            <span className="text-xs font-semibold">
              O: {stats.oWins} {mode === 'online' && myRole === 'guest' && '(Bạn)'}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700/80">
          {winner === 'X' ? (
            <span className="text-rose-400">🎉 Bên X Chiến Thắng!</span>
          ) : winner === 'O' ? (
            <span className="text-cyan-400">🎉 Bên O Chiến Thắng!</span>
          ) : winner === 'draw' ? (
            <span className="text-amber-400">Hòa cờ!</span>
          ) : mode === 'online' && !onlineConnected ? (
            <span className="text-amber-300 animate-pulse">Đang chờ bạn bè kết nối...</span>
          ) : mode === 'online' ? (
            <span>
              {isMyTurnOnline ? (
                <strong className="text-emerald-400 animate-pulse">👉 Đến lượt bạn đi!</strong>
              ) : (
                <span className="text-slate-400">Đang đợi đối thủ đi...</span>
              )}
            </span>
          ) : isThinking ? (
            <span className="text-cyan-300 animate-pulse">Máy đang tính nước...</span>
          ) : (
            <span>
              Lượt đi:{' '}
              <strong className={turn === 'X' ? 'text-rose-400' : 'text-cyan-400'}>
                {turn === 'X' ? 'Bên X (Đỏ)' : 'Bên O (Xanh)'}
              </strong>
            </span>
          )}
        </div>

        <button
          onClick={() => {
            const muted = sound.toggleMute();
            setIsMuted(muted);
          }}
          aria-label="Âm thanh"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* Control Bar: Mode, Online Invite, Undo, Restart */}
      <div className="w-full max-w-[620px] mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Game Mode */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => { setMode('ai'); resetBoardState(); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'ai' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Máy
          </button>
          <button
            onClick={() => { setMode('pvp'); resetBoardState(); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'pvp' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2 Người
          </button>
          <button
            onClick={handleCreateRoom}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'online' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Mời bạn bè</span>
          </button>
        </div>

        {/* AI Difficulty or Invite Link Button */}
        {mode === 'ai' && (
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {(['easy', 'normal', 'hard'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setAiLevel(lvl)}
                className={`px-2 py-1 rounded-md font-medium capitalize transition-all cursor-pointer ${
                  aiLevel === lvl ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl === 'easy' ? 'Dễ' : lvl === 'normal' ? 'Vừa' : 'Khó'}
              </button>
            ))}
          </div>
        )}

        {mode === 'online' && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-lg hover:bg-amber-900/50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Link mời phòng</span>
          </button>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || !!winner || isThinking}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Đi lại nước trước"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Đi lại
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Ván mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ván mới
          </button>
        </div>
      </div>

      {/* 15x15 Caro Board Container */}
      <div className="w-full max-w-[620px] overflow-x-auto no-scrollbar flex justify-center">
        <div className="relative w-full aspect-square min-w-[340px] p-1 sm:p-2.5 bg-[#e8c187] rounded-2xl shadow-2xl border-2 sm:border-4 border-[#8c572b] flex items-center justify-center select-none overflow-hidden touch-manipulation">
          {/* Board wood grid lines */}
          <div className="grid grid-cols-15 grid-rows-15 w-full h-full border border-[#8c572b]/60 bg-[#eedab3] rounded-xl shadow-inner">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isLast = lastMove?.r === r && lastMove?.c === c;
                const isWinning = winningLine.some(pt => pt.r === r && pt.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={!!cell || !!winner || isThinking}
                    className={`relative flex items-center justify-center border border-[#b88b56]/50 transition-colors focus:outline-none cursor-pointer active:bg-[#dfba85] ${
                      !cell && !winner ? 'hover:bg-[#dfba85]' : ''
                    } ${isWinning ? 'bg-amber-300 animate-pulse' : ''}`}
                    aria-label={`Ô ${r}, ${c}`}
                  >
                    {((r === 3 || r === 7 || r === 11) && (c === 3 || c === 7 || c === 11)) && !cell && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8c572b]/70" />
                    )}

                    {cell === 'X' && (
                      <div
                        className={`w-[85%] h-[85%] rounded-full flex items-center justify-center font-black text-xs sm:text-base md:text-lg font-mono text-rose-600 transition-transform ${
                          isLast ? 'ring-2 ring-rose-500' : ''
                        }`}
                      >
                        ✕
                      </div>
                    )}

                    {cell === 'O' && (
                      <div
                        className={`w-[85%] h-[85%] rounded-full flex items-center justify-center font-black text-xs sm:text-base md:text-lg font-mono text-cyan-600 transition-transform ${
                          isLast ? 'ring-2 ring-cyan-500' : ''
                        }`}
                      >
                        ○
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Winner Overlay Modal */}
          {winner && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white z-20">
              <Trophy className="w-14 h-14 text-yellow-400 mb-2 animate-bounce" />
              <h2 className="text-3xl font-black text-white mb-2">
                {winner === 'draw' ? 'HAI BÊN BẤT PHÂN THẮNG BẠI' : `BÊN ${winner} ĐÃ CHIẾN THẮNG!`}
              </h2>
              <p className="text-slate-300 text-xs max-w-xs mb-6">
                {winner === 'X'
                  ? 'Chúc mừng bạn đã tạo nên chuỗi 5 quân liên tiếp hoàn hảo!'
                  : winner === 'O'
                  ? 'Bên O đã tạo thế cờ 5 quân bất bại!'
                  : 'Cả 2 bên đều phòng thủ kiên cường!'}
              </p>
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Đánh Ván Mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Online Lobby & Invite Modal */}
      <OnlineLobbyModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        gameId="caro"
        gameTitle="Cờ Ca-rô 5 Quân"
        currentRoomId={roomId}
        inviteUrl={inviteUrl}
        myUserName={typeof localStorage !== 'undefined' ? localStorage.getItem('arcade_player_name') || 'Dân Chơi' : 'Dân Chơi'}
        myUserAvatar={typeof localStorage !== 'undefined' ? localStorage.getItem('arcade_player_avatar') || '🥷' : '🥷'}
        onInviteAccepted={(rId) => {
          setMode('online');
          setMyRole('host');
          setRoomId(rId);
          setOnlineConnected(true);
        }}
      />

      <div className="w-full max-w-[620px] mt-2.5 text-center text-xs text-slate-400">
        {mode === 'online'
          ? `Chế độ online: Bạn là Bên ${myRole === 'host' ? 'X (Đi trước)' : 'O (Đi sau)'}. Nước đi tự đồng bộ tức thì.`
          : 'Tạo chuỗi 5 quân liên tiếp (ngang, dọc, chéo) để thắng. Chọn "Mời bạn bè" để chơi qua link.'}
      </div>
    </div>
  );
};
