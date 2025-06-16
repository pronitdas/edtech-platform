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
  return (
    <div className='flex items-center justify-between bg-gray-800 p-2'>
      <div className='flex space-x-2'>
        <button
          onClick={() => onModeChange('concept')}
          className={`rounded px-3 py-1 ${
            activeMode === 'concept'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Concept
        </button>
        <button
          onClick={() => onModeChange('practice')}
          className={`rounded px-3 py-1 ${
            activeMode === 'practice'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => onModeChange('custom')}
          className={`rounded px-3 py-1 ${
            activeMode === 'custom'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Custom
        </button>
        <button
          onClick={() => onModeChange('word')}
          className={`rounded px-3 py-1 ${
            activeMode === 'word'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Word Problem
        </button>
      </div>

      {/* Cognitive Load Indicator */}
      <CognitiveLoadIndicator
        loadLevel={cognitiveState.loadLevel}
        errorCount={cognitiveState.errorCount}
        hesitationSeconds={cognitiveState.hesitationSeconds}
        idleTimeSeconds={cognitiveState.idleTimeSeconds}
        onReset={onReset}
        className='ml-2'
      />
    </div>
  )
}

export default ModeSelector
