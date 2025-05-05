import React from 'react';
import { LineData } from '../types';

interface BottomControlsProps {
  lineData?: LineData;
  resetView: () => void;
  clearPoints: () => void;
  onShowAnimation: () => void;
}

/**
 * BottomControls component provides the bottom control bar for SlopeDrawing
 */
const BottomControls: React.FC<BottomControlsProps> = ({ 
  lineData, 
  resetView, 
  clearPoints, 
  onShowAnimation 
}) => {
  return (
    <div className="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
      <div className="flex space-x-2">
        <button
          onClick={resetView}
          className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600"
        >
          Reset View
        </button>
        <button
          onClick={clearPoints}
          className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600"
        >
          Clear Points
        </button>
        {lineData && (
          <button
            onClick={onShowAnimation}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Show Steps
          </button>
        )}
      </div>
      
      {lineData && (
        <div className="text-gray-400 text-sm">
          {lineData.equation} | Slope: {lineData.slope !== null ? lineData.slope.toFixed(2) : 'Undefined'}
        </div>
      )}
    </div>
  );
};

export default BottomControls; 