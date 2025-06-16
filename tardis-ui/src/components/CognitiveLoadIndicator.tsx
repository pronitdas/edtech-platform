import React, { useState, useEffect } from 'react'
import { AlertCircle, Clock, Brain } from 'lucide-react'

interface CognitiveLoadIndicatorProps {
  loadLevel: 'low' | 'medium' | 'high' | 'overload'
  errorCount: number
  hesitationSeconds: number
  idleTimeSeconds: number
  onReset?: () => void
  className?: string
}

export const CognitiveLoadIndicator: React.FC<CognitiveLoadIndicatorProps> = ({
  loadLevel,
  errorCount,
  hesitationSeconds,
  idleTimeSeconds,
  onReset,
  className = '',
}) => {
  // Calculate formatted times
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Determine background color based on load level
  const getBgColor = () => {
    switch (loadLevel) {
      case 'overload':
        return 'bg-red-700' // Using a slightly darker red for overload
      case 'high':
        return 'bg-red-600'
      case 'medium':
        return 'bg-amber-500'
      default:
        return 'bg-green-500'
    }
  }

  // Determine message based on load level
  const getMessage = () => {
    switch (loadLevel) {
      case 'overload':
        return 'Cognitive overload detected! Take a break.'
      case 'high':
        return 'Consider taking a break'
      case 'medium':
        return 'Your cognitive load is increasing'
      default:
        return 'Optimal learning state'
    }
  }

  // Define localStorage key
  const STORAGE_KEY = 'cognitiveLoadIndicatorSettings'

  // Load initial state from localStorage
  const loadSettings = () => {
    try {
      const settings = localStorage.getItem(STORAGE_KEY)
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        return parsedSettings.isExpanded || false // Default to false if not found
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
    return false // Default to false if loading fails
  }

  const [isExpanded, setIsExpanded] = useState(loadSettings())

  // Save state to localStorage whenever isExpanded changes
  useEffect(() => {
    try {
      const settings = { isExpanded }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }, [isExpanded])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`overflow-hidden rounded-lg shadow-md ${className}`}>
      <div
        className={`p-3 text-white transition-colors duration-300 ease-in-out ${getBgColor()} cursor-pointer`}
        onClick={toggleExpand}
      >
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Brain size={18} />
            <h3 className='font-medium'>
              Cognitive Load: {loadLevel.toUpperCase()}
            </h3>
          </div>
          {onReset && (
            <button
              onClick={e => {
                e.stopPropagation() // Prevent click from toggling expand
                onReset()
              }}
              className='rounded bg-white/20 px-2 py-1 text-xs transition-colors hover:bg-white/30'
            >
              Reset
            </button>
          )}
        </div>
        <p className='text-sm'>{getMessage()}</p>
      </div>

      {isExpanded && (
        <div className='bg-gray-800 p-3 text-gray-200'>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div className='flex items-center space-x-2'>
              <AlertCircle size={14} />
              <span>Errors: {errorCount}</span>
            </div>
            <div className='flex items-center space-x-2'>
              <Clock size={14} />
              <span>Hesitation: {formatTime(hesitationSeconds)}</span>
            </div>
          </div>

          {/* Only show idle time if significant */}
          {idleTimeSeconds > 30 && (
            <div className='mt-2 flex items-center space-x-2 text-sm'>
              <Clock size={14} />
              <span>Idle: {formatTime(idleTimeSeconds)}</span>
              {idleTimeSeconds > 120 && (
                <span className='rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-300'>
                  Extended idle detected
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
