import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '../../../public/models/face-api.min.js';
import '../App.css'; 

const FaceDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [dominantEmotion, setDominantEmotion] = useState('');
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [expressionChanges, setExpressionChanges] = useState(0);
  const [microExpressionCount, setMicroExpressionCount] = useState(0);
  const [noFaceCount, setNoFaceCount] = useState(0);

  const lastEmotionRef = useRef('');
  const lastConfidenceRef = useRef(0);
  const emotionHistory = useRef([]);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    };

    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };

    const detectFace = () => {
      const interval = setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          const canvas = canvasRef.current;
          const video = videoRef.current;

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          faceapi.matchDimensions(canvas, {
            width: video.videoWidth,
            height: video.videoHeight,
          });

          const resized = faceapi.resizeResults(detections, {
            width: video.videoWidth,
            height: video.videoHeight,
          });

          faceapi.draw.drawDetections(canvas, resized);
          faceapi.draw.drawFaceExpressions(canvas, resized);

          if (resized.length > 0) {
            const expressions = resized[0].expressions;
            const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
            const [topEmotion, confidence] = sorted[0];

            setDominantEmotion(topEmotion);
            setEmotionConfidence(confidence.toFixed(2));
            emotionHistory.current.push(topEmotion);

            if (lastEmotionRef.current !== topEmotion) {
              setExpressionChanges(prev => prev + 1);
              lastEmotionRef.current = topEmotion;
            }

            if (Math.abs(confidence - lastConfidenceRef.current) > 0.4) {
              setMicroExpressionCount(prev => prev + 1);
            }

            lastConfidenceRef.current = confidence;
          } else {
            setNoFaceCount(prev => prev + 1);
          }
        }
      }, 300);

      return interval;
    };

    loadModels().then(() => {
      startVideo();
      const intervalId = detectFace();

      const expressionResetInterval = setInterval(() => {
        setExpressionChanges(0);
      }, 10000);

      return () => {
        clearInterval(intervalId);
        clearInterval(expressionResetInterval);
      };
    });
  }, []);

  return (
    <div className="face-container">
      <div className="face-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="face-video"
        />
        <canvas
          ref={canvasRef}
          className="face-canvas"
        />
      </div>
  
      <div className="face-metrics">
        <p>🎭 Dominant Emotion: {dominantEmotion}</p>
        <p>📈 Confidence: {emotionConfidence}</p>
        <p>🔄 Expression Changes (10s): {expressionChanges}</p>
        <p>⚡ Microexpressions: {microExpressionCount}</p>
        <p>🙈 Face Lost Count: {noFaceCount}</p>
      </div>
    </div>
  );
  
};

export default FaceDetector;
