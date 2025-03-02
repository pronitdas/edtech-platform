┌─────────────────────────────────┐
│      UI Components Layer        │
│  ┌───────────┐   ┌───────────┐  │
│  │   Quiz    │   │  Video    │  │
│  │Component  │   │ Component │  │
│  └───────────┘   └───────────┘  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│      Context Providers          │
│  ┌───────────────────────────┐  │
│  │  InteractionTrackerContext│  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│      Service Layer              │
│  ┌───────────┐   ┌───────────┐  │
│  │Interaction│   │ Analytics │  │
│  │  Service  │   │  Service  │  │
│  └───────────┘   └───────────┘  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│      Data Access Layer          │
│  ┌───────────┐   ┌───────────┐  │
│  │ Supabase  │   │   Cache   │  │
│  │ Database  │   │  Layer    │  │
│  └───────────┘   └───────────┘  │
└─────────────────────────────────┘
// src/contexts/InteractionTrackerContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InteractionDataService } from '@/services/interaction-data-service';

// Define types
interface InteractionEvent {
  id: string;
  type: string;
  contentId?: number;
  timestamp: number;
  metadata: any;
  persisted: boolean;
}

interface InteractionContextState {
  sessionId: string | null;
  events: InteractionEvent[];
  isTrackingEnabled: boolean;
}

interface InteractionContextValue extends InteractionContextState {
  startSession: (userId: string, metadata?: any) => Promise<void>;
  endSession: () => Promise<void>;
  trackEvent: (type: string, contentId?: number, metadata?: any) => void;
  // Specialized tracking methods
  trackVideoPlay: (contentId: number, metadata?: any) => void;
  trackVideoPause: (contentId: number, elapsedTime: number, metadata?: any) => void;
  trackVideoComplete: (contentId: number, metadata?: any) => void;
  trackQuizStart: (quizId: number, metadata?: any) => void;
  trackQuizAnswer: (quizId: number, questionId: string, userAnswer: string, isCorrect: boolean, timeTaken: number) => void;
  trackQuizComplete: (quizId: number, score: number, maxScore: number, metadata?: any) => void;
  // More tracking methods...
  flushEvents: () => Promise<void>;
  getAnalytics: (userId: string, contentId?: number) => Promise<any>;
}

// Create context
const InteractionTrackerContext = createContext<InteractionContextValue | undefined>(undefined);

// Provider component
export const InteractionTrackerProvider: React.FC<{
  children: React.ReactNode;
  dataService: InteractionDataService;
  userId?: string;
  batchSize?: number;
  flushInterval?: number;
}> = ({
  children,
  dataService,
  userId,
  batchSize = 10,
  flushInterval = 30000, // 30 seconds
}) => {
  const [state, setState] = useState<InteractionContextState>({
    sessionId: null,
    events: [],
    isTrackingEnabled: Boolean(userId),
  });

  // Start session automatically if userId is provided
  useEffect(() => {
    if (userId) {
      startSession(userId);
    }
  }, [userId]);

  // Set up interval for flushing events
  useEffect(() => {
    if (state.isTrackingEnabled) {
      const interval = setInterval(() => {
        if (state.events.filter(e => !e.persisted).length > 0) {
          flushEvents();
        }
      }, flushInterval);
      
      return () => clearInterval(interval);
    }
  }, [state.isTrackingEnabled, state.events, flushInterval]);

  // Flush events when reaching batch size
  useEffect(() => {
    if (state.events.filter(e => !e.persisted).length >= batchSize) {
      flushEvents();
    }
  }, [state.events, batchSize]);

  // Start a new session
  const startSession = async (userId: string, metadata = {}) => {
    try {
      const sessionId = await dataService.startSession(userId, metadata);
      setState(prev => ({
        ...prev,
        sessionId,
        isTrackingEnabled: true
      }));
    } catch (error) {
      console.error('Failed to start tracking session:', error);
    }
  };

  // End the current session
  const endSession = async () => {
    if (state.sessionId) {
      try {
        await flushEvents();
        await dataService.endSession(state.sessionId);
        setState(prev => ({
          ...prev,
          sessionId: null,
          events: []
        }));
      } catch (error) {
        console.error('Failed to end tracking session:', error);
      }
    }
  };

  // Track a generic event
  const trackEvent = (type: string, contentId?: number, metadata = {}) => {
    if (!state.isTrackingEnabled || !state.sessionId) return;

    const newEvent: InteractionEvent = {
      id: uuidv4(),
      type,
      contentId,
      timestamp: Date.now(),
      metadata,
      persisted: false
    };

    setState(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));
  };

  // Flush events to the server
  const flushEvents = async () => {
    if (!state.sessionId) return;

    const unpersisted = state.events.filter(e => !e.persisted);
    if (unpersisted.length === 0) return;

    try {
      await dataService.batchLogInteractions(
        state.sessionId,
        unpersisted.map(e => ({
          type: e.type,
          contentId: e.contentId,
          metadata: {
            ...e.metadata,
            timestamp: e.timestamp
          }
        }))
      );

      // Mark events as persisted
      setState(prev => ({
        ...prev,
        events: prev.events.map(e => 
          unpersisted.some(u => u.id === e.id) 
            ? { ...e, persisted: true } 
            : e
        )
      }));
    } catch (error) {
      console.error('Failed to flush tracking events:', error);
    }
  };

  // Define specialized tracking methods
  const trackVideoPlay = (contentId: number, metadata = {}) => {
    trackEvent('video_play', contentId, metadata);
  };

  const trackVideoPause = (contentId: number, elapsedTime: number, metadata = {}) => {
    trackEvent('video_pause', contentId, { 
      ...metadata,
      elapsedTime 
    });
  };

  // More specialized tracking methods...

  // Get analytics
  const getAnalytics = async (userId: string, contentId?: number) => {
    return await dataService.getAnalytics(userId, contentId);
  };

  const value: InteractionContextValue = {
    ...state,
    startSession,
    endSession,
    trackEvent,
    trackVideoPlay,
    trackVideoPause,
    trackVideoComplete: (contentId, metadata) => trackEvent('video_complete', contentId, metadata),
    trackQuizStart: (quizId, metadata) => trackEvent('quiz_start', quizId, metadata),
    trackQuizAnswer: (quizId, questionId, userAnswer, isCorrect, timeTaken) => 
      trackEvent('quiz_answer', quizId, { questionId, userAnswer, isCorrect, timeTaken }),
    trackQuizComplete: (quizId, score, maxScore, metadata) => 
      trackEvent('quiz_complete', quizId, { ...metadata, score, maxScore }),
    flushEvents,
    getAnalytics
  };

  return (
    <InteractionTrackerContext.Provider value={value}>
      {children}
    </InteractionTrackerContext.Provider>
  );
};

