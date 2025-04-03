import { useCallback, useRef, useEffect } from 'react';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { ContentViewEvent } from '@/types/analytics';

interface ContentViewAnalyticsParams {
  knowledgeId: string;
  moduleId: string;
  contentId: string;
  contentType: string;
  contentTitle?: string;
}

/**
 * Hook for standardized content view analytics tracking
 * 
 * @param params Base content parameters that will be included in all events
 * @returns Object with tracking methods for content view interactions
 */
export const useContentViewAnalytics = (params: ContentViewAnalyticsParams) => {
  const { trackContentView } = useInteractionTracker();
  const viewStartTimeRef = useRef<number>(0);
  
  // Track content view on mount
  useEffect(() => {
    // Record view start time
    viewStartTimeRef.current = Date.now();
    
    // Track initial view
    trackView();
    
    // Track view duration on unmount
    return () => {
      const viewDuration = (Date.now() - viewStartTimeRef.current) / 1000; // seconds
      trackView(viewDuration);
    };
  }, [params.contentId]); // Re-run if content ID changes
  
  /**
   * Track content view event
   * @param viewDuration Duration of view in seconds (optional)
   * @param referrer Where the user came from (optional)
   */
  const trackView = useCallback((viewDuration?: number, referrer?: string) => {
    // Prepare event data
    const eventData: ContentViewEvent = {
      ...params,
      contentId: params.contentId,
      contentType: params.contentType,
      contentTitle: params.contentTitle,
      viewDuration,
      referrer
    };
    
    // Track the event
    trackContentView(params.contentId, eventData);
  }, [params, trackContentView]);
  
  /**
   * Get the current view duration in seconds
   * @returns Current view duration in seconds
   */
  const getCurrentViewDuration = useCallback(() => {
    if (!viewStartTimeRef.current) return 0;
    return (Date.now() - viewStartTimeRef.current) / 1000;
  }, []);
  
  return {
    trackView,
    getCurrentViewDuration
  };
}; 