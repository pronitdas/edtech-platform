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
    <div className='relative flex items-center justify-between p-4'>
      {/* Glowing border effect */}
      <div className='absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl' />

      <div className='relative z-10 flex space-x-1'>
        {modes.map(mode => {
          const isActive = activeMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id as ToolMode)}
              className={`group relative transform rounded-xl px-6 py-3 font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-2xl shadow-purple-500/25'
                  : 'border border-white/20 bg-white/10 text-gray-300 backdrop-blur-sm hover:bg-white/20 hover:text-white'
              } `}
            >
              {/* Active mode glow effect */}
              {isActive && (
                <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 opacity-50 blur-lg transition-opacity duration-300 group-hover:opacity-75' />
              )}

              {/* Button content */}
              <div className='relative flex items-center space-x-2'>
                <span className='text-lg'>{mode.icon}</span>
                <span className='font-semibold'>{mode.label}</span>
              </div>

              {/* Hover shimmer effect */}
              <div className='absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
                <div className='absolute inset-0 translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[-200%]' />
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
          className='ml-4 rounded-xl border border-white/20 bg-black/30 shadow-xl backdrop-blur-xl'
        />
      </div>
    </div>
  )
}

export default ModeSelector
