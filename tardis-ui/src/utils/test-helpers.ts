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
  }
}; 