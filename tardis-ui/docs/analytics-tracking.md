# Analytics Session Management

This document explains how the analytics session management system works in the application.

## Overview

The analytics system now uses a proper session management approach to ensure that all user interaction events are properly associated with a valid session. This is critical because the `user_interactions` table has a foreign key constraint to the `user_sessions` table, requiring a valid `session_id` for all tracked events.

## Session Lifecycle

1. **Session Creation**:
   - When a user logs in or starts using the application, the `InteractionTrackerContext` calls `analyticsService.startUserSession(userId)`.
   - This uses the database `start_user_session` RPC function to create a record in the `user_sessions` table.
   - The database-generated session ID is returned and stored in the context state.
   - Event tracking is only enabled after a successful session creation.

2. **During Session**:
   - All tracked events are associated with the active session ID.
   - Events are collected in memory and flushed periodically to the database.
   - The session ID is included in all events sent to the database.

3. **Session Termination**:
   - When the user logs out or the application is closed, the session is automatically ended.
   - The `InteractionTrackerContext` calls `analyticsService.endUserSession(sessionId)`.
   - This uses the database `end_user_session` RPC function to update the `ended_at` timestamp in the session record.
   - Any pending events are flushed before ending the session.

## Key Components

### 1. AnalyticsService

- `startUserSession(userId)`: Creates a new session record and returns the session ID.
- `endUserSession(sessionId)`: Updates the session record with an end timestamp.
- `trackEvent(data)`: Records a user interaction event associated with a session.

### 2. InteractionTrackerContext

- Manages the session lifecycle in the frontend.
- Initializes a session when a user logs in.
- Tracks events and associates them with the active session.
- Ends the session when the component unmounts.

### 3. Database RPC Functions

- `start_user_session`: Creates a record in the `user_sessions` table.
- `end_user_session`: Updates a session record with an end timestamp.
- `track_user_interaction`: Records a single interaction event.
- `batch_track_user_interactions`: Records multiple interaction events.

## Testing Session Management

The `analyticsTestHelpers` utility provides methods to verify that sessions and events are properly created and associated:

```typescript
// Verify if a user has an active session
await analyticsTestHelpers.verifyUserSession(userId);

// Check if events are associated with a session
await analyticsTestHelpers.verifySessionEvents(sessionId);

// Run a test of the complete flow
const result = await analyticsTestHelpers.testSessionAndEventCreation(userId);
console.log(`Session creation successful: ${result.success}`);
console.log(`Session ID: ${result.sessionId}`);
console.log(`Event count: ${result.eventCount}`);
```

## Troubleshooting

If events are not being persisted in the database, check:

1. Is a valid session being created? Check the console logs for `[InteractionTracker] Session started successfully`.
2. Is the session ID being properly passed to the events? Check the `flushEvents` function.
3. Are there any errors during event tracking? Check the console logs for error messages.
4. Is the database connection working? Test the RPC functions directly via the Supabase client.

If sessions are not being properly ended, check:

1. Is the cleanup logic in the `useEffect` return function being called?
2. Is the `endUserSession` method working correctly? Test it directly via the Supabase client. 