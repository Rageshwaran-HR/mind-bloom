
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GameType, GameLevel, GameResult, EmotionScore } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MageRun from './MageRun';
import SnakeGame from './SnakeGame';
import MirrorMoves from './MirrorMoves';
import MazeRunner from './MazeRunner';
import { Trophy, Clock, BarChart3, Award, Target, ArrowLeft } from 'lucide-react';

interface GameContainerProps {
  gameType: GameType;
  levelId: number;
  childId: string;
  isDailyChallenge?: boolean;
}

const GameContainer: React.FC<GameContainerProps> = ({ 
  gameType, 
  levelId, 
  childId,
  isDailyChallenge = false
}) => {
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showGameInstructions, setShowGameInstructions] = useState(true);
  const [gameId, setGameId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { childUser } = useAuth();
  
  useEffect(() => {
    const loadGameInfo = async () => {
      try {
        // Load game ID from database
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('id, slug')
          .eq('slug', gameType)
          .single();
          
        if (gameError) throw gameError;
        
        setGameId(gameData.id);
        
        // Load game levels from game_levels table
        const { data: levelData, error: levelError } = await supabase
          .from('game_levels')
          .select('*')
          .eq('game_id', gameData.id)
          .eq('level_number', levelId)
          .single();
        
        if (levelError) {
          // If level not found in database, use backup level data
          const backupLevel: GameLevel = {
            id: levelId,
            name: `Level ${levelId}`,
            difficulty: levelId <= 2 ? 'easy' : levelId <= 4 ? 'medium' : 'hard',
            speed: levelId * 2,
            obstacles: levelId * 3,
            timeLimit: Math.max(60 - (levelId * 5), 30)
          };
          
          setLevel(backupLevel);
        } else {
          // Map database level to GameLevel type
          const gameLevel: GameLevel = {
            id: levelData.level_number,
            name: levelData.name || `Level ${levelData.level_number}`,
            difficulty: levelData.difficulty as 'easy' | 'medium' | 'hard',
            speed: levelData.speed || levelId * 2,
            obstacles: levelData.obstacles || levelId * 3,
            timeLimit: levelData.time_limit || Math.max(60 - (levelId * 5), 30)
          };
          
          setLevel(gameLevel);
        }
      } catch (error) {
        console.error('Error loading game level:', error);
        toast.error('Failed to load game');
        
        // Fallback level data
        const fallbackLevel: GameLevel = {
          id: levelId,
          name: `Level ${levelId}`,
          difficulty: levelId <= 2 ? 'easy' : levelId <= 4 ? 'medium' : 'hard',
          speed: levelId * 2,
          obstacles: levelId * 3,
          timeLimit: Math.max(60 - (levelId * 5), 30)
        };
        
        setLevel(fallbackLevel);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGameInfo();
  }, [gameType, levelId]);
  
  const startGame = () => {
    setShowGameInstructions(false);
    setGameStarted(true);
    setStartTime(Date.now());
    setReactionTimes([]);
  };
  
  const handleReactionTime = (time: number) => {
    setReactionTimes(prev => [...prev, time]);
  };
  
  const handleGameOver = async (score: number, success: boolean) => {
    if (!level || !startTime) return;
    
    const endTime = Date.now();
    const completionTime = (endTime - startTime) / 1000; // convert to seconds
    
    if (success) {
      // Game was completed successfully
      setGameCompleted(true);
      
      // Calculate emotion score
      const successRate = score / 100; // Normalize score to 0-1
      const emotionScore = generateEmotionScore(
        completionTime,
        level.timeLimit,
        retryCount,
        successRate,
        reactionTimes
      );
      
      // Save game result
      try {
        // First, create or update game session
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .insert({
            child_id: childId,
            game_id: gameId,
            difficulty: level.difficulty,
            score: score,
            time_spent: Math.round(completionTime),
            moves: reactionTimes.length,
            completed: true,
            win: true,
            attempts: retryCount + 1
          })
          .select()
          .single();
          
        if (sessionError) throw sessionError;
        
        // Then, create sentiment analysis entry
        const { data: sentimentData, error: sentimentError } = await supabase
          .from('sentiment_analysis')
          .insert({
            child_id: childId,
            game_session_id: sessionData.id,
            enjoyment_level: Math.round(emotionScore.joy * 100),
            frustration_level: Math.round(emotionScore.frustration * 100),
            focus_level: Math.round(emotionScore.focus * 100),
            persistence_level: Math.round(emotionScore.engagement * 100),
            overall_sentiment: emotionScore.overall > 0.3 ? 'positive' : 
                              emotionScore.overall > -0.3 ? 'neutral' : 'negative'
          });
        
        if (sentimentError) throw sentimentError;
        
        // Update leaderboard if score is high
        const { error: leaderboardError } = await supabase
          .from('leaderboard')
          .insert({
            child_id: childId,
            child_name: childUser?.name || 'Unknown',
            avatar_emoji: childUser?.avatarId.toString() || '1',
            game_id: gameId,
            game_name: gameType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            game_slug: gameType,
            difficulty: level.difficulty,
            score: score,
            created_at: new Date().toISOString()
          });
        
        if (leaderboardError) console.error('Error updating leaderboard:', leaderboardError);
        
        // Create result object for UI
        const result: GameResult = {
          id: sessionData.id,
          childId: childId,
          gameType: gameType as GameType,
          levelId: level.id,
          score: score,
          completionTime: completionTime,
          retryCount: retryCount,
          successRate: successRate,
          reactionTimes: reactionTimes,
          emotionScore: emotionScore,
          createdAt: new Date().toISOString()
        };
        
        setGameResult(result);
        
        toast.success('Game completed! Result saved');
      } catch (error) {
        console.error('Error saving game result:', error);
        toast.error('Failed to save game result');
      }
    } else {
      // Game failed
      setRetryCount(prev => prev + 1);
      setGameStarted(false);
      toast.error('Game over! Try again?');
    }
  };
  
  // Generate emotion score based on game performance
  const generateEmotionScore = (
    completionTime: number,
    timeLimit: number,
    retryCount: number,
    successRate: number,
    reactionTimes: number[]
  ): EmotionScore => {
    // Calculate average reaction time (in seconds)
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length / 1000
      : 1;
    
    // Time efficiency (higher is better)
    const timeEfficiency = Math.min(1, (timeLimit / Math.max(completionTime, 1)));
    
    // Joy - based on success rate and time efficiency
    const joy = Math.min(1, (successRate * 0.7) + (timeEfficiency * 0.3));
    
    // Frustration - based on retry count and reaction times
    const baseRetryFrustration = Math.min(1, retryCount / 5);
    const reactionFrustration = Math.min(1, avgReactionTime / 2);
    const frustration = (baseRetryFrustration * 0.7) + (reactionFrustration * 0.3);
    
    // Engagement - based on reaction time consistency and success
    const rtConsistency = reactionTimes.length > 1 
      ? 1 - Math.min(1, standardDeviation(reactionTimes) / 1000)
      : 0.5;
    const engagement = (rtConsistency * 0.6) + (successRate * 0.4);
    
    // Focus - based on time efficiency and reaction time
    const focus = (timeEfficiency * 0.5) + (Math.max(0, 1 - avgReactionTime / 2) * 0.5);
    
    // Overall score combines all factors (-1 to 1 scale)
    const overall = ((joy + engagement + focus) / 3) - frustration;
    
    return {
      joy,
      frustration,
      engagement,
      focus,
      overall: Math.max(-1, Math.min(1, overall))
    };
  };
  
  // Helper function to calculate standard deviation
  const standardDeviation = (values: number[]): number => {
    if (values.length <= 1) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  };
  
  const handleRetry = () => {
    setGameStarted(false);
    setGameCompleted(false);
    // Don't reset retry count as we want to track it
  };
  
  const handleFinish = () => {
    navigate('/child-dashboard');
  };
  
  const getGameInstructions = () => {
    switch (gameType) {
      case 'mage-run':
        return (
          <div className="text-white">
            <h3 className="text-xl font-bold mb-3">How to Play Mage Run</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the arrow keys (↑, ↓, ←, →) to move the mage character</li>
              <li>Avoid obstacles and enemies</li>
              <li>Collect magic orbs to gain points</li>
              <li>Reach the end of the level before time runs out</li>
              <li>The faster you complete the level, the higher your score!</li>
            </ul>
          </div>
        );
      case 'snake-game':
        return (
          <div className="text-white">
            <h3 className="text-xl font-bold mb-3">How to Play Snake Game</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the arrow keys (↑, ↓, ←, →) to change the snake's direction</li>
              <li>Eat the food to grow longer and score points</li>
              <li>Avoid hitting the walls or your own tail</li>
              <li>The longer your snake gets, the higher your score!</li>
              <li>Try to survive as long as possible</li>
            </ul>
          </div>
        );
      case 'mirror-moves':
        return (
          <div className="text-white">
            <h3 className="text-xl font-bold mb-3">How to Play Mirror Moves</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Watch the pattern of lights carefully</li>
              <li>When it's your turn, repeat the pattern by pressing the matching arrows</li>
              <li>Each correct sequence gives you points</li>
              <li>The pattern gets longer and more complex as you progress</li>
              <li>Try to remember and repeat as many sequences as possible!</li>
            </ul>
          </div>
        );
      case 'maze-runner':
        return (
          <div className="text-white">
            <h3 className="text-xl font-bold mb-3">How to Play Maze Runner</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the arrow keys (↑, ↓, ←, →) to navigate through the maze</li>
              <li>Find the shortest path to the exit</li>
              <li>Collect gems along the way for extra points</li>
              <li>Avoid traps and dead ends</li>
              <li>Complete the maze as quickly as possible for a higher score!</li>
            </ul>
          </div>
        );
      default:
        return <div className="text-white">Use arrow keys to play this game.</div>;
    }
  };
  
  const renderGame = () => {
    if (!level) return null;
    
    const props = {
      level,
      onGameOver: handleGameOver,
      onReactionTime: handleReactionTime
    };
    
    switch (gameType) {
      case 'mage-run':
        return <MageRun {...props} />;
      case 'snake-game':
        return <SnakeGame {...props} />;
      case 'mirror-moves':
        return <MirrorMoves {...props} />;
      case 'maze-runner':
        return <MazeRunner {...props} />;
      default:
        return <div>Game not found</div>;
    }
  };
  
  const getGameTitle = () => {
    switch (gameType) {
      case 'mage-run': return 'Mage Run';
      case 'snake-game': return 'Snake Game';
      case 'mirror-moves': return 'Mirror Moves';
      case 'maze-runner': return 'Maze Runner';
      default: return 'Game';
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-mindbloom-green bg-mindbloom-green/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-mindbloom-green bg-mindbloom-green/10';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin-slow w-16 h-16 border-4 border-mindbloom-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!level) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">Game level not found</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate('/child-dashboard')}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center"
              onClick={() => navigate('/child-dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
            
            <CardTitle className="flex items-center">
              <span>{getGameTitle()} - {level?.name}</span> 
              <span className={`text-sm font-normal px-3 py-1 rounded-full ml-2 ${getDifficultyColor(level?.difficulty || 'easy')}`}>
                {level?.difficulty}
              </span>
            </CardTitle>
            
            {isDailyChallenge && (
              <span className="text-sm text-mindbloom-orange font-semibold bg-mindbloom-orange/10 px-3 py-1 rounded-full">
                Daily Challenge
              </span>
            )}
          </div>
          <CardDescription className="flex items-center justify-center text-center mt-2">
            <Clock className="w-4 h-4 mr-1" />
            Time Limit: {level?.timeLimit} seconds
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="game-container bg-mindbloom-dark">
        {!gameStarted && !gameCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-6">
            {showGameInstructions ? (
              <div className="max-w-md text-center">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {getGameTitle()} - Level {levelId}
                </h2>
                <div className="mb-6">
                  {getGameInstructions()}
                </div>
                <Button 
                  onClick={() => setShowGameInstructions(false)} 
                  size="lg" 
                  className="gradient-bg button-shadow"
                >
                  I Understand
                </Button>
              </div>
            ) : (
              <div className="max-w-md text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {retryCount === 0 ? 'Ready to start?' : 'Try again?'}
                </h3>
                <p className="text-white mb-6 text-center">
                  {retryCount > 0 && 'Don\'t worry, practice makes perfect! '}
                  Complete the level within the time limit!
                </p>
                <Button 
                  onClick={startGame} 
                  size="lg" 
                  className="gradient-bg button-shadow"
                >
                  {retryCount === 0 ? 'Start Game' : 'Retry'}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {gameCompleted && gameResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-6">
            <div className="animate-game-success mb-4">
              <div className="w-20 h-20 rounded-full bg-mindbloom-green flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Great job!</h3>
            <p className="text-xl text-mindbloom-green mb-6">Level completed</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-xs">
              <div className="bg-black/40 p-3 rounded-lg text-center">
                <p className="text-white text-sm flex items-center justify-center">
                  <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                  Score
                </p>
                <p className="text-2xl font-bold text-mindbloom-yellow">{gameResult.score}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-lg text-center">
                <p className="text-white text-sm flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-1 text-blue-400" />
                  Time
                </p>
                <p className="text-2xl font-bold text-mindbloom-blue">
                  {gameResult.completionTime.toFixed(1)}s
                </p>
              </div>
              <div className="bg-black/40 p-3 rounded-lg text-center">
                <p className="text-white text-sm flex items-center justify-center">
                  <Target className="w-4 h-4 mr-1 text-purple-400" />
                  Tries
                </p>
                <p className="text-2xl font-bold text-mindbloom-purple">
                  {retryCount + 1}
                </p>
              </div>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg mb-6 w-full max-w-sm">
              <h4 className="text-white text-center font-medium mb-2 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 mr-1 text-mindbloom-purple" />
                Emotion Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${gameResult.emotionScore.joy * 100}%` }}></div>
                  </div>
                  <span className="text-white text-xs w-8">Joy</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${gameResult.emotionScore.focus * 100}%` }}></div>
                  </div>
                  <span className="text-white text-xs w-8">Focus</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${gameResult.emotionScore.engagement * 100}%` }}></div>
                  </div>
                  <span className="text-white text-xs w-12">Engage</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mr-2">
                    <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${gameResult.emotionScore.frustration * 100}%` }}></div>
                  </div>
                  <span className="text-white text-xs w-8">Frust</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleRetry} 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black"
              >
                Play Again
              </Button>
              <Button 
                onClick={handleFinish} 
                className="gradient-bg button-shadow"
              >
                Finish
              </Button>
            </div>
          </div>
        )}
        
        {gameStarted && renderGame()}
      </div>
      
      {gameStarted && (
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => setGameStarted(false)}
            className="border-mindbloom-purple text-mindbloom-purple"
          >
            Pause Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameContainer;
