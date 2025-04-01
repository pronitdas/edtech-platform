import React, { createContext, useContext, ReactNode, useReducer, useCallback, useEffect, useMemo } from 'react';
import { AnalyticsService } from '@/services/analytics-service';

// Interface definitions
interface InteractionEvent {
  id: string;
  type: string;
  contentId?: string;
  timestamp: number;
  metadata: Record<string, any>;
  persisted: boolean;
}

// New state structure as proposed in the epic
interface InteractionContextState {
  session: {
    id: string | null;
    isActive: boolean;
    metadata: Record<string, any>;
  };
  events: {
    pending: InteractionEvent[];
    processing: InteractionEvent[];
    failed: InteractionEvent[];
  };
  config: {
    isTrackingEnabled: boolean;
    batchSize: number;
    flushInterval: number;
  };
}

// Context value interface
interface InteractionContextValue extends Omit<InteractionContextState, 'events'> {
  trackVideoPlay: (contentId: number, data?: Record<string, any>) => void;
  trackVideoPause: (contentId: number, data?: Record<string, any>) => void;
  trackVideoComplete: (contentId: number, data?: Record<string, any>) => void;
  trackQuizStart: (quizId: number, data?: Record<string, any>) => void;
  trackQuizAnswer: (quizId: number, questionId: string, data?: Record<string, any>) => void;
  trackQuizComplete: (quizId: number, data?: Record<string, any>) => void;
  trackContentView: (contentId: string, data?: Record<string, any>) => void;
  pendingEventsCount: number;
  totalEventsCount: number;
  flushEvents: () => Promise<void>;
}

// Action types for the reducer
type ActionType = 
  | { type: 'ADD_EVENT'; payload: { eventType: string; contentId?: string; metadata?: Record<string, any> } }
  | { type: 'SET_EVENTS_PROCESSING' }
  | { type: 'SET_EVENTS_PERSISTED' }
  | { type: 'SET_EVENTS_FAILED'; payload: { events: InteractionEvent[] } }
  | { type: 'SET_SESSION'; payload: { sessionId: string | null; metadata?: Record<string, any> } }
  | { type: 'SET_TRACKING_ENABLED'; payload: boolean }
  | { type: 'UPDATE_CONFIG'; payload: Partial<InteractionContextState['config']> };

// Create context
const InteractionTrackerContext = createContext<InteractionContextValue | undefined>(undefined);

// Initial state
const initialState: InteractionContextState = {
  session: {
    id: null,
    isActive: false,
    metadata: {},
  },
  events: {
    pending: [],
    processing: [],
    failed: [],
  },
  config: {
    isTrackingEnabled: false,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
  },
};

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Reducer function
const interactionReducer = (state: InteractionContextState, action: ActionType): InteractionContextState => {
  switch (action.type) {
    case 'ADD_EVENT': {
      if (!state.session.isActive || !state.config.isTrackingEnabled) {
        return state;
      }

      const newEvent: InteractionEvent = {
        id: generateId(),
        type: action.payload.eventType,
        contentId: action.payload.contentId,
        timestamp: Date.now(),
        metadata: action.payload.metadata || {},
        persisted: false,
      };

      return {
        ...state,
        events: {
          ...state.events,
          pending: [...state.events.pending, newEvent],
        },
      };
    }

    case 'SET_EVENTS_PROCESSING': {
      const { pending, processing, failed } = state.events;
      
      if (pending.length === 0) {
        return state;
      }

      return {
        ...state,
        events: {
          pending: [],
          processing: [...processing, ...pending],
          failed,
        },
      };
    }

    case 'SET_EVENTS_PERSISTED': {
      return {
        ...state,
        events: {
          ...state.events,
          processing: [],
        },
      };
    }

    case 'SET_EVENTS_FAILED': {
      return {
        ...state,
        events: {
          ...state.events,
          processing: [],
          failed: [...state.events.failed, ...action.payload.events],
        },
      };
    }

    case 'SET_SESSION': {
      return {
        ...state,
        session: {
          id: action.payload.sessionId,
          isActive: action.payload.sessionId !== null,
          metadata: action.payload.metadata || state.session.metadata,
        },
      };
    }

    case 'SET_TRACKING_ENABLED': {
      return {
        ...state,
        config: {
          ...state.config,
          isTrackingEnabled: action.payload,
        },
      };
    }

    case 'UPDATE_CONFIG': {
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };
    }

    default:
      return state;
  }
};

// Provider component
interface InteractionTrackerProviderProps {
  children: ReactNode;
  dataService: AnalyticsService;
  userId: string;
  batchSize?: number;
  flushInterval?: number;
}

