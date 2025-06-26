import React, { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera as CameraUtils } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { HandData, HandLandmark, FingerAngles } from '../types/HandData';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onHandData: (data: HandData[]) => void;
}

const FINGER_JOINTS: Record<keyof FingerAngles, [number, number, number]> = {
  Thumb: [1, 2, 4],
  Index: [5, 6, 8],
  Middle: [9, 10, 12],
  Ring: [13, 14, 16],
  Pinky: [17, 18, 20],
};

const FINGER_TIPS = [4, 8, 12, 16, 20];

const CameraFeed: React.FC<CameraFeedProps> = ({ videoRef, canvasRef, onHandData }) => {
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInstanceRef = useRef<any>(null);
  const handsRef = useRef<Hands | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showArtisticAngles, setShowArtisticAngles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAngle = (a: HandLandmark, b: HandLandmark, c: HandLandmark): number => {
    const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let deg = Math.abs(rad * (180 / Math.PI));
    return deg > 180 ? 360 - deg : deg;
  };

  const calculateSideBend = (a: HandLandmark, b: HandLandmark, c: HandLandmark): number => {
    const rad = Math.atan2(c.x - b.x, c.z - b.z) - Math.atan2(a.x - b.x, a.z - b.z);
    let deg = Math.abs(rad * (180 / Math.PI));
    return deg > 180 ? 360 - deg : deg;
  };

  const processAngles = (lm: HandLandmark[]): FingerAngles => {
    const angles: FingerAngles = {
      Thumb: 0,
      Index: 0,
      Middle: 0,
      Ring: 0,
      Pinky: 0,
    };
    (Object.keys(FINGER_JOINTS) as (keyof FingerAngles)[]).forEach((finger) => {
      const [a, b, c] = FINGER_JOINTS[finger];
      if (lm[a] && lm[b] && lm[c]) {
        angles[finger] = calculateAngle(lm[a], lm[b], lm[c]);
      }
    });
    return angles;
  };

  const processSideAngles = (lm: HandLandmark[]): FingerAngles => {
    const angles: FingerAngles = {
      Thumb: 0,
      Index: 0,
      Middle: 0,
      Ring: 0,
      Pinky: 0,
    };
    (Object.keys(FINGER_JOINTS) as (keyof FingerAngles)[]).forEach((finger) => {
      const [a, b, c] = FINGER_JOINTS[finger];
      if (lm[a] && lm[b] && lm[c]) {
        angles[finger] = calculateSideBend(lm[a], lm[b], lm[c]);
      }
    });
    return angles;
  };

  const processFingerPairAngles = (lm: HandLandmark[]): Record<string, number> => {
    const angles: Record<string, number> = {};
    for (let i = 0; i < FINGER_TIPS.length - 1; i++) {
      const tip1 = lm[FINGER_TIPS[i]];
      const tip2 = lm[FINGER_TIPS[i + 1]];
      if (tip1 && tip2) {
        const dx = tip2.x - tip1.x;
        const dy = tip2.y - tip1.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        angles[`${FINGER_TIPS[i]}_${FINGER_TIPS[i + 1]}`] = Math.abs(angle);
      }
    }
    return angles;
  };

  const onResults = (results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !videoRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const hands: HandData[] = [];

    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, i) => {
        const handedness = results.multiHandedness[i].label as 'Left' | 'Right';
        const lm: HandLandmark[] = landmarks.map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z ?? 0,
        }));

        const fingerAngles = processAngles(lm);
        const fingerPairAngles = processFingerPairAngles(lm);
        const sideBendAngles = processSideAngles(lm);

        const thumbTip = lm[4];
        const indexTip = lm[8];
        const gap = thumbTip && indexTip ? Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y) : 0;

        const hand: HandData = {
          landmarks: lm,
          fingerAngles,
          fingerPairAngles,
          handedness,
          gap,
          timestamp: Date.now(),
        };

        hands.push(hand);

        const color = handedness === 'Right' ? '#00FF00' : '#0099FF';
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color,
          lineWidth: 2,
        });
        drawLandmarks(ctx, landmarks, { color, radius: 2 });

        ctx.fillStyle = color;
        ctx.font = '13px Arial';
        let y = 20 + (i * 150);
        ctx.fillText(`${handedness} Thumb-Index Gap: ${(gap * 100).toFixed(1)} px`, 10, y);

        const displayedAngles = showArtisticAngles ? sideBendAngles : fingerAngles;
        ctx.fillText(`(${showArtisticAngles ? 'Side Bend' : 'Palm Bend'})`, 10, (y += 18));
        Object.entries(displayedAngles).forEach(([finger, angle]) => {
          y += 18;
          ctx.fillText(`${finger}: ${Math.round(angle)}°`, 10, y);
        });
      });
    }

    onHandData(hands);
  };

  const startCamera = async () => {
    try {
      setError(null);
      if (isCameraOn) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');
      
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      streamRef.current = stream;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
        setTimeout(() => reject(new Error('Timeout loading video metadata')), 5000);
      });

      await video.play();

      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      const camera = new CameraUtils(video, {
        onFrame: async () => {
          if (video.readyState >= 2 && handsRef.current) {
            await handsRef.current.send({ image: video });
          }
        },
        width: video.videoWidth,
        height: video.videoHeight,
      });

      cameraInstanceRef.current = camera;
      camera.start();
      setIsCameraOn(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    cameraInstanceRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    cameraInstanceRef.current = null;
    handsRef.current = null;
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative aspect-video">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover" 
          playsInline 
          muted 
          autoPlay 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        />
      </div>
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
          <div className="text-center text-white p-4">
            <p className="text-sm mb-2">Camera Error:</p>
            <p className="text-xs">{error}</p>
            <button 
              onClick={toggleCamera}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          onClick={toggleCamera}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isCameraOn 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isCameraOn ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        <button
          onClick={() => setShowArtisticAngles(!showArtisticAngles)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          {showArtisticAngles ? 'Palm Bend' : 'Side Bend'}
        </button>
      </div>

      {!isCameraOn && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="text-center text-gray-300">
            <div className="text-4xl mb-2">📷</div>
            <p>Camera is off</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;