import { analyticsService } from '@/services/analytics-service'
import supabase from '@/services/supabase'

/**
 * Test helpers for analytics functionality
 */
export const analyticsTestHelpers = {
  /**
   * Generate test events for a user
   */
  async generateTestEvents(
    userId: string,
    sessionId: string,
    count: number = 5
  ): Promise<boolean> {
    try {
      const events = Array.from({ length: count }, (_, i) => ({
        user_id: userId,
        session_id: sessionId,
        event_type: `test_event_${i % 3}`, // Cycle through 3 event types
        content_id: `test_content_${i}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        event_data: {
          testValue: i * 10,
          testString: `test_string_${i}`,
          timestamp: Date.now() - i * 1000,
        },
      }))

      const { error } = await supabase.from('user_interactions').insert(events)

      if (error) {
        console.error('Error generating test events:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Failed to generate test events:', err)
      return false
    }
  },

  /**
   * Verify event persistence
   */
  async verifyEventPersistence(
    sessionId: string,
    expectedCount: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error verifying event persistence:', error)
        return false
      }

      return data.length === expectedCount
    } catch (err) {
      console.error('Failed to verify event persistence:', err)
      return false
    }
  },

  /**
   * Test the full analytics flow
   */
  async testAnalyticsFlow(userId: string): Promise<{
    success: boolean
    sessionId?: string
    eventCount?: number
    stats?: any
    summary?: any
  }> {
    try {
      // Start a session
      const sessionResult = await analyticsService.startUserSession(userId)

      if (!sessionResult || !sessionResult.id) {
        return { success: false }
      }

      const sessionId = sessionResult.id
      const eventCount = 5

      // Generate test events
      const eventsGenerated = await this.generateTestEvents(
        userId,
        sessionId,
        eventCount
      )
      if (!eventsGenerated) {
        return { success: false, sessionId }
      }

      // Verify events were created
      const eventsPersisted = await this.verifyEventPersistence(
        sessionId,
        eventCount
      )
      if (!eventsPersisted) {
        return { success: false, sessionId }
      }

      // Get analytics data
      const stats = await analyticsService.getUserSessionStats(userId)
      const summary = await analyticsService.getUserInteractionSummary(userId)

      // End the session
      await analyticsService.endUserSession(sessionId)

      return {
        success: true,
        sessionId,
        eventCount,
        stats,
        summary,
      }
    } catch (err) {
      console.error('Failed to test analytics flow:', err)
      return { success: false }
    }
  },

  /**
   * Clean up test data
   */
  async cleanupTestData(userId: string, sessionId: string): Promise<boolean> {
    try {
      // Delete test events
      const { error: eventsError } = await supabase
        .from('user_interactions')
        .delete()
        .eq('session_id', sessionId)

      if (eventsError) {
        console.error('Error cleaning up test events:', eventsError)
        return false
      }

      // Delete test session
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        console.error('Error cleaning up test session:', sessionError)
        return false
      }

      return true
    } catch (err) {
      console.error('Failed to clean up test data:', err)
      return false
    }
  },
}
