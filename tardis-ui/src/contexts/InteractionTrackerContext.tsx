import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { AnalyticsService } from '@/services/analytics-service'
import { DynamicApiClient } from '@/services/dynamic-api-client'
import {
  VideoPlayEvent,
  VideoPauseEvent,
  VideoCompleteEvent,
  VideoProgressEvent,
  QuizStartEvent,
  QuizQuestionAnswerEvent,
  QuizSubmitEvent,
  ContentViewEvent,
  NavigationEvent,
  MindMapInteractionEvent,
} from '../types/analytics'

// Interface definitions
interface InteractionEvent {
  id: string
  type: string
  contentId?: string | undefined
  timestamp: number
  metadata: Record<string, any>
  persisted: boolean
}

// Roleplay event schemas
interface RoleplayStartEvent {
  knowledgeId: string
  moduleId: string
  scenarioId: string
  scenarioTitle: string
  difficulty: string
  estimatedDuration: number
  studentProfiles: Array<{
    name: string
    personality: string
  }>
}

interface RoleplayResponseEvent {
  knowledgeId: string
  moduleId: string
  scenarioId: string
  step: number
  studentName: string
  studentPersonality: string
  question: string
  response: string
  responseTime: number
  feedbackProvided?: string
}

interface RoleplayCompleteEvent {
  knowledgeId: string
  moduleId: string
  scenarioId: string
  totalSteps: number
  completedSteps: number
  totalScore: number
  maxPossibleScore: number
  durationSeconds: number
  evaluations: Array<{
    criteriaId: string
    criteriaName: string
    score: number
    maxScore: number
    feedback: string
  }>
}

// Topic generation tracking events
interface TopicGenerationStartEvent {
  topic: string
  subject_area: string
  difficulty_level: string
  target_audience: string
  content_depth: string
  learning_objectives: string[]
  user_id: string
}

interface TopicGenerationCompleteEvent {
  knowledge_id: string
  topic: string
  generation_time: number
  chapters_count: number
  external_sources_count: number
  status: 'completed' | 'error'
}

interface TopicContentViewEvent {
  knowledge_id: string
  content_type: 'chapter' | 'mindmap' | 'notes' | 'summary' | 'quiz'
  chapter_id?: string
  section: string
  time_spent: number
}

// New state structure as proposed in the epic
interface InteractionContextState {
  session: {
    id: string | null
    isActive: boolean
    metadata: Record<string, unknown>
  }
  events: {
    pending: InteractionEvent[]
    processing: InteractionEvent[]
    failed: InteractionEvent[]
  }
  config: {
    isTrackingEnabled: boolean
    batchSize: number
    flushInterval: number
  }
}

// Context value interface
interface InteractionContextValue
  extends Omit<InteractionContextState, 'events'> {
  trackEvent: (data: Record<string, any>) => void
  trackVideoPlay: (contentId: number, data: VideoPlayEvent) => void
  trackVideoPause: (contentId: number, data: VideoPauseEvent) => void
  trackVideoComplete: (contentId: number, data: VideoCompleteEvent) => void
  trackVideoProgress: (contentId: number, data: VideoProgressEvent) => void
  trackQuizStart: (quizId: number, data: QuizStartEvent) => void
  trackQuizAnswer: (
    quizId: number,
    questionId: string,
    data: QuizQuestionAnswerEvent
  ) => void
  trackQuizComplete: (quizId: number, data: QuizSubmitEvent) => void
  trackContentView: (contentId: string, data: ContentViewEvent) => void
  trackNavigation: (data: NavigationEvent) => void
  trackMindMapInteraction: (
    mapId: string,
    data: MindMapInteractionEvent
  ) => void
  trackRoleplayStart: (data: RoleplayStartEvent) => void
  trackRoleplayResponse: (data: RoleplayResponseEvent) => void
  trackRoleplayComplete: (data: RoleplayCompleteEvent) => void
  trackTopicGenerationStart: (data: TopicGenerationStartEvent) => void
  trackTopicGenerationComplete: (data: TopicGenerationCompleteEvent) => void
  trackTopicContentView: (data: TopicContentViewEvent) => void
  pendingEventsCount: number
  totalEventsCount: number
  flushEvents: () => Promise<void>
}

