
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/mockDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { GameResult, DailyChallenge, LeaderboardEntry, GameType } from '@/lib/types';
import { toast } from '@/components/ui/sonner';

const ChildDashboard: React.FC = () => {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { childUser, switchToParent } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!childUser) {
      toast.error('No child profile selected');
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch game history
        const results = await db.getGameResultsByChild(childUser.id);
        setGameHistory(results);
        
        // Fetch daily challenge
        const challenge = await db.getDailyChallenge(childUser.id);
        setDailyChallenge(challenge);
        
        // Fetch leaderboard
        const leaderboardData = await db.getLeaderboard();
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Error fetching child dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [childUser]);
  
  const handlePlayGame = (gameType: GameType, levelId: number, isDailyChallenge: boolean = false) => {
    if (!childUser) {
      toast.error('No child profile selected');
      return;
    }
    
    navigate(`/game/${gameType}/${levelId}/${isDailyChallenge ? 'daily' : 'practice'}`);
  };
  
  const getGameDisplayName = (gameType: GameType): string => {
    switch (gameType) {
      case 'mage-run': return 'Mage Run';
      case 'snake-game': return 'Snake Game';
      case 'mirror-moves': return 'Mirror Moves';
      case 'maze-runner': return 'Maze Runner';
      default: return 'Unknown Game';
    }
  };
  
  const getGameEmoji = (gameType: GameType): string => {
    switch (gameType) {
      case 'mage-run': return '🧙';
      case 'snake-game': return '🐍';
      case 'mirror-moves': return '🪞';
      case 'maze-runner': return '🏃';
      default: return '🎮';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin-slow w-16 h-16 border-4 border-mindbloom-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">
            Hi, {childUser?.name}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-muted-foreground mb-4">Welcome to your MindBloom dashboard</p>
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-mindbloom-purple/10 text-mindbloom-purple px-3 py-1 rounded-full flex items-center">
              <span className="mr-1">🔥</span> {childUser?.streakDays || 0} day streak
            </div>
            <Button variant="outline" size="sm" onClick={() => switchToParent()}>
              Parent Mode
            </Button>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-mindbloom-purple to-mindbloom-blue flex items-center justify-center text-white text-4xl font-bold animate-float">
            {childUser?.avatarId || 1}
          </div>
        </div>
      </div>
      
      {dailyChallenge && (
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-mindbloom-purple to-mindbloom-blue h-2"></div>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Challenge</span>
              {dailyChallenge.completed ? (
                <span className="bg-mindbloom-green/10 text-mindbloom-green text-sm px-3 py-1 rounded-full">
                  Completed
                </span>
              ) : (
                <span className="bg-mindbloom-orange/10 text-mindbloom-orange text-sm px-3 py-1 rounded-full animate-pulse">
                  New Challenge
                </span>
              )}
            </CardTitle>
            <CardDescription>Complete your daily game to maintain your streak!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-xl bg-mindbloom-dark flex items-center justify-center text-5xl">
                {getGameEmoji(dailyChallenge.gameType)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{getGameDisplayName(dailyChallenge.gameType)}</h3>
                <p className="text-muted-foreground mb-3">
                  Level {dailyChallenge.levelId} - {dailyChallenge.completed ? 'Great job completing this!' : 'Ready to play?'}
                </p>
                <Button 
                  onClick={() => handlePlayGame(dailyChallenge.gameType, dailyChallenge.levelId, true)} 
                  className="gradient-bg button-shadow"
                  disabled={dailyChallenge.completed}
                >
                  {dailyChallenge.completed ? 'Completed' : 'Play Now'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Practice Games</CardTitle>
            <CardDescription>Improve your skills with these games</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {['mage-run', 'snake-game', 'mirror-moves', 'maze-runner'].map((game) => (
                <Button 
                  key={game} 
                  variant="outline"
                  onClick={() => handlePlayGame(game as GameType, 1)}
                  className="h-auto py-4 flex flex-col gap-2 card-hover"
                >
                  <span className="text-3xl">{getGameEmoji(game as GameType)}</span>
                  <span>{getGameDisplayName(game as GameType)}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>See how you compare with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((entry) => (
                <div 
                  key={entry.childId} 
                  className={`flex items-center p-3 rounded-lg ${
                    entry.childId === childUser?.id ? 'bg-mindbloom-purple/10' : 'bg-muted/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-mindbloom-dark flex items-center justify-center text-white font-bold mr-3">
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mindbloom-purple to-mindbloom-blue flex items-center justify-center text-white text-xs font-bold mr-2">
                        {entry.avatarId}
                      </div>
                      <span className="font-medium">{entry.childName}</span>
                    </div>
                  </div>
                  <div className="font-bold">
                    {entry.score} pts
                  </div>
                </div>
              ))}
              
              {leaderboard.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No data yet. Play games to get on the leaderboard!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your game history</CardDescription>
        </CardHeader>
        <CardContent>
          {gameHistory.length > 0 ? (
            <div className="space-y-3">
              {gameHistory.slice(0, 5).map((result) => (
                <div key={result.id} className="flex flex-col sm:flex-row sm:items-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                    <div className="w-10 h-10 rounded-lg bg-mindbloom-dark flex items-center justify-center text-xl mr-3">
                      {getGameEmoji(result.gameType)}
                    </div>
                    <div>
                      <p className="font-medium">{getGameDisplayName(result.gameType)}</p>
                      <p className="text-xs text-muted-foreground">
                        Level {result.levelId} • {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 ml-auto">
                    <div className="bg-mindbloom-purple/10 px-3 py-1 rounded-full text-sm">
                      Score: {result.score}
                    </div>
                    <div className="bg-mindbloom-green/10 px-3 py-1 rounded-full text-sm">
                      Time: {result.completionTime.toFixed(1)}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No game history yet. Start playing to see your progress!
            </div>
          )}
        </CardContent>
        {gameHistory.length > 5 && (
          <CardFooter>
            <Button variant="outline" className="w-full">View All Activity</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ChildDashboard;
