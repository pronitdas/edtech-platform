import { useCallback } from 'react';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { MindMapInteractionEvent } from '@/types/analytics';

interface MindMapAnalyticsParams {
  knowledgeId: string;
  moduleId: string;
  mapId: string;
}

type InteractionType = 'zoom' | 'pan' | 'click' | 'expand' | 'collapse' | 'search' | 'focus';

/**
 * Hook for standardized mind map analytics tracking
 * 
 * @param params Base parameters that will be included in all events
 * @returns Object with tracking methods for mind map interactions
 */
export const useMindMapAnalytics = (params: MindMapAnalyticsParams) => {
  const { trackMindMapInteraction } = useInteractionTracker();
  
  /**
   * Track a mind map interaction event
   * @param interactionType Type of interaction
   * @param details Additional details about the interaction
   */
  const trackInteraction = useCallback((
    interactionType: InteractionType,
    details?: {
      nodeId?: string;
      nodeTitle?: string;
      zoomLevel?: number;
      expandedNodes?: number;
    }
  ) => {
    // Prepare event data
    const eventData: MindMapInteractionEvent = {
      ...params,
      mapId: params.mapId,
      interactionType,
      ...details
    };
    
    // Track the event
    trackMindMapInteraction(params.mapId, eventData);
  }, [params, trackMindMapInteraction]);
  
  /**
   * Track node click
   * @param nodeId ID of the clicked node
   * @param nodeTitle Title of the clicked node
   */
  const trackNodeClick = useCallback((nodeId: string, nodeTitle: string) => {
    trackInteraction('click', { nodeId, nodeTitle });
  }, [trackInteraction]);
  
  /**
   * Track node expansion
   * @param nodeId ID of the expanded node
   * @param nodeTitle Title of the expanded node
   * @param expandedNodes Total number of expanded nodes after this expansion
   */
  const trackNodeExpand = useCallback((
    nodeId: string,
    nodeTitle: string,
    expandedNodes: number
  ) => {
    trackInteraction('expand', { nodeId, nodeTitle, expandedNodes });
  }, [trackInteraction]);
  
  /**
   * Track node collapse
   * @param nodeId ID of the collapsed node
   * @param nodeTitle Title of the collapsed node
   * @param expandedNodes Total number of expanded nodes after this collapse
   */
  const trackNodeCollapse = useCallback((
    nodeId: string,
    nodeTitle: string,
    expandedNodes: number
  ) => {
    trackInteraction('collapse', { nodeId, nodeTitle, expandedNodes });
  }, [trackInteraction]);
  
  /**
   * Track zoom action
   * @param zoomLevel New zoom level after the action
   */
  const trackZoom = useCallback((zoomLevel: number) => {
    trackInteraction('zoom', { zoomLevel });
  }, [trackInteraction]);
  
  /**
   * Track pan action
   */
  const trackPan = useCallback(() => {
    trackInteraction('pan');
  }, [trackInteraction]);
  
  /**
   * Track search action in the mind map
   * @param nodeId ID of the found node (if any)
   * @param nodeTitle Title of the found node (if any)
   */
  const trackSearch = useCallback((nodeId?: string, nodeTitle?: string) => {
    trackInteraction('search', { nodeId, nodeTitle });
  }, [trackInteraction]);
  
  /**
   * Track when a node is focused
   * @param nodeId ID of the focused node
   * @param nodeTitle Title of the focused node
   */
  const trackNodeFocus = useCallback((nodeId: string, nodeTitle: string) => {
    trackInteraction('focus', { nodeId, nodeTitle });
  }, [trackInteraction]);
  
  return {
    trackInteraction,
    trackNodeClick,
    trackNodeExpand,
    trackNodeCollapse,
    trackZoom,
    trackPan,
    trackSearch,
    trackNodeFocus
  };
}; 