// Action types for the reducer
type ActionType =
  | {
    type: 'ADD_EVENT'
    payload: {
      eventType: string
      contentId?: string | undefined
      metadata?: Record<string, unknown>
    }
  }
  | { type: 'SET_EVENTS_PROCESSING'; payload: { events: InteractionEvent[] } }
  | { type: 'SET_EVENTS_PERSISTED'; payload: { processedIds: string[] } }
  | { type: 'SET_EVENTS_FAILED'; payload: { events: InteractionEvent[] } }
  | {
    type: 'SET_SESSION'
    payload: { sessionId: string | null; metadata?: Record<string, any> }
  }
  | { type: 'SET_TRACKING_ENABLED'; payload: boolean }
  | {
    type: 'UPDATE_CONFIG'
    payload: Partial<InteractionContextState['config']>
  }

// Create context
const InteractionTrackerContext = createContext<
  InteractionContextValue | undefined
>(undefined)

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
}

// Generate a unique ID
const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

// Reducer function
const interactionReducer = (
  state: InteractionContextState,
  action: ActionType
): InteractionContextState => {
  switch (action.type) {
    case 'ADD_EVENT': {
      if (!state.session.isActive || !state.config.isTrackingEnabled) {
        return state
      }

      const newEvent: InteractionEvent = {
        id: generateId(),
        type: action.payload.eventType,
        contentId: action.payload.contentId || undefined,
        timestamp: Date.now(),
        metadata: action.payload.metadata || {},
        persisted: false,
      }

      console.log(
        `[InteractionTracker] Adding event: ${action.payload.eventType}`,
        newEvent
      )

      return {
        ...state,
        events: {
          ...state.events,
          pending: [...state.events.pending, newEvent],
        },
      }
    }

    case 'SET_EVENTS_PROCESSING': {
      const { processing, failed } = state.events
      const eventsToProcess = action.payload.events
      const processedEventIds = new Set(eventsToProcess.map(e => e.id))

      console.log(
        `[InteractionTracker Reducer] Moving ${eventsToProcess.length} events to processing.`
      )

      return {
        ...state,
        events: {
          // Remove the specific events being processed from pending
          pending: state.events.pending.filter(
            e => !processedEventIds.has(e.id)
          ),
          // Add the newly processing events
          processing: [...processing, ...eventsToProcess],
          failed,
        },
      }
    }

    case 'SET_EVENTS_PERSISTED': {
      const processedIds = new Set(action.payload.processedIds)
      console.log(
        `[InteractionTracker Reducer] Marking ${processedIds.size} events as persisted.`
      )
      return {
        ...state,
        events: {
          ...state.events,
          // Remove persisted events from processing state
          processing: state.events.processing.filter(
            e => !processedIds.has(e.id)
          ),
        },
      }
    }

    case 'SET_EVENTS_FAILED': {
      const failedEvents = action.payload.events
      const failedEventIds = new Set(failedEvents.map(e => e.id))
      console.warn(
        `[InteractionTracker Reducer] Marking ${failedEvents.length} events as failed.`
      )
      return {
        ...state,
        events: {
          ...state.events,
          // Remove failed events from processing state
          processing: state.events.processing.filter(
            e => !failedEventIds.has(e.id)
          ),
          // Add failed events to the failed state
          failed: [...state.events.failed, ...failedEvents],
        },
      }
    }

    case 'SET_SESSION': {
      return {
        ...state,
        session: {
          id: action.payload.sessionId,
          isActive: action.payload.sessionId !== null,
          metadata: action.payload.metadata || state.session.metadata,
        },
      }
    }

    case 'SET_TRACKING_ENABLED': {
      return {
        ...state,
        config: {
          ...state.config,
          isTrackingEnabled: action.payload,
        },
      }
    }

    case 'UPDATE_CONFIG': {
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      }
    }

    default:
      return state
  }
}

