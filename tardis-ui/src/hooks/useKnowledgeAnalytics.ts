import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '@/services/analytics-service';

interface KnowledgeAnalyticsState {
  interactionSummary: any;
  videoStats: any;
  quizStats: any;
  isLoading: boolean;
  error: Error | null;
}

export function useKnowledgeAnalytics(userId: string, knowledgeId: string) {
  const [state, setState] = useState<KnowledgeAnalyticsState>({
    interactionSummary: null,
    videoStats: null,
    quizStats: null,
    isLoading: true,
    error: null
  });

  const fetchInteractionSummary = useCallback(async () => {
    try {
      const summary = await analyticsService.getKnowledgeInteractionSummary(userId, knowledgeId);
      setState(prev => ({ ...prev, interactionSummary: summary }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err as Error }));
    }
  }, [userId, knowledgeId]);

  const fetchVideoStats = useCallback(async () => {
    try {
      const stats = await analyticsService.getKnowledgeVideoStats(userId, knowledgeId);
      setState(prev => ({ ...prev, videoStats: stats }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err as Error }));
    }
  }, [userId, knowledgeId]);

  const fetchQuizStats = useCallback(async () => {
    try {
      const stats = await analyticsService.getKnowledgeQuizStats(userId, knowledgeId);
      setState(prev => ({ ...prev, quizStats: stats }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err as Error }));
    }
  }, [userId, knowledgeId]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        await Promise.all([
          fetchInteractionSummary(),
          fetchVideoStats(),
          fetchQuizStats()
        ]);
      } catch (err) {
        setState(prev => ({ ...prev, error: err as Error }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (userId && knowledgeId) {
      fetchData();
    }
  }, [userId, knowledgeId, fetchInteractionSummary, fetchVideoStats, fetchQuizStats]);

  return {
    ...state,
    refreshInteractionSummary: fetchInteractionSummary,
    refreshVideoStats: fetchVideoStats,
    refreshQuizStats: fetchQuizStats
  };
} 