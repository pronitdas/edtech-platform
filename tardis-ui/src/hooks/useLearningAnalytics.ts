import { useState, useEffect } from 'react';
import { learningAnalyticsService } from '@/services/learning-analytics-service';
import { LearningAnalytics } from '@/types/database';

interface UseLearningAnalyticsResult {
  analytics: LearningAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
}

export function useLearningAnalytics(userId: string, knowledgeId: string): UseLearningAnalyticsResult {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!userId || !knowledgeId) {
      setError('User ID or Knowledge ID is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await learningAnalyticsService.getLearningAnalytics(userId, knowledgeId);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching learning analytics:', err);
      setError('Failed to load learning analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId, knowledgeId]);

  const refreshAnalytics = async () => {
    if (!userId || !knowledgeId) {
      setError('User ID or Knowledge ID is missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Force regeneration of analytics
      const data = await learningAnalyticsService.generateLearningAnalytics(userId, knowledgeId);
      setAnalytics(data);
    } catch (err) {
      console.error('Error refreshing learning analytics:', err);
      setError('Failed to refresh learning analytics');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics
  };
} 