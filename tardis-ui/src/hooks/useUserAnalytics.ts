import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '@/services/analytics-service';

interface UserAnalyticsState {
  sessionStats: any;
  interactionSummary: any;
  numericSummaries: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
}

export function useUserAnalytics(userId: string, contentId?: string) {
  const [state, setState] = useState<UserAnalyticsState>({
    sessionStats: null,
    interactionSummary: null,
    numericSummaries: {},
    isLoading: true,
    error: null
  });

  const fetchSessionStats = useCallback(async () => {
    try {
      const stats = await analyticsService.getUserSessionStats(userId);
      setState(prev => ({ ...prev, sessionStats: stats }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err as Error }));
    }
  }, [userId]);

  const fetchInteractionSummary = useCallback(async () => {
    try {
      const summary = await analyticsService.getUserInteractionSummary(userId, contentId);
      setState(prev => ({ ...prev, interactionSummary: summary }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err as Error }));
    }
  }, [userId, contentId]);

  const fetchNumericSummary = useCallback(async (eventType: string, jsonKey: string) => {
    try {
      const summary = await analyticsService.summarizeNumericEventData(userId, eventType, jsonKey);
      setState(prev => ({
        ...prev,
        numericSummaries: {
          ...prev.numericSummaries,
          [`${eventType}_${jsonKey}`]: summary
        }
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err as Error }));
    }
  }, [userId]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        await Promise.all([
          fetchSessionStats(),
          fetchInteractionSummary()
        ]);
      } catch (err) {
        setState(prev => ({ ...prev, error: err as Error }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, contentId, fetchSessionStats, fetchInteractionSummary]);

  return {
    ...state,
    refreshSessionStats: fetchSessionStats,
    refreshInteractionSummary: fetchInteractionSummary,
    fetchNumericSummary
  };
} 