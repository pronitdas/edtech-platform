import React, { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analytics-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Video, CheckSquare } from 'lucide-react';

interface ProgressData {
  completion: number;
  engagementScore: number;
  videoCompletion: number;
  quizCompletion: number;
  videosWatched: number;
  quizzesCompleted: number;
  totalTimeSpent: number;
}

interface LearningDashboardProps {
  userId: string;
  courseId?: string;
  compact?: boolean;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({ 
  userId, 
  courseId,
  compact = false 
}) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    completion: 0,
    engagementScore: 0,
    videoCompletion: 0,
    quizCompletion: 0,
    videosWatched: 0,
    quizzesCompleted: 0,
    totalTimeSpent: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProgress() {
      setIsLoading(true);
      try {
        // Get overall user progress
        const progressData = await analyticsService.getUserProgress(userId);
        
        // If courseId is provided, get completion percentage for this specific course
        let completionData = { 
          completion: 0,
          engagementScore: 0,
          videoCompletion: 0,
          quizCompletion: 0
        };
        
        if (courseId) {
          completionData = await analyticsService.getUserCompletion(userId, courseId);
        }

        // Process the data to get relevant metrics
        const videosWatched = progressData?.filter(
          (item: any) => item.event_type === 'video_complete'
        ).length || 0;
        
        const quizzesCompleted = progressData?.filter(
          (item: any) => item.event_type === 'quiz_complete'
        ).length || 0;
        
        // Calculate total time spent (simplified calculation)
        let totalTimeSpent = 0;
        const videoEvents = progressData?.filter(
          (item: any) => ['video_play', 'video_pause', 'video_complete'].includes(item.event_type)
        ) || [];
        
        if (videoEvents.length > 0) {
          totalTimeSpent = Math.round(videoEvents.reduce(
            (total: number, event: any) => total + (event.event_data.duration || 0),
            0
          ) / 60); // Convert to minutes
        }

        setProgressData({
          ...completionData,
          videosWatched,
          quizzesCompleted,
          totalTimeSpent
        });
      } catch (error) {
        console.error('Error fetching learning progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProgress();
  }, [userId, courseId]);

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Compact version of the dashboard for smaller screens
  if (compact) {
    return (
      <div className="p-2 space-y-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-white">Course Progress</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400">
              {progressData.completion}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
              style={{ width: `${progressData.completion}%` }}
            ></div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>Videos: {Math.round(progressData.videoCompletion)}%</div>
            <div>Quizzes: {Math.round(progressData.quizCompletion)}%</div>
          </div>
        </div>
      </div>
    );
  }

  // Full dashboard for larger screens
  return (
    <div className="p-4 space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <span>Course Completion</span>
            <span className="text-sm font-medium bg-indigo-600/20 text-indigo-400 px-2.5 py-0.5 rounded-full">
              {progressData.completion}% Complete
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pt-1">
            <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-gray-700">
              <div
                style={{ width: `${progressData.completion}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 ease-in-out"
              ></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-gray-400">
              <div className="text-sm font-medium">Video Progress</div>
              <div className="text-lg font-semibold text-white">{Math.round(progressData.videoCompletion)}%</div>
              <div className="text-xs">Videos Watched: {progressData.videosWatched}</div>
            </div>
            <div className="text-gray-400">
              <div className="text-sm font-medium">Quiz Progress</div>
              <div className="text-lg font-semibold text-white">{Math.round(progressData.quizCompletion)}%</div>
              <div className="text-xs">Quizzes Completed: {progressData.quizzesCompleted}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-400">Engagement Score</div>
            <div className="text-lg font-semibold text-white">{Math.round(progressData.engagementScore)}/100</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 