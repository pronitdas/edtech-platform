import React from 'react';
import { AlertCircle, Clock, Brain } from 'lucide-react';

interface CognitiveLoadIndicatorProps {
  loadLevel: 'low' | 'medium' | 'high';
  errorCount: number;
  hesitationSeconds: number;
  idleTimeSeconds: number;
  onReset?: () => void;
  className?: string;
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine background color based on load level
  const getBgColor = () => {
    switch (loadLevel) {
      case 'high':
        return 'bg-red-600';
      case 'medium':
        return 'bg-amber-500';
      default:
        return 'bg-green-500';
    }
  };

  // Determine message based on load level
  const getMessage = () => {
    switch (loadLevel) {
      case 'high':
        return 'Consider taking a break';
      case 'medium':
        return 'Your cognitive load is increasing';
      default:
        return 'Optimal learning state';
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden shadow-md ${className}`}>
      <div className={`p-3 text-white ${getBgColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Brain size={18} />
            <h3 className="font-medium">Cognitive Load: {loadLevel.toUpperCase()}</h3>
          </div>
          {onReset && (
            <button 
              onClick={onReset}
              className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-sm">{getMessage()}</p>
      </div>
      
      <div className="bg-gray-800 p-3 text-gray-200">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle size={14} />
            <span>Errors: {errorCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={14} />
            <span>Hesitation: {formatTime(hesitationSeconds)}</span>
          </div>
        </div>
        
        {/* Only show idle time if significant */}
        {idleTimeSeconds > 30 && (
          <div className="mt-2 flex items-center space-x-2 text-sm">
            <Clock size={14} />
            <span>Idle: {formatTime(idleTimeSeconds)}</span>
            {idleTimeSeconds > 120 && (
              <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                Extended idle detected
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 