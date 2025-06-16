import { apiClient } from './api'

export interface UserEvent {
  event_type: string
  knowledge_id?: string
  chapter_id?: string
  content_id?: string
  data?: Record<string, any>
}

export interface UserProgress {
  user_id: string
  knowledge_id: string
  chapters_viewed: number
  progress_percent: number
  last_access: string
}

export interface VideoStats {
  total_watch_time: number
  completion_rate: number
  average_session_duration: number
  chapters_with_video: number
}

export interface QuizStats {
  attempts: number
  average_score: number
  best_score: number
  completion_rate: number
}

export class AnalyticsService {
  async trackEvent(event: UserEvent): Promise<void> {
    return apiClient.request('/v2/analytics/track-event', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  async getUserProgress(
    userId: string,
    knowledgeId?: string
  ): Promise<UserProgress[]> {
    const params = knowledgeId ? `?knowledge_id=${knowledgeId}` : ''
    return apiClient.request(`/v2/analytics/user/${userId}/progress${params}`)
  }

  async getUserSessions(userId: string): Promise<any[]> {
    return apiClient.request(`/v2/analytics/user/${userId}/sessions`)
  }

  async getUserInteractions(
    userId: string,
    contentId?: string
  ): Promise<any[]> {
    const params = contentId ? `?content_id=${contentId}` : ''
    return apiClient.request(
      `/v2/analytics/user/${userId}/interactions${params}`
    )
  }

  async getKnowledgeInteractions(knowledgeId: string): Promise<any[]> {
    return apiClient.request(
      `/v2/analytics/knowledge/${knowledgeId}/interactions`
    )
  }

  async getVideoStats(knowledgeId: string): Promise<VideoStats> {
    return apiClient.request(
      `/v2/analytics/knowledge/${knowledgeId}/video-stats`
    )
  }

  async getQuizStats(knowledgeId: string): Promise<QuizStats> {
    return apiClient.request(
      `/v2/analytics/knowledge/${knowledgeId}/quiz-stats`
    )
  }

  async getNumericSummary(
    userId: string,
    eventType: string,
    jsonKey: string
  ): Promise<any> {
    return apiClient.request(
      `/v2/analytics/user/${userId}/numeric-summary?event_type=${eventType}&json_key=${jsonKey}`
    )
  }

  // Helper methods for common tracking scenarios
  async trackChapterView(
    knowledgeId: string,
    chapterId: string,
    data?: Record<string, any>
  ) {
    return this.trackEvent({
      event_type: 'chapter_view',
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
      data,
    })
  }

  async trackVideoWatch(
    knowledgeId: string,
    chapterId: string,
    duration: number,
    progress: number
  ) {
    return this.trackEvent({
      event_type: 'video_watch',
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
      data: { duration, progress },
    })
  }

  async trackQuizAttempt(
    knowledgeId: string,
    chapterId: string,
    score: number,
    answers: any[]
  ) {
    return this.trackEvent({
      event_type: 'quiz_attempt',
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
      data: { score, answers },
    })
  }

  async trackContentGeneration(
    knowledgeId: string,
    contentType: string,
    success: boolean
  ) {
    return this.trackEvent({
      event_type: 'content_generation',
      knowledge_id: knowledgeId,
      data: { content_type: contentType, success },
    })
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
