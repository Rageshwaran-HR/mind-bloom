import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import '../App.css';

const FaceDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [expressionsData, setExpressionsData] = useState({});

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
            setExpressionsData(expressions); // store full expressions object
            console.log(JSON.stringify(expressions)); // print in console
          }
        }
      }, 300);

      return interval;
    };

    loadModels().then(() => {
      startVideo();
      const intervalId = detectFace();

      return () => {
        clearInterval(intervalId);
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
        <p className="whitespace-pre-wrap text-white text-sm bg-gray-800 p-4 rounded shadow-md">
          {Object.keys(expressionsData).length > 0
            ? JSON.stringify(
                Object.fromEntries(
                  Object.entries(expressionsData).map(([key, val]) => [
                    key,
                    +val.toFixed(4),
                  ])
                ),
                null,
                2
              )
            : 'No expression data yet.'}
        </p>
      </div>
    </div>
  );
};

export default FaceDetector;