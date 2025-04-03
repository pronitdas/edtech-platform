### Analytics Integration
```typescript
// Example usage of the existing analytics service
import { analyticsService } from '../services/analytics-service';

// Start a session when the roleplay begins
const startRoleplaySession = async (userId: string, scenarioId: string, scenarioTitle: string) => {
  const session = await analyticsService.startUserSession(userId);
  
  if (session) {
    // Track initial scenario selection
    await analyticsService.trackEvent({
      userId,
      eventType: 'roleplay_start',
      contentId: scenarioId,
      timestamp: Date.now(),
      sessionId: session.id,
      scenarioTitle,
      interactionType: 'scenario_selection'
    });
    
    return session.id;
  }
  
  return null;
};

// Track events during roleplay
const trackTeacherResponse = async (
  userId: string, 
  sessionId: string,
  scenarioId: string,
  studentName: string,
  studentPersonality: string,
  question: string,
  response: string,
  step: number
) => {
  await analyticsService.trackEvent({
    userId,
    eventType: 'roleplay_response',
    contentId: scenarioId,
    timestamp: Date.now(),
    sessionId,
    step,
    studentName,
    studentPersonality,
    question,
    response,
    interactionType: 'teacher_response'
  });
};

// End session and track final results
const endRoleplaySession = async (
  userId: string,
  sessionId: string,
  scenarioId: string,
  totalScore: number,
  evaluations: any[]
) => {
  await analyticsService.trackEvent({
    userId,
    eventType: 'roleplay_complete',
    contentId: scenarioId,
    timestamp: Date.now(),
    sessionId,
    totalScore,
    evaluations,
    interactionType: 'completion'
  });
  
  await analyticsService.endUserSession(sessionId);
};
```

## Roleplay Analytics: Standardization Plan

Based on the analytics migration progress in Chunk 2 of the analytics.md document, we need to standardize the roleplay analytics events to ensure consistent data collection across the application.

### Current State
- We have basic roleplay tracking functions that create sessions and track events
- Events need standardization for consistency with other parts of the application
- Need to integrate with the InteractionTrackerContext for better management

### Tasks to Complete

#### 1. Standardize Roleplay Event Schemas
- [x] Define standard schemas for all roleplay event types:
  - `roleplay_start`: Track scenario selection and initialization
  - `roleplay_response`: Track teacher responses to scenarios
  - `roleplay_complete`: Track completion and evaluation results

#### 2. Schema Definitions

```typescript
// Roleplay Start Event Schema
interface RoleplayStartEvent {
  // Required fields for all events
  knowledgeId: string;  // Link to curriculum knowledge
  moduleId: string;     // Module containing this roleplay
  
  // Roleplay-specific fields
  scenarioId: string;
  scenarioTitle: string;
  difficulty: string;
  estimatedDuration: number;
  studentProfiles: Array<{
    name: string;
    personality: string;
  }>;
}

// Roleplay Response Event Schema
interface RoleplayResponseEvent {
  // Required fields for all events
  knowledgeId: string;
  moduleId: string;
  
  // Roleplay-specific fields
  scenarioId: string;
  step: number;
  studentName: string;
  studentPersonality: string;
  question: string;
  response: string;
  responseTime: number;  // Time taken to respond in ms
  feedbackProvided?: string;
}

// Roleplay Complete Event Schema
interface RoleplayCompleteEvent {
  // Required fields for all events
  knowledgeId: string;
  moduleId: string;
  
  // Roleplay-specific fields
  scenarioId: string;
  totalSteps: number;
  completedSteps: number;
  totalScore: number;
  maxPossibleScore: number;
  durationSeconds: number;
  evaluations: Array<{
    criteriaId: string;
    criteriaName: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
}
```

#### 3. Update Tracking Functions

- [x] Refactor `startRoleplaySession` to include required fields
- [x] Refactor `trackTeacherResponse` to include additional context
- [x] Refactor `endRoleplaySession` to include standardized completion data
- [x] Create specialized helper functions for consistency

#### 4. Integration with InteractionTrackerContext

- [x] Add specialized tracking methods to the InteractionTrackerContext:
  - `trackRoleplayStart(data: RoleplayStartEvent)`
  - `trackRoleplayResponse(data: RoleplayResponseEvent)`
  - `trackRoleplayComplete(data: RoleplayCompleteEvent)`

#### 5. Hook for Roleplay Analytics 

- [x] Create a `useRoleplayAnalytics` hook that leverages the tracker context

#### 6. Testing

- [x] Add tests to verify event structure
- [x] Add tests to verify session management specific to roleplay
- [x] Create test scenario for validating the full analytics flow

### Definition of Done

- [x] All roleplay events follow standardized schemas
- [x] Events contain all required fields for analysis
- [x] Integration with InteractionTrackerContext is complete
- [x] Specialized tracking methods and hooks are implemented
- [x] Tests for all functionality pass

## Implementation Summary

Implementation has been completed for all planned tasks:

1. **Standardized Event Schemas**: Created interfaces for `RoleplayStartEvent`, `RoleplayResponseEvent`, and `RoleplayCompleteEvent`.

2. **InteractionTrackerContext Integration**: Added new tracking methods to the context provider:
   - `trackRoleplayStart`
   - `trackRoleplayResponse`
   - `trackRoleplayComplete`

3. **Custom Hook**: Created `useRoleplayAnalytics` in `tardis-ui/src/hooks/useRoleplayAnalytics.ts` that provides:
   - Simple interface for tracking events
   - Helper functions like `createResponseTimer` for measuring response times
   - Knowledge/module context handling

4. **Testing**: Added `testRoleplayAnalytics` helper to `test-helpers.ts` for testing:
   - Session creation for roleplay
   - Event tracking
   - Event verification

5. **Documentation**: Created `roleplay-analytics.md` with:
   - Usage examples
   - Complete implementation example
   - Schema references

All components have been implemented in a way that maintains the standardized schemas while providing a simple and consistent API for developers.