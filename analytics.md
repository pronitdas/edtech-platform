# Frontend Analytics Migration & Refinement

This document outlines the tasks required to complete the migration from the legacy `interaction-tracking.ts` service to the `InteractionTrackerContext` and ensure consistent analytics tracking.

## Background

The application is transitioning to a new context-based system (`InteractionTrackerContext`) for handling user interaction tracking. This system sends raw events to the backend (`analyticsService.trackEvent`). These events should be stored in the `user_interactions` table. Aggregation and calculation of learning analytics summaries (like engagement score, understanding level) are handled by backend RPC functions (`calculate_course_completion`, `calculate_engagement_score`), likely storing results in `learning_analytics` or `user_progress` tables.

**Key Issue Identified:** The `user_interactions` table has a foreign key constraint to the `user_sessions` table. Events cannot be saved without a valid `session_id` referencing an existing record in `user_sessions`. The current implementation generates a session ID locally in the frontend context but doesn't create the corresponding database record.

Migration from the old `interactionTracker` is complete, but data persistence was blocked by the missing session creation. This has now been fixed in Chunk 1.

## Implementation Progress

The implementation is divided into five logical chunks to facilitate systematic development and testing. Each chunk contains specific tasks and clear definitions of done.

### ✅ Chunk 1: Session Management Implementation (Frontend) - COMPLETED

**Objective:** Implement session creation and management in the frontend to ensure all tracked interactions are properly associated with valid database sessions.

**Implementation Details:**

1. ✅ **Updated `startUserSession` method in `analyticsService.ts`**:
   - Modified the method to use the `start_user_session` RPC function
   - Added robust error handling and improved logging
   - Ensured proper handling of the returned session ID

2. ✅ **Implemented `endUserSession` method in `analyticsService.ts`**:
   - Added method to properly end sessions using the `end_user_session` RPC
   - Included error handling and return value processing
   - Ensured proper logging for debugging purposes

3. ✅ **Updated `InteractionTrackerContext.tsx` session initialization**:
   - Confirmed that the `useEffect` hook properly initializes sessions
   - Session is initialized whenever the userId changes
   - Tracking is only enabled after successful session creation
   - Session ID from the database is stored in the context

4. ✅ **Added session termination logic**:
   - Created a separate cleanup effect to handle session termination
   - Sessions are properly ended when the component unmounts
   - Error handling is included for session termination

5. ✅ **Created test utilities**:
   - Implemented `analyticsTestHelpers` with functions to:
     - Verify user session existence
     - Check event association with sessions
     - Test the full session and event creation flow

6. ✅ **Added documentation**:
   - Created `analytics-tracking.md` documenting:
     - Session lifecycle (creation, usage, termination)
     - Key components and their roles
     - Testing and troubleshooting procedures

**Result:** The core issue preventing event persistence has been resolved. Events are now properly associated with database-generated session IDs, allowing them to be successfully saved in the `user_interactions` table due to the foreign key constraint being satisfied.

**Validation:** Manual testing confirms that:
- Sessions are successfully created in the database when a user logs in
- Events are correctly associated with session IDs
- Sessions are properly terminated when the component unmounts
- No console errors occur during normal session management operations

### Chunk 2: Event Data Standardization

**Objective:** Define and implement standardized schemas for all event types to ensure consistency in analytics data collection and facilitate future analysis.

**Tasks:**

1. **Create documentation for event data schemas:**
   - Define a master list of all tracked event types
   - Create JSON schema definitions for each event type's `event_data` object
   - Document required fields and their data types for each event

2. **Implement standardized video event tracking:**
   - Update `trackVideoPlay` method to include: `{ knowledgeId, moduleId, currentTime, totalDuration, progressPercent }`
   - Update `trackVideoPause` method with the same schema plus pause context
   - Update `trackVideoComplete` with completion metrics
   - Add `trackVideoProgress` for periodic updates if not already present

3. **Implement standardized quiz event tracking:**
   - Update `trackQuizStart` to include: `{ knowledgeId, moduleId, quizId }`
   - Update `trackQuizSubmit` to include: `{ knowledgeId, moduleId, quizId, attemptId, score, maxScore, durationSeconds }`
   - Update `trackQuizQuestionAnswer` with: `{ knowledgeId, moduleId, quizId, attemptId, questionId, isCorrect, timeTaken }`

4. **Implement other standardized event tracking:**
   - Update `trackContentView` to include: `{ knowledgeId, moduleId, contentType }`
   - Add `trackMindMapInteraction` for mindmap-specific events
   - Add `trackNavigation` for user navigation events
   - Ensure all methods include required fields consistently

**Definition of Done:**
- Documentation for all event types and their schemas is complete
- All tracking methods in `InteractionTrackerContext` use the standardized schemas
- The schema implementation allows for future analytics needs
- Events contain all necessary context (especially knowledgeId) for aggregation
- Sample events verified in database have complete, well-structured event_data

### Chunk 3: Basic Analytics Queries Integration

**Objective:** Deploy and integrate the basic analytics query functions with the frontend services to enable fundamental user activity reporting.

**Tasks:**

1. **Deploy the SQL functions to the database:**
   - Execute the SQL scripts for user session statistics
   - Deploy the user interaction summary function
   - Deploy the numeric event data summarization function
   - Verify function execution permissions in the production environment

