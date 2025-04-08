import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameLevel } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface SnakeGameProps {
  level: GameLevel;
  onGameOver: (success: boolean) => void;
  onReactionTime: (time: number) => void;
}

interface Position {
  x: number;
  y: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const SnakeGame: React.FC<SnakeGameProps> = ({ level, onGameOver, onReactionTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [direction, setDirection] = useState<Direction>('right');
  const [lastDirection, setLastDirection] = useState<Direction>('right');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const [gameActive, setGameActive] = useState(true);
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const gameSpeed = level.speed;
  const obstacleCount = level.obstacles;

  const getSentiment = (reactions: number[], score: number, success: boolean) => {
    const avg = reactions.reduce((a, b) => a + b, 0) / reactions.length || 0;
    if (success && score >= 100 && avg < 300) return 'happy';
    if (!success && avg > 1000) return 'stressed';
    if (!success && avg <= 1000) return 'sad';
    return 'neutral';
  };
  const allowedDifficulties = ['easy', 'medium', 'hard'];

  // Normalize difficulty input safely
  const difficulty = allowedDifficulties.includes(level.difficulty?.toLowerCase())
    ? level.difficulty.toLowerCase()
    : 'easy';
  const [success, setSuccess] = useState(false);

  const gameOverHandledRef = useRef(false); // 👈 to prevent double-calling

  const endGame = (didSucceed: boolean) => {
    setSuccess(didSucceed);
    setGameActive(false);
  };
  useEffect(() => {
    if (!gameActive && score >= 0) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          saveGameSessionToDB(score >= 100);
        } else {
          console.warn('⛔ No session available. Skipping DB save.');
        }
      });
    }
  }, [gameActive]);
  useEffect(() => {
    const checkSessionAndSave = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
  
      if (!session) {
        console.warn('⛔ No session available. Skipping DB save.');
        return;
      }
  
      await saveGameSessionToDB(score >= 100);
    };
  
    if (!gameActive) {
      checkSessionAndSave();
    }
  }, [gameActive]);
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Store session in your app context if needed
      console.log('Auth changed:', _event, session);
    });
  
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const logSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('📦 Current Session:', session);
    };
    logSession();
  }, []);
  
  useEffect(() => {
    const newObstacles: Position[] = [];
    for (let i = 0; i < obstacleCount; i++) {
      let valid = false;
      while (!valid) {
        const pos = {
          x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
          y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
        };
        const overlap = snake.some(s => s.x === pos.x && s.y === pos.y) ||
                        (food.x === pos.x && food.y === pos.y) ||
                        newObstacles.some(o => o.x === pos.x && o.y === pos.y);
        if (!overlap) {
          valid = true;
          newObstacles.push(pos);
        }
      }
    }
    setObstacles(newObstacles);
  }, [obstacleCount]);

  const generateFood = useCallback(() => {
    let valid = false;
    while (!valid) {
      const newFood = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      };
      const overlap = snake.some(s => s.x === newFood.x && s.y === newFood.y) ||
                      obstacles.some(o => o.x === newFood.x && o.y === newFood.y);
      if (!overlap) {
        setFood(newFood);
        valid = true;
      }
    }
  }, [snake, obstacles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (lastKeyPressTime) {
        const reaction = now - lastKeyPressTime;
        onReactionTime(reaction);
        setReactionTimes(prev => [...prev, reaction]);
      }
      setLastKeyPressTime(now);
      if (!gameActive) return;

      if (e.key === 'ArrowUp' && lastDirection !== 'down') setDirection('up');
      if (e.key === 'ArrowDown' && lastDirection !== 'up') setDirection('down');
      if (e.key === 'ArrowLeft' && lastDirection !== 'right') setDirection('left');
      if (e.key === 'ArrowRight' && lastDirection !== 'left') setDirection('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, lastDirection, lastKeyPressTime, onReactionTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameActive) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameActive(false);
            onGameOver(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive, onGameOver, score]);

  useEffect(() => {
    if (!gameActive) return;

    const moveSnake = () => {
      setSnake(prev => {
        const newSnake = [...prev];
        const head = { ...newSnake[0] };

        if (direction === 'up') head.y -= 1;
        if (direction === 'down') head.y += 1;
        if (direction === 'left') head.x -= 1;
        if (direction === 'right') head.x += 1;

        const outOfBounds = head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE;
        const hitSelf = newSnake.some(s => s.x === head.x && s.y === head.y);
        const hitObstacle = obstacles.some(o => o.x === head.x && o.y === head.y);

        if (outOfBounds || hitSelf || hitObstacle) {
          setGameActive(false);
          onGameOver(false);
          return prev;
        }

        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          generateFood();
          newSnake.unshift(head);

          if (newScore >= 100) {
            setGameActive(false);
            onGameOver(true);
          }

          return newSnake;
        }

        newSnake.pop();
        newSnake.unshift(head);
        return newSnake;
      });

      setLastDirection(direction);
    };

    const interval = setInterval(moveSnake, 300 / gameSpeed);
    return () => clearInterval(interval);
  }, [direction, food, gameActive, gameSpeed, generateFood, obstacles, onGameOver, score]);

  const saveGameSessionToDB = async (success: boolean) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
    if (!session || sessionError) {
      console.error('No active session or auth error:', sessionError);
      return;
    }
  
    const userId = session.user.id;
  
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
  
    if (!profile || profileError) {
      console.error('Profile not found or error:', profileError);
      return;
    }
  
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('slug', 'snake-adventure')
      .maybeSingle();
  
    if (!game || gameError) {
      console.error('Game not found or error:', gameError);
      return;
    }
  
    const sentiment = getSentiment(reactionTimes, score, success);
    const attempts = 1;
  
    const payload = {
      child_id: profile.child_id,
      game_id: game.id,
      score,
      moves: snake.length,
      time_spent: level.timeLimit - timeLeft,
      difficulty,
      completed: success,
      win: success,
      attempts,
      sentiment,
      created_at: new Date().toISOString(),
    };
  
    console.log('Saving game session to DB:', payload);
  
    const { error: insertError } = await supabase.from('game_sessions').insert(payload);
  
    if (insertError) {
      console.error('Error inserting game session:', insertError);
    } else {
      console.log('✅ Game session saved!');
    }
  };
  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    setFood({ x: 15, y: 10 });
    setObstacles([]);
    setDirection('right');
    setLastDirection('right');
    setScore(0);
    setTimeLeft(level.timeLimit);
    setGameActive(true);
    setSuccess(false);
    setLastKeyPressTime(null);
    setReactionTimes([]);
    gameOverHandledRef.current = false;
  };
  
  useEffect(() => {
    if (!gameActive) {
      const success = score >= 100;
      saveGameSessionToDB(success);
    }
  }, [gameActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1A1F2C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2A3040';
    ctx.lineWidth = 0.5;

    for (let x = 0; x < canvas.width; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#8B5CF6' : `rgba(139, 92, 246, ${1 - index * 0.05})`;
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

      if (index === 0) {
        ctx.fillStyle = 'white';
        let eyeX1, eyeY1, eyeX2, eyeY2;
        if (direction === 'up' || direction === 'down') {
          eyeX1 = segment.x * GRID_SIZE + GRID_SIZE / 4;
          eyeX2 = segment.x * GRID_SIZE + 3 * GRID_SIZE / 4;
          eyeY1 = eyeY2 = segment.y * GRID_SIZE + (direction === 'up' ? GRID_SIZE / 4 : 3 * GRID_SIZE / 4);
        } else {
          eyeY1 = segment.y * GRID_SIZE + GRID_SIZE / 4;
          eyeY2 = segment.y * GRID_SIZE + 3 * GRID_SIZE / 4;
          eyeX1 = eyeX2 = segment.x * GRID_SIZE + (direction === 'left' ? GRID_SIZE / 4 : 3 * GRID_SIZE / 4);
        }
        ctx.beginPath(); ctx.arc(eyeX1, eyeY1, GRID_SIZE / 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX2, eyeY2, GRID_SIZE / 8, 0, Math.PI * 2); ctx.fill();
      }
    });

    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(food.x * GRID_SIZE + GRID_SIZE / 2, food.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    obstacles.forEach(o => ctx.fillRect(o.x * GRID_SIZE, o.y * GRID_SIZE, GRID_SIZE, GRID_SIZE));

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 120, 30);

    const progress = (score / 100) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progress, 10);
  }, [snake, food, obstacles, score, timeLeft, direction]);

  return (
    <div className="relative w-full h-full">
      {!gameActive && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-80 flex flex-col items-center justify-center text-white z-10">
          <h2 className="text-4xl font-bold mb-4">{score >= 100 ? '🎉 Level Complete!' : '💀 Game Over'}</h2>
          <p className="text-lg mb-6">Your Score: {score}</p>
          <button
  onClick={resetGame}
  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded text-white text-lg"
          >
            Retry
          </button>
        </div>
      )}
  
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full block"
      />
  
      {/* 🧪 Debug buttons: Remove or comment these in production */}
      <div className="absolute bottom-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => endGame(true)}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
        >
          Finish Level (Success)
        </button>
        <button
          onClick={() => endGame(false)}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm"
        >
          Game Over (Fail)
        </button>
      </div>
    </div>
  );
  
};

export default SnakeGame;