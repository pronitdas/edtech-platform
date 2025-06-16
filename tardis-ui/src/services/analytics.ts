import { apiClient } from './api-client';
import { UserEvent, AnalyticsData } from '../types/api';

export class AnalyticsService {
  async trackEvent(event: UserEvent): Promise<void> {
    return apiClient.post('/analytics/track-event', event);
  }

  async getUserProgress(userId: number): Promise<AnalyticsData[]> {
    return apiClient.get<AnalyticsData[]>(`/analytics/user/${userId}/progress`);
  }

  async getUserCompletion(userId: number, courseId?: number): Promise<any> {
    const query = courseId ? `?course_id=${courseId}` : '';
    return apiClient.get(`/analytics/user/${userId}/completion${query}`);
  }

  async getUserSessions(userId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/analytics/user/${userId}/sessions`);
  }

  async getKnowledgeStats(knowledgeId: number): Promise<any> {
    return apiClient.get(`/analytics/knowledge/${knowledgeId}/interactions`);
  }
}

export const analyticsService = new AnalyticsService();
