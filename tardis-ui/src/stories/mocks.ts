// This file contains mock implementations of various hooks and services for Storybook

// Function to create a simple mock function
export const createMockFn = () => {
  const calls: any[][] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return fn.returnValue;
  };
  
  // @ts-ignore - Adding properties to function
  fn.calls = calls;
  // @ts-ignore
  fn.returnValue = undefined;
  
  // @ts-ignore
  fn.mockReturnValue = (value: any) => {
    // @ts-ignore
    fn.returnValue = value;
    return fn;
  };
  
  // @ts-ignore
  fn.mockResolvedValue = (value: any) => {
    // @ts-ignore
    fn.returnValue = Promise.resolve(value);
    return fn;
  };
  
  return fn;
};

// Mock implementation for useInteractionTracker
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
  // Mock tracking functions with call recording
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