import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameLevel } from '@/lib/types';

interface MageRunProps {
  level: GameLevel;
  onGameOver: (score: number, success: boolean) => void;
  onReactionTime: (time: number) => void;
}

interface MagePosition {
  x: number;
  y: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MageRun: React.FC<MageRunProps> = ({ level, onGameOver, onReactionTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mage, setMage] = useState<MagePosition>({ x: 50, y: 250 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit + 20); // Increased time
  const [gameActive, setGameActive] = useState(false); // Game starts inactive
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const gameSpeed = level.speed * 0.3; // Slower game speed
  const obstacleFrequency = Math.max(20 - (level.obstacles * 2), 10); // More frequent obstacles
  const gameOverRef = useRef(false);

  // Start the game when the user presses an arrow key
  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(level.timeLimit + 20); // Reset time with increased limit
    setObstacles([]);
    setMage({ x: 50, y: 250 });
    setGameOver(false);
    setWin(false);
  };

  // Initialize the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    let gameLoop: number;

    if (gameActive) {
      gameLoop = requestAnimationFrame(updateGame);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleGameOver(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      

      // Generate obstacles
      const obstacleGenerator = setInterval(() => {
        generateObstacle();
      }, 1000 / gameSpeed); // Reduced interval for more obstacles

      return () => {
        cancelAnimationFrame(gameLoop);
        clearInterval(timerRef.current!);
        clearInterval(obstacleGenerator);
      };
    }
  }, [gameActive, gameSpeed]);

  // Handle keyboard input to start the game and move the mage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (lastKeyPressTime) {
        const reactionTime = now - lastKeyPressTime;
        onReactionTime(reactionTime);
      }
      setLastKeyPressTime(now);

      // Start the game on first arrow key press
      if (!gameActive) {
        startGame();
      }

      const { key } = e;

      setMage((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        const moveAmount = 15; // Reduced speed for moves

        switch (key) {
          case 'ArrowUp':
            newY = Math.max(20, prev.y - moveAmount);
            break;
          case 'ArrowDown':
            newY = Math.min(450, prev.y + moveAmount);
            break;
          case 'ArrowLeft':
            newX = Math.max(20, prev.x - moveAmount);
            break;
          case 'ArrowRight':
            newX = Math.min(750, prev.x + moveAmount);
            break;
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameActive, lastKeyPressTime, onReactionTime]);

  // Check for collisions
  useEffect(() => {
    if (!gameActive) return;

    const mageRadius = 20;

    for (const obstacle of obstacles) {
      const mageLeft = mage.x - mageRadius;
      const mageRight = mage.x + mageRadius;
      const mageTop = mage.y - mageRadius;
      const mageBottom = mage.y + mageRadius;

      if (
        mageRight > obstacle.x &&
        mageLeft < obstacle.x + obstacle.width &&
        mageBottom > obstacle.y &&
        mageTop < obstacle.y + obstacle.height
      ) {
        handleGameOver(false);
        return;
      }
    }

    if (score >= 100) {
      handleGameOver(true);
    }
  }, [mage, obstacles, gameActive, score]);

  // Handle game over or win
  const handleGameOver = (success: boolean) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  
    gameOverRef.current = true; // <-- Add this line
  
    setGameActive(false);
    setGameOver(true);
    setWin(success);
    onGameOver(score, success);
  };
  
  

  // Generate obstacle
  const generateObstacle = useCallback(() => {
    if (!gameActive) return;

    const height = Math.floor(Math.random() * 150) + 50;
    const y = Math.floor(Math.random() * (500 - height));

    const newObstacle: Obstacle = {
      id: Date.now(),
      x: 800,
      y,
      width: 30,
      height,
    };

    setObstacles((prev) => [...prev, newObstacle]);
  }, [gameActive]);

  // Update game state
  const updateGame = useCallback(() => {
    if (!gameActive || gameOverRef.current) return; // Use the ref instead of state
  
    setObstacles((prev) =>
      prev
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - (2 * gameSpeed),
        }))
        .filter((obstacle) => obstacle.x + obstacle.width > 0)
    );
  
    setScore((prev) => Math.min(prev + 0.05, 100)); // No need to check gameOver here now
  
    requestAnimationFrame(updateGame);
  }, [gameActive, gameSpeed]);
  
  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return; // prevent rendering if game is over
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw background
    ctx.fillStyle = '#222831';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
  
    // Draw time
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 120, 30);
  
    // Draw mage
    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.arc(mage.x, mage.y, 20, 0, Math.PI * 2);
    ctx.fill();
  
    ctx.fillStyle = '#D946EF';
    ctx.beginPath();
    ctx.moveTo(mage.x, mage.y - 20);
    ctx.lineTo(mage.x - 15, mage.y - 5);
    ctx.lineTo(mage.x + 15, mage.y - 5);
    ctx.fill();
  
    // Draw obstacles
    ctx.fillStyle = '#F97316';
    obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
  
    // Draw progress bar
    const progressWidth = (score / 100) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progressWidth, 10);
  }, [mage, obstacles, score, timeLeft, gameOver]);
  
  return (
    <div>
      {!gameOver && (
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      )}
      {gameOver && (
        <div className="game-over-screen flex flex-col items-center justify-center h-full bg-black text-white">
          <h1 className="text-4xl font-bold mb-4">{win ? '🎉 You Win! 🎉' : '💀 Game Over 💀'}</h1>
          <p className="text-xl mb-6">Your Score: {Math.floor(score)}</p>
          <div className="space-x-4">
            <button
              className="px-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button
              className="px-6 py-3 bg-red-500 text-white font-bold rounded hover:bg-red-600"
              onClick={() => alert('Returning to Main Menu (not implemented)')}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MageRun;