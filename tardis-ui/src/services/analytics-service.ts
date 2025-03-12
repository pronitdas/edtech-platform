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
      // First check if the table exists by querying first
      const { data: tableCheck, error: tableCheckError } = await supabase
        .from('user_progress')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist, return a fallback response
      if (tableCheckError && tableCheckError.message.includes('does not exist')) {
        console.warn('user_progress table not found, returning default progress');
        return [{ 
          user_id: userId, 
          progress_percentage: 0,
          completed: false,
          course_id: null
        }];
      }
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user progress:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch user progress:', err);
      // Provide a graceful fallback
      return [{ 
        user_id: userId, 
        progress_percentage: 0,
        completed: false
      }];
    }
  }

  async getUserCompletion(userId: string, courseId: string): Promise<any> {
    try {
      // Try calling the preferred function first
      const { data, error } = await supabase
        .rpc('calculate_course_completion', {
          p_user_id: userId,
          p_course_id: courseId
        });

      // If there's an error about the function not existing, try the engagement score function
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.warn('calculate_course_completion not found, trying calculate_engagement_score');
        
        try {
          const { data: engagementData, error: engagementError } = await supabase
            .rpc('calculate_engagement_score', {
              p_user_id: userId,
              p_course_id: courseId
            });
          
          if (engagementError) {
            console.error('Error calculating engagement:', engagementError);
            return this.getFallbackCompletion();
          }
          
          return engagementData || this.getFallbackCompletion();
        } catch (engErr) {
          console.error('Failed to calculate engagement:', engErr);
          return this.getFallbackCompletion();
        }
      }

      if (error) {
        console.error('Error calculating course completion:', error);
        return this.getFallbackCompletion();
      }

      return data || this.getFallbackCompletion();
    } catch (err) {
      console.error('Failed to calculate course completion:', err);
      return this.getFallbackCompletion();
    }
  }
  
  // Provide a fallback completion object when database functions fail
  private getFallbackCompletion(): any {
    return { 
      completion: 0,
      completed_items: 0,
      total_items: 0,
      engagement_score: 0
    };
  }
}

// Create and export a singleton instance
export const analyticsService: AnalyticsService = new SupabaseAnalyticsService(); 