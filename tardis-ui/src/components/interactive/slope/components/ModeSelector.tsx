import React from 'react';
import { ToolMode } from '../types';
import { CognitiveLoadIndicator } from '@/components/CognitiveLoadIndicator';

interface ModeSelectorProps {
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  cognitiveState: {
    loadLevel: 'low' | 'medium' | 'high';
    errorCount: number;
    hesitationSeconds: number;
    idleTimeSeconds: number;
  };
  onReset: () => void;
}

/**
 * ModeSelector component provides the tool mode selection controls
 */
const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onModeChange, cognitiveState, onReset }) => {
  return (
    <div className="bg-gray-800 p-2 flex items-center justify-between">
      <div className="flex space-x-2">
        <button
          onClick={() => onModeChange('concept')}
          className={`px-3 py-1 rounded ${
            activeMode === 'concept' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Concept
        </button>
        <button
          onClick={() => onModeChange('practice')}
          className={`px-3 py-1 rounded ${
            activeMode === 'practice' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => onModeChange('custom')}
          className={`px-3 py-1 rounded ${
            activeMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Custom
        </button>
        <button
          onClick={() => onModeChange('word')}
          className={`px-3 py-1 rounded ${
            activeMode === 'word' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
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
        className="ml-2"
      />
    </div>
  );
};

export default ModeSelector; 