// Custom hook
export const useInteractionTracker = () => {
  const context = useContext(InteractionTrackerContext);
  if (!context) {
    throw new Error('useInteractionTracker must be used within an InteractionTrackerProvider');
  }
  return context;
};
// src/services/analytics-service.ts

import supabase from './supabase';

export interface LearningAnalytics {
  understanding_level: 'high' | 'medium' | 'low';
  engagement_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  learning_patterns?: any;
}

export class AnalyticsService {
  /**
   * Get learning analytics for a user
   */
  async getUserAnalytics(userId: string): Promise<LearningAnalytics | null> {
    try {
      // First check if we have recent analytics
      const { data: existingAnalytics, error: fetchError } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      // If we have recent analytics (less than 24 hours old), return them
      if (existingAnalytics && existingAnalytics.length > 0) {
        const generatedAt = new Date(existingAnalytics[0].generated_at);
        const now = new Date();
        const hoursSinceGeneration = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceGeneration < 24) {
          return this.formatAnalytics(existingAnalytics[0]);
        }
      }
      
      // Generate new analytics
      return await this.generateUserAnalytics(userId);
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }
  
  /**
   * Generate learning analytics for a user
   */
  private async generateUserAnalytics(userId: string): Promise<LearningAnalytics | null> {
    try {
      // Get interactions data
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_interactions')
        .select(`
          id,
          interaction_type,
          content_id,
          created_at,
          metadata,
          user_sessions!inner(user_id)
        `)
        .eq('user_sessions.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (interactionsError) throw interactionsError;
      
      // Get quiz results
      const { data: quizResults, error: quizError } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          started_at,
          completed_at,
          score,
          max_score,
          quiz_answers(*)
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (quizError) throw quizError;
      
      // Analyze the data
      const analytics = this.analyzeUserData(interactions, quizResults);
      
      // Store the analytics
      const { data: savedAnalytics, error: saveError } = await supabase
        .from('learning_analytics')
        .insert({
          user_id: userId,
          understanding_level: analytics.understanding_level,
          engagement_score: analytics.engagement_score,
          strengths: analytics.strengths,
          weaknesses: analytics.weaknesses,
          recommendations: analytics.recommendations,
          raw_data: {
            interactions_count: interactions.length,
            quiz_results_count: quizResults.length,
            patterns: analytics.learning_patterns
          }
        })
        .select()
        .single();
      
      if (saveError) throw saveError;
      
      return analytics;
    } catch (error) {
      console.error('Error generating user analytics:', error);
      return null;
    }
  }
  
  /**
   * Analyze user interaction and quiz data
   */
  private analyzeUserData(interactions: any[], quizResults: any[]): LearningAnalytics {
    // This is where you'd implement your analytics algorithm
    // For now, using simplified logic similar to the original interaction-tracking.ts
    
    // Count different types of interactions
    const videoPlays = interactions.filter(i => i.interaction_type === 'video_play').length;
    const videoPauses = interactions.filter(i => i.interaction_type === 'video_pause').length;
    const quizAttempts = quizResults.length;
    const quizCompletions = quizResults.filter(q => q.completed_at).length;
    const notesClicks = interactions.filter(i => i.interaction_type === 'notes_view').length;
    const summaryClicks = interactions.filter(i => i.interaction_type === 'summary_view').length;
    const mindmapClicks = interactions.filter(i => i.interaction_type === 'mindmap_view').length;
    
    // Calculate video watch duration
    let videoWatchDuration = 0;
    interactions.forEach(interaction => {
      if (interaction.interaction_type === 'video_pause' && interaction.metadata?.elapsedTime) {
        videoWatchDuration += interaction.metadata.elapsedTime;
      }
    });
    
    // Calculate quiz performance
    let quizPerformance = 0;
    if (quizCompletions > 0) {
      const totalScore = quizResults
        .filter(q => q.completed_at)
        .reduce((sum, q) => sum + (q.score || 0), 0);
      const totalMaxScore = quizResults
        .filter(q => q.completed_at)
        .reduce((sum, q) => sum + (q.max_score || 1), 0);
      
      quizPerformance = totalMaxScore > 0 ? totalScore / totalMaxScore : 0;
    }
    
    // Calculate engagement score (0-1)
    const engagementScore = Math.min(1, (
      (videoPlays * 0.1) + 
      (videoWatchDuration / 3600) + // Normalize to hours
      (quizAttempts * 0.2) + 
      (notesClicks * 0.05) + 
      (summaryClicks * 0.05) + 
      (mindmapClicks * 0.1)
    ) / 5);
    
    // Determine understanding level
    let understandingLevel: 'high' | 'medium' | 'low';
    if (quizPerformance > 0.8) {
      understandingLevel = 'high';
    } else if (quizPerformance > 0.5) {
      understandingLevel = 'medium';
    } else {
      understandingLevel = 'low';
    }
    
    // Identify strengths
    const strengths = [];
    if (videoWatchDuration > 3600) strengths.push('video engagement');
    if (quizPerformance > 0.7) strengths.push('quiz performance');
    if (notesClicks + summaryClicks > 10) strengths.push('study material usage');
    if (mindmapClicks > 5) strengths.push('conceptual understanding');
    
    // Identify weaknesses
    const weaknesses = [];
    if (videoWatchDuration < 1800) weaknesses.push('video engagement');
    if (quizPerformance < 0.6) weaknesses.push('quiz performance');
    if (notesClicks + summaryClicks < 5) weaknesses.push('study material usage');
    if (mindmapClicks < 2) weaknesses.push('conceptual mapping');
    
    // Generate recommendations
    const recommendations = [];
    if (videoWatchDuration < 1800) recommendations.push('Spend more time watching the video lessons');
    if (quizPerformance < 0.6) recommendations.push('Practice more with quizzes');
    if (notesClicks + summaryClicks < 5) recommendations.push('Review notes and summaries regularly');
    if (mindmapClicks < 2) recommendations.push('Use mind maps to understand concept relationships');
    
    return {
      understanding_level: understandingLevel,
      engagement_score: engagementScore,
      strengths: strengths.length > 0 ? strengths : ['Consistent learning habits'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue with your current learning approach'],
      learning_patterns: {
        video_engagement: {
          plays: videoPlays,
          duration: videoWatchDuration,
          pauses: videoPauses
        },
        quiz_engagement: {
          attempts: quizAttempts,
          completions: quizCompletions,
          performance: quizPerformance
        },
        content_interaction: {
          notes: notesClicks,
          summaries: summaryClicks,
          mindmaps: mindmapClicks
        }
      }
    };
  }
  
  /**
   * Format analytics data from database
   */
  private formatAnalytics(dbAnalytics: any): LearningAnalytics {
    return {
      understanding_level: dbAnalytics.understanding_level || 'medium',
      engagement_score: dbAnalytics.engagement_score || 0,
      strengths: dbAnalytics.strengths || [],
      weaknesses: dbAnalytics.weaknesses || [],
      recommendations: dbAnalytics.recommendations || [],
      learning_patterns: dbAnalytics.raw_data?.patterns || {}
    };
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();