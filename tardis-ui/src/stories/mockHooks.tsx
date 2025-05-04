import React, { createContext, useContext, ReactNode } from 'react';
import { createMockFn } from './mocks';

// Create a proper context
const InteractionTrackerContext = createContext<any>(null);

// This is a comprehensive mock for the useInteractionTracker hook
export const mockInteractionTracker = {
  session: {
    id: 'mock-session-id',
    isActive: true,
    metadata: {
      userId: 'mock-user-id',
      courseId: 'mock-course-id'
    }
  },
  config: {
    isTrackingEnabled: true,
    batchSize: 10,
    flushInterval: 30000
  },
  trackVideoPlay: createMockFn(),
  trackVideoPause: createMockFn(),
  trackVideoComplete: createMockFn(),
  trackVideoProgress: createMockFn(),
  trackQuizStart: createMockFn(),
  trackQuizAnswer: createMockFn(),
  trackQuizComplete: createMockFn(),
  trackContentView: createMockFn(),
  trackNavigation: createMockFn(),
  trackMindMapInteraction: createMockFn(),
  trackRoleplayStart: createMockFn(),
  trackRoleplayResponse: createMockFn(),
  trackRoleplayComplete: createMockFn(),
  pendingEventsCount: 0,
  totalEventsCount: 0,
  flushEvents: createMockFn().mockResolvedValue(undefined)
};

// Mock implementation of the useInteractionTracker hook
export const useInteractionTracker = () => mockInteractionTracker;

// A proper provider component that uses our mock data
export const InteractionTrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <InteractionTrackerContext.Provider value={mockInteractionTracker}>
      {children}
    </InteractionTrackerContext.Provider>
  );
}; 