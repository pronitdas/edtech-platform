'use client';

import React from 'react';

export interface StatsDisplayProps {
  stats: {
    correct: number;
    incorrect: number;
    attempted: number;
    streakCount: number;
  };
  showDetails?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  showDetails = false
}) => {
  // Calculate accuracy percentage
  const accuracyPercentage = stats.attempted > 0
    ? Math.round((stats.correct / stats.attempted) * 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Basic Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-sm">Attempted</p>
          <p className="text-2xl font-bold text-white">{stats.attempted}</p>
        </div>
        <div className="bg-green-900/50 rounded-lg p-3 text-center">
          <p className="text-green-400 text-sm">Correct</p>
          <p className="text-2xl font-bold text-green-400">{stats.correct}</p>
        </div>
        <div className="bg-red-900/50 rounded-lg p-3 text-center">
          <p className="text-red-400 text-sm">Incorrect</p>
          <p className="text-2xl font-bold text-red-400">{stats.incorrect}</p>
        </div>
        <div className="bg-yellow-900/50 rounded-lg p-3 text-center">
          <p className="text-yellow-400 text-sm">Streak</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.streakCount}</p>
        </div>
      </div>

      {/* Detailed Stats (conditionally rendered) */}
      {showDetails && (
        <div className="space-y-4">
          {/* Accuracy Bar */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Accuracy</span>
              <span className="text-gray-300">{accuracyPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${accuracyPercentage}%` }}
              />
            </div>
          </div>

          {/* Streak Information */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white text-lg mb-2">Current Streak</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-1 bg-gray-600">
                {Array.from({ length: Math.min(stats.streakCount, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className="inline-block h-full bg-yellow-400"
                    style={{ width: '10%' }}
                  />
                ))}
              </div>
              <span className="text-yellow-400 font-bold">{stats.streakCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDisplay; 