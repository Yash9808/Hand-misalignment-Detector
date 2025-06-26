import React, { useRef, useState } from 'react';
import CameraFeed, { CameraFeedHandle } from './CameraFeed';
import MenuBar from './MenuBar';
import SettingsPanel from './SettingsPanel';

const App: React.FC = () => {
  const cameraRef = useRef<CameraFeedHandle>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 });

  const handleToggleFullscreen = () => {
    const el = document.documentElement;

    if (!isFullscreen) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }

    setIsFullscreen(!isFullscreen);
  };

  const handleResize = (size: { width: number; height: number }) => {
    setWindowSize(size);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black" style={{ width: windowSize.width, height: windowSize.height }}>
      <MenuBar
        onSaveScan={() => cameraRef.current?.saveScan()}
        onShareScan={() => cameraRef.current?.shareScan()}
        onUploadFrame={() => alert('Upload functionality coming soon!')}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div className="flex-grow flex items-center justify-center">
        <CameraFeed
          ref={cameraRef}
          onHandData={(data) => console.log(data)}
        />
      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          windowSize={windowSize}
          onWindowSizeChange={handleResize}
        />
      )}
    </div>
  );
};

export default App;
