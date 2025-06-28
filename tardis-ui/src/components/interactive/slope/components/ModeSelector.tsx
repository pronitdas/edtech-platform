import React from 'react'
import { ToolMode } from '../types'
import { CognitiveLoadIndicator } from '@/components/CognitiveLoadIndicator'

interface ModeSelectorProps {
  activeMode: ToolMode
  onModeChange: (mode: ToolMode) => void
  cognitiveState: {
    loadLevel: 'low' | 'medium' | 'high'
    errorCount: number
    hesitationSeconds: number
    idleTimeSeconds: number
  }
  onReset: () => void
}

/**
 * ModeSelector component provides the tool mode selection controls
 */
const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onModeChange,
  cognitiveState,
  onReset,
}) => {
  const modes = [
    { id: 'concept', label: 'Concept', icon: '🧠' },
    { id: 'practice', label: 'Practice', icon: '🎯' },
    { id: 'custom', label: 'Custom', icon: '⚡' },
    { id: 'word', label: 'Word Problem', icon: '📖' },
  ] as const

  return (
    <div className='flex items-center justify-between p-4 relative'>
      {/* Glowing border effect */}
      <div className='absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl' />
      
      <div className='flex space-x-1 relative z-10'>
        {modes.map((mode) => {
          const isActive = activeMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id as ToolMode)}
              className={`
                relative group px-6 py-3 rounded-xl font-medium transition-all duration-300 ease-out
                transform hover:scale-105 hover:-translate-y-0.5
                ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-2xl shadow-purple-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white backdrop-blur-sm border border-white/20'
                }
              `}
            >
              {/* Active mode glow effect */}
              {isActive && (
                <div className='absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300' />
              )}
              
              {/* Button content */}
              <div className='relative flex items-center space-x-2'>
                <span className='text-lg'>{mode.icon}</span>
                <span className='font-semibold'>{mode.label}</span>
              </div>
              
              {/* Hover shimmer effect */}
              <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000' />
              </div>
            </button>
          )
        })}
      </div>

      {/* Cognitive Load Indicator */}
      <div className='relative z-10'>
        <CognitiveLoadIndicator
          loadLevel={cognitiveState.loadLevel}
          errorCount={cognitiveState.errorCount}
          hesitationSeconds={cognitiveState.hesitationSeconds}
          idleTimeSeconds={cognitiveState.idleTimeSeconds}
          onReset={onReset}
          className='ml-4 backdrop-blur-xl bg-black/30 border border-white/20 rounded-xl shadow-xl'
        />
      </div>
    </div>
  )
}

export default ModeSelector
