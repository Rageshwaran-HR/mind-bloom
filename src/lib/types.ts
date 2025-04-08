// User types
export interface User {
  id: string;
  email: string;
  isParent: boolean;
  name: string;
  createdAt: string;
}

export interface ChildUser extends User {
  parentId: string;
  avatarId: number;
  streakDays: number;
  lastPlayDate?: string;
  username?: string; // Added username for child login
}

export interface ParentUser extends User {
  children: ChildUser[];
}

// Game related types
export type GameType = 'mage-run' | 'snake-game' | 'mirror-moves' | 'maze-runner';

export interface GameLevel {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  speed: number;
  obstacles: number;
  timeLimit: number;
}

export interface GameResult {
  id: string;
  childId: string;
  gameType: GameType;
  levelId: number;
  score: number;
  completionTime: number; // in seconds
  retryCount: number;
  successRate: number; // 0-1
  reactionTimes: number[]; // array of reaction times in ms
  emotionScore: EmotionScore;
  createdAt: string;
}

export interface EmotionScore {
  joy: number; // 0-1
  frustration: number; // 0-1
  engagement: number; // 0-1
  focus: number; // 0-1
  overall: number; // -1 to 1
}

export interface DailyChallenge {
  id: string;
  childId: string;
  gameType: GameType;
  levelId: number;
  date: string;
  completed: boolean;
}

export interface LeaderboardEntry {
  childId: string;
  childName: string;
  avatarId: number;
  score: number;
  rank: number;
}

// Database responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
