import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '../audio/soundEffects';
import { RotateCcw, Volume2, VolumeX, Undo2, Bot, Users, Trophy, ShieldAlert, Globe, Share2, MessageSquare } from 'lucide-react';
import { roomManager, MultiplayerRole } from '../multiplayer/roomManager';
import { InviteFriendModal } from '../components/InviteFriendModal';

interface CoTuongGameProps {
  onGameOver: (score: number) => void;
  highScore: number;
  initialRoomId?: string | null;
}

export type PieceColor = 'red' | 'black';
export type PieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P';

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  label: string;
  subLabel: string;
}

type Board = (ChessPiece | null)[][];

const ROWS = 10;
const COLS = 9;

// Initial Xiangqi Board Setup
const createInitialBoard = (): Board => {
  const b: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

  const setP = (r: number, c: number, type: PieceType, color: PieceColor, label: string, subLabel: string) => {
    b[r][c] = { id: `${color}_${type}_${r}_${c}`, type, color, label, subLabel };
  };

  // Black pieces (top: r = 0..4)
  setP(0, 0, 'R', 'black', '車', 'Xe');
  setP(0, 1, 'H', 'black', '馬', 'Mã');
  setP(0, 2, 'E', 'black', '象', 'Tượng');
  setP(0, 3, 'A', 'black', '士', 'Sĩ');
  setP(0, 4, 'K', 'black', '將', 'Tướng');
  setP(0, 5, 'A', 'black', '士', 'Sĩ');
  setP(0, 6, 'E', 'black', '象', 'Tượng');
  setP(0, 7, 'H', 'black', '馬', 'Mã');
  setP(0, 8, 'R', 'black', '車', 'Xe');

  setP(2, 1, 'C', 'black', '砲', 'Pháo');
  setP(2, 7, 'C', 'black', '砲', 'Pháo');

  setP(3, 0, 'P', 'black', '卒', 'Tốt');
  setP(3, 2, 'P', 'black', '卒', 'Tốt');
  setP(3, 4, 'P', 'black', '卒', 'Tốt');
  setP(3, 6, 'P', 'black', '卒', 'Tốt');
  setP(3, 8, 'P', 'black', '卒', 'Tốt');

  // Red pieces (bottom: r = 5..9)
  setP(9, 0, 'R', 'red', '俥', 'Xe');
  setP(9, 1, 'H', 'red', '傌', 'Mã');
  setP(9, 2, 'E', 'red', '相', 'Tượng');
  setP(9, 3, 'A', 'red', '仕', 'Sĩ');
  setP(9, 4, 'K', 'red', '帥', 'Tướng');
  setP(9, 5, 'A', 'red', '仕', 'Sĩ');
  setP(9, 6, 'E', 'red', '相', 'Tượng');
  setP(9, 7, 'H', 'red', '傌', 'Mã');
  setP(9, 8, 'R', 'red', '俥', 'Xe');

  setP(7, 1, 'C', 'red', '炮', 'Pháo');
  setP(7, 7, 'C', 'red', '炮', 'Pháo');

  setP(6, 0, 'P', 'red', '兵', 'Binh');
  setP(6, 2, 'P', 'red', '兵', 'Binh');
  setP(6, 4, 'P', 'red', '兵', 'Binh');
  setP(6, 6, 'P', 'red', '兵', 'Binh');
  setP(6, 8, 'P', 'red', '兵', 'Binh');

  return b;
};

