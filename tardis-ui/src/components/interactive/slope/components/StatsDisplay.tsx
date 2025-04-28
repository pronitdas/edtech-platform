'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface StatsDisplayProps {
  stats: {
    correct: number;
    incorrect: number;
    attempted: number;
    streakCount: number;
    history?: Array<'correct' | 'incorrect'>;
  };
  showDetails?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  showDetails = false
}) => {
  // For client-side rendering of charts
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Calculate accuracy percentage
  const accuracyPercentage = stats.attempted > 0
    ? Math.round((stats.correct / stats.attempted) * 100)
    : 0;

  // Data for pie chart
  const pieData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [stats.correct, stats.incorrect],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Options for pie chart
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
      }
    },
  };

  // Generate history data for bar chart
  const historyData = {
    labels: stats.history ? Array.from({ length: stats.history.length }, (_, i) => `Q${i + 1}`) : [],
    datasets: [
      {
        label: 'Performance',
        data: stats.history ? stats.history.map(result => result === 'correct' ? 1 : 0) : [],
        backgroundColor: stats.history ? stats.history.map(result => 
          result === 'correct' ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
        ) : [],
        borderColor: stats.history ? stats.history.map(result => 
          result === 'correct' ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
        ) : [],
        borderWidth: 1,
      },
    ],
  };

  // Options for bar chart
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 1,
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.raw === 1 ? 'Correct' : 'Incorrect';
          }
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
      }
    },
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 overflow-hidden">
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
        <div className="space-y-4 overflow-y-visible">
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

          {/* Chart Visualizations */}
          {isClient && stats.attempted > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Correct vs Incorrect Pie Chart */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white text-lg mb-2">Performance Breakdown</h3>
                <div className="h-56">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </div>

              {/* Performance History Bar Chart */}
              {stats.history && stats.history.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white text-lg mb-2">Performance History</h3>
                  <div className="h-56">
                    <Bar data={historyData} options={barOptions} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsDisplay; 