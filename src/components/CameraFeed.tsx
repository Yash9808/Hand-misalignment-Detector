import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera as CameraUtils } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { HandData, HandLandmark, FingerAngles } from '../types/HandData';

interface CameraFeedProps {
  onHandData: (data: HandData[]) => void;
}

export interface CameraFeedHandle {
  saveScan: () => void;
  shareScan: () => void;
}

const FINGER_JOINTS: Record<keyof FingerAngles, [number, number, number]> = {
  Thumb: [1, 2, 4],
  Index: [5, 6, 8],
  Middle: [9, 10, 12],
  Ring: [13, 14, 16],
  Pinky: [17, 18, 20],
};

const FINGER_TIPS = [4, 8, 12, 16, 20]; // Thumb to Pinky

const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(
  ({ onHandData }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const cameraInstanceRef = useRef<any>(null); // store MediaPipe camera instance

    const [isCameraOn, setIsCameraOn] = useState(false);

    const calculateAngle = (
      a: HandLandmark,
      b: HandLandmark,
      c: HandLandmark
    ): number => {
      const rad =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
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
      (Object.keys(FINGER_JOINTS) as (keyof FingerAngles)[]).forEach(
        (finger) => {
          const [a, b, c] = FINGER_JOINTS[finger];
          if (lm[a] && lm[b] && lm[c]) {
            angles[finger] = calculateAngle(lm[a], lm[b], lm[c]);
          }
        }
      );
      return angles;
    };

    const processFingerPairAngles = (
      lm: HandLandmark[]
    ): Record<string, number> => {
      const angles: Record<string, number> = {};
      for (let i = 0; i < FINGER_TIPS.length - 1; i++) {
        const tip1 = lm[FINGER_TIPS[i]];
        const tip2 = lm[FINGER_TIPS[i + 1]];
        const dx = tip2.x - tip1.x;
        const dy = tip2.y - tip1.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        angles[`${FINGER_TIPS[i]}_${FINGER_TIPS[i + 1]}`] = Math.abs(angle);
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
          const handedness = results.multiHandedness[i].label;
          const lm: HandLandmark[] = landmarks.map((l) => ({
            x: l.x,
            y: l.y,
            z: l.z ?? 0,
          }));

          const fingerAngles = processAngles(lm);
          const fingerPairAngles = processFingerPairAngles(lm);

          const thumbTip = lm[4],
            indexTip = lm[8];
          const gap = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

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
          let y = 20;
          ctx.fillText(
            `${handedness} Thumb-Index Gap: ${(gap * 100).toFixed(1)} px`,
            10,
            y
          );
          Object.entries(fingerAngles).forEach(([finger, angle]) => {
            y += 18;
            ctx.fillText(`${finger}: ${Math.round(angle)}°`, 10, y);
          });
        });
      }

      onHandData(hands);
    };

    const startCamera = async () => {
      if (isCameraOn) return; // already started

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (!videoRef.current) throw new Error('Video element not found.');
      const video = videoRef.current;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      streamRef.current = stream;

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        setTimeout(() => rej(new Error('Timeout loading video metadata')), 5000);
      });

      await video.play();

      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }

      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults(onResults);

      const camera = new CameraUtils(video, {
        onFrame: async () => {
          if (video.readyState >= 2) {
            await hands.send({ image: video });
          }
        },
        width: video.videoWidth,
        height: video.videoHeight,
      });

      cameraInstanceRef.current = camera;
      camera.start();
      setIsCameraOn(true);
    };

    const stopCamera = () => {
      cameraInstanceRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      cameraInstanceRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    };

    const toggleCamera = () => {
      if (isCameraOn) {
        stopCamera();
      } else {
        startCamera().catch((err) => {
          console.error('[CameraFeed] Initialization failed:', err);
        });
      }
    };

    // Save current canvas as PNG file
    const saveScan = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hand-scan-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    // Share canvas image using Web Share API
    const shareScan = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        alert('Canvas not ready for sharing.');
        return;
      }

      if (!navigator.canShare || !navigator.canShare({ files: [] })) {
        alert('Sharing is not supported on this device/browser.');
        return;
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `hand-scan-${Date.now()}.png`, {
          type: 'image/png',
        });

        try {
          await navigator.share({
            files: [file],
            title: 'Hand Scan',
            text: 'Check out my hand scan!',
          });
        } catch (error) {
          console.error('Share failed:', error);
        }
      });
    };

    // Expose saveScan and shareScan to parent via ref
    useImperativeHandle(ref, () => ({
      saveScan,
      shareScan,
    }));

    useEffect(() => {
      startCamera().catch((err) => {
        console.error('[CameraFeed] Initialization failed:', err);
      });

      return () => {
        stopCamera();
      };
    }, []);

    return (
      <div className="relative w-full max-w-md mx-auto bg-gray-900 rounded overflow-hidden">
        <video
          ref={videoRef}
          className="w-full"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <button
          onClick={toggleCamera}
          className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded z-10"
        >
          {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
      </div>
    );
  }
);

export default CameraFeed;
