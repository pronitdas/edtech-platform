import { LearningAnalytics } from '@/types/database'
import { analyticsService } from './analytics'

export interface LearningAnalyticsService {
  generateLearningAnalytics: (
    userId: string,
    knowledgeId: string
  ) => Promise<LearningAnalytics | null>
  getLearningAnalytics: (
    userId: string,
    knowledgeId: string
  ) => Promise<LearningAnalytics | null>
  getEngagementScore: (
    userId: string,
    knowledgeId: string
  ) => Promise<number | null>
  getUnderstandingLevel: (
    userId: string,
    knowledgeId: string
  ) => Promise<string | null>
}

class LocalLearningAnalyticsService implements LearningAnalyticsService {
  async generateLearningAnalytics(
    userId: string,
    knowledgeId: string
  ): Promise<LearningAnalytics | null> {
    try {
      console.log(
        `[LearningAnalyticsService] Generating analytics for user: ${userId}, knowledge: ${knowledgeId}`
      )

      // Get user sessions and interactions to generate analytics
      const sessions = await analyticsService.getUserSessions(userId, {
        knowledge_id: parseInt(knowledgeId)
      })
      
      const interactions = await analyticsService.getUserInteractions(userId, {
        knowledge_id: parseInt(knowledgeId)
      })

      // Generate basic analytics based on interactions
      const analytics: LearningAnalytics = {
        user_id: userId,
        knowledge_id: knowledgeId,
        total_time: sessions.reduce((acc: number, session: any) => acc + (session.duration || 0), 0),
        engagement_score: this.calculateEngagementScore(interactions),
        understanding_level: this.calculateUnderstandingLevel(interactions),
        completion_rate: this.calculateCompletionRate(interactions),
        last_activity: new Date().toISOString(),
        analytics_data: {
          sessions: sessions.length,
          interactions: interactions.length
        }
      }

      return analytics
    } catch (err) {
      console.error(
        '[LearningAnalyticsService] Failed to generate learning analytics:',
        err
      )
      return null
    }
  }

  async getLearningAnalytics(
    userId: string,
    knowledgeId: string
  ): Promise<LearningAnalytics | null> {
    // For now, just generate new analytics each time
    return this.generateLearningAnalytics(userId, knowledgeId)
  }

  async getEngagementScore(
    userId: string,
    knowledgeId: string
  ): Promise<number | null> {
    try {
      const interactions = await analyticsService.getUserInteractions(userId, {
        knowledge_id: parseInt(knowledgeId)
      })
      return this.calculateEngagementScore(interactions)
    } catch (err) {
      console.error('[LearningAnalyticsService] Failed to get engagement score:', err)
      return null
    }
  }

  async getUnderstandingLevel(
    userId: string,
    knowledgeId: string
  ): Promise<string | null> {
    try {
      const interactions = await analyticsService.getUserInteractions(userId, {
        knowledge_id: parseInt(knowledgeId)
      })
      return this.calculateUnderstandingLevel(interactions)
    } catch (err) {
      console.error('[LearningAnalyticsService] Failed to get understanding level:', err)
      return null
    }
  }

  private calculateEngagementScore(interactions: any[]): number {
    // Simple engagement calculation based on interaction count and types
    return Math.min(100, interactions.length * 10)
  }

  private calculateUnderstandingLevel(interactions: any[]): string {
    const score = interactions.length
    if (score > 20) return 'advanced'
    if (score > 10) return 'intermediate'
    return 'beginner'
  }

  private calculateCompletionRate(interactions: any[]): number {
    // Simple completion rate calculation
    return Math.min(100, interactions.length * 5)
  }
}

export const learningAnalyticsService = new LocalLearningAnalyticsService()