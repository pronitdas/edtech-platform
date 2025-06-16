import supabase from './supabase';

interface EventData {
  userId: string;
  eventType: string;
  contentId: string | null;
  timestamp: number;
  sessionId: string | null;
  [key: string]: any;
}

export interface AnalyticsService {
  trackEvent: (data: EventData) => Promise<void>;
  getUserProgress: (userId: string) => Promise<any>;
  getUserCompletion: (userId: string, courseId: string) => Promise<any>;
  startUserSession: (userId: string) => Promise<{ id: string } | null>;
  endUserSession: (sessionId: string) => Promise<boolean>;
  getUserSessionStats: (userId: string) => Promise<any>;
  getUserInteractionSummary: (userId: string, contentId?: string) => Promise<any>;
  summarizeNumericEventData: (userId: string, eventType: string, jsonKey: string) => Promise<any>;
  getKnowledgeInteractionSummary: (userId: string, knowledgeId: string) => Promise<any>;
  getKnowledgeVideoStats: (userId: string, knowledgeId: string) => Promise<any>;
  getKnowledgeQuizStats: (userId: string, knowledgeId: string) => Promise<any>;
}

class SupabaseAnalyticsService implements AnalyticsService {
  async trackEvent(data: EventData): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: data.userId,
          event_type: data.eventType,
          content_id: data.contentId ? parseInt(data.contentId, 10) : null,
          created_at: new Date(data.timestamp).toISOString(),
          event_data: data,
          session_id: data.sessionId
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
      // Call the engagement score function directly since it's our new standard
      const { data: engagementData, error: engagementError } = await supabase
        .rpc('calculate_engagement_score', {
          p_user_id: userId,
          p_knowledge_id: parseInt(courseId)
        });
      
      if (engagementError) {
        console.error('Error calculating engagement:', engagementError);
        return this.getFallbackCompletion();
      }

      // Get video and quiz stats for more accurate completion calculation
      const [videoStats, quizStats] = await Promise.all([
        supabase.rpc('get_knowledge_video_stats', {
          p_user_id: userId,
          p_knowledge_id: parseInt(courseId)
        }),
        supabase.rpc('get_knowledge_quiz_stats', {
          p_user_id: userId,
          p_knowledge_id: parseInt(courseId)
        })
      ]);

      // Calculate completion based on engagement score and content completion
      const engagementScore = engagementData || 0;
      const videoCompletion = videoStats.data?.completion_rate_percent || 0;
      const quizCompletion = quizStats.data?.completion_rate_percent || 0;

      // Weight the completion: 40% engagement, 30% video completion, 30% quiz completion
      const completion = Math.round(
        (engagementScore * 0.4) +
        (videoCompletion * 0.3) +
        (quizCompletion * 0.3)
      );

