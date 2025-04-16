import React, { useEffect, useState } from 'react';
import { BarChart, Hourglass, BrainCircuit, TrendingUp, AlertCircle } from 'lucide-react';

interface TopicProgress {
  topicId: string;
  topicName: string;
  masteryLevel: number; // 0-100
  questionsAttempted: number;
  questionsCorrect: number;
  averageResponseTime: number; // in seconds
  lastPracticed: string; // ISO date string
}

interface TimeSpentData {
  date: string;
  minutes: number;
}

interface ProgressTrackingProps {
  userId: string;
  topicsData?: TopicProgress[];
  timeSpentData?: TimeSpentData[];
  className?: string;
  compact?: boolean;
}

export const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  userId,
  topicsData = [],
  timeSpentData = [],
  className = '',
  compact = false,
}) => {
  const [topTopics, setTopTopics] = useState<TopicProgress[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<TopicProgress[]>([]);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Process the data to identify strengths and improvement areas
    if (topicsData.length > 0) {
      // Sort by mastery level to find top topics
      const sortedByMastery = [...topicsData].sort((a, b) => b.masteryLevel - a.masteryLevel);
      setTopTopics(sortedByMastery.slice(0, 3));
      
      // Find topics that need improvement (low mastery, high attempts)
      const needsImprovement = topicsData
        .filter(topic => topic.masteryLevel < 70 && topic.questionsAttempted > 5)
        .sort((a, b) => a.masteryLevel - b.masteryLevel);
      setImprovementAreas(needsImprovement.slice(0, 3));
      
      setIsLoading(false);
    }
    
    // Calculate total time spent
    if (timeSpentData.length > 0) {
      const total = timeSpentData.reduce((sum, data) => sum + data.minutes, 0);
      setTotalTimeSpent(total);
    }
  }, [topicsData, timeSpentData]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Function to render mastery level bar
  const renderMasteryBar = (level: number) => (
    <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${
          level >= 80 ? 'bg-green-500' : level >= 60 ? 'bg-yellow-500' : 'bg-red-500'
        }`}
        style={{ width: `${level}%` }}
      ></div>
    </div>
  );

  if (isLoading && topicsData.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Compact view for smaller spaces
  if (compact) {
    return (
      <div className={`bg-gray-900 p-3 rounded-lg ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Progress Summary</h3>
          <div className="flex items-center text-gray-400 text-sm">
            <Hourglass size={14} className="mr-1" />
            <span>{formatTime(totalTimeSpent)}</span>
          </div>
        </div>
        
        {topTopics.length > 0 ? (
          <div className="mb-3">
            <h4 className="text-gray-400 text-xs uppercase mb-2">Strongest Topics</h4>
            <div className="space-y-2">
              {topTopics.map(topic => (
                <div key={topic.topicId} className="flex items-center justify-between">
                  <span className="text-white text-sm truncate">{topic.topicName}</span>
                  <span className="text-xs text-green-400">{topic.masteryLevel}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm mb-3">No topic data available</div>
        )}
        
        {improvementAreas.length > 0 && (
          <div>
            <h4 className="text-gray-400 text-xs uppercase mb-2">Needs Improvement</h4>
            <div className="space-y-2">
              {improvementAreas.map(topic => (
                <div key={topic.topicId} className="flex items-center justify-between">
                  <span className="text-white text-sm truncate">{topic.topicName}</span>
                  <span className="text-xs text-red-400">{topic.masteryLevel}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-xl ${className}`}>
      <div className="bg-gray-800 p-4">
        <h2 className="text-lg font-medium text-white flex items-center">
          <BarChart size={20} className="mr-2" />
          Learning Progress
        </h2>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time stats */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <Hourglass size={18} className="mr-2" />
            Time Metrics
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Total Practice Time</span>
                <span className="text-sm text-white">{formatTime(totalTimeSpent)}</span>
              </div>
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${Math.min(totalTimeSpent / 10, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {timeSpentData.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm text-gray-400 mb-2">Recent Practice Sessions</h4>
                <div className="space-y-2">
                  {timeSpentData.slice(-5).map((data, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">
                        {new Date(data.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                        {formatTime(data.minutes)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Topic mastery */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <BrainCircuit size={18} className="mr-2" />
            Topic Mastery
          </h3>
          
          {topicsData.length > 0 ? (
            <div className="space-y-4">
              {topTopics.length > 0 && (
                <div>
                  <h4 className="text-sm text-gray-400 mb-2 flex items-center">
                    <TrendingUp size={14} className="mr-1" />
                    Strongest Topics
                  </h4>
                  <div className="space-y-3">
                    {topTopics.map(topic => (
                      <div key={topic.topicId}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-300">{topic.topicName}</span>
                          <span 
                            className={`text-xs px-2 py-0.5 rounded ${
                              topic.masteryLevel >= 80 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {topic.masteryLevel}%
                          </span>
                        </div>
                        {renderMasteryBar(topic.masteryLevel)}
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>{topic.questionsCorrect}/{topic.questionsAttempted} correct</span>
                          <span>Last: {new Date(topic.lastPracticed).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {improvementAreas.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm text-gray-400 mb-2 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    Areas for Improvement
                  </h4>
                  <div className="space-y-3">
                    {improvementAreas.map(topic => (
                      <div key={topic.topicId}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-300">{topic.topicName}</span>
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                            {topic.masteryLevel}%
                          </span>
                        </div>
                        {renderMasteryBar(topic.masteryLevel)}
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>{topic.questionsCorrect}/{topic.questionsAttempted} correct</span>
                          <span>Avg time: {Math.round(topic.averageResponseTime)}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No topic data available yet.</p>
              <p className="text-sm mt-2">Complete practice sessions to see your progress.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 