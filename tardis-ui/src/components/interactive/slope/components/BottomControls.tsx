import React from 'react'
import { LineData } from '../types'

interface BottomControlsProps {
  lineData?: LineData
  resetView: () => void
  clearPoints: () => void
  onShowAnimation: () => void
}

/**
 * BottomControls component provides the bottom control bar for SlopeDrawing
 */
const BottomControls: React.FC<BottomControlsProps> = ({
  lineData,
  resetView,
  clearPoints,
  onShowAnimation,
}) => {
  return (
    <div className='flex items-center justify-between border-t border-gray-700 bg-gray-800 p-3'>
      <div className='flex space-x-2'>
        <button
          onClick={resetView}
          className='rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600'
        >
          Reset View
        </button>
        <button
          onClick={clearPoints}
          className='rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600'
        >
          Clear Points
        </button>
        {lineData && (
          <button
            onClick={onShowAnimation}
            className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700'
          >
            Show Steps
          </button>
        )}
      </div>

      {lineData && (
        <div className='text-sm text-gray-400'>
          {lineData.equation} | Slope:{' '}
          {lineData.slope !== null ? lineData.slope.toFixed(2) : 'Undefined'}
        </div>
      )}
    </div>
  )
}

export default BottomControls