      return {
        completion: Math.min(completion, 100), // Cap at 100%
        engagementScore,
        videoCompletion,
        quizCompletion
      };
    } catch (err) {
      console.error('Failed to calculate course completion:', err);
      return this.getFallbackCompletion();
    }
  }
  
  // Provide a fallback completion object when database functions fail
  private getFallbackCompletion(): any {
    return {
      completion: 0,
      engagementScore: 0,
      videoCompletion: 0,
      quizCompletion: 0
    };
  }

  async startUserSession(userId: string): Promise<{ id: string } | null> {
    if (!userId) {
      console.error('Cannot start session without user ID.');
      return null;
    }
    
    try {
      console.log(`[AnalyticsService] Starting new session for user: ${userId}`);
      
      // Call the RPC function to start a user session
      // This is more reliable than direct table inserts because:
      // 1. It ensures UUID generation happens on the database side
      // 2. It centralizes session creation logic
      // 3. It can handle additional session initialization steps in the future
      const { data, error } = await supabase
        .rpc('start_user_session', {
          p_user_id: userId
        });

      if (error) {
        console.error('[AnalyticsService] Error starting user session:', error);
        return null;
      }

      if (!data || !data.id) {
        console.error('[AnalyticsService] User session created but failed to retrieve ID.');
        return null;
      }
      
      console.log('[AnalyticsService] User session started successfully:', data);
      return data; // Returns { id: string }
    } catch (err) {
      console.error('[AnalyticsService] Failed to start user session:', err);
      return null;
    }
  }

  async endUserSession(sessionId: string): Promise<boolean> {
    if (!sessionId) {
      console.error('[AnalyticsService] Cannot end session without session ID.');
      return false;
    }
    
    try {
      console.log(`[AnalyticsService] Ending session: ${sessionId}`);
      
      // Call the RPC function to end a user session
      const { data, error } = await supabase
        .rpc('end_user_session', {
          p_session_id: sessionId
        });

      if (error) {
        console.error('[AnalyticsService] Error ending user session:', error);
        return false;
      }
      
      console.log('[AnalyticsService] User session ended successfully');
      return data || false; // Function returns boolean indicating success
    } catch (err) {
      console.error('[AnalyticsService] Failed to end user session:', err);
      return false;
    }
  }

  async getUserSessionStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_session_stats', {
          p_user_id: userId
        });

      if (error) {
        console.error('Error getting user session stats:', error);
        return this.getFallbackSessionStats();
      }

      return data || this.getFallbackSessionStats();
    } catch (err) {
      console.error('Failed to get user session stats:', err);
      return this.getFallbackSessionStats();
    }
  }

  async getUserInteractionSummary(userId: string, contentId?: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_interaction_summary', {
          p_user_id: userId,
          p_content_id: contentId
        });

      if (error) {
        console.error('Error getting user interaction summary:', error);
        return this.getFallbackInteractionSummary();
      }

      return data || this.getFallbackInteractionSummary();
    } catch (err) {
      console.error('Failed to get user interaction summary:', err);
      return this.getFallbackInteractionSummary();
    }
  }

  async summarizeNumericEventData(userId: string, eventType: string, jsonKey: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('summarize_numeric_event_data', {
          p_user_id: userId,
          p_event_type: eventType,
          p_json_key: jsonKey
        });

      if (error) {
        console.error('Error summarizing numeric event data:', error);
        return this.getFallbackNumericSummary();
      }

      return data || this.getFallbackNumericSummary();
    } catch (err) {
      console.error('Failed to summarize numeric event data:', err);
      return this.getFallbackNumericSummary();
    }
  }

  async getKnowledgeInteractionSummary(userId: string, knowledgeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_knowledge_interaction_summary', {
          p_user_id: userId,
          p_knowledge_id: knowledgeId
        });

      if (error) {
        console.error('Error getting knowledge interaction summary:', error);
        return this.getFallbackKnowledgeSummary();
      }

      return data || this.getFallbackKnowledgeSummary();
    } catch (err) {
      console.error('Failed to get knowledge interaction summary:', err);
      return this.getFallbackKnowledgeSummary();
    }
  }

  async getKnowledgeVideoStats(userId: string, knowledgeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_knowledge_video_stats', {
          p_user_id: userId,
          p_knowledge_id: knowledgeId
        });

      if (error) {
        console.error('Error getting knowledge video stats:', error);
        return this.getFallbackVideoStats();
      }

      return data || this.getFallbackVideoStats();
    } catch (err) {
      console.error('Failed to get knowledge video stats:', err);
      return this.getFallbackVideoStats();
    }
  }

  async getKnowledgeQuizStats(userId: string, knowledgeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_knowledge_quiz_stats', {
          p_user_id: userId,
          p_knowledge_id: knowledgeId
        });

      if (error) {
        console.error('Error getting knowledge quiz stats:', error);
        return this.getFallbackQuizStats();
      }

      return data || this.getFallbackQuizStats();
    } catch (err) {
      console.error('Failed to get knowledge quiz stats:', err);
      return this.getFallbackQuizStats();
    }
  }

  // Fallback methods for when database functions fail
  private getFallbackSessionStats(): any {
    return {
      total_sessions: 0,
      total_duration: 0,
      average_duration: 0,
      last_session: null
    };
  }

  private getFallbackInteractionSummary(): any {
    return {
      total_interactions: 0,
      interaction_types: {},
      content_interactions: {},
      last_interaction: null
    };
  }

  private getFallbackNumericSummary(): any {
    return {
      count: 0,
      sum: 0,
      average: 0,
      min: 0,
      max: 0
    };
  }

  private getFallbackKnowledgeSummary(): any {
    return {
      total_interactions: 0,
      interaction_types: {},
      content_interactions: {},
      last_interaction: null,
      engagement_score: 0
    };
  }

  private getFallbackVideoStats(): any {
    return {
      total_videos: 0,
      videos_watched: 0,
      total_watch_time: 0,
      average_watch_percentage: 0,
      completion_rate: 0
    };
  }

  private getFallbackQuizStats(): any {
    return {
      total_quizzes: 0,
      quizzes_attempted: 0,
      quizzes_completed: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0
    };
  }
}

// Create and export a singleton instance
export const analyticsService: AnalyticsService = new SupabaseAnalyticsService(); 