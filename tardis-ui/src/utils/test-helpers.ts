import { analyticsService } from '@/services/analytics-service';
import supabase from '@/services/supabase';

/**
 * Test helpers for analytics session management and event tracking
 */
export const analyticsTestHelpers = {
  /**
   * Verify if a session exists for a user
   */
  async verifyUserSession(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .is('ended_at', null) // Only active sessions
        .order('started_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error verifying user session:', error);
        return false;
      }
      
      return Boolean(data && data.length > 0);
    } catch (err) {
      console.error('Failed to verify user session:', err);
      return false;
    }
  },
  
  /**
   * Verify if events are properly associated with a session
   */
  async verifySessionEvents(sessionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error verifying session events:', error);
        return 0;
      }
      
      return data ? data.length : 0;
    } catch (err) {
      console.error('Failed to verify session events:', err);
      return 0;
    }
  },
  
  /**
   * Create a test session and track a test event
   */
  async testSessionAndEventCreation(userId: string): Promise<{
    success: boolean;
    sessionId?: string;
    eventCount?: number;
  }> {
    try {
      // Start a session
      const sessionResult = await analyticsService.startUserSession(userId);
      
      if (!sessionResult || !sessionResult.id) {
        return { success: false };
      }
      
      // Track a test event
      await analyticsService.trackEvent({
        userId,
        eventType: 'test_event',
        contentId: null,
        timestamp: Date.now(),
        sessionId: sessionResult.id,
        testData: 'This is a test event'
      });
      
      // Verify the event was created
      const eventCount = await this.verifySessionEvents(sessionResult.id);
      
      // End the session
      await analyticsService.endUserSession(sessionResult.id);
      
      return {
        success: true,
        sessionId: sessionResult.id,
        eventCount
      };
    } catch (err) {
      console.error('Failed to test session and event creation:', err);
      return { success: false };
    }
  },

  /**
   * Test the roleplay analytics tracking functionality
   */
  async testRoleplayAnalytics(userId: string, knowledgeId: string, moduleId: string): Promise<{
    success: boolean;
    sessionId?: string;
    events?: {
      start?: boolean;
      response?: boolean;
      complete?: boolean;
    };
  }> {
    try {
      // Start a session
      const sessionResult = await analyticsService.startUserSession(userId);
      
      if (!sessionResult || !sessionResult.id) {
        return { success: false };
      }

      const sessionId = sessionResult.id;
      const scenarioId = 'test-scenario-123';
      
      // Track roleplay start event
      await analyticsService.trackEvent({
        userId,
        eventType: 'roleplay_start',
        contentId: scenarioId,
        timestamp: Date.now(),
        sessionId,
        knowledgeId,
        moduleId,
        scenarioTitle: 'Test Scenario',
        difficulty: 'medium',
        estimatedDuration: 600,
        studentProfiles: [
          { name: 'Student A', personality: 'Curious' }
        ],
        interactionType: 'scenario_selection'
      });
      
      // Track roleplay response event
      await analyticsService.trackEvent({
        userId,
        eventType: 'roleplay_response',
        contentId: scenarioId,
        timestamp: Date.now(),
        sessionId,
        knowledgeId,
        moduleId,
        step: 1,
        studentName: 'Student A',
        studentPersonality: 'Curious',
        question: 'What is this test about?',
        response: 'This is a test of the roleplay analytics system.',
        responseTime: 5000,
        interactionType: 'teacher_response'
      });
      
      // Track roleplay complete event
      await analyticsService.trackEvent({
        userId,
        eventType: 'roleplay_complete',
        contentId: scenarioId,
        timestamp: Date.now(),
        sessionId,
        knowledgeId,
        moduleId,
        totalSteps: 3,
        completedSteps: 3,
        totalScore: 85,
        maxPossibleScore: 100,
        durationSeconds: 300,
        evaluations: [
          {
            criteriaId: 'clarity',
            criteriaName: 'Clarity of Explanation',
            score: 4,
            maxScore: 5,
            feedback: 'Good clarity in responses'
          }
        ],
        interactionType: 'completion'
      });
      
      // Verify events were created
      const { data: events, error } = await supabase
        .from('user_interactions')
        .select('event_type')
        .eq('session_id', sessionId)
        .in('event_type', ['roleplay_start', 'roleplay_response', 'roleplay_complete']);
      
      if (error) {
        console.error('Error verifying roleplay events:', error);
        return { success: false, sessionId };
      }
      
      const hasStartEvent = events.some(e => e.event_type === 'roleplay_start');
      const hasResponseEvent = events.some(e => e.event_type === 'roleplay_response');
      const hasCompleteEvent = events.some(e => e.event_type === 'roleplay_complete');
      
      // End the session
      await analyticsService.endUserSession(sessionId);
      
      return {
        success: true,
        sessionId,
        events: {
          start: hasStartEvent,
          response: hasResponseEvent,
          complete: hasCompleteEvent
        }
      };
    } catch (err) {
      console.error('Failed to test roleplay analytics:', err);
      return { success: false };
    }
  }
}; 