// Provider component
interface InteractionTrackerProviderProps {
  children: ReactNode
  dataService: AnalyticsService
  apiClient?: DynamicApiClient | null
  userId: string
  batchSize?: number
  flushInterval?: number
}

export const InteractionTrackerProvider: React.FC<
  InteractionTrackerProviderProps
> = ({
  children,
  dataService,
  apiClient,
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
    })

    // Initialize session when userId changes
    useEffect(() => {
      let isMounted = true // Flag to prevent state updates on unmounted component

      const initializeSession = async () => {
        if (userId) {
          console.log(
            `[InteractionTracker] Attempting to start session for userId: ${userId}`
          )
          
          // Check if dataService has startUserSession method
          if (dataService.startUserSession) {
            dispatch({ type: 'SET_TRACKING_ENABLED', payload: false }) // Disable tracking until session is ready
            dispatch({ type: 'SET_SESSION', payload: { sessionId: null } }) // Clear old session ID

            try {
              const sessionResult = await dataService.startUserSession(userId)

              if (isMounted && sessionResult && sessionResult.id) {
                console.log(
                  `[InteractionTracker] Session started successfully. Session ID: ${sessionResult.id}`
                )
                // Store the DB-generated session ID and enable tracking
                dispatch({
                  type: 'SET_SESSION',
                  payload: {
                    sessionId: sessionResult.id,
                    metadata: {
                      userId,
                      startedAt: new Date().toISOString(),
                    },
                  },
                })
                dispatch({ type: 'SET_TRACKING_ENABLED', payload: true })
              } else if (isMounted) {
                console.warn(
                  '[InteractionTracker] Failed to start session or get session ID from service.'
                )
                // Use a fallback session ID and enable tracking anyway
                const fallbackSessionId = `session_${userId}_${Date.now()}`
                dispatch({
                  type: 'SET_SESSION',
                  payload: {
                    sessionId: fallbackSessionId,
                    metadata: {
                      userId,
                      startedAt: new Date().toISOString(),
                      fallback: true
                    },
                  },
                })
                dispatch({ type: 'SET_TRACKING_ENABLED', payload: true })
              }
            } catch (error) {
              console.warn(
                '[InteractionTracker] Error during session initialization, using fallback:',
                error
              )
              if (isMounted) {
                // Use a fallback session ID and enable tracking
                const fallbackSessionId = `session_${userId}_${Date.now()}`
                dispatch({
                  type: 'SET_SESSION',
                  payload: {
                    sessionId: fallbackSessionId,
                    metadata: {
                      userId,
                      startedAt: new Date().toISOString(),
                      fallback: true
                    },
                  },
                })
                dispatch({ type: 'SET_TRACKING_ENABLED', payload: true })
              }
            }
          } else {
            // No startUserSession method, create a simple session and enable tracking
            console.log(
              '[InteractionTracker] No startUserSession method, creating simple session.'
            )
            const simpleSessionId = `session_${userId}_${Date.now()}`
            dispatch({
              type: 'SET_SESSION',
              payload: {
                sessionId: simpleSessionId,
                metadata: {
                  userId,
                  startedAt: new Date().toISOString(),
                  simple: true
                },
              },
            })
            dispatch({ type: 'SET_TRACKING_ENABLED', payload: true })
          }
        } else {
          // No userId, disable tracking
          console.log(
            '[InteractionTracker] No userId provided, disabling tracking.'
          )
          dispatch({ type: 'SET_SESSION', payload: { sessionId: null } })
          dispatch({ type: 'SET_TRACKING_ENABLED', payload: false })
        }
      }

      initializeSession()

      return () => {
        isMounted = false // Cleanup function to set flag on unmount
      }
    }, [userId, dataService])

    // Create a separate useEffect for handling session termination
    useEffect(() => {
      return () => {
        // End the session when the component unmounts if it's active
        if (state.session.id && dataService.endUserSession) {
          console.log(`[InteractionTracker] Ending session: ${state.session.id}`)
          dataService.endUserSession(state.session.id).catch((error: unknown) => {
            console.error('[InteractionTracker] Error ending session:', error)
          })
        }
      }
    }, [state.session.id, dataService])

    // Set up interval for flushing events
    useEffect(() => {
      if (state.config.isTrackingEnabled && state.session.isActive) {
        const interval = setInterval(() => {
          if (state.events.pending.length > 0) {
            flushEvents()
          }
        }, state.config.flushInterval)

        return () => clearInterval(interval)
      }
      // Return undefined for the else case
      return undefined
    }, [
      state.config.isTrackingEnabled,
      state.session.isActive,
      state.config.flushInterval,
      state.events.pending.length,
    ])

    // Flush events to persistence
    const flushEvents = useCallback(async () => {
      // Capture pending events *before* any state changes
      const eventsToProcess = [...state.events.pending]

      // Exit if there's nothing to process in the captured array
      if (eventsToProcess.length === 0) return

      console.log(
        `[InteractionTracker] Flushing ${eventsToProcess.length} pending events...`
      )

      // Dispatch action to move these specific events from pending to processing state
      dispatch({
        type: 'SET_EVENTS_PROCESSING',
        payload: { events: eventsToProcess },
      })

      try {
        // Use dynamic API client if available, otherwise fall back to analytics service
        if (apiClient) {
          // Send events using dynamic API client analytics endpoints
          const eventsToSend = eventsToProcess.map(event => ({
            user_id: userId,
            event_type: event.type,
            content_id: event.contentId || null,
            timestamp: event.timestamp,
            session_id: state.session.id,
            metadata: event.metadata,
          }))

          console.log(
            '[InteractionTracker] Events mapped for API client:',
            eventsToSend
          )

          // Use analytics endpoints from the dynamic client
          await Promise.all(
            eventsToSend.map(eventData => {
              // You might need to create a specific analytics endpoint or use a general one
              // For now, we'll use a hypothetical analytics tracking endpoint
              return (apiClient as any).trackAnalyticsEvent?.(eventData) ||
                     Promise.resolve() // Fallback if endpoint doesn't exist
            })
          )
        } else {
          // Fallback to original analytics service
          const eventsToSend = eventsToProcess.map(event => ({
            userId,
            event_type: event.type,
            contentId: event.contentId || null,
            timestamp: event.timestamp,
            sessionId: state.session.id,
            ...event.metadata,
          }))

          console.log(
            '[InteractionTracker] Events mapped for analytics service:',
            eventsToSend
          )

          await Promise.all(
            eventsToSend.map(eventData => dataService.trackEvent(eventData))
          )
        }


        console.log(
          `[InteractionTracker] Successfully persisted ${eventsToProcess.length} events.`
        )
        // Mark these specific events as persisted by sending their IDs
        dispatch({
          type: 'SET_EVENTS_PERSISTED',
          payload: { processedIds: eventsToProcess.map(e => e.id) },
        })
      } catch (error) {
        console.error('Failed to persist events:', error)
        // Mark these specific events (from the captured array) as failed
        dispatch({
          type: 'SET_EVENTS_FAILED',
          payload: { events: eventsToProcess },
        })
      }
      // Ensure dispatch is included in dependencies if reducer relies on external scope
    }, [dataService, state.events.pending, userId, dispatch])

    // Track an event (internal function)
    const trackEventInternal = useCallback(
      (
        eventType: string,
        contentId?: number,
        metadata: Record<string, unknown> = {}
      ) => {
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
        })
      },
      [userId]
    )

    // Generic trackEvent function for public use
    const trackEvent = useCallback(
      (data: Record<string, any>) => {
        const { eventType, contentId, knowledgeId, moduleId, contentType, timestamp, ...metadata } = data
        
        trackEventInternal(
          eventType,
          contentId ? parseInt(contentId, 10) : undefined,
          {
            knowledgeId,
            moduleId,
            contentType,
            timestamp: timestamp || Date.now(),
            ...metadata,
          }
        )
      },
      [trackEventInternal]
    )

    // Specialized tracking methods (memoized)
    const trackVideoPlay = useCallback(
      (contentId: number, data: VideoPlayEvent) => {
        // Ensure required fields are present
        if (!data.knowledgeId || !data.moduleId) {
          console.warn(
            'Missing required fields in trackVideoPlay event data. Required: knowledgeId, moduleId'
          )
        }

        trackEventInternal('video_play', contentId, {
          ...data,
          timestamp: data.timestamp || Date.now(),
        })
      },
      [trackEventInternal]
    )

    const trackVideoPause = useCallback(
      (contentId: number, data: VideoPauseEvent) => {
        // Ensure required fields are present
        if (!data.knowledgeId || !data.moduleId) {
          console.warn(
            'Missing required fields in trackVideoPause event data. Required: knowledgeId, moduleId'
          )
        }

        trackEventInternal('video_pause', contentId, {
          ...data,
          timestamp: data.timestamp || Date.now(),
        })
      },
      [trackEventInternal]
    )

    const trackVideoComplete = useCallback(
      (contentId: number, data: VideoCompleteEvent) => {
        // Ensure required fields are present
        if (!data.knowledgeId || !data.moduleId) {
          console.warn(
            'Missing required fields in trackVideoComplete event data. Required: knowledgeId, moduleId'
          )
        }

        trackEventInternal('video_complete', contentId, {
          ...data,
          timestamp: data.timestamp || Date.now(),
        })
      },
      [trackEventInternal]
    )

    const trackVideoProgress = useCallback(
      (contentId: number, data: VideoProgressEvent) => {
        // Ensure required fields are present
        if (!data.knowledgeId || !data.moduleId) {
          console.warn(
            'Missing required fields in trackVideoProgress event data. Required: knowledgeId, moduleId'
          )
        }

        trackEventInternal('video_progress', contentId, {
          ...data,
          timestamp: data.timestamp || Date.now(),
        })
      },
      [trackEventInternal]
    )

    const trackQuizStart = useCallback(
      (quizId: number, data: QuizStartEvent) =>
        trackEventInternal('quiz_start', quizId, data),
      [trackEventInternal]
    )

    const trackQuizAnswer = useCallback(
      (quizId: number, questionId: string, data: QuizQuestionAnswerEvent) =>
        trackEventInternal('quiz_answer', quizId, { ...data, questionId }),
      [trackEventInternal]
    )

    const trackQuizComplete = useCallback(
      (quizId: number, data: QuizSubmitEvent) =>
        trackEventInternal('quiz_complete', quizId, data),
      [trackEventInternal]
    )

    const trackContentView = useCallback(
      (contentId: string, data: ContentViewEvent) =>
        trackEventInternal('content_view', parseInt(contentId, 10) || 0, data),
      [trackEventInternal]
    )

    // Specialized roleplay tracking methods
    const trackRoleplayStart = useCallback(
      (data: RoleplayStartEvent) => {
        const { knowledgeId, moduleId, scenarioId, ...restData } = data
        trackEventInternal('roleplay_start', parseInt(scenarioId, 10) || 0, {
          knowledgeId,
          moduleId,
          scenarioId,
          ...restData,
          interactionType: 'scenario_selection',
        })
      },
      [trackEventInternal]
    )

    const trackRoleplayResponse = useCallback(
      (data: RoleplayResponseEvent) => {
        const { knowledgeId, moduleId, scenarioId, ...restData } = data
        trackEventInternal('roleplay_response', parseInt(scenarioId, 10) || 0, {
          knowledgeId,
          moduleId,
          scenarioId,
          ...restData,
          interactionType: 'teacher_response',
        })
      },
      [trackEventInternal]
    )

    const trackRoleplayComplete = useCallback(
      (data: RoleplayCompleteEvent) => {
        const { knowledgeId, moduleId, scenarioId, ...restData } = data
        trackEventInternal('roleplay_complete', parseInt(scenarioId, 10) || 0, {
          knowledgeId,
          moduleId,
          scenarioId,
          ...restData,
          interactionType: 'completion',
        })
      },
      [trackEventInternal]
    )

    // Add new navigation tracking method
    const trackNavigation = useCallback(
      (data: NavigationEvent) => {
        // Ensure required fields are present
        if (!data.knowledgeId || !data.moduleId) {
          console.warn(
            'Missing required fields in trackNavigation event data. Required: knowledgeId, moduleId'
          )
        }

        trackEventInternal('navigation', 0, {
          ...data,
          timestamp: data.timestamp || Date.now(),
        })
      },
      [trackEventInternal]
    )

    // Add new mindmap interaction tracking method
    const trackMindMapInteraction = useCallback(
      (mapId: string, data: MindMapInteractionEvent) => {
        // Ensure required fields are present
        if (!data.knowledgeId || !data.moduleId) {
          console.warn(
            'Missing required fields in trackMindMapInteraction event data. Required: knowledgeId, moduleId'
          )
        }

        trackEventInternal('mindmap_interaction', parseInt(mapId, 10) || 0, {
          ...data,
          timestamp: data.timestamp || Date.now(),
        })
      },
      [trackEventInternal]
    )

    // Topic generation tracking methods
    const trackTopicGenerationStart = useCallback(
      (data: TopicGenerationStartEvent) => {
        trackEventInternal('topic_generation_start', 0, {
          ...data,
          timestamp: Date.now(),
        })
      },
      [trackEventInternal]
    )

    const trackTopicGenerationComplete = useCallback(
      (data: TopicGenerationCompleteEvent) => {
        trackEventInternal('topic_generation_complete', parseInt(data.knowledge_id, 10) || 0, {
          ...data,
          timestamp: Date.now(),
        })
      },
      [trackEventInternal]
    )

    const trackTopicContentView = useCallback(
      (data: TopicContentViewEvent) => {
        trackEventInternal('topic_content_view', parseInt(data.knowledge_id, 10) || 0, {
          ...data,
          timestamp: Date.now(),
        })
      },
      [trackEventInternal]
    )

    // Memoized counts
    const pendingEventsCount = useMemo(
      () => state.events.pending.length,
      [state.events.pending.length]
    )

    const totalEventsCount = useMemo(
      () =>
        state.events.pending.length +
        state.events.processing.length +
        state.events.failed.length,
      [
        state.events.pending.length,
        state.events.processing.length,
        state.events.failed.length,
      ]
    )

    // Memoized context value
    const contextValue = useMemo(
      () => ({
        session: state.session,
        config: state.config,
        trackEvent,
        trackVideoPlay,
        trackVideoPause,
        trackVideoComplete,
        trackVideoProgress,
        trackQuizStart,
        trackQuizAnswer,
        trackQuizComplete,
        trackContentView,
        trackNavigation,
        trackMindMapInteraction,
        trackRoleplayStart,
        trackRoleplayResponse,
        trackRoleplayComplete,
        trackTopicGenerationStart,
        trackTopicGenerationComplete,
        trackTopicContentView,
        pendingEventsCount,
        totalEventsCount,
        flushEvents,
      }),
      [
        state.session,
        state.config,
        trackEvent,
        trackVideoPlay,
        trackVideoPause,
        trackVideoComplete,
        trackVideoProgress,
        trackQuizStart,
        trackQuizAnswer,
        trackQuizComplete,
        trackContentView,
        trackNavigation,
        trackMindMapInteraction,
        trackRoleplayStart,
        trackRoleplayResponse,
        trackRoleplayComplete,
        trackTopicGenerationStart,
        trackTopicGenerationComplete,
        trackTopicContentView,
        pendingEventsCount,
        totalEventsCount,
        flushEvents,
      ]
    )

    return (
      <InteractionTrackerContext.Provider value={contextValue}>
        {children}
      </InteractionTrackerContext.Provider>
    )
  }

// Custom hook with proper error handling
export const useInteractionTracker = (): InteractionContextValue => {
  const context = useContext(InteractionTrackerContext)
  if (!context) {
    throw new Error(
      'useInteractionTracker must be used within an InteractionTrackerProvider'
    )
  }
  return context
}
