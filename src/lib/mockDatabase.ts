
import { User, ChildUser, ParentUser, GameResult, DailyChallenge, LeaderboardEntry, GameLevel, GameType, EmotionScore } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock in-memory database for development
const users: User[] = [];
const gameResults: GameResult[] = [];
const dailyChallenges: DailyChallenge[] = [];

// Define game levels
const gameLevels: Record<GameType, GameLevel[]> = {
  'mage-run': [
    { id: 1, name: 'Forest Path', difficulty: 'easy', speed: 1, obstacles: 5, timeLimit: 60 },
    { id: 2, name: 'Castle Bridge', difficulty: 'medium', speed: 1.5, obstacles: 8, timeLimit: 50 },
    { id: 3, name: 'Dragon Keep', difficulty: 'hard', speed: 2, obstacles: 12, timeLimit: 45 },
  ],
  'snake-game': [
    { id: 1, name: 'Garden Maze', difficulty: 'easy', speed: 1, obstacles: 0, timeLimit: 60 },
    { id: 2, name: 'Forest Clearing', difficulty: 'medium', speed: 1.5, obstacles: 3, timeLimit: 50 },
    { id: 3, name: 'Ancient Ruins', difficulty: 'hard', speed: 2, obstacles: 5, timeLimit: 45 },
  ],
  'mirror-moves': [
    { id: 1, name: 'Village Square', difficulty: 'easy', speed: 1, obstacles: 0, timeLimit: 45 },
    { id: 2, name: 'Crystal Cave', difficulty: 'medium', speed: 1.5, obstacles: 0, timeLimit: 40 },
    { id: 3, name: 'Mystic Temple', difficulty: 'hard', speed: 2, obstacles: 0, timeLimit: 30 },
  ],
  'maze-runner': [
    { id: 1, name: 'Hedge Maze', difficulty: 'easy', speed: 1, obstacles: 0, timeLimit: 60 },
    { id: 2, name: 'Desert Labyrinth', difficulty: 'medium', speed: 1, obstacles: 0, timeLimit: 75 },
    { id: 3, name: 'Ice Cavern', difficulty: 'hard', speed: 1, obstacles: 3, timeLimit: 90 },
  ],
};

// Mock database functions
export const db = {
  // User related
  createParent: async (email: string, password: string, name: string): Promise<ParentUser> => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const newUser: ParentUser = {
      id: uuidv4(),
      email,
      isParent: true,
      name,
      createdAt: new Date().toISOString(),
      children: []
    };
    
    users.push(newUser);
    return newUser;
  },
  
  login: async (email: string, password: string): Promise<User> => {
    // In a real app, we would verify password hash
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    return user;
  },
  
  createChild: async (parentId: string, name: string, avatarId: number): Promise<ChildUser> => {
    const parent = users.find(u => u.id === parentId && u.isParent) as ParentUser | undefined;
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    const childUser: ChildUser = {
      id: uuidv4(),
      email: `${name.toLowerCase()}_${Date.now()}@child.mindbloom.com`,
      isParent: false,
      name,
      parentId,
      avatarId,
      streakDays: 0,
      createdAt: new Date().toISOString(),
    };
    
    users.push(childUser);
    parent.children.push(childUser);
    
    // Create first daily challenge
    createDailyChallenge(childUser.id);
    
    return childUser;
  },
  
  getUser: async (id: string): Promise<User | null> => {
    return users.find(u => u.id === id) || null;
  },
  
  getParent: async (id: string): Promise<ParentUser | null> => {
    const user = users.find(u => u.id === id && u.isParent) as ParentUser | null;
    if (user) {
      // Make sure to populate children
      user.children = users.filter(u => !u.isParent && (u as ChildUser).parentId === id) as ChildUser[];
    }
    return user;
  },
  
  getChild: async (id: string): Promise<ChildUser | null> => {
    return users.find(u => u.id === id && !u.isParent) as ChildUser | null;
  },
  
  // Game related
  saveGameResult: async (result: Omit<GameResult, 'id' | 'createdAt'>): Promise<GameResult> => {
    const newResult: GameResult = {
      ...result,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    gameResults.push(newResult);
    
    // Update child's streak
    const child = users.find(u => u.id === result.childId && !u.isParent) as ChildUser | undefined;
    if (child) {
      const today = new Date().toDateString();
      const lastPlay = child.lastPlayDate ? new Date(child.lastPlayDate).toDateString() : null;
      
      if (!lastPlay) {
        child.streakDays = 1;
      } else if (lastPlay !== today) {
        // Check if last play was yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastPlay === yesterday.toDateString()) {
          child.streakDays += 1;
        } else {
          child.streakDays = 1; // Reset streak
        }
      }
      
      child.lastPlayDate = new Date().toISOString();
      
      // Mark daily challenge as completed if matching
      const challenge = dailyChallenges.find(
        c => c.childId === child.id && 
        c.gameType === result.gameType && 
        c.levelId === result.levelId &&
        new Date(c.date).toDateString() === today &&
        !c.completed
      );
      
      if (challenge) {
        challenge.completed = true;
      }
    }
    
    return newResult;
  },
  
  getGameResultsByChild: async (childId: string): Promise<GameResult[]> => {
    return gameResults.filter(r => r.childId === childId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  
  getGameLevels: async (gameType: GameType): Promise<GameLevel[]> => {
    return gameLevels[gameType] || [];
  },
  
  getAllGameLevels: async (): Promise<Record<GameType, GameLevel[]>> => {
    return gameLevels;
  },
  
  // Daily challenges
  getDailyChallenge: async (childId: string): Promise<DailyChallenge | null> => {
    const today = new Date().toDateString();
    let challenge = dailyChallenges.find(
      c => c.childId === childId && new Date(c.date).toDateString() === today
    );
    
    if (!challenge) {
      challenge = createDailyChallenge(childId);
    }
    
    return challenge;
  },
  
  // Leaderboard
  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const childUsers = users.filter(u => !u.isParent) as ChildUser[];
    
    const leaderboardMap = new Map<string, number>();
    
    // Calculate total scores
    gameResults.forEach(result => {
      const currentScore = leaderboardMap.get(result.childId) || 0;
      leaderboardMap.set(result.childId, currentScore + result.score);
    });
    
    // Create and sort entries
    const entries: LeaderboardEntry[] = childUsers.map(child => ({
      childId: child.id,
      childName: child.name,
      avatarId: child.avatarId,
      score: leaderboardMap.get(child.id) || 0,
      rank: 0, // Will be calculated below
    })).sort((a, b) => b.score - a.score);
    
    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return entries;
  },
  
  // Analytics
  getEmotionTrends: async (childId: string): Promise<{ date: string; emotions: EmotionScore }[]> => {
    const results = await db.getGameResultsByChild(childId);
    
    // Group by date
    const resultsByDate = results.reduce((acc, result) => {
      const date = new Date(result.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(result);
      return acc;
    }, {} as Record<string, GameResult[]>);
    
    // Calculate average emotions per day
    return Object.entries(resultsByDate).map(([date, dayResults]) => {
      const totalEmotions = dayResults.reduce(
        (acc, result) => {
          acc.joy += result.emotionScore.joy;
          acc.frustration += result.emotionScore.frustration;
          acc.engagement += result.emotionScore.engagement;
          acc.focus += result.emotionScore.focus;
          acc.overall += result.emotionScore.overall;
          return acc;
        },
        { joy: 0, frustration: 0, engagement: 0, focus: 0, overall: 0 }
      );
      
      const count = dayResults.length;
      
      return {
        date,
        emotions: {
          joy: totalEmotions.joy / count,
          frustration: totalEmotions.frustration / count,
          engagement: totalEmotions.engagement / count,
          focus: totalEmotions.focus / count,
          overall: totalEmotions.overall / count,
        }
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
};

// Helper functions
function createDailyChallenge(childId: string): DailyChallenge {
  // Generate a random game type and level
  const gameTypes: GameType[] = ['mage-run', 'snake-game', 'mirror-moves', 'maze-runner'];
  const randomGameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
  const levels = gameLevels[randomGameType];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];
  
  const challenge: DailyChallenge = {
    id: uuidv4(),
    childId,
    gameType: randomGameType,
    levelId: randomLevel.id,
    date: new Date().toISOString(),
    completed: false,
  };
  
  dailyChallenges.push(challenge);
  return challenge;
}

// Generate emotion score based on game performance
export function generateEmotionScore(
  completionTime: number,
  timeLimit: number,
  retryCount: number,
  successRate: number,
  reactionTimes: number[]
): EmotionScore {
  // Normalize values
  const timeRatio = Math.min(timeLimit / completionTime, 1); // Higher is better
  const retryFactor = Math.max(0, 1 - retryCount * 0.1); // Lower retry count is better
  const avgReactionTime = reactionTimes.length ? 
    reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length : 
    500; // Default to 500ms
  
  const reactionFactor = Math.min(Math.max(1 - (avgReactionTime - 200) / 800, 0), 1); // 200ms-1000ms range
  
  // Calculate emotion scores
  const joy = timeRatio * 0.3 + successRate * 0.5 + retryFactor * 0.2;
  const frustration = (1 - successRate) * 0.4 + retryCount * 0.1 + (1 - timeRatio) * 0.2;
  const engagement = reactionFactor * 0.6 + (retryCount > 0 ? 0.3 : 0) + successRate * 0.3;
  const focus = reactionFactor * 0.7 + timeRatio * 0.3;
  
  // Calculate overall score (-1 to 1 range)
  const overall = (joy * 0.4 + engagement * 0.3 + focus * 0.3) - (frustration * 0.8);
  
  return {
    joy: Math.min(Math.max(joy, 0), 1),
    frustration: Math.min(Math.max(frustration, 0), 1),
    engagement: Math.min(Math.max(engagement, 0), 1),
    focus: Math.min(Math.max(focus, 0), 1),
    overall: Math.min(Math.max(overall, -1), 1),
  };
}
