import { apiClient } from './api'

export interface UserEvent {
  event_type: string
  knowledge_id?: string
  chapter_id?: string
  content_id?: string
  data?: Record<string, unknown>
  // Additional properties used by components
  userId?: string
  eventType?: string // Alternative to event_type for compatibility
  contentId?: string | null
  timestamp?: number
  sessionId?: string | null
  [key: string]: any // Allow additional properties
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

export interface SessionResponse {
  id: string
}

export class AnalyticsService {
  async trackEvent(event: UserEvent): Promise<void> {
    return apiClient.request('/v2/analytics/track-event', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  async startUserSession(userId: string): Promise<SessionResponse> {
    return apiClient.request('/v2/analytics/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    })
  }

  async endUserSession(sessionId: string): Promise<void> {
    return apiClient.request(`/v2/analytics/sessions/${sessionId}/end`, {
      method: 'POST',
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

  // Missing methods that are being called
  async getUserCompletion(userId: string, courseId?: string): Promise<any> {
    const params = courseId ? `?course_id=${courseId}` : ''
    return apiClient.request(`/v2/analytics/user/${userId}/completion${params}`)
  }

  async getKnowledgeInteractionSummary(
    userId: string,
    knowledgeId: string
  ): Promise<any> {
    return apiClient.request(
      `/v2/analytics/user/${userId}/knowledge/${knowledgeId}/interaction-summary`
    )
  }

  async getKnowledgeVideoStats(
    userId: string,
    knowledgeId: string
  ): Promise<VideoStats> {
    return apiClient.request(
      `/v2/analytics/user/${userId}/knowledge/${knowledgeId}/video-stats`
    )
  }

  async getKnowledgeQuizStats(
    userId: string,
    knowledgeId: string
  ): Promise<QuizStats> {
    return apiClient.request(
      `/v2/analytics/user/${userId}/knowledge/${knowledgeId}/quiz-stats`
    )
  }

  async getUserSessionStats(userId: string): Promise<any> {
    return apiClient.request(`/v2/analytics/user/${userId}/session-stats`)
  }

  async getUserInteractionSummary(userId: string): Promise<any> {
    return apiClient.request(`/v2/analytics/user/${userId}/interaction-summary`)
  }

  async summarizeNumericEventData(
    userId: string,
    eventType: string,
    jsonKey: string
  ): Promise<any> {
    return this.getNumericSummary(userId, eventType, jsonKey)
  }

  // Helper methods for common tracking scenarios
  async trackChapterView(
    knowledgeId: string,
    chapterId: string,
    data?: Record<string, unknown>
  ) {
    const event: UserEvent = {
      event_type: 'chapter_view',
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
    }
    if (data !== undefined) {
      event.data = data
    }
    return this.trackEvent(event)
  }

  async trackVideoWatch(
    knowledgeId: string,
    chapterId: string,
    duration: number,
    progress: number
  ) {
    const event: UserEvent = {
      event_type: 'video_watch',
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
    }
    event.data = { duration, progress }
    return this.trackEvent(event)
  }

  async trackQuizAttempt(
    knowledgeId: string,
    chapterId: string,
    score: number,
    answers: any[]
  ) {
    const event: UserEvent = {
      event_type: 'quiz_attempt',
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
    }
    event.data = { score, answers }
    return this.trackEvent(event)
  }

  async trackContentGeneration(
    knowledgeId: string,
    contentType: string,
    success: boolean
  ) {
    const event: UserEvent = {
      event_type: 'content_generation',
      knowledge_id: knowledgeId,
    }
    event.data = { content_type: contentType, success }
    return this.trackEvent(event)
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
