
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameLevel } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

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
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  // Use level speed for game difficulty adjustment
  const gameSpeed = level.speed;
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);
  
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
    
    setTimerInterval(timer);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Generate a pattern based on difficulty
  const generatePattern = useCallback(() => {
    const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
    
    // Adjust pattern length based on difficulty and round
    let patternLength;
    if (level.difficulty === 'easy') {
      patternLength = Math.min(2 + Math.floor(round / 4), 4); // Easier: Shorter patterns
    } else if (level.difficulty === 'medium') {
      patternLength = Math.min(3 + Math.floor(round / 3), 6); // Medium: Regular progression
    } else {
      patternLength = Math.min(3 + Math.floor(round / 2), 8); // Hard: Longer patterns
    }
    
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
  }, [round, level.difficulty]);
  
  // Show the pattern to the player with adjusted speed
  const showPattern = useCallback((patternToShow: PatternStep[]) => {
    let step = 0;
    
    // Adjust speed of pattern display based on difficulty
    const displaySpeed = level.difficulty === 'easy' ? gameSpeed * 0.6 : 
                         level.difficulty === 'medium' ? gameSpeed * 0.8 : 
                         gameSpeed;
    
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
        setLastKeyPressTime(Date.now()); // Start timing from when pattern is fully shown
      }
    }, 1200 / displaySpeed); // Slower display for easier learning
    
    return () => clearInterval(intervalId);
  }, [gameSpeed, level.difficulty]);
  
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
            // Pattern complete - calculate score based on difficulty
            const difficultyMultiplier = level.difficulty === 'easy' ? 12 : 
                                        level.difficulty === 'medium' ? 10 : 8;
            const roundScore = difficultyMultiplier * pattern.length;
            const newScore = score + roundScore;
            setScore(newScore);
            
            // Check win condition - easier to reach winning score on easy difficulty
            const winScore = level.difficulty === 'easy' ? 80 : 
                            level.difficulty === 'medium' ? 100 : 120;
                            
            if (newScore >= winScore || round >= 10) {
              setGameActive(false);
              // Game over with success
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
          // Incorrect move - more forgiving on easy difficulty
          if (level.difficulty === 'easy' && round <= 3) {
            // For beginners on easy difficulty, give multiple chances
            toast.info("Try again! Watch the pattern carefully.");
            
            // Help by showing the pattern again after a few mistakes
            if (currentStep === 0) {
              setTimeout(() => {
                showPattern(pattern);
              }, 1000);
            }
          } else if (level.difficulty === 'medium' && round <= 2 && currentStep === 0) {
            // For medium difficulty, give a second chance on the first step of early rounds
            toast.info("Oops! Let's try that again.");
            setTimeout(() => {
              showPattern(pattern);
            }, 1000);
          } else {
            // Game over with failure
            setGameActive(false);
            onGameOver(score, false);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, gameActive, generatePattern, onGameOver, onReactionTime, pattern, score, showingPattern, lastKeyPressTime, level.difficulty, round, showPattern]);
  
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
    
    // Draw background elements based on difficulty
    if (level.difficulty === 'easy') {
      // Simple background for easy difficulty
      ctx.fillStyle = '#1A1F2C';
    } else if (level.difficulty === 'medium') {
      // Add some subtle patterns for medium difficulty
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(75, 85, 99, ${0.1 + (i * 0.02)})`;
        ctx.fillRect(
          centerX - 200 + (i * 20), 
          centerY - 200 + (i * 20), 
          400 - (i * 40), 
          400 - (i * 40)
        );
      }
    } else {
      // More distracting patterns for hard difficulty
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = `rgba(75, 85, 99, ${0.05 + (i % 2) * 0.05})`;
        ctx.beginPath();
        ctx.arc(
          centerX + Math.cos(i * Math.PI / 5) * 150,
          centerY + Math.sin(i * Math.PI / 5) * 150,
          10 + (i * 5), 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    
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
    
    // Draw progress bar - adjust target score based on difficulty
    const targetScore = level.difficulty === 'easy' ? 80 : 
                       level.difficulty === 'medium' ? 100 : 120;
    const progressWidth = (score / targetScore) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progressWidth, 10);
    
  }, [pattern, currentStep, showingPattern, score, timeLeft, round, level.difficulty]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
};

export default MirrorMoves;
