import supabase from './supabase'
import { LearningAnalytics } from '@/types/database'

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

class SupabaseLearningAnalyticsService implements LearningAnalyticsService {
  async generateLearningAnalytics(
    userId: string,
    knowledgeId: string
  ): Promise<LearningAnalytics | null> {
    try {
      console.log(
        `[LearningAnalyticsService] Generating analytics for user: ${userId}, knowledge: ${knowledgeId}`
      )

      const { data, error } = await supabase.rpc(
        'generate_learning_analytics',
        {
          p_user_id: userId,
          p_knowledge_id: parseInt(knowledgeId, 10),
        }
      )

      if (error) {
        console.error(
          '[LearningAnalyticsService] Error generating learning analytics:',
          error
        )
        return this.getFallbackLearningAnalytics()
      }

      if (!data) {
        console.error(
          '[LearningAnalyticsService] No data returned from generate_learning_analytics'
        )
        return this.getFallbackLearningAnalytics()
      }

      // Map the response to the LearningAnalytics type
      const analytics: LearningAnalytics = {
        engagement_score: data.engagement_score,
        understanding_level: data.understanding_level,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        recommendations: data.recommendations,
      }

      return analytics
    } catch (err) {
      console.error(
        '[LearningAnalyticsService] Failed to generate learning analytics:',
        err
      )
      return this.getFallbackLearningAnalytics()
    }
  }

  async getLearningAnalytics(
    userId: string,
    knowledgeId: string
  ): Promise<LearningAnalytics | null> {
    try {
      console.log(
        `[LearningAnalyticsService] Retrieving analytics for user: ${userId}, knowledge: ${knowledgeId}`
      )

      // First check if we have existing analytics in the learning_analytics table
      const { data, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', parseInt(knowledgeId, 10))
        .order('generated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error(
          '[LearningAnalyticsService] Error retrieving learning analytics:',
          error
        )
        return this.getFallbackLearningAnalytics()
      }

      // If we have existing analytics, return them
      if (data && data.length > 0) {
        const analytics: LearningAnalytics = {
          engagement_score: data[0].engagement_score,
          understanding_level: data[0].understanding_level,
          strengths: data[0].strengths,
          weaknesses: data[0].weaknesses,
          recommendations: data[0].recommendations,
        }
        return analytics
      }

      // If no existing analytics, generate new ones
      return this.generateLearningAnalytics(userId, knowledgeId)
    } catch (err) {
      console.error(
        '[LearningAnalyticsService] Failed to retrieve learning analytics:',
        err
      )
      return this.getFallbackLearningAnalytics()
    }
  }

  async getEngagementScore(
    userId: string,
    knowledgeId: string
  ): Promise<number | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_engagement_score', {
        p_user_id: userId,
        p_knowledge_id: parseInt(knowledgeId, 10),
      })

      if (error) {
        console.error(
          '[LearningAnalyticsService] Error calculating engagement score:',
          error
        )
        return null
      }

      return data
    } catch (err) {
      console.error(
        '[LearningAnalyticsService] Failed to calculate engagement score:',
        err
      )
      return null
    }
  }

  async getUnderstandingLevel(
    userId: string,
    knowledgeId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc(
        'calculate_understanding_level',
        {
          p_user_id: userId,
          p_knowledge_id: parseInt(knowledgeId, 10),
        }
      )

      if (error) {
        console.error(
          '[LearningAnalyticsService] Error calculating understanding level:',
          error
        )
        return null
      }

      return data
    } catch (err) {
      console.error(
        '[LearningAnalyticsService] Failed to calculate understanding level:',
        err
      )
      return null
    }
  }

  private getFallbackLearningAnalytics(): LearningAnalytics {
    return {
      engagement_score: 0,
      understanding_level: 'Not available',
      strengths: [],
      weaknesses: [],
      recommendations: [],
    }
  }
}

// Export a singleton instance
export const learningAnalyticsService = new SupabaseLearningAnalyticsService()
