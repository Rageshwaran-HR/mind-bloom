import React, { useEffect, useRef, useState } from 'react';
import * as handPoseDetection from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';


function HandTracker({ onDirectionChange }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const lastPositionRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    const hands = new handPoseDetection.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const x = indexTip.x * canvas.width;
        const y = indexTip.y * canvas.height;

        if (lastPositionRef.current) {
          const dx = x - lastPositionRef.current.x;
          const dy = y - lastPositionRef.current.y;
          const threshold = 20;

          let direction = null;

          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > threshold ? 'right' : dx < -threshold ? 'left' : null;
          } else {
            direction = dy > threshold ? 'down' : dy < -threshold ? 'up' : null;
          }

          if (direction && onDirectionChange) {
            onDirectionChange(direction);
          }
        }

        lastPositionRef.current = { x, y };
      }
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, [onDirectionChange]);

  return (
    <div>
      <video ref={videoRef} style={{ display: 'none' }}></video>
      <canvas ref={canvasRef} width={640} height={480} style={{ border: '1px solid #ccc' }}></canvas>
    </div>
  );
}

export default function MageRun() {
  const canvasRef = useRef(null);
  const [mage, setMage] = useState({ x: 100, y: 100 });
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, 800, 500);
      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(mage.x, mage.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'red';
      obstacles.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${score}`, 10, 20);
    };

    draw();
  }, [mage, obstacles, score]);

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      setObstacles((prev) => {
        const newObs = prev
          .map((obs) => ({ ...obs, x: obs.x - 5 }))
          .filter((obs) => obs.x + obs.width > 0);

        if (Math.random() < 0.1) {
          newObs.push({ x: 800, y: Math.random() * 460, width: 20, height: 40 });
        }

        return newObs;
      });

      setScore((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    for (const obs of obstacles) {
      const dx = mage.x - (obs.x + obs.width / 2);
      const dy = mage.y - (obs.y + obs.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 30) {
        setGameActive(false);
        alert(`Game Over! Final Score: ${score}`);
        return;
      }
    }
  }, [mage, obstacles, score]);

  const handleHandDirection = (direction) => {
    if (!gameActive) setGameActive(true);

    const move = 15;
    setMage((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      if (direction === 'up') newY = Math.max(20, prev.y - move);
      if (direction === 'down') newY = Math.min(450, prev.y + move);
      if (direction === 'left') newX = Math.max(20, prev.x - move);
      if (direction === 'right') newX = Math.min(750, prev.x + move);

      return { x: newX, y: newY };
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={500} style={{ border: '2px solid black' }} />
      <HandTracker onDirectionChange={handleHandDirection} />
    </div>
  );
}