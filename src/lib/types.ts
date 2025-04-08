
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
  avatarUrl?: string; // For image-based avatars
  streakDays: number;
  lastPlayDate?: string;
  username?: string; // For child login
  password?: string; // For child login (will be hashed in the actual database)
}

export interface ParentUser extends User {
  children: ChildUser[];
}

// Game related types
export type GameType = 'mage-run' | 'snake-game' | 'mirror-moves' | 'maze-runner';

export interface GameLevel {
  id: number | string;
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
  avatarUrl?: string;
  score: number;
  rank: number;
  gameType?: GameType;
  difficulty?: string;
}

// Achievement system
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface ChildAchievement {
  childId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  maxProgress: number;
}

// Database responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Game session data for Supabase
export interface GameSession {
  id?: string;
  child_id: string;
  game_id: string;
  difficulty: string;
  score: number;
  time_spent?: number;
  moves?: number;
  completed: boolean;
  win: boolean;
  attempts: number;
  created_at?: string;
}

// Sentiment analysis data for Supabase
export interface SentimentAnalysis {
  id?: string;
  child_id: string;
  game_session_id: string;
  frustration_level: number;
  persistence_level: number;
  focus_level: number;
  enjoyment_level: number;
  overall_sentiment: string;
  notes?: string;
  created_at?: string;
}

// Database game level type
export interface DbGameLevel {
  id: string;
  game_id: string;
  level_number: number;
  name: string;
  difficulty: string;
  speed: number;
  obstacles: number;
  time_limit: number;
  created_at: string;
}

// Leaderboard entry from database
export interface DbLeaderboardEntry {
  child_id: string;
  child_name: string;
  avatar_emoji: string;
  game_id: string;
  game_name: string;
  game_slug: string;
  difficulty: string;
  score: number;
  created_at: string;
}
