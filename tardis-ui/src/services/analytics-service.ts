import supabase from './supabase';

interface EventData {
  userId: string;
  eventType: string;
  contentId: string;
  timestamp: number;
  [key: string]: any;
}

export interface AnalyticsService {
  trackEvent: (data: EventData) => Promise<void>;
  getUserProgress: (userId: string) => Promise<any>;
  getUserCompletion: (userId: string, courseId: string) => Promise<any>;
}

class SupabaseAnalyticsService implements AnalyticsService {
  async trackEvent(data: EventData): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: data.userId,
          event_type: data.eventType,
          content_id: data.contentId,
          timestamp: new Date(data.timestamp).toISOString(),
          event_data: data
        });

      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }

  async getUserProgress(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user progress:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch user progress:', err);
      return null;
    }
  }

  async getUserCompletion(userId: string, courseId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_course_completion', {
          p_user_id: userId,
          p_course_id: courseId
        });

      if (error) {
        console.error('Error calculating course completion:', error);
        return { completion: 0 };
      }

      return data || { completion: 0 };
    } catch (err) {
      console.error('Failed to calculate course completion:', err);
      return { completion: 0 };
    }
  }
}

// Create and export a singleton instance
export const analyticsService: AnalyticsService = new SupabaseAnalyticsService(); 