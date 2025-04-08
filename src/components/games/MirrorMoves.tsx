
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameLevel } from '@/lib/types';

interface MirrorMovesProps {
  level: GameLevel;
  onGameOver: (score: number, success: boolean) => void;
  onReactionTime: (time: number) => void;
}

interface PatternStep {
  direction: 'up' | 'down' | 'left' | 'right';
  completed: boolean;
}

const MirrorMoves: React.FC<MirrorMovesProps> = ({ level, onGameOver, onReactionTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pattern, setPattern] = useState<PatternStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showingPattern, setShowingPattern] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const [gameActive, setGameActive] = useState(true);
  const [round, setRound] = useState(1);
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number | null>(null);
  
  const gameSpeed = level.speed;
  
  // Initialize the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 800;
    canvas.height = 500;
    
    generatePattern();
    
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
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Generate a pattern
  const generatePattern = useCallback(() => {
    const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
    const patternLength = Math.min(3 + Math.floor(round / 2), 8); // Increase pattern length as rounds progress
    
    const newPattern: PatternStep[] = [];
    
    for (let i = 0; i < patternLength; i++) {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      newPattern.push({
        direction: randomDirection,
        completed: false
      });
    }
    
    setPattern(newPattern);
    setCurrentStep(0);
    setShowingPattern(true);
    
    // Show the pattern
    showPattern(newPattern);
  }, [round]);
  
  // Show the pattern to the player
  const showPattern = useCallback((patternToShow: PatternStep[]) => {
    let step = 0;
    
    const intervalId = setInterval(() => {
      if (step < patternToShow.length) {
        // Highlight the current step
        setCurrentStep(step);
        step++;
      } else {
        // Done showing pattern
        clearInterval(intervalId);
        setShowingPattern(false);
        setCurrentStep(-1); // No step highlighted
      }
    }, 1000 / gameSpeed);
    
    return () => clearInterval(intervalId);
  }, [gameSpeed]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || showingPattern) return;
      
      // Record reaction time
      const now = Date.now();
      if (lastKeyPressTime) {
        const reactionTime = now - lastKeyPressTime;
        onReactionTime(reactionTime);
      }
      setLastKeyPressTime(now);
      
      let userDirection: 'up' | 'down' | 'left' | 'right' | null = null;
      
      switch (e.key) {
        case 'ArrowUp':
          userDirection = 'up';
          break;
        case 'ArrowDown':
          userDirection = 'down';
          break;
        case 'ArrowLeft':
          userDirection = 'left';
          break;
        case 'ArrowRight':
          userDirection = 'right';
          break;
      }
      
      if (userDirection && currentStep < pattern.length) {
        const expectedDirection = pattern[currentStep].direction;
        
        if (userDirection === expectedDirection) {
          // Correct move
          const updatedPattern = [...pattern];
          updatedPattern[currentStep].completed = true;
          setPattern(updatedPattern);
          
          // Move to next step
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          
          // Check if pattern is complete
          if (nextStep >= pattern.length) {
            // Pattern complete
            const roundScore = 10 * pattern.length;
            const newScore = score + roundScore;
            setScore(newScore);
            
            // Check win condition
            if (newScore >= 100) {
              setGameActive(false);
              onGameOver(newScore, true);
              return;
            }
            
            // Start next round
            setRound(prev => prev + 1);
            setTimeout(() => {
              generatePattern();
            }, 1000);
          }
        } else {
          // Incorrect move
          setGameActive(false);
          onGameOver(score, false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, gameActive, generatePattern, onGameOver, onReactionTime, pattern, score, showingPattern, lastKeyPressTime]);
  
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
    
    // Draw playing area
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const gridSize = 80;
    
    // Draw center point
    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw directional buttons
    const directions = [
      { dir: 'up', x: centerX, y: centerY - gridSize },
      { dir: 'right', x: centerX + gridSize, y: centerY },
      { dir: 'down', x: centerX, y: centerY + gridSize },
      { dir: 'left', x: centerX - gridSize, y: centerY }
    ];
    
    directions.forEach(({ dir, x, y }) => {
      const isCurrentStep = !showingPattern ? false : pattern[currentStep]?.direction === dir;
      const isCompleted = pattern.find(p => p.direction === dir && p.completed);
      
      ctx.fillStyle = isCurrentStep ? '#F97316' : (isCompleted ? '#34D399' : '#4B5563');
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw arrow inside
      ctx.fillStyle = 'white';
      ctx.beginPath();
      
      switch (dir) {
        case 'up':
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x - 10, y + 5);
          ctx.lineTo(x + 10, y + 5);
          break;
        case 'right':
          ctx.moveTo(x + 10, y);
          ctx.lineTo(x - 5, y - 10);
          ctx.lineTo(x - 5, y + 10);
          break;
        case 'down':
          ctx.moveTo(x, y + 10);
          ctx.lineTo(x - 10, y - 5);
          ctx.lineTo(x + 10, y - 5);
          break;
        case 'left':
          ctx.moveTo(x - 10, y);
          ctx.lineTo(x + 5, y - 10);
          ctx.lineTo(x + 5, y + 10);
          break;
      }
      
      ctx.fill();
    });
    
    // Draw pattern sequence at the bottom
    const sequenceY = canvas.height - 60;
    const startX = (canvas.width - (pattern.length * 50)) / 2;
    
    pattern.forEach((step, index) => {
      const x = startX + index * 50;
      const isCurrentStep = index === currentStep;
      
      ctx.fillStyle = step.completed ? '#34D399' : (isCurrentStep ? '#F97316' : '#4B5563');
      ctx.beginPath();
      ctx.arc(x + 25, sequenceY, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw arrow inside
      ctx.fillStyle = 'white';
      ctx.beginPath();
      
      switch (step.direction) {
        case 'up':
          ctx.moveTo(x + 25, sequenceY - 5);
          ctx.lineTo(x + 20, sequenceY + 5);
          ctx.lineTo(x + 30, sequenceY + 5);
          break;
        case 'right':
          ctx.moveTo(x + 30, sequenceY);
          ctx.lineTo(x + 20, sequenceY - 5);
          ctx.lineTo(x + 20, sequenceY + 5);
          break;
        case 'down':
          ctx.moveTo(x + 25, sequenceY + 5);
          ctx.lineTo(x + 20, sequenceY - 5);
          ctx.lineTo(x + 30, sequenceY - 5);
          break;
        case 'left':
          ctx.moveTo(x + 20, sequenceY);
          ctx.lineTo(x + 30, sequenceY - 5);
          ctx.lineTo(x + 30, sequenceY + 5);
          break;
      }
      
      ctx.fill();
    });
    
    // Draw status
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Round: ${round}`, 20, 30);
    ctx.fillText(`Score: ${score}`, 20, 60);
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 120, 30);
    
    // Draw instruction
    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    if (showingPattern) {
      ctx.fillText('Remember the pattern!', centerX, 30);
    } else {
      ctx.fillText('Repeat the pattern using arrow keys', centerX, 30);
    }
    
    // Draw progress bar
    const progressWidth = (score / 100) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progressWidth, 10);
    
  }, [pattern, currentStep, showingPattern, score, timeLeft, round]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
};

export default MirrorMoves;
