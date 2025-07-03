// Test helpers using local API
import { apiClient } from '@/services/api-client'
import type { ApiResponse } from '@/types/dashboard'

export const testHelpers = {
  async simulateUserActivity(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean }>>('/testing/simulate-activity', {
        userId,
        activityType: 'test_interaction',
        timestamp: new Date().toISOString()
      })
      return response.success
    } catch (error) {
      console.error('Failed to simulate user activity:', error)
      return false
    }
  },

  async createTestUser(userData: { email: string; name: string; role: string }): Promise<string | null> {
    try {
      const response = await apiClient.post<ApiResponse<{ id: string }>>('/testing/create-user', userData)
      return response.success ? response.data.id : null
    } catch (error) {
      console.error('Failed to create test user:', error)
      return null
    }
  },

  async cleanupTestData(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/testing/cleanup/${userId}`)
      return response.success
    } catch (error) {
      console.error('Failed to cleanup test data:', error)
      return false
    }
  }
}