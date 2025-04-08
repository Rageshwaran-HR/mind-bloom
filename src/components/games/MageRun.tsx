
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
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const [gameActive, setGameActive] = useState(true);
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number | null>(null);
  
  const gameSpeed = level.speed;
  const obstacleFrequency = Math.max(100 - (level.obstacles * 10), 30); // Lower number = more obstacles
  
  // Initialize the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 500;
    
    // Start the game loop
    const gameLoop = requestAnimationFrame(updateGame);
    
    // Start timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameActive(false);
          onGameOver(score, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Generate obstacles
    const obstacleGenerator = setInterval(() => {
      if (Math.random() * 100 < obstacleFrequency) {
        generateObstacle();
      }
    }, 1500 / gameSpeed);
    
    return () => {
      cancelAnimationFrame(gameLoop);
      clearInterval(timer);
      clearInterval(obstacleGenerator);
    };
  }, []);
  
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
      
      const { key } = e;
      
      setMage(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        const moveAmount = 15;
        
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
    
    // Check if mage collided with any obstacle
    const mageRadius = 20;
    
    for (const obstacle of obstacles) {
      // Simple circular collision detection
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
        setGameActive(false);
        onGameOver(score, false);
        return;
      }
    }
    
    // Check if reached end (score = 100)
    if (score >= 100) {
      setGameActive(false);
      onGameOver(score, true);
    }
  }, [mage, obstacles, gameActive, onGameOver, score]);
  
  // Generate obstacle
  const generateObstacle = useCallback(() => {
    if (!gameActive) return;
    
    const height = Math.floor(Math.random() * 150) + 50;
    const y = Math.floor(Math.random() * (500 - height));
    
    const newObstacle: Obstacle = {
      id: Date.now(),
      x: 800, // Start from right edge
      y,
      width: 30,
      height,
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [gameActive]);
  
  // Update game state
  const updateGame = useCallback(() => {
    if (!gameActive) return;
    
    // Move obstacles
    setObstacles(prev => {
      return prev
        .map(obstacle => ({
          ...obstacle,
          x: obstacle.x - (3 * gameSpeed),
        }))
        .filter(obstacle => obstacle.x + obstacle.width > 0); // Remove obstacles that are off-screen
    });
    
    // Increase score
    setScore(prev => Math.min(prev + 0.1, 100));
    
    // Continue the game loop
    requestAnimationFrame(updateGame);
  }, [gameActive, gameSpeed]);
  
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
    
    // Draw mage hat
    ctx.fillStyle = '#D946EF';
    ctx.beginPath();
    ctx.moveTo(mage.x, mage.y - 20);
    ctx.lineTo(mage.x - 15, mage.y - 5);
    ctx.lineTo(mage.x + 15, mage.y - 5);
    ctx.fill();
    
    // Draw obstacles
    ctx.fillStyle = '#F97316';
    obstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw progress bar
    const progressWidth = (score / 100) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progressWidth, 10);
    
  }, [mage, obstacles, score, timeLeft]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
};

export default MageRun;
