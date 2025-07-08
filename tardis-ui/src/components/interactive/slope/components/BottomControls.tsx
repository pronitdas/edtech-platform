import React, { useState } from 'react'
import { LineData } from '../types'
import { RotateCcw, Trash2, Play, Eye } from 'lucide-react'

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
  const [isResetting, setIsResetting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleResetView = async () => {
    setIsResetting(true)
    // Add a subtle delay for visual feedback
    setTimeout(() => {
      resetView()
      setIsResetting(false)
    }, 200)
  }

  const handleClearPoints = async () => {
    setIsClearing(true)
    // Add a subtle delay for visual feedback
    setTimeout(() => {
      clearPoints()
      setIsClearing(false)
    }, 200)
  }

  const handleShowAnimation = async () => {
    setIsAnimating(true)
    onShowAnimation()
    // Reset animation state after 2 seconds
    setTimeout(() => {
      setIsAnimating(false)
    }, 2000)
  }

  return (
    <div className='relative flex items-center justify-between border-t border-white/10 bg-gradient-to-r from-gray-900/95 to-black/95 p-4 backdrop-blur-sm'>
      {/* Animated background glow */}
      <div className='absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-50' />

      <div className='relative flex items-center space-x-3'>
        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          disabled={isResetting}
          className='group relative flex items-center space-x-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition-all duration-200 hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95 disabled:opacity-50'
          aria-label="Reset view to center and default zoom"
        >
          <RotateCcw
            size={16}
            className={`transition-transform duration-300 ${isResetting ? 'animate-spin' : 'group-hover:rotate-180'}`}
          />
          <span>Reset</span>
          {isResetting && (
            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse' />
          )}
        </button>

        {/* Clear Points Button */}
        <button
          onClick={handleClearPoints}
          disabled={isClearing}
          className='group relative flex items-center space-x-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 hover:scale-105 active:scale-95 disabled:opacity-50'
          aria-label="Clear all points from the graph"
        >
          <Trash2
            size={16}
            className={`transition-all duration-300 ${isClearing ? 'animate-bounce' : 'group-hover:animate-pulse'}`}
          />
          <span>Clear</span>
          {isClearing && (
            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 animate-pulse' />
          )}
        </button>

        {/* Show Animation Button */}
        {lineData && (
          <button
            onClick={handleShowAnimation}
            disabled={isAnimating}
            className='group relative flex items-center space-x-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-all duration-200 hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-100 hover:scale-105 active:scale-95 disabled:opacity-50'
            aria-label="Show step-by-step solution animation"
          >
            {isAnimating ? (
              <Eye size={16} className='animate-pulse' />
            ) : (
              <Play size={16} className='group-hover:animate-bounce' />
            )}
            <span>{isAnimating ? 'Playing...' : 'Steps'}</span>
            {isAnimating && (
              <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse' />
            )}
          </button>
        )}
      </div>

      {/* Line Data Display */}
      {lineData && (
        <div className='relative flex items-center space-x-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm'>
          <div className='flex flex-col space-y-1 text-right'>
            <div className='text-sm font-mono text-cyan-300'>
              {lineData.equation}
            </div>
            <div className='text-xs text-gray-400'>
              Slope: <span className='font-semibold text-white'>
                {lineData.slope !== null ? lineData.slope.toFixed(2) : 'Undefined'}
              </span>
            </div>
          </div>
          {/* Visual indicator for slope */}
          <div className='h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-0.5'>
            <div className='flex h-full w-full items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
              {lineData.slope !== null ? (lineData.slope > 0 ? '↗' : lineData.slope < 0 ? '↘' : '→') : '|'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BottomControls
