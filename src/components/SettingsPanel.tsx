import React, { useState } from 'react';
import { X, Monitor, Maximize2 } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  windowSize: { width: number; height: number };
  onWindowSizeChange: (size: { width: number; height: number }) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  windowSize,
  onWindowSizeChange
}) => {
  const [customWidth, setCustomWidth] = useState(windowSize.width.toString());
  const [customHeight, setCustomHeight] = useState(windowSize.height.toString());

  const presetSizes = [
    { name: 'Small', width: 800, height: 600 },
    { name: 'Medium', width: 1024, height: 768 },
    { name: 'Large', width: 1200, height: 800 },
    { name: 'XL', width: 1440, height: 900 }
  ];

  const handleCustomSizeApply = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    
    if (width >= 600 && height >= 400 && width <= 2560 && height <= 1440) {
      onWindowSizeChange({ width, height });
    } else {
      alert('Please enter valid dimensions (600-2560px width, 400-1440px height)');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Preset Sizes */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Preset Sizes</h3>
            <div className="grid grid-cols-2 gap-2">
              {presetSizes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onWindowSizeChange({ width: preset.width, height: preset.height })}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-gray-400">
                    {preset.width} × {preset.height}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Custom Size</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Width</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                    min="600"
                    max="2560"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Height</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                    min="400"
                    max="1440"
                  />
                </div>
              </div>
              <button
                onClick={handleCustomSizeApply}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Apply Custom Size
              </button>
            </div>
          </div>

          {/* Current Size Display */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-400">Current Size</div>
            <div className="text-sm text-gray-200">
              {windowSize.width} × {windowSize.height} pixels
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;