export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerAngles {
  Thumb: number;
  Index: number;
  Middle: number;
  Ring: number;
  Pinky: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  fingerAngles: FingerAngles;
  fingerPairAngles?: Record<string, number>;
  handedness: 'Left' | 'Right';
  gap: number;
  timestamp: number;
}

export interface FingerPair {
  finger1: string;
  finger2: string;
  angle: number;
  landmarks: [number, number, number, number]; // indices for start/end points of both fingers
}