export const CoTuongGame: React.FC<CoTuongGameProps> = ({ onGameOver, highScore, initialRoomId }) => {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [history, setHistory] = useState<Board[]>([]);
  const [turn, setTurn] = useState<PieceColor>('red');
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number }[]>([]);
  const [mode, setMode] = useState<'ai' | 'pvp' | 'online'>('ai');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [inCheck, setInCheck] = useState<PieceColor | null>(null);
  const [stats, setStats] = useState({ redWins: 0, blackWins: 0 });

  // Online Multiplayer states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [roomId, setRoomId] = useState('');
  const [myRole, setMyRole] = useState<MultiplayerRole>('host'); // Host is Red, Guest is Black
  const [onlineConnected, setOnlineConnected] = useState(false);
  const [chatToast, setChatToast] = useState<string | null>(null);

  const pieceValues: Record<PieceType, number> = {
    K: 10000,
    R: 900,
    C: 450,
    H: 400,
    E: 200,
    A: 200,
    P: 100
  };

  const inBounds = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

  // Calculate legal moves
  const getPieceMoves = useCallback((b: Board, r: number, c: number): { r: number; c: number }[] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: { r: number; c: number }[] = [];
    const color = piece.color;

    const canMoveOrTake = (nr: number, nc: number) => {
      if (!inBounds(nr, nc)) return false;
      const target = b[nr][nc];
      return !target || target.color !== color;
    };

    switch (piece.type) {
      case 'K': {
        const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const minR = color === 'red' ? 7 : 0;
        const maxR = color === 'red' ? 9 : 2;
        const minC = 3;
        const maxC = 5;

        for (const [dr, dc] of deltas) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= minR && nr <= maxR && nc >= minC && nc <= maxC && canMoveOrTake(nr, nc)) {
            moves.push({ r: nr, c: nc });
          }
        }

        // Flying general
        const stepR = color === 'red' ? -1 : 1;
        let testR = r + stepR;
        while (testR >= 0 && testR < ROWS) {
          const obstacle = b[testR][c];
          if (obstacle) {
            if (obstacle.type === 'K' && obstacle.color !== color) {
              moves.push({ r: testR, c });
            }
            break;
          }
          testR += stepR;
        }
        break;
      }

      case 'A': {
        const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        const minR = color === 'red' ? 7 : 0;
        const maxR = color === 'red' ? 9 : 2;
        const minC = 3;
        const maxC = 5;

        for (const [dr, dc] of diag) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= minR && nr <= maxR && nc >= minC && nc <= maxC && canMoveOrTake(nr, nc)) {
            moves.push({ r: nr, c: nc });
          }
        }
        break;
      }

      case 'E': {
        const diag2 = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
        const minR = color === 'red' ? 5 : 0;
        const maxR = color === 'red' ? 9 : 4;

        for (const [dr, dc] of diag2) {
          const nr = r + dr;
          const nc = c + dc;
          const eyeR = r + dr / 2;
          const eyeC = c + dc / 2;

          if (nr >= minR && nr <= maxR && inBounds(nr, nc) && canMoveOrTake(nr, nc)) {
            if (!b[eyeR][eyeC]) {
              moves.push({ r: nr, c: nc });
            }
          }
        }
        break;
      }

      case 'H': {
        const horseJumps = [
          { dr: -2, dc: -1, legR: -1, legC: 0 },
          { dr: -2, dc: 1, legR: -1, legC: 0 },
          { dr: 2, dc: -1, legR: 1, legC: 0 },
          { dr: 2, dc: 1, legR: 1, legC: 0 },
          { dr: -1, dc: -2, legR: 0, legC: -1 },
          { dr: 1, dc: -2, legR: 0, legC: -1 },
          { dr: -1, dc: 2, legR: 0, legC: 1 },
          { dr: 1, dc: 2, legR: 0, legC: 1 }
        ];

        for (const h of horseJumps) {
          const nr = r + h.dr;
          const nc = c + h.dc;
          const legR = r + h.legR;
          const legC = c + h.legC;

          if (canMoveOrTake(nr, nc)) {
            if (!b[legR][legC]) {
              moves.push({ r: nr, c: nc });
            }
          }
        }
        break;
      }

      case 'R': {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (inBounds(nr, nc)) {
            if (!b[nr][nc]) {
              moves.push({ r: nr, c: nc });
            } else {
              if (b[nr][nc]?.color !== color) {
                moves.push({ r: nr, c: nc });
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }

      case 'C': {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          let jumpOver = false;

          while (inBounds(nr, nc)) {
            if (!jumpOver) {
              if (!b[nr][nc]) {
                moves.push({ r: nr, c: nc });
              } else {
                jumpOver = true;
              }
            } else {
              if (b[nr][nc]) {
                if (b[nr][nc]?.color !== color) {
                  moves.push({ r: nr, c: nc });
                }
                break;
              }
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }

      case 'P': {
        const forward = color === 'red' ? -1 : 1;
        const crossedRiver = color === 'red' ? r <= 4 : r >= 5;

        const nr = r + forward;
        if (canMoveOrTake(nr, c)) {
          moves.push({ r: nr, c });
        }

        if (crossedRiver) {
          if (canMoveOrTake(r, c - 1)) moves.push({ r, c: c - 1 });
          if (canMoveOrTake(r, c + 1)) moves.push({ r, c: c + 1 });
        }
        break;
      }
    }

    return moves;
  }, []);

  const isKingInCheck = useCallback((b: Board, kingColor: PieceColor): boolean => {
    let kingR = -1;
    let kingC = -1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = b[r][c];
        if (p && p.type === 'K' && p.color === kingColor) {
          kingR = r;
          kingC = c;
          break;
        }
      }
      if (kingR !== -1) break;
    }

    if (kingR === -1) return true;

    const oppColor = kingColor === 'red' ? 'black' : 'red';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const oppPiece = b[r][c];
        if (oppPiece && oppPiece.color === oppColor) {
          const oppMoves = getPieceMoves(b, r, c);
          if (oppMoves.some(m => m.r === kingR && m.c === kingC)) {
            return true;
          }
        }
      }
    }

    return false;
  }, [getPieceMoves]);

  // Create Online Room (Host)
  const handleCreateRoom = () => {
    setMode('online');
    setMyRole('host');
    const { roomId: rId, inviteUrl: url } = roomManager.createRoom(
      'cotuong',
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

  // Join Room if initialRoomId is provided
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

  // Online Multiplayer Listeners
  useEffect(() => {
    if (mode === 'online') {
      roomManager.onMove((data: { fromR: number; fromC: number; toR: number; toC: number }) => {
        setBoard((prev) => {
          const p = prev[data.fromR][data.fromC];
          if (!p) return prev;
          const target = prev[data.toR][data.toC];
          const newB = prev.map(row => [...row]);
          newB[data.toR][data.toC] = p;
          newB[data.fromR][data.fromC] = null;

          sound.playWoodClack();
          if (target?.type === 'K') {
            setWinner(p.color);
            if ((myRole === 'host' && p.color === 'red') || (myRole === 'guest' && p.color === 'black')) {
              sound.playVictory();
            } else {
              sound.playGameOver();
            }
          }

          const myColor = myRole === 'host' ? 'red' : 'black';
          if (isKingInCheck(newB, myColor)) {
            setInCheck(myColor);
            sound.playCheck();
          } else {
            setInCheck(null);
          }

          return newB;
        });

        setTurn(prevTurn => (prevTurn === 'red' ? 'black' : 'red'));
        setSelectedCell(null);
        setValidMoves([]);
      });

      roomManager.onChat((msg: string) => {
        sound.playBounce(600);
        setChatToast(msg);
        setTimeout(() => setChatToast(null), 4000);
      });

      roomManager.onRestart(() => {
        sound.playBounce(500);
        resetBoardState();
      });

      roomManager.onUndo(() => {
        setHistory(prev => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            setBoard(last);
            setSelectedCell(null);
            setValidMoves([]);
            setInCheck(null);
            setTurn(prevTurn => (prevTurn === 'red' ? 'black' : 'red'));
            return prev.slice(0, -1);
          }
          return prev;
        });
        sound.playBounce(400);
      });
    }
  }, [isKingInCheck, mode, myRole]);

  // Handle cell click
  const handleCellClick = (r: number, c: number) => {
    if (winner || isThinking) return;

    // Online turn restriction
    if (mode === 'online') {
      const myColor = myRole === 'host' ? 'red' : 'black';
      if (turn !== myColor) {
        return; // Opponent's turn
      }
    }

    if (selectedCell) {
      const isTargetValid = validMoves.some(m => m.r === r && m.c === c);
      if (isTargetValid) {
        makeMove(selectedCell.r, selectedCell.c, r, c);
        return;
      }
    }

    const piece = board[r][c];
    if (piece && piece.color === turn) {
      if (mode === 'online') {
        const myColor = myRole === 'host' ? 'red' : 'black';
        if (piece.color !== myColor) return;
      }
      setSelectedCell({ r, c });
      const moves = getPieceMoves(board, r, c);
      setValidMoves(moves);
      sound.playBounce(350);
    } else {
      setSelectedCell(null);
      setValidMoves([]);
    }
  };

  // Perform move
  const makeMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    const piece = board[fromR][fromC];
    if (!piece) return;

    const targetPiece = board[toR][toC];
    const newBoard = board.map(row => [...row]);
    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = null;

    sound.playWoodClack();
    setHistory(prev => [...prev, board.map(row => [...row])]);
    setBoard(newBoard);
    setSelectedCell(null);
    setValidMoves([]);

    // Broadcast move if online
    if (mode === 'online') {
      roomManager.sendMove({ fromR, fromC, toR, toC });
    }

    if (targetPiece?.type === 'K') {
      setWinner(piece.color);
      if (piece.color === 'red') {
        sound.playVictory();
        setStats(prev => ({ ...prev, redWins: prev.redWins + 1 }));
        onGameOver(250);
      } else {
        sound.playGameOver();
        setStats(prev => ({ ...prev, blackWins: prev.blackWins + 1 }));
      }
      return;
    }

    const nextTurn = turn === 'red' ? 'black' : 'red';
    const checkState = isKingInCheck(newBoard, nextTurn);
    if (checkState) {
      setInCheck(nextTurn);
      sound.playCheck();
    } else {
      setInCheck(null);
    }

    setTurn(nextTurn);
  };

  // AI Bot logic
  const runAiTurn = useCallback(() => {
    setIsThinking(true);

    setTimeout(() => {
      let bestScore = -Infinity;
      let candidateMoves: Array<{ from: { r: number; c: number }; to: { r: number; c: number } }> = [];

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = board[r][c];
          if (p && p.color === 'black') {
            const moves = getPieceMoves(board, r, c);
            for (const m of moves) {
              const target = board[m.r][m.c];
              let score = 0;

              if (target) score += pieceValues[target.type] * 2.5;
              score += (m.r - r) * 10;

              const simBoard = board.map(row => [...row]);
              simBoard[m.r][m.c] = p;
              simBoard[r][c] = null;
              if (isKingInCheck(simBoard, 'red')) score += 500;
              if (isKingInCheck(simBoard, 'black')) score -= 3000;

              if (score > bestScore) {
                bestScore = score;
                candidateMoves = [{ from: { r, c }, to: m }];
              } else if (score === bestScore) {
                candidateMoves.push({ from: { r, c }, to: m });
              }
            }
          }
        }
      }

      if (candidateMoves.length > 0) {
        const choice = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
        const piece = board[choice.from.r][choice.from.c];
        const targetPiece = board[choice.to.r][choice.to.c];

        const newBoard = board.map(row => [...row]);
        newBoard[choice.to.r][choice.to.c] = piece;
        newBoard[choice.from.r][choice.from.c] = null;

        sound.playWoodClack();
        setHistory(prev => [...prev, board.map(row => [...row])]);
        setBoard(newBoard);
        setIsThinking(false);

        if (targetPiece?.type === 'K') {
          setWinner('black');
          sound.playGameOver();
          setStats(prev => ({ ...prev, blackWins: prev.blackWins + 1 }));
          return;
        }

        const redChecked = isKingInCheck(newBoard, 'red');
        if (redChecked) {
          setInCheck('red');
          sound.playCheck();
        } else {
          setInCheck(null);
        }

        setTurn('red');
      } else {
        setWinner('red');
        sound.playVictory();
        setIsThinking(false);
      }
    }, 600);
  }, [board, getPieceMoves, isKingInCheck, pieceValues]);

  useEffect(() => {
    if (mode === 'ai' && turn === 'black' && !winner) {
      runAiTurn();
    }
  }, [mode, runAiTurn, turn, winner]);

  const resetBoardState = () => {
    setBoard(createInitialBoard());
    setHistory([]);
    setTurn('red');
    setSelectedCell(null);
    setValidMoves([]);
    setWinner(null);
    setInCheck(null);
    setIsThinking(false);
  };

  const handleRestart = () => {
    resetBoardState();
    if (mode === 'online') {
      roomManager.sendRestart();
    }
    sound.playBounce(500);
  };

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
      setTurn('red');
      setSelectedCell(null);
      setValidMoves([]);
      setInCheck(null);
      sound.playBounce(400);
    } else if (mode === 'pvp' && history.length >= 1) {
      const prevBoard = history[history.length - 1];
      setBoard(prevBoard);
      setHistory(prev => prev.slice(0, -1));
      setTurn(turn === 'red' ? 'black' : 'red');
      setSelectedCell(null);
      setValidMoves([]);
      setInCheck(null);
      sound.playBounce(400);
    }
  };

  const isMyTurnOnline = mode === 'online' && (myRole === 'host' ? turn === 'red' : turn === 'black');

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Opponent Chat Floating Toast */}
      {chatToast && (
        <div className="fixed top-16 z-50 px-4 py-2 bg-slate-900 border border-amber-500 rounded-full shadow-2xl text-amber-300 font-semibold text-xs flex items-center gap-2 animate-bounce">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Đối thủ: "{chatToast}"</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="w-full max-w-[620px] mb-3 flex items-center justify-between text-sm bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-sm text-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 inline-block border border-rose-300" />
            <span className="text-xs font-semibold">
              Đỏ: {stats.redWins} {mode === 'online' && myRole === 'host' && '(Bạn)'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-800 inline-block border border-slate-400" />
            <span className="text-xs font-semibold">
              Đen: {stats.blackWins} {mode === 'online' && myRole === 'guest' && '(Bạn)'}
            </span>
          </div>
        </div>

        {/* Status / Check indicator */}
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700/80 flex items-center gap-1.5">
          {winner ? (
            <span className={winner === 'red' ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>
              🎉 {winner === 'red' ? 'Bên Đỏ Chiến Thắng!' : 'Bên Đen Chiến Thắng!'}
            </span>
          ) : inCheck ? (
            <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Chiếu Tướng ({inCheck === 'red' ? 'Bên Đỏ' : 'Bên Đen'})!
            </span>
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
              <strong className={turn === 'red' ? 'text-rose-400' : 'text-slate-200'}>
                {turn === 'red' ? 'Bên Đỏ (Đi trước)' : 'Bên Đen'}
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

      {/* Control Bar: Mode, Invite, Undo, Restart */}
      <div className="w-full max-w-[620px] mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => { setMode('ai'); resetBoardState(); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'ai' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Máy
          </button>
          <button
            onClick={() => { setMode('pvp'); resetBoardState(); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'pvp' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2 Người
          </button>
          <button
            onClick={handleCreateRoom}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'online' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Mời bạn bè</span>
          </button>
        </div>

        {mode === 'online' && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-lg hover:bg-amber-900/50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Link mời phòng</span>
          </button>
        )}

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

      {/* Xiangqi Board (10 rows x 9 columns) */}
      <div className="relative w-full max-w-[620px] aspect-[9/10] p-1.5 sm:p-3.5 bg-[#d8ab6b] rounded-2xl shadow-2xl border-2 sm:border-4 border-[#6b3c16] flex flex-col justify-between select-none">
        {/* River text background in the middle */}
        <div className="absolute top-[46.5%] left-0 right-0 flex items-center justify-around pointer-events-none text-[11px] sm:text-sm font-bold text-[#8c572b]/80 tracking-wider sm:tracking-widest px-4 sm:px-8">
          <span>楚 河 · SỞ HÀ</span>
          <span>HÁN GIỚI · 漢 界</span>
        </div>

        {/* Board intersections grid */}
        <div className="grid grid-cols-9 grid-rows-10 w-full h-full border border-[#8c572b]/80 bg-[#eedab3] rounded-xl shadow-inner relative touch-manipulation">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isValidTarget = validMoves.some(m => m.r === r && m.c === c);

              const isPalace = (c >= 3 && c <= 5) && ((r >= 0 && r <= 2) || (r >= 7 && r <= 9));

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`relative flex items-center justify-center border border-[#b88b56]/40 cursor-pointer active:bg-amber-200/50 transition-colors ${
                    isPalace ? 'bg-[#e5caa0]/50' : ''
                  }`}
                >
                  {isValidTarget && !cell && (
                    <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/60 animate-pulse z-10" />
                  )}

                  {cell && (
                    <div
                      className={`relative w-[90%] h-[90%] rounded-full flex flex-col items-center justify-center border-1.5 sm:border-2 shadow-sm transition-transform ${
                        cell.color === 'red'
                          ? 'bg-[#fff7ed] border-rose-600 text-rose-600 shadow-rose-900/10'
                          : 'bg-[#262626] border-[#e2d5c5] text-[#f5eedc] shadow-black/20'
                      } ${isSelected ? 'ring-2 sm:ring-4 ring-emerald-400 scale-105 z-20' : ''} ${
                        isValidTarget ? 'ring-2 sm:ring-4 ring-amber-400' : ''
                      }`}
                    >
                      <span className="font-extrabold text-xs sm:text-base leading-none">
                        {cell.label}
                      </span>
                      <span className="text-[7.5px] sm:text-[10px] font-bold leading-tight opacity-90 tracking-tighter">
                        {cell.subLabel}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Victory Modal */}
        {winner && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <Trophy className="w-14 h-14 text-yellow-400 mb-2 animate-bounce" />
            <h2 className="text-3xl font-black text-white mb-2">
              BÊN {winner === 'red' ? 'ĐỎ' : 'ĐEN'} TOÀN THẮNG!
            </h2>
            <p className="text-slate-300 text-xs max-w-xs mb-6">
              Tướng đối phương đã bị bắt hạ! Một ván cờ đầy trí tuệ và mưu lược.
            </p>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Đánh Ván Mới
            </button>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        gameTitle="Cờ Tướng Đấu Trí"
        inviteUrl={inviteUrl}
        roomId={roomId}
        isConnected={onlineConnected}
        onSendChat={(text) => roomManager.sendChat(text)}
      />

      <div className="w-full max-w-[620px] mt-2.5 text-center text-xs text-slate-400">
        {mode === 'online'
          ? `Chế độ online: Bạn là Bên ${myRole === 'host' ? 'Đỏ (Đi trước)' : 'Đen (Đi sau)'}. Nước đi tự đồng bộ tức thì.`
          : 'Bấm vào quân cờ để xem các ô có thể đi. Chọn "Mời bạn bè" để chơi đối kháng qua link.'}
      </div>
    </div>
  );
};
