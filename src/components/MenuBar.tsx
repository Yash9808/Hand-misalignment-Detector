import React from 'react';
import { Download, Share2, Upload, Settings, Maximize, Minimize } from 'lucide-react';

interface MenuBarProps {
  onSaveScan: () => void;
  onShareScan: () => void;
  onUploadFrame: () => void;
  onToggleSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onSaveScan,
  onShareScan,
  onUploadFrame,
  onToggleSettings,
  onToggleFullscreen,
  isFullscreen
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Hand Tracking Studio</h1>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onSaveScan}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Save Scan"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
          
          <button
            onClick={onShareScan}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Share Scan"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          
          <button
            onClick={onUploadFrame}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="Upload Frame"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          
          <button
            onClick={onToggleSettings}
            className="p-2 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={onToggleFullscreen}
            className="p-2 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuBar;