import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as handPoseDetection from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import * as faceapi from 'face-api.js';
import { GameLevel } from '@/lib/types';

interface MageRunProps {
  level: GameLevel;
  onGameOver: (score: number, success: boolean, emotion?: string) => void;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mage, setMage] = useState<MagePosition>({ x: 50, y: 250 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit + 20);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(null);
  const lastPosition = useRef<MagePosition>({ x: 50, y: 250 });
  const lastKeyPressTime = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverRef = useRef(false);
  const detectedEmotions = useRef<Record<string, number>>({});

  const gameSpeed = level.speed * 0.3;
  const obstacleFrequency = Math.max(20 - (level.obstacles * 2), 10);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    };
    loadModels();
  }, []);

  // Setup video, hand tracking & emotion detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hands = new handPoseDetection.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    const processHandDetection = async () => {
      await hands.send({ image: video });
    };

    const processEmotionDetection = async () => {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (detections?.expressions) {
        const sorted = Object.entries(detections.expressions).sort((a, b) => b[1] - a[1]);
        const topEmotion = sorted[0][0];
        detectedEmotions.current[topEmotion] = (detectedEmotions.current[topEmotion] || 0) + 1;
        setEmotion(topEmotion);
      }
    };

    const camera = new Camera(video, {
      onFrame: async () => {
        // Run both hand detection and emotion detection asynchronously
        await Promise.all([processHandDetection(), processEmotionDetection()]);
      },
      width: 640,
      height: 480,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];
        const indexFinger = hand[8];

        // Invert the x-coordinate for mirrored behavior
        const newX = Math.min(Math.max((1 - indexFinger.x) * 800, 20), 750);
        const newY = Math.min(Math.max(indexFinger.y * 500, 20), 450);

        // Detect movement direction
        if (lastPosition.current.x < newX) {
          console.log('Moving Right');
        } else if (lastPosition.current.x > newX) {
          console.log('Moving Left');
        }

        lastPosition.current = { x: newX, y: newY };
        setMage({ x: newX, y: newY });

        if (!gameActive && !gameOverRef.current) {
          startGame();
          const now = Date.now();
          if (lastKeyPressTime.current) {
            onReactionTime(now - lastKeyPressTime.current);
          }
          lastKeyPressTime.current = now;
        }
      } else {
        // Keep the mage at the last known position if the hand is not detected
        setMage(lastPosition.current);
      }
    });

    camera.start();

    return () => {
      hands.close();
      camera.stop();
    };
  }, [gameActive]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(level.timeLimit + 20);
    setObstacles([]);
    setGameOver(false);
    setWin(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    let animationId: number;
    let obstacleInterval: NodeJS.Timeout;

    if (gameActive) {
      animationId = requestAnimationFrame(updateGame);
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

      obstacleInterval = setInterval(generateObstacle, 1000 / gameSpeed);

      return () => {
        cancelAnimationFrame(animationId);
        clearInterval(timerRef.current!);
        clearInterval(obstacleInterval);
      };
    }
  }, [gameActive]);

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

  const handleGameOver = (success: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setGameActive(false);
    setGameOver(true);
    setWin(success);

    const finalEmotion = Object.entries(detectedEmotions.current).sort((a, b) => b[1] - a[1])[0]?.[0];
    onGameOver(score, success, finalEmotion);
  };

  const generateObstacle = useCallback(() => {
    if (!gameActive) return;

    const height = Math.floor(Math.random() * 150) + 50;
    const y = Math.floor(Math.random() * (500 - height));

    setObstacles((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: 800,
        y,
        width: 30,
        height,
      },
    ]);
  }, [gameActive]);

  const updateGame = useCallback(() => {
    if (!gameActive || gameOverRef.current) return;

    setObstacles((prev) =>
      prev
        .map((obstacle) => ({ ...obstacle, x: obstacle.x - (2 * gameSpeed) }))
        .filter((obstacle) => obstacle.x + obstacle.width > 0)
    );

    setScore((prev) => Math.min(prev + 0.05, 100));
    requestAnimationFrame(updateGame);
  }, [gameActive, gameSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#222831';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 120, 30);
    if (emotion) ctx.fillText(`Emotion: ${emotion}`, canvas.width / 2 - 60, 30);

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

    ctx.fillStyle = '#F97316';
    obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    const progressWidth = (score / 100) * canvas.width;
    ctx.fillStyle = '#34D399';
    ctx.fillRect(0, canvas.height - 10, progressWidth, 10);
  }, [mage, obstacles, score, timeLeft, emotion, gameOver]);

  return (
    <div>
      {!gameOver ? (
        <canvas ref={canvasRef} className="w-full h-full block" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-black text-white">
          <h1 className="text-4xl font-bold mb-4">{win ? '🎉 You Win! 🎉' : '💀 Game Over 💀'}</h1>
          <p className="text-xl mb-2">Your Score: {Math.floor(score)}</p>
          {emotion && <p className="text-lg mb-4">Dominant Emotion: {emotion}</p>}
          <div className="space-x-4">
            <button
              className="px-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button
              className="px-6 py-3 bg-red-500 text-white font-bold rounded hover:bg-red-600"
              onClick={() => alert('Return to Menu')}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Popup window for the camera feed */}
      <div
        className="fixed bottom-4 right-4 bg-white border border-gray-300 shadow-lg rounded-lg p-2"
        style={{ width: '400px', height: '300px' }} // Increased width and height
        >
        <video
          ref={videoRef}
          className="w-full h-full rounded"
          autoPlay
          playsInline
          muted
        />
      </div>
    </div>
  );
};

export default MageRun;