export const InteractionTrackerProvider: React.FC<InteractionTrackerProviderProps> = ({
  children,
  dataService,
  userId,
  batchSize = 10,
  flushInterval = 30000,
}) => {
  const [state, dispatch] = useReducer(interactionReducer, {
    ...initialState,
    config: {
      ...initialState.config,
      isTrackingEnabled: Boolean(userId),
      batchSize,
      flushInterval,
    },
  });

  // Initialize session when userId changes
  useEffect(() => {
    if (userId) {
      // Create a session in state (could also call an API to create a server-side session)
      dispatch({ 
        type: 'SET_SESSION', 
        payload: { 
          sessionId: generateId(),
          metadata: { 
            userId,
            startedAt: new Date().toISOString() 
          } 
        } 
      });
      dispatch({ type: 'SET_TRACKING_ENABLED', payload: true });
    } else {
      dispatch({ type: 'SET_SESSION', payload: { sessionId: null } });
      dispatch({ type: 'SET_TRACKING_ENABLED', payload: false });
    }
  }, [userId]);

  // Set up interval for flushing events
  useEffect(() => {
    if (state.config.isTrackingEnabled && state.session.isActive) {
      const interval = setInterval(() => {
        if (state.events.pending.length > 0) {
          flushEvents();
        }
      }, state.config.flushInterval);
      
      return () => clearInterval(interval);
    }
  }, [
    state.config.isTrackingEnabled,
    state.session.isActive,
    state.config.flushInterval,
    state.events.pending.length
  ]);

  // Flush events when reaching batch size
  useEffect(() => {
    if (
      state.config.isTrackingEnabled && 
      state.session.isActive && 
      state.events.pending.length >= state.config.batchSize
    ) {
      flushEvents();
    }
  }, [
    state.config.isTrackingEnabled,
    state.session.isActive,
    state.events.pending.length,
    state.config.batchSize
  ]);

  // Track an event (internal function)
  const trackEvent = useCallback((eventType: string, contentId?: number, metadata: Record<string, any> = {}) => {
    dispatch({
      type: 'ADD_EVENT',
      payload: {
        eventType,
        contentId: contentId?.toString(),
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          userId,
        },
      },
    });
  }, [userId]);

  // Flush events to persistence
  const flushEvents = useCallback(async () => {
    if (state.events.pending.length === 0) return;

    // Mark events as processing
    dispatch({ type: 'SET_EVENTS_PROCESSING' });

    try {
      // Convert events to the format expected by the analytics service
      const eventsToSend = state.events.processing.map(event => ({
        userId,
        eventType: event.type,
        contentId: event.contentId || '',
        timestamp: event.timestamp,
        ...event.metadata,
      }));

      // Persist events in batches
      await Promise.all(
        eventsToSend.map(eventData => dataService.trackEvent(eventData))
      );

      // Mark events as persisted
      dispatch({ type: 'SET_EVENTS_PERSISTED' });
    } catch (error) {
      console.error('Failed to persist events:', error);
      // Mark events as failed
      dispatch({ 
        type: 'SET_EVENTS_FAILED', 
        payload: { events: state.events.processing } 
      });
    }
  }, [dataService, state.events.pending.length, state.events.processing, userId]);

  // Specialized tracking methods (memoized)
  const trackVideoPlay = useCallback(
    (contentId: number, data: Record<string, any> = {}) => 
      trackEvent('video_play', contentId, data),
    [trackEvent]
  );

  const trackVideoPause = useCallback(
    (contentId: number, data: Record<string, any> = {}) => 
      trackEvent('video_pause', contentId, data),
    [trackEvent]
  );

  const trackVideoComplete = useCallback(
    (contentId: number, data: Record<string, any> = {}) => 
      trackEvent('video_complete', contentId, data),
    [trackEvent]
  );

  const trackQuizStart = useCallback(
    (quizId: number, data: Record<string, any> = {}) => 
      trackEvent('quiz_start', quizId, data),
    [trackEvent]
  );

  const trackQuizAnswer = useCallback(
    (quizId: number, questionId: string, data: Record<string, any> = {}) => 
      trackEvent('quiz_answer', quizId, { ...data, questionId }),
    [trackEvent]
  );

  const trackQuizComplete = useCallback(
    (quizId: number, data: Record<string, any> = {}) => 
      trackEvent('quiz_complete', quizId, data),
    [trackEvent]
  );

  const trackContentView = useCallback(
    (contentId: string, data: Record<string, any> = {}) => 
      trackEvent('content_view', parseInt(contentId, 10) || 0, data),
    [trackEvent]
  );

  // Memoized counts
  const pendingEventsCount = useMemo(() => 
    state.events.pending.length, [state.events.pending.length]
  );

  const totalEventsCount = useMemo(
    () => state.events.pending.length + state.events.processing.length + state.events.failed.length,
    [state.events.pending.length, state.events.processing.length, state.events.failed.length]
  );

  // Memoized context value
  const contextValue = useMemo(() => ({
    session: state.session,
    config: state.config,
    trackVideoPlay,
    trackVideoPause,
    trackVideoComplete,
    trackQuizStart,
    trackQuizAnswer,
    trackQuizComplete,
    trackContentView,
    pendingEventsCount,
    totalEventsCount,
    flushEvents,
  }), [
    state.session,
    state.config,
    trackVideoPlay,
    trackVideoPause,
    trackVideoComplete,
    trackQuizStart,
    trackQuizAnswer,
    trackQuizComplete,
    trackContentView,
    pendingEventsCount,
    totalEventsCount,
    flushEvents
  ]);

  return (
    <InteractionTrackerContext.Provider value={contextValue}>
      {children}
    </InteractionTrackerContext.Provider>
  );
};

// Custom hook with proper error handling
export const useInteractionTracker = (): InteractionContextValue => {
  const context = useContext(InteractionTrackerContext);
  if (!context) {
    throw new Error('useInteractionTracker must be used within an InteractionTrackerProvider');
  }
  return context;
}; 