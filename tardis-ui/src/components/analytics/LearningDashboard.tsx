import React, { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analytics-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressData {
  completion: number;
  videosWatched: number;
  quizzesCompleted: number;
  totalTimeSpent: number; // in minutes
}

interface LearningDashboardProps {
  userId: string;
  courseId?: string;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({ userId, courseId }) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    completion: 0,
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
        let completionData = { completion: 0 };
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
        
        // This is a simplified calculation - in a real app, this would be more sophisticated
        if (videoEvents.length > 0) {
          totalTimeSpent = Math.round(videoEvents.reduce(
            (total: number, event: any) => total + (event.event_data.duration || 0),
            0
          ) / 60); // Convert to minutes
        }

        setProgressData({
          completion: completionData.completion,
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
    return <div className="p-4">Loading your progress...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Course Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  {progressData.completion}% Complete
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${progressData.completion}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{progressData.videosWatched}</p>
            <p className="text-xs text-gray-500">Videos completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{progressData.quizzesCompleted}</p>
            <p className="text-xs text-gray-500">Quizzes passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{progressData.totalTimeSpent}</p>
            <p className="text-xs text-gray-500">Minutes spent</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 