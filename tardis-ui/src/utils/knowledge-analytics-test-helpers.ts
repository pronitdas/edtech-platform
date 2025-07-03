// Knowledge analytics test helpers using local API
import { apiClient } from '@/services/api-client'
import type { ApiResponse } from '@/types/dashboard'

interface TestKnowledgeScenario {
  knowledgeId: string
  userId: string
  chapters: Array<{ id: string; title: string }>
  analytics: {
    completionRate: number
    averageScore: number
    timeSpent: number
  }
}

export const knowledgeAnalyticsTestHelpers = {
  async createTestKnowledgeScenario(userId: string): Promise<TestKnowledgeScenario | null> {
    try {
      const response = await apiClient.post<ApiResponse<TestKnowledgeScenario>>('/testing/knowledge-scenario', {
        userId,
        scenarioType: 'analytics_test',
        chapters: [
          { title: 'Introduction to Algebra', difficulty: 'beginner' },
          { title: 'Linear Equations', difficulty: 'intermediate' },
          { title: 'Quadratic Functions', difficulty: 'advanced' }
        ]
      })
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to create test knowledge scenario:', error)
      return null
    }
  },

  async generateTestAnalytics(knowledgeId: string, userId: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/testing/generate-analytics', {
        knowledgeId,
        userId,
        sessions: 5,
        averageScore: 85,
        totalTime: 3600
      })
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to generate test analytics:', error)
      return null
    }
  },

  async cleanupKnowledgeData(knowledgeId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/testing/knowledge/${knowledgeId}`)
      return response.success
    } catch (error) {
      console.error('Failed to cleanup knowledge data:', error)
      return false
    }
  }
}