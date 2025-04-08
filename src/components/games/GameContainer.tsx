
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GameType, GameLevel, GameResult, EmotionScore } from '@/lib/types';
import { db, generateEmotionScore } from '@/lib/mockDatabase';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import MageRun from './MageRun';
import SnakeGame from './SnakeGame';
import MirrorMoves from './MirrorMoves';
import MazeRunner from './MazeRunner';

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
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadLevel = async () => {
      try {
        const levels = await db.getGameLevels(gameType);
        const foundLevel = levels.find(l => l.id === levelId);
        
        if (foundLevel) {
          setLevel(foundLevel);
        } else {
          toast.error('Game level not found');
          navigate('/child-dashboard');
        }
      } catch (error) {
        console.error('Error loading game level:', error);
        toast.error('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLevel();
  }, [gameType, levelId, navigate]);
  
  const startGame = () => {
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
        const result = await db.saveGameResult({
          childId,
          gameType,
          levelId,
          score,
          completionTime,
          retryCount,
          successRate,
          reactionTimes,
          emotionScore
        });
        
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
  
  const handleRetry = () => {
    setGameStarted(false);
    setGameCompleted(false);
    // Don't reset retry count as we want to track it
  };
  
  const handleFinish = () => {
    navigate('/child-dashboard');
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
          <CardTitle className="flex items-center justify-between">
            <span>{getGameTitle()} - {level.name}</span> 
            <span className="text-sm font-normal bg-mindbloom-green/10 text-mindbloom-green px-3 py-1 rounded-full">
              {level.difficulty}
            </span>
          </CardTitle>
          <CardDescription>
            {isDailyChallenge && (
              <span className="text-mindbloom-orange font-semibold">Daily Challenge</span>
            )}
            Time Limit: {level.timeLimit} seconds
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="game-container bg-mindbloom-dark">
        {!gameStarted && !gameCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 p-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              {retryCount === 0 ? 'Ready to start?' : 'Try again?'}
            </h3>
            <p className="text-white mb-6 text-center max-w-md">
              Use arrow keys (↑, ↓, ←, →) to play. Complete the level within the time limit!
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
        
        {gameCompleted && gameResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 p-6">
            <div className="animate-game-success mb-4">
              <div className="w-20 h-20 rounded-full bg-mindbloom-green flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Great job!</h3>
            <p className="text-xl text-mindbloom-green mb-6">Level completed</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-xs">
              <div className="bg-black/30 p-3 rounded-lg text-center">
                <p className="text-white text-sm">Score</p>
                <p className="text-2xl font-bold text-mindbloom-yellow">{gameResult.score}</p>
              </div>
              <div className="bg-black/30 p-3 rounded-lg text-center">
                <p className="text-white text-sm">Time</p>
                <p className="text-2xl font-bold text-mindbloom-blue">
                  {gameResult.completionTime.toFixed(1)}s
                </p>
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
