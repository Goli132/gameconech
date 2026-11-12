export type GameType = 'space' | 'snake' | 'brick' | 'flappy' | '2048' | string;

export type GameCategory = 'all' | 'action' | 'arcade' | 'puzzle' | 'custom';

export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface GameItem {
  id: GameType;
  title: string;
  category: 'action' | 'arcade' | 'puzzle' | 'custom';
  description: string;
  badge?: string;
  plays: number;
  rating: number;
  iconType: 'space' | 'snake' | 'brick' | 'flappy' | '2048' | 'caro' | 'cotuong' | 'custom';
  embedUrl?: string; // For custom HTML5 games added by creator
  isCustom?: boolean;
}

export interface HighScoreRecord {
  [gameId: string]: number;
}

