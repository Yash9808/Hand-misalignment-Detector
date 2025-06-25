import React, { useState, useRef, useEffect } from 'react';
import { Camera, Settings, Download, Share2, Upload, Maximize, Minimize } from 'lucide-react';
import CameraFeed from './components/CameraFeed';
import HandVisualization3D from './components/HandVisualization3D';
import CorrelationChart from './components/CorrelationChart';
import MenuBar from './components/MenuBar';
import SettingsPanel from './components/SettingsPanel';
import { HandData } from './types/HandData';

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [handData, setHandData] = useState<HandData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSaveScan = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      const now = new Date();
      const filename = `hand_scan_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}.png`;
      
      canvas.toBlob((blob) => {
        if (blob) {
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
        }
      });
    }
  };

  const handleShareScan = async () => {
    if (canvasRef.current && navigator.share) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'hand_scan.png', { type: 'image/png' });
          try {
            await navigator.share({
              title: 'Hand Tracking Scan',
              files: [file]
            });
          } catch (err) {
            console.log('Error sharing:', err);
          }
        }
      });
    } else {
      // Fallback: copy to clipboard
      if (canvasRef.current) {
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              alert('Image copied to clipboard!');
            } catch (err) {
              console.log('Error copying to clipboard:', err);
              handleSaveScan(); // Fallback to download
            }
          }
        });
      }
    }
  };

  const handleUploadFrame = async () => {
    // Placeholder for API upload functionality
    alert('Upload to API functionality would be implemented here');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <MenuBar
        onSaveScan={handleSaveScan}
        onShareScan={handleShareScan}
        onUploadFrame={handleUploadFrame}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Camera Feed */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-100">Camera Feed</h2>
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            </div>
            <CameraFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              onHandData={setHandData}
            />
          </div>

          {/* 3D Visualization */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-purple-400">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-100">3D Hand Structure</h2>
            </div>
            <HandVisualization3D handData={handData} />
          </div>

          {/* Correlation Chart - Hand 1 */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-green-400">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3V21H21V19H5V3H3Z" />
                  <path d="M7 14L12 9L16 13L21 8V12H19V10.5L16 13.5L12 9.5L9 12.5V17H7V14Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Correlation - Hand 1</h2>
            </div>
            <CorrelationChart handData={handData[0]} handIndex={0} />
          </div>

          {/* Correlation Chart - Hand 2 */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-green-400">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3V21H21V19H5V3H3Z" />
                  <path d="M7 14L12 9L16 13L21 8V12H19V10.5L16 13.5L12 9.5L9 12.5V17H7V14Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Correlation - Hand 2</h2>
            </div>
            <CorrelationChart handData={handData[1]} handIndex={1} />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          windowSize={windowSize}
          onWindowSizeChange={setWindowSize}
        />
      )}
    </div>
  );
}

export default App;