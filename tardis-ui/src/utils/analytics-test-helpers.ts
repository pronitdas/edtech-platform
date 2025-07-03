// Analytics test helpers using local API
import { apiClient } from '@/services/api-client'
import { analyticsService } from '@/services/analytics-service'
import type { ApiResponse } from '@/types/dashboard'

interface TestEvent {
  type: string
  userId: string
  data: Record<string, any>
  timestamp: string
}

export const analyticsTestHelpers = {
  async generateTestEvents(userId: string, count: number = 10): Promise<boolean> {
    try {
      const events: TestEvent[] = []
      const eventTypes = ['page_view', 'interaction', 'completion', 'progress']
      
      for (let i = 0; i < count; i++) {
        events.push({
          type: eventTypes[i % eventTypes.length]!,
          userId,
          data: {
            component: 'test_component',
            action: `test_action_${i}`,
            value: Math.random() * 100
          },
          timestamp: new Date(Date.now() - i * 60000).toISOString()
        })
      }

      const response = await apiClient.post<ApiResponse<any>>('/testing/analytics/batch-events', { events })
      return response.success
    } catch (error) {
      console.error('Failed to generate test events:', error)
      return false
    }
  },

  async verifyEventPersistence(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`/testing/analytics/events/${userId}`)
      return response.success && response.data.length > 0
    } catch (error) {
      console.error('Failed to verify event persistence:', error)
      return false
    }
  },

  async testAnalyticsFlow(userId: string): Promise<{ success: boolean; eventsGenerated?: number; eventsPersisted?: number }> {
    try {
      // Generate test events
      const generateSuccess = await this.generateTestEvents(userId, 5)
      if (!generateSuccess) {
        return { success: false }
      }

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify events were persisted
      const verifySuccess = await this.verifyEventPersistence(userId)
      
      // Get event count
      const response = await apiClient.get<ApiResponse<any[]>>(`/testing/analytics/events/${userId}`)
      const eventCount = response.success ? response.data.length : 0

      return {
        success: generateSuccess && verifySuccess,
        eventsGenerated: 5,
        eventsPersisted: eventCount
      }
    } catch (error) {
      console.error('Failed to test analytics flow:', error)
      return { success: false }
    }
  },

  async cleanupTestData(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/testing/analytics/cleanup/${userId}`)
      return response.success
    } catch (error) {
      console.error('Failed to cleanup analytics test data:', error)
      return false
    }
  },

  async trackTestInteraction(userId: string, component: string, action: string): Promise<boolean> {
    try {
      analyticsService.trackEvent({ 
        event_type: 'interaction', 
        userId, 
        data: { component, action, test: true } 
      })
      return true
    } catch (error) {
      console.error('Failed to track test interaction:', error)
      return false
    }
  }
}