2. **Create analytics service methods in the frontend:**
   - Add `getUserSessionStats(userId)` method to `analyticsService.ts`
   - Add `getUserInteractionSummary(userId, contentId?)` method
   - Add `summarizeNumericEventData(userId, eventType, jsonKey)` method
   - Implement error handling and data transformation for all methods

3. **Create a basic analytics hook for components:**
   - Implement a `useUserAnalytics` hook that leverages the analytics service
   - Add methods to fetch session and interaction statistics
   - Include loading state and error handling
   - Cache results appropriately to minimize API calls

4. **Implement basic analytics test utilities:**
   - Create helpers for generating test events
   - Add methods to verify event persistence
   - Include tools for validating event_data structure

**Definition of Done:**
- All SQL functions are deployed and operational
- Frontend service methods successfully call and retrieve data from these functions
- The `useUserAnalytics` hook correctly exposes the data to components
- Basic analytics can be retrieved by user ID and optionally filtered by content
- Test utilities confirm proper data flow and structure

### Chunk 4: Knowledge-Level Analytics Integration

**Objective:** Implement and integrate advanced analytics functions that provide insights at the knowledge/course level, enabling deeper analysis of user learning patterns.

**Tasks:**

1. **Deploy knowledge-specific SQL functions:**
   - Execute SQL scripts for `get_knowledge_interaction_summary`
   - Deploy `get_knowledge_video_stats` function
   - Deploy `get_knowledge_quiz_stats` function
   - Test these functions with sample user and knowledge IDs

2. **Extend the analytics service with knowledge-specific methods:**
   - Add `getKnowledgeInteractionSummary(userId, knowledgeId)` method
   - Add `getKnowledgeVideoStats(userId, knowledgeId)` method
   - Add `getKnowledgeQuizStats(userId, knowledgeId)` method
   - Implement proper error handling and response processing

3. **Create a knowledge analytics hook for components:**
   - Implement a `useKnowledgeAnalytics(userId, knowledgeId)` hook
   - Add methods to retrieve all knowledge-specific analytics
   - Include loading states and error handling
   - Cache results appropriately to minimize API calls

4. **Implement analytics data transformation utilities:**
   - Create helpers for formatting analytics for display
   - Add methods for calculating derived metrics
   - Implement utilities for generating charts/visualizations from analytics data

**Definition of Done:**
- All knowledge-level SQL functions are deployed and operational
- Frontend service methods successfully retrieve knowledge-specific analytics
- The `useKnowledgeAnalytics` hook correctly exposes the data to components
- Knowledge-level analytics can be retrieved and filtered by user ID and knowledge ID
- Data transformation utilities correctly prepare analytics for display

### Chunk 5: Learning Analytics Dashboard

**Objective:** Create a comprehensive learning analytics dashboard that visualizes user engagement, understanding, and progress, providing actionable insights for both users and educators.

**Tasks:**

1. **Deploy learning analytics calculation functions:**
   - Execute SQL scripts for `calculate_engagement_score`
   - Deploy `calculate_understanding_level` function
   - Deploy `generate_learning_analytics` function
   - Test these functions with sample user and knowledge IDs

2. **Implement the LearningAnalytics service layer:**
   - Create a dedicated `learningAnalyticsService.ts` file
   - Add `generateLearningAnalytics(userId, knowledgeId)` method
   - Add `getLearningAnalytics(userId, knowledgeId)` method to retrieve existing records
   - Implement caching strategy to avoid redundant calculations

3. **Create UI components for the analytics dashboard:**
   - Implement `EngagementScoreCard` component with visualization
   - Create `UnderstandingLevelDisplay` component
   - Implement `StrengthsWeaknessesPanel` to show identified areas
   - Add `RecommendationsSection` to display personalized suggestions
   - Build `InteractionHistoryChart` to show activity over time

4. **Assemble the complete LearningReport component:**
   - Create a container component that organizes all analytics visualizations
   - Implement filtering by date range and knowledge/course
   - Add print/export functionality for reports
   - Ensure responsive design for different screen sizes

5. **Integrate the dashboard with the application:**
   - Add the dashboard to appropriate routes/pages
   - Implement access controls based on user roles
   - Add analytics refresh/recalculation controls
   - Create documentation for interpreting the analytics

**Definition of Done:**
- Learning analytics calculation functions work correctly in the database
- Frontend service layer successfully generates and retrieves analytics
- All dashboard UI components render correctly with real data
- The complete dashboard accurately displays user learning patterns
- Analytics update appropriately when new interaction data is collected
- The dashboard is accessible only to authorized users
- Documentation helps users interpret their analytics data

## Integration Testing

After implementing each chunk, comprehensive integration testing should be performed to verify:

1. **Session Management:** ✅ Confirmed sessions are created and stored properly
2. **Event Tracking:** ✅ Verified events are correctly associated with sessions and contain proper data
3. **Analytics Queries:** Test that all SQL functions return expected results
4. **Dashboard Rendering:** Ensure analytics data is correctly displayed in the UI

## Rollout Strategy

1. ✅ Deploy database functions (RPC functions for session management are deployed)
2. ✅ Implement and test the frontend session management (Completed in Chunk 1)
3. Update event tracking with standardized schemas (Next: Chunk 2)
4. Integrate basic analytics queries
5. Add knowledge-level analytics
6. Roll out the learning analytics dashboard

This phased approach ensures that core functionality (event persistence) is addressed first, with more advanced features added subsequently.