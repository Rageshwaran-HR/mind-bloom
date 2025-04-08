import { User, ChildUser, ParentUser, GameResult, DailyChallenge, LeaderboardEntry, GameLevel, GameType, EmotionScore, Achievement, ChildAchievement } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock in-memory database for development
const users: User[] = [];
const childCredentials: Map<string, {username: string, password: string}> = new Map();
const gameResults: GameResult[] = [];
const dailyChallenges: DailyChallenge[] = [];
const childAchievements: ChildAchievement[] = [];

// Avatar options
export const avatarOptions = [
  { id: 1, url: '/avatars/kid-avatar-1.png', name: 'Happy Kid' },
  { id: 2, url: '/avatars/kid-avatar-2.png', name: 'Cool Kid' },
  { id: 3, url: '/avatars/kid-avatar-3.png', name: 'Smart Kid' },
  { id: 4, url: '/avatars/kid-avatar-4.png', name: 'Creative Kid' },
  { id: 5, url: '/avatars/kid-avatar-5.png', name: 'Adventurous Kid' },
  { id: 6, url: '/avatars/kid-avatar-6.png', name: 'Curious Kid' },
];

// Achievement definitions
export const achievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Play your first game',
    icon: '🎮',
    maxProgress: 1
  },
  {
    id: '2',
    title: 'Quick Learner',
    description: 'Complete 5 games',
    icon: '🧠',
    maxProgress: 5
  },
  {
    id: '3',
    title: 'Focus Master',
    description: 'Achieve a focus score of over 80%',
    icon: '🔍',
    maxProgress: 1
  },
  {
    id: '4',
    title: 'Streak Champion',
    description: 'Maintain a 5-day streak',
    icon: '🔥',
    maxProgress: 5
  },
  {
    id: '5',
    title: 'Joy Seeker',
    description: 'Achieve a joy score of over 85%',
    icon: '😄',
    maxProgress: 1
  },
  {
    id: '6',
    title: 'Game Master',
    description: 'Complete all game types',
    icon: '🏆',
    maxProgress: 4
  }
];

// Define game levels with adjusted difficulty for easy levels
const gameLevels: Record<GameType, GameLevel[]> = {
  'mage-run': [
    { id: 1, name: 'Forest Path', difficulty: 'easy', speed: 0.7, obstacles: 3, timeLimit: 80 }, // Made easier
    { id: 2, name: 'Castle Bridge', difficulty: 'medium', speed: 1.2, obstacles: 6, timeLimit: 60 },
    { id: 3, name: 'Dragon Keep', difficulty: 'hard', speed: 1.8, obstacles: 10, timeLimit: 50 },
  ],
  'snake-game': [
    { id: 1, name: 'Garden Maze', difficulty: 'easy', speed: 0.7, obstacles: 0, timeLimit: 80 }, // Made easier
    { id: 2, name: 'Forest Clearing', difficulty: 'medium', speed: 1.3, obstacles: 2, timeLimit: 60 },
    { id: 3, name: 'Ancient Ruins', difficulty: 'hard', speed: 1.8, obstacles: 4, timeLimit: 50 },
  ],
  'mirror-moves': [
    { id: 1, name: 'Village Square', difficulty: 'easy', speed: 0.7, obstacles: 0, timeLimit: 60 }, // Made easier
    { id: 2, name: 'Crystal Cave', difficulty: 'medium', speed: 1.3, obstacles: 0, timeLimit: 45 },
    { id: 3, name: 'Mystic Temple', difficulty: 'hard', speed: 1.8, obstacles: 0, timeLimit: 35 },
  ],
  'maze-runner': [
    { id: 1, name: 'Hedge Maze', difficulty: 'easy', speed: 0.8, obstacles: 0, timeLimit: 80 }, // Made easier
    { id: 2, name: 'Desert Labyrinth', difficulty: 'medium', speed: 1, obstacles: 0, timeLimit: 75 },
    { id: 3, name: 'Ice Cavern', difficulty: 'hard', speed: 1, obstacles: 2, timeLimit: 90 },
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

  childLogin: async (username: string, password: string): Promise<ChildUser> => {
    // Find child with matching username
    const childUsers = users.filter(u => !u.isParent) as ChildUser[];
    const childUser = childUsers.find(child => 
      child.username && child.username.toLowerCase() === username.toLowerCase()
    );
    
    if (!childUser) {
      throw new Error('Child not found');
    }

    // Verify credentials
    const credentials = childCredentials.get(childUser.id);
    if (!credentials || credentials.username !== username || credentials.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    return childUser;
  },
  
  createChild: async (parentId: string, name: string, avatarId: number, username: string, password: string): Promise<ChildUser> => {
    const parent = users.find(u => u.id === parentId && u.isParent) as ParentUser | undefined;
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    // Check if username is already taken
    const existingCredentials = Array.from(childCredentials.values());
    if (existingCredentials.some(cred => cred.username === username)) {
      throw new Error('Username already taken');
    }
    
    const childId = uuidv4();
    const avatar = avatarOptions.find(a => a.id === avatarId);
    
    const childUser: ChildUser = {
      id: childId,
      email: `${name.toLowerCase()}_${Date.now()}@child.mindbloom.com`,
      isParent: false,
      name,
      parentId,
      avatarId,
      avatarUrl: avatar?.url,
      streakDays: 0,
      createdAt: new Date().toISOString(),
      username
    };
    
    // Store the child's credentials
    childCredentials.set(childId, { username, password });
    
    users.push(childUser);
    parent.children.push(childUser);
    
    // Create first daily challenge
    createDailyChallenge(childUser.id);
    
    // Add first achievement - First Steps
    createChildAchievement(childUser.id, '1', 0, 1);
    
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
          
          // Check for streak achievement
          if (child.streakDays >= 5) {
            updateAchievementProgress(child.id, '4', 5);
          }
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
      
      // Update achievements
      // First Steps achievement - Just playing a game completes this
      updateAchievementProgress(child.id, '1', 1);
      
      // Quick Learner achievement - Complete 5 games
      const completedGames = gameResults.filter(gr => gr.childId === child.id).length + 1;
      updateAchievementProgress(child.id, '2', Math.min(completedGames, 5));
      
      // Focus Master achievement
      if (result.emotionScore.focus >= 0.8) {
        updateAchievementProgress(child.id, '3', 1);
      }
      
      // Joy Seeker achievement
      if (result.emotionScore.joy >= 0.85) {
        updateAchievementProgress(child.id, '5', 1);
      }
      
      // Game Master achievement - Complete all game types
      const uniqueGames = new Set(gameResults.filter(gr => gr.childId === child.id).map(gr => gr.gameType));
      uniqueGames.add(result.gameType);
      updateAchievementProgress(child.id, '6', Math.min(uniqueGames.size, 4));
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
      avatarUrl: child.avatarUrl,
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
  },
  
  // Achievements
  getChildAchievements: async (childId: string): Promise<Achievement[]> => {
    // Get all the child's achievement progress
    const childAchievementList = childAchievements.filter(ca => ca.childId === childId);
    
    // Map the achievement definitions with the child's progress
    return achievements.map(achievement => {
      const childAchievement = childAchievementList.find(ca => ca.achievementId === achievement.id);
      
      if (!childAchievement) {
        return {
          ...achievement,
          progress: 0,
          unlockedAt: undefined
        };
      }
      
      return {
        ...achievement,
        progress: childAchievement.progress,
        maxProgress: childAchievement.maxProgress,
        unlockedAt: childAchievement.progress >= childAchievement.maxProgress ? childAchievement.unlockedAt : undefined
      };
    });
  },
  
  getSentimentInsight: async (childId: string): Promise<string> => {
    const trends = await db.getEmotionTrends(childId);
    
    if (trends.length === 0) return "No data available yet.";
    
    const latest = trends[trends.length - 1].emotions;
    const trend = trends.length > 1
      ? trends[trends.length - 1].emotions.overall - trends[trends.length - 2].emotions.overall
      : 0;
    
    // Generate more detailed and personalized insights based on the emotional data
    const insights = [];
    
    // Detect emotional patterns and provide more specific feedback
    if (latest.overall > 0.7) {
      insights.push("Your child is showing excellent emotional well-being! They appear to be thriving in their activities.");
    } else if (latest.overall > 0.3) {
      insights.push("Your child is showing good emotional balance. Their mental health indicators are positive.");
    } else if (latest.overall > 0) {
      insights.push("Your child's emotional state is generally neutral. Some activities might help boost their engagement.");
    } else if (latest.overall > -0.3) {
      insights.push("Your child may be experiencing some minor challenges. Consider checking in to provide support.");
    } else {
      insights.push("Your child might be struggling emotionally. We recommend having a conversation about their experience.");
    }
    
    // Add trend-based insights
    if (trend > 0.3) {
      insights.push("There's been a significant positive improvement in their emotional state recently!");
    } else if (trend > 0.1) {
      insights.push("Their emotional well-being is showing a positive trend.");
    } else if (trend < -0.3) {
      insights.push("There's been a notable decline in their emotional indicators. Consider exploring the cause.");
    } else if (trend < -0.1) {
      insights.push("Their emotional state has slightly decreased recently.");
    }
    
    // Add specific insights based on individual metrics
    if (latest.joy < 0.3) {
      insights.push("Joy levels are quite low. Consider activities that promote fun and positive experiences.");
    } else if (latest.joy > 0.8) {
      insights.push("They're showing high levels of joy and happiness in their activities!");
    }
    
    if (latest.frustration > 0.7) {
      insights.push("Frustration levels are elevated. The activities might be too challenging or causing stress.");
    } else if (latest.frustration < 0.2) {
      insights.push("They're managing challenges well with minimal frustration.");
    }
    
    if (latest.focus < 0.4) {
      insights.push("Focus levels are lower than ideal. They might benefit from shorter, more engaging sessions.");
    } else if (latest.focus > 0.8) {
      insights.push("Their ability to focus is excellent! They're showing strong concentration skills.");
    }
    
    if (latest.engagement < 0.4) {
      insights.push("Engagement is low. They might need more stimulating or varied activities.");
    } else if (latest.engagement > 0.8) {
      insights.push("They're highly engaged with the activities, showing strong interest and participation!");
    }
    
    // Return a subset of insights to avoid overwhelming
    return insights.slice(0, 3).join(' ');
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

// Create/update achievement progress for a child
function createChildAchievement(childId: string, achievementId: string, progress: number, maxProgress: number): void {
  const now = new Date().toISOString();
  const existing = childAchievements.find(ca => ca.childId === childId && ca.achievementId === achievementId);
  
  if (existing) {
    existing.progress = progress;
    if (progress >= maxProgress && !existing.unlockedAt) {
      existing.unlockedAt = now;
    }
  } else {
    childAchievements.push({
      childId,
      achievementId,
      progress,
      maxProgress,
      unlockedAt: progress >= maxProgress ? now : ''
    });
  }
}

// Update achievement progress
function updateAchievementProgress(childId: string, achievementId: string, progress: number): void {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement) return;
  
  const existing = childAchievements.find(ca => ca.childId === childId && ca.achievementId === achievementId);
  const maxProgress = achievement.maxProgress || 1;
  
  if (existing) {
    existing.progress = Math.max(existing.progress, progress);
    if (existing.progress >= maxProgress && !existing.unlockedAt) {
      existing.unlockedAt = new Date().toISOString();
    }
  } else {
    createChildAchievement(childId, achievementId, progress, maxProgress);
  }
}

// Generate emotion score based on game performance with improved algorithm
export function generateEmotionScore(
  completionTime: number,
  timeLimit: number,
  retryCount: number,
  successRate: number,
  reactionTimes: number[]
): EmotionScore {
  // More sophisticated analysis of reaction times
  const avgReactionTime = reactionTimes.length ? 
    reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length : 
    500; // Default to 500ms
  
  // Analyze consistency in reaction times (lower variance is better)
  const reactionTimeVariance = reactionTimes.length > 1 ?
    Math.sqrt(reactionTimes.reduce((sum, time) => sum + Math.pow(time - avgReactionTime, 2), 0) / reactionTimes.length) / avgReactionTime :
    0.5; // Default to medium variance
  
  // Calculate time efficiency (how well they used available time)
  const timeEfficiency = Math.min(timeLimit / completionTime, 1.5); // Allow overperformance up to 150%
  const normalizedTimeEfficiency = Math.min(Math.max(timeEfficiency, 0.5), 1.5) / 1.5; // Normalize to 0-1
  
  // Calculate retry impact - diminish for each retry
  const retryFactor = Math.max(0, 1 - retryCount * 0.15);
  
  // More nuanced reaction factor - rewards both speed and consistency
  const reactionSpeed = Math.min(Math.max(1 - (avgReactionTime - 200) / 800, 0), 1);
  const reactionConsistency = Math.min(Math.max(1 - reactionTimeVariance, 0), 1);
  const reactionFactor = reactionSpeed * 0.6 + reactionConsistency * 0.4;
  
  // Calculate emotion scores with more subtle interactions
  const joy = successRate * 0.4 + normalizedTimeEfficiency * 0.3 + retryFactor * 0.1 + reactionConsistency * 0.2;
  
  const frustration = (1 - successRate) * 0.3 + 
                    retryCount * 0.15 + 
                    (1 - normalizedTimeEfficiency) * 0.15 + 
                    (1 - reactionConsistency) * 0.4;
  
  const engagement = reactionFactor * 0.3 + 
                   (retryCount > 0 ? Math.min(0.3, retryCount * 0.1) : 0) + 
                   successRate * 0.2 + 
                   Math.min(timeEfficiency, 1) * 0.2;
  
  const focus = reactionConsistency * 0.5 + 
              normalizedTimeEfficiency * 0.3 + 
              (1 - Math.min(retryCount * 0.1, 0.2));
  
  // Calculate overall score (-1 to 1 range) with more balanced weighting
  const overall = (joy * 0.35 + engagement * 0.25 + focus * 0.25) - (frustration * 0.7);
  
  return {
    joy: Math.min(Math.max(joy, 0), 1),
    frustration: Math.min(Math.max(frustration, 0), 1),
    engagement: Math.min(Math.max(engagement, 0), 1),
    focus: Math.min(Math.max(focus, 0), 1),
    overall: Math.min(Math.max(overall, -1), 1),
  };
}
