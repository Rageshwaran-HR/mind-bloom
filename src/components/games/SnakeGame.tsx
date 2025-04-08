
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameLevel } from '@/lib/types';

interface SnakeGameProps {
  level: GameLevel;
  onGameOver: (score: number, success: boolean) => void;
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
  
  const gameSpeed = level.speed;
  const obstacleCount = level.obstacles;
  
  // Initialize obstacles
  useEffect(() => {
    if (obstacleCount > 0) {
      const newObstacles: Position[] = [];
      
      for (let i = 0; i < obstacleCount; i++) {
        let obstaclePosition: Position;
        let validPosition = false;
        
        // Make sure obstacles don't overlap with snake or food
        while (!validPosition) {
          obstaclePosition = {
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
          };
          
          // Check if position overlaps with snake
          const overlapsWithSnake = snake.some(
            segment => segment.x === obstaclePosition.x && segment.y === obstaclePosition.y
          );
          
          // Check if position overlaps with food
          const overlapsWithFood = food.x === obstaclePosition.x && food.y === obstaclePosition.y;
          
          // Check if position overlaps with other obstacles
          const overlapsWithObstacles = newObstacles.some(
            obstacle => obstacle.x === obstaclePosition.x && obstacle.y === obstaclePosition.y
          );
          
          if (!overlapsWithSnake && !overlapsWithFood && !overlapsWithObstacles) {
            validPosition = true;
            newObstacles.push(obstaclePosition);
          }
        }
      }
      
      setObstacles(newObstacles);
    }
  }, [obstacleCount]);
  
  // Generate a new food position
  const generateFood = useCallback(() => {
    let newFood: Position;
    let validPosition = false;
    
    while (!validPosition) {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      };
      
      // Check if position overlaps with snake
      const overlapsWithSnake = snake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      
      // Check if position overlaps with obstacles
      const overlapsWithObstacles = obstacles.some(
        obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y
      );
      
      if (!overlapsWithSnake && !overlapsWithObstacles) {
        validPosition = true;
        setFood(newFood);
      }
    }
  }, [snake, obstacles]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Record reaction time
      const now = Date.now();
      if (lastKeyPressTime) {
        const reactionTime = now - lastKeyPressTime;
        onReactionTime(reactionTime);
      }
      setLastKeyPressTime(now);
      
      if (!gameActive) return;
      
      // Prevent reverse direction (which would cause immediate game over)
      switch (e.key) {
        case 'ArrowUp':
          if (lastDirection !== 'down') setDirection('up');
          break;
        case 'ArrowDown':
          if (lastDirection !== 'up') setDirection('down');
          break;
        case 'ArrowLeft':
          if (lastDirection !== 'right') setDirection('left');
          break;
        case 'ArrowRight':
          if (lastDirection !== 'left') setDirection('right');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameActive, lastDirection, lastKeyPressTime, onReactionTime]);
  
  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameActive) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameActive(false);
            onGameOver(score, false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameActive, onGameOver, score]);
  
  // Game loop
  useEffect(() => {
    if (!gameActive) return;
    
    const moveSnake = () => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };
        
        // Update head position based on direction
        switch (direction) {
          case 'up':
            head.y -= 1;
            break;
          case 'down':
            head.y += 1;
            break;
          case 'left':
            head.x -= 1;
            break;
          case 'right':
            head.x += 1;
            break;
        }
        
        // Check if snake hit the wall
        if (
          head.x < 0 || 
          head.x >= CANVAS_WIDTH / GRID_SIZE ||
          head.y < 0 ||
          head.y >= CANVAS_HEIGHT / GRID_SIZE
        ) {
          setGameActive(false);
          onGameOver(score, false);
          return prevSnake;
        }
        
        // Check if snake hit itself
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameActive(false);
          onGameOver(score, false);
          return prevSnake;
        }
        
        // Check if snake hit an obstacle
        if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
          setGameActive(false);
          onGameOver(score, false);
          return prevSnake;
        }
        
        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
          // Increase score
          const newScore = score + 10;
          setScore(newScore);
          
          // Generate new food
          generateFood();
          
          // Don't remove tail (snake grows)
          newSnake.unshift(head);
          
          // Check win condition (score >= 100)
          if (newScore >= 100) {
            setGameActive(false);
            onGameOver(newScore, true);
          }
          
          return newSnake;
        }
        
        // Regular movement (remove tail)
        newSnake.pop();
        newSnake.unshift(head);
        
        return newSnake;
      });
      
      // Save the last direction moved
      setLastDirection(direction);
    };
    
    const gameInterval = setInterval(moveSnake, 150 / gameSpeed);
    
    return () => clearInterval(gameInterval);
  }, [direction, food, gameActive, gameSpeed, generateFood, obstacles, onGameOver, score]);
  
  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#1A1F2C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (optional)
    ctx.strokeStyle = '#2A3040';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Head
      if (index === 0) {
        ctx.fillStyle = '#8B5CF6';
      } 
      // Body
      else {
        const gradientValue = 255 - (index * 5);
        ctx.fillStyle = `rgba(139, 92, 246, ${1 - index * 0.05})`;
      }
      
      ctx.fillRect(
        segment.x * GRID_SIZE,
        segment.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
      
      // Draw snake eye (for head)
      if (index === 0) {
        ctx.fillStyle = 'white';
        
        // Position eyes based on direction
        let eyeX1, eyeY1, eyeX2, eyeY2;
        
        switch (direction) {
          case 'up':
            eyeX1 = segment.x * GRID_SIZE + GRID_SIZE / 4;
            eyeY1 = segment.y * GRID_SIZE + GRID_SIZE / 4;
            eyeX2 = segment.x * GRID_SIZE + 3 * GRID_SIZE / 4;
            eyeY2 = segment.y * GRID_SIZE + GRID_SIZE / 4;
            break;
          case 'down':
            eyeX1 = segment.x * GRID_SIZE + GRID_SIZE / 4;
            eyeY1 = segment.y * GRID_SIZE + 3 * GRID_SIZE / 4;
            eyeX2 = segment.x * GRID_SIZE + 3 * GRID_SIZE / 4;
            eyeY2 = segment.y * GRID_SIZE + 3 * GRID_SIZE / 4;
            break;
          case 'left':
            eyeX1 = segment.x * GRID_SIZE + GRID_SIZE / 4;
            eyeY1 = segment.y * GRID_SIZE + GRID_SIZE / 4;
            eyeX2 = segment.x * GRID_SIZE + GRID_SIZE / 4;
            eyeY2 = segment.y * GRID_SIZE + 3 * GRID_SIZE / 4;
            break;
          case 'right':
            eyeX1 = segment.x * GRID_SIZE + 3 * GRID_SIZE / 4;
            eyeY1 = segment.y * GRID_SIZE + GRID_SIZE / 4;
            eyeX2 = segment.x * GRID_SIZE + 3 * GRID_SIZE / 4;
            eyeY2 = segment.y * GRID_SIZE + 3 * GRID_SIZE / 4;
            break;
        }
        
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, GRID_SIZE / 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, GRID_SIZE / 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw food
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw obstacles
    ctx.fillStyle = '#EF4444';
    obstacles.forEach(obstacle => {
      ctx.fillRect(
        obstacle.x * GRID_SIZE,
        obstacle.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
    
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Draw time
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 120, 30);
    
    // Draw progress bar
    const progressWidth = (score / 100) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progressWidth, 10);
    
  }, [snake, food, obstacles, score, timeLeft, direction]);
  
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full block"
    />
  );
};

export default SnakeGame;
