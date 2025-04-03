import { useCallback, useRef, useEffect } from 'react';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { NavigationEvent } from '@/types/analytics';

interface NavigationAnalyticsParams {
  knowledgeId: string;
  moduleId: string;
}

/**
 * Hook for standardized navigation analytics tracking
 * 
 * @param params Base navigation parameters that will be included in all events
 * @returns Object with tracking methods for navigation events
 */
export const useNavigationAnalytics = (params: NavigationAnalyticsParams) => {
  const { trackNavigation } = useInteractionTracker();
  const currentRouteRef = useRef<string>('');
  const routeEntryTimeRef = useRef<number>(0);
  
  /**
   * Track navigation event between routes
   * @param fromRoute Previous route
   * @param toRoute Current/destination route
   * @param navigationMethod How navigation occurred (link, button, back, etc.)
   */
  const trackNavigate = useCallback((
    fromRoute: string,
    toRoute: string,
    navigationMethod: string
  ) => {
    let durationOnPreviousPage: number | undefined;
    
    // Calculate time spent on previous page if we have entry time
    if (routeEntryTimeRef.current > 0) {
      durationOnPreviousPage = (Date.now() - routeEntryTimeRef.current) / 1000; // seconds
    }
    
    // Update refs for next navigation
    currentRouteRef.current = toRoute;
    routeEntryTimeRef.current = Date.now();
    
    // Prepare event data
    const eventData: NavigationEvent = {
      ...params,
      fromRoute,
      toRoute,
      navigationMethod,
      durationOnPreviousPage
    };
    
    // Track the event
    trackNavigation(eventData);
  }, [params, trackNavigation]);
  
  /**
   * Initialize navigation tracking
   * @param initialRoute The initial route when the component mounts
   */
  const initializeTracking = useCallback((initialRoute: string) => {
    currentRouteRef.current = initialRoute;
    routeEntryTimeRef.current = Date.now();
  }, []);
  
  // Track navigation to a new route
  const navigateTo = useCallback((
    toRoute: string,
    navigationMethod: string = 'link'
  ) => {
    if (currentRouteRef.current) {
      trackNavigate(currentRouteRef.current, toRoute, navigationMethod);
    } else {
      // Initialize if not already set
      initializeTracking(toRoute);
    }
  }, [trackNavigate, initializeTracking]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Could track final page view duration here if needed
      routeEntryTimeRef.current = 0;
    };
  }, []);
  
  return {
    trackNavigate,
    navigateTo,
    initializeTracking,
    getCurrentRoute: () => currentRouteRef.current,
    getCurrentDuration: () => {
      if (routeEntryTimeRef.current === 0) return 0;
      return (Date.now() - routeEntryTimeRef.current) / 1000;
    }
  };
}; 