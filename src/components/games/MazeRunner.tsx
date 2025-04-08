
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameLevel } from '@/lib/types';

interface MazeRunnerProps {
  level: GameLevel;
  onGameOver: (score: number, success: boolean) => void;
  onReactionTime: (time: number) => void;
}

interface Position {
  x: number;
  y: number;
}

interface MazeCell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
}

const CELL_SIZE = 40;
const WALL_THICKNESS = 4;

const MazeRunner: React.FC<MazeRunnerProps> = ({ level, onGameOver, onReactionTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<MazeCell[][]>([]);
  const [player, setPlayer] = useState<Position>({ x: 0, y: 0 });
  const [exit, setExit] = useState<Position>({ x: 0, y: 0 });
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const [gameActive, setGameActive] = useState(true);
  const [mazeWidth, setMazeWidth] = useState(0);
  const [mazeHeight, setMazeHeight] = useState(0);
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number | null>(null);
  
  // Initialize the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 800;
    canvas.height = 500;
    
    // Determine maze dimensions based on canvas size and cell size
    const width = Math.floor(canvas.width / CELL_SIZE);
    const height = Math.floor(canvas.height / CELL_SIZE);
    
    setMazeWidth(width);
    setMazeHeight(height);
    
    // Generate maze
    const newMaze = generateMaze(width, height);
    setMaze(newMaze);
    
    // Set player at entrance (top-left)
    setPlayer({ x: 0, y: 0 });
    
    // Set exit at bottom-right
    setExit({ x: width - 1, y: height - 1 });
    
    // Add obstacles based on level
    if (level.obstacles > 0) {
      const newObstacles: Position[] = [];
      for (let i = 0; i < level.obstacles; i++) {
        let validPosition = false;
        let obstaclePos: Position = { x: 0, y: 0 };
        
        while (!validPosition) {
          obstaclePos = {
            x: Math.floor(Math.random() * (width - 2)) + 1,
            y: Math.floor(Math.random() * (height - 2)) + 1
          };
          
          // Make sure obstacle is not at player position, exit, or another obstacle
          const isPlayerPosition = obstaclePos.x === 0 && obstaclePos.y === 0;
          const isExitPosition = obstaclePos.x === width - 1 && obstaclePos.y === height - 1;
          const isOtherObstacle = newObstacles.some(
            o => o.x === obstaclePos.x && o.y === obstaclePos.y
          );
          
          if (!isPlayerPosition && !isExitPosition && !isOtherObstacle) {
            validPosition = true;
            newObstacles.push(obstaclePos);
          }
        }
      }
      
      setObstacles(newObstacles);
    }
    
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
  }, [level.obstacles]);
  
  // Generate maze using recursive backtracking algorithm
  const generateMaze = (width: number, height: number): MazeCell[][] => {
    // Initialize maze with all walls
    const newMaze: MazeCell[][] = [];
    
    for (let y = 0; y < height; y++) {
      newMaze[y] = [];
      for (let x = 0; x < width; x++) {
        newMaze[y][x] = {
          x,
          y,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true
          },
          visited: false
        };
      }
    }
    
    // Start at a random cell
    const startX = 0;
    const startY = 0;
    const stack: [number, number][] = [[startX, startY]];
    newMaze[startY][startX].visited = true;
    
    // Continue until all cells are visited
    while (stack.length > 0) {
      const [currentX, currentY] = stack[stack.length - 1];
      
      // Get unvisited neighbors
      const neighbors: [number, number, string][] = [];
      
      // Check top neighbor
      if (currentY > 0 && !newMaze[currentY - 1][currentX].visited) {
        neighbors.push([currentX, currentY - 1, 'top']);
      }
      
      // Check right neighbor
      if (currentX < width - 1 && !newMaze[currentY][currentX + 1].visited) {
        neighbors.push([currentX + 1, currentY, 'right']);
      }
      
      // Check bottom neighbor
      if (currentY < height - 1 && !newMaze[currentY + 1][currentX].visited) {
        neighbors.push([currentX, currentY + 1, 'bottom']);
      }
      
      // Check left neighbor
      if (currentX > 0 && !newMaze[currentY][currentX - 1].visited) {
        neighbors.push([currentX - 1, currentY, 'left']);
      }
      
      if (neighbors.length > 0) {
        // Choose a random neighbor
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const [nextX, nextY, direction] = neighbors[randomIndex];
        
        // Remove walls between current cell and chosen neighbor
        if (direction === 'top') {
          newMaze[currentY][currentX].walls.top = false;
          newMaze[nextY][nextX].walls.bottom = false;
        } else if (direction === 'right') {
          newMaze[currentY][currentX].walls.right = false;
          newMaze[nextY][nextX].walls.left = false;
        } else if (direction === 'bottom') {
          newMaze[currentY][currentX].walls.bottom = false;
          newMaze[nextY][nextX].walls.top = false;
        } else if (direction === 'left') {
          newMaze[currentY][currentX].walls.left = false;
          newMaze[nextY][nextX].walls.right = false;
        }
        
        // Mark neighbor as visited and add to stack
        newMaze[nextY][nextX].visited = true;
        stack.push([nextX, nextY]);
      } else {
        // Backtrack
        stack.pop();
      }
    }
    
    // Ensure entrance and exit are accessible
    newMaze[0][0].walls.top = false; // Entrance at top-left
    newMaze[height - 1][width - 1].walls.bottom = false; // Exit at bottom-right
    
    return newMaze;
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive) return;
      
      // Record reaction time
      const now = Date.now();
      if (lastKeyPressTime) {
        const reactionTime = now - lastKeyPressTime;
        onReactionTime(reactionTime);
      }
      setLastKeyPressTime(now);
      
      let newX = player.x;
      let newY = player.y;
      
      switch (e.key) {
        case 'ArrowUp':
          if (!maze[player.y][player.x].walls.top) {
            newY = player.y - 1;
          }
          break;
        case 'ArrowRight':
          if (!maze[player.y][player.x].walls.right) {
            newX = player.x + 1;
          }
          break;
        case 'ArrowDown':
          if (!maze[player.y][player.x].walls.bottom) {
            newY = player.y + 1;
          }
          break;
        case 'ArrowLeft':
          if (!maze[player.y][player.x].walls.left) {
            newX = player.x - 1;
          }
          break;
      }
      
      // Check for collision with obstacles
      const hitObstacle = obstacles.some(o => o.x === newX && o.y === newY);
      
      if (hitObstacle) {
        setGameActive(false);
        onGameOver(score, false);
        return;
      }
      
      // Update player position
      setPlayer({ x: newX, y: newY });
      
      // Check if player reached exit
      if (newX === exit.x && newY === exit.y) {
        // Calculate score based on time left and maze size
        const newScore = Math.floor(100 * (timeLeft / level.timeLimit)) + 20;
        setScore(newScore);
        setGameActive(false);
        onGameOver(newScore, true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameActive, maze, player, exit, obstacles, score, timeLeft, level.timeLimit, onGameOver, lastKeyPressTime, onReactionTime]);
  
  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maze.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#1A1F2C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate offset to center maze
    const offsetX = (canvas.width - mazeWidth * CELL_SIZE) / 2;
    const offsetY = (canvas.height - mazeHeight * CELL_SIZE) / 2;
    
    // Draw maze
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        const cell = maze[y][x];
        const cellX = offsetX + x * CELL_SIZE;
        const cellY = offsetY + y * CELL_SIZE;
        
        // Draw cell background
        ctx.fillStyle = '#2A2F3C';
        ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
        
        // Draw walls
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = WALL_THICKNESS;
        
        // Top wall
        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX + CELL_SIZE, cellY);
          ctx.stroke();
        }
        
        // Right wall
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(cellX + CELL_SIZE, cellY);
          ctx.lineTo(cellX + CELL_SIZE, cellY + CELL_SIZE);
          ctx.stroke();
        }
        
        // Bottom wall
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(cellX, cellY + CELL_SIZE);
          ctx.lineTo(cellX + CELL_SIZE, cellY + CELL_SIZE);
          ctx.stroke();
        }
        
        // Left wall
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX, cellY + CELL_SIZE);
          ctx.stroke();
        }
      }
    }
    
    // Draw entrance and exit
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(
      offsetX + exit.x * CELL_SIZE + CELL_SIZE / 2,
      offsetY + exit.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw obstacles
    ctx.fillStyle = '#F97316';
    obstacles.forEach(obstacle => {
      ctx.fillRect(
        offsetX + obstacle.x * CELL_SIZE + CELL_SIZE / 4,
        offsetY + obstacle.y * CELL_SIZE + CELL_SIZE / 4,
        CELL_SIZE / 2,
        CELL_SIZE / 2
      );
    });
    
    // Draw player
    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.arc(
      offsetX + player.x * CELL_SIZE + CELL_SIZE / 2,
      offsetY + player.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw player face
    ctx.fillStyle = 'white';
    // Eyes
    ctx.beginPath();
    ctx.arc(
      offsetX + player.x * CELL_SIZE + CELL_SIZE / 2 - 5,
      offsetY + player.y * CELL_SIZE + CELL_SIZE / 2 - 2,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(
      offsetX + player.x * CELL_SIZE + CELL_SIZE / 2 + 5,
      offsetY + player.y * CELL_SIZE + CELL_SIZE / 2 - 2,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Smile
    ctx.beginPath();
    ctx.arc(
      offsetX + player.x * CELL_SIZE + CELL_SIZE / 2,
      offsetY + player.y * CELL_SIZE + CELL_SIZE / 2 + 2,
      5,
      0,
      Math.PI
    );
    ctx.stroke();
    
    // Draw info
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${timeLeft}s`, 20, 30);
    
    // Instructions
    ctx.textAlign = 'center';
    ctx.fillText('Navigate to the green exit using arrow keys', canvas.width / 2, 30);
    
  }, [maze, player, exit, obstacles, timeLeft, mazeWidth, mazeHeight]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
};

export default MazeRunner;
