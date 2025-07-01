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

  // Determine background gradient and effects based on load level
  const getStyleConfig = () => {
    switch (loadLevel) {
      case 'overload':
        return {
          gradient: 'bg-gradient-to-r from-red-600 via-red-500 to-pink-600',
          glow: 'shadow-red-500/50',
          pulse: 'animate-pulse',
          border: 'border-red-400/50',
        }
      case 'high':
        return {
          gradient:
            'bg-gradient-to-r from-orange-600 via-red-500 to-orange-600',
          glow: 'shadow-orange-500/40',
          pulse: 'animate-pulse',
          border: 'border-orange-400/50',
        }
      case 'medium':
        return {
          gradient:
            'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500',
          glow: 'shadow-yellow-500/30',
          pulse: '',
          border: 'border-yellow-400/50',
        }
      default:
        return {
          gradient:
            'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500',
          glow: 'shadow-green-500/20',
          pulse: '',
          border: 'border-green-400/50',
        }
    }
  }

  // Determine message and AI insights based on load level
  const getMessageConfig = () => {
    switch (loadLevel) {
      case 'overload':
        return {
          title: 'AI ALERT: Cognitive Overload Detected',
          message:
            'Neural patterns suggest mental fatigue. Recommend 10-15 min break.',
          icon: '🧐',
          recommendation: 'Try deep breathing or a short walk',
        }
      case 'high':
        return {
          title: 'AI Notice: High Cognitive Load',
          message: 'Performance indicators suggest approaching limits.',
          icon: '⚠️',
          recommendation: 'Consider taking a brief pause',
        }
      case 'medium':
        return {
          title: 'AI Monitor: Moderate Load',
          message: 'Cognitive engagement within healthy range.',
          icon: '🟡',
          recommendation: 'Maintain current pace',
        }
      default:
        return {
          title: 'AI Status: Optimal State',
          message: 'Peak learning efficiency detected.',
          icon: '✨',
          recommendation: 'Perfect conditions for learning',
        }
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

  const styleConfig = getStyleConfig()
  const messageConfig = getMessageConfig()

  return (
    <div
      className={`overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl ${styleConfig.border} ${className}`}
    >
      <div
        className={`p-4 text-white transition-all duration-500 ease-in-out ${styleConfig.gradient} ${styleConfig.glow} ${styleConfig.pulse} relative cursor-pointer`}
        onClick={toggleExpand}
      >
        {/* Neural network background pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute left-2 top-2 h-1 w-1 animate-ping rounded-full bg-white' />
          <div className='animation-delay-300 absolute right-3 top-4 h-1 w-1 animate-ping rounded-full bg-white' />
          <div className='animation-delay-700 absolute bottom-3 left-4 h-1 w-1 animate-ping rounded-full bg-white' />
        </div>

        <div className='relative z-10'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                <Brain size={20} className='drop-shadow-lg' />
                {loadLevel === 'overload' && (
                  <div className='absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-white' />
                )}
              </div>
              <div>
                <h3 className='text-sm font-bold'>
                  {messageConfig.icon} {messageConfig.title}
                </h3>
                <div className='text-xs font-medium opacity-90'>
                  Load Level: {loadLevel.toUpperCase()}
                </div>
              </div>
            </div>
            {onReset && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onReset()
                }}
                className='rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/30'
              >
                Reset AI
              </button>
            )}
          </div>
          <p className='mb-2 text-sm font-medium'>{messageConfig.message}</p>
          <p className='text-xs italic opacity-80'>
            🤖 {messageConfig.recommendation}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className='border-t border-white/20 bg-black/40 p-4 text-gray-200 backdrop-blur-xl'>
          {/* AI Analytics Header */}
          <div className='mb-3 flex items-center space-x-2 text-cyan-400'>
            <span className='text-sm font-bold'>🤖 AI Neural Analysis</span>
            <div className='h-px flex-1 bg-gradient-to-r from-cyan-400/50 to-transparent' />
          </div>

          {/* Metrics Grid */}
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 p-2'>
              <AlertCircle size={14} className='text-red-400' />
              <div>
                <div className='font-medium'>Errors</div>
                <div className='font-bold text-red-400'>{errorCount}</div>
              </div>
            </div>
            <div className='flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 p-2'>
              <Clock size={14} className='text-yellow-400' />
              <div>
                <div className='font-medium'>Hesitation</div>
                <div className='font-bold text-yellow-400'>
                  {formatTime(hesitationSeconds)}
                </div>
              </div>
            </div>
          </div>

          {/* Idle Time Analysis */}
          {idleTimeSeconds > 30 && (
            <div className='mt-3 rounded-lg border border-blue-400/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Clock size={14} className='text-blue-400' />
                  <span className='text-sm font-medium'>
                    Idle Time: {formatTime(idleTimeSeconds)}
                  </span>
                </div>
                {idleTimeSeconds > 120 && (
                  <span className='rounded-full border border-red-400/50 bg-red-500/30 px-2 py-1 text-xs font-medium text-red-300'>
                    ⚠️ Extended idle
                  </span>
                )}
              </div>
              {idleTimeSeconds > 180 && (
                <div className='mt-2 text-xs italic text-blue-300'>
                  🤖 AI suggests: Consider a learning break or topic change
                </div>
              )}
            </div>
          )}

          {/* Learning Efficiency Score */}
          <div className='mt-3 rounded-lg border border-green-400/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3'>
            <div className='mb-1 text-xs text-green-300'>
              📊 Learning Efficiency Score
            </div>
            <div className='flex items-center space-x-2'>
              <div className='h-2 flex-1 overflow-hidden rounded-full bg-black/30'>
                <div
                  className='h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500'
                  style={{
                    width: `${Math.max(10, Math.min(100, ((120 - hesitationSeconds) / 120) * (100 - errorCount * 10)))}%`,
                  }}
                />
              </div>
              <span className='text-sm font-bold text-green-400'>
                {Math.max(
                  10,
                  Math.min(
                    100,
                    ((120 - hesitationSeconds) / 120) * (100 - errorCount * 10)
                  )
                )}
                %
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
