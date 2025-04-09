import React, { useRef, useEffect, useState } from 'react';
import HandTracker from '../components/tracker/HandTracker';

function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastTimestampRef = useRef(performance.now());

  const [metrics, setMetrics] = useState({
    hand_movement_range: 0,
    hand_movement_speed: 0,
    gesture_symmetry: 0,
  });

  useEffect(() => {
    const loadMediaPipe = async () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.onload = initializeHands;
      document.body.appendChild(script);
    };

    const initializeHands = async () => {
      const hands = new window.Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults(onResults);

      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();
        detect();
      };

      const detect = async () => {
        await hands.send({ image: video });
        requestAnimationFrame(detect);
      };
    };

    const calculateDistance = (point1, point2) => {
      const dx = point1.x - point2.x;
      const dy = point1.y - point2.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onResults = (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const x = indexTip.x * canvas.width;
        const y = indexTip.y * canvas.height;

        // Draw pointer
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'lime';
        ctx.fill();

        // === Calculate Movement Range ===
        if (!lastPositionRef.current) lastPositionRef.current = { x, y };
        const dx = x - lastPositionRef.current.x;
        const dy = y - lastPositionRef.current.y;
        const movementRange = Math.sqrt(dx * dx + dy * dy);

        // === Calculate Movement Speed ===
        const now = performance.now();
        const timeDelta = (now - lastTimestampRef.current) / 1000; // seconds
        const movementSpeed = timeDelta > 0 ? movementRange / timeDelta : 0;
        lastPositionRef.current = { x, y };
        lastTimestampRef.current = now;

        // === Calculate Gesture Symmetry ===
        // We'll compare how symmetric the spread between fingers is
        const fingerIndices = [4, 8, 12, 16, 20]; // Thumb to pinky
        const palm = landmarks[0];
        const fingerDistances = fingerIndices.map((i) =>
          calculateDistance(palm, landmarks[i])
        );
        const mean = fingerDistances.reduce((a, b) => a + b) / fingerDistances.length;
        const variance =
          fingerDistances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
          fingerDistances.length;
        const symmetryScore = 1 / (1 + variance); // Closer to 1 = more symmetric

        setMetrics({
          hand_movement_range: movementRange.toFixed(2),
          hand_movement_speed: movementSpeed.toFixed(2),
          gesture_symmetry: symmetryScore.toFixed(2),
        });
      }
    };

    loadMediaPipe();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Mini Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 200,
          height: 150,
          border: '2px solid white',
          borderRadius: 8,
          zIndex: 2
        }}
      />
  
      {/* Canvas overlay for landmarks */}
      <canvas
        ref={canvasRef}
        width={200}
        height={150}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
  
      {/* Metrics box below video */}
      <div style={{
        position: 'absolute',
        top: 170, // 10 (margin) + 150 (video height) + 10 (spacing)
        right: 10,
        width: 200,
        color: 'white',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 8,
        fontSize: 13,
        zIndex: 4
      }}>
        <p>✋ Range: {metrics.hand_movement_range} px</p>
        <p>🚀 Speed: {metrics.hand_movement_speed} px/sec</p>
        <p>🔁 Symmetry: {metrics.gesture_symmetry}</p>
      </div>
    </div>
  );
  

}

export default HandTracker;
