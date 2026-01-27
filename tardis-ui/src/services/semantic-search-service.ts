/**
 * Semantic Search Service for Student Learning Recommendations
 * Provides intelligent content discovery and personalized learning suggestions
 */

import { apiClient } from './api-client';

export interface SearchQuery {
  query: string;
  user_interests?: string[];
  knowledge_level?: Record<string, string>;
  content_types?: string[];
  difficulty_filter?: 'beginner' | 'intermediate' | 'advanced';
  subject_filter?: string[];
  limit?: number;
}

export interface SearchResult {
  knowledge_id: string;
  title: string;
  summary: string;
  content_type: string;
  subject_area: string;
  difficulty_level: string;
  relevance_score: number;
  learning_objectives: string[];
  estimated_duration: string;
  prerequisite_topics: string[];
  tags: string[];
}

export interface LearningRecommendation {
  recommended_content: SearchResult[];
  learning_pathway: {
    pathway_name: string;
    description: string;
    topics: string[];
    estimated_duration: string;
    difficulty_progression: string[];
  };
  skill_gaps: string[];
  next_steps: string[];
  related_topics: string[];
}

export interface PersonalizedFeed {
  trending_topics: SearchResult[];
  recommended_for_you: SearchResult[];
  continue_learning: SearchResult[];
  related_to_interests: SearchResult[];
  difficulty_matched: SearchResult[];
}

type ApiDataResponse<T> = {
  data: T;
}

interface SearchResultsResponse {
  results: SearchResult[];
}

interface SimilarTopicsResponse {
  similar_topics: SearchResult[];
}

interface ProgressRecommendationsResponse {
  recommendations: SearchResult[];
}

interface PrerequisitesResponse {
  prerequisites: SearchResult[];
}

interface AdvancedContentResponse {
  advanced_content: SearchResult[];
}

interface TrendingContentResponse {
  trending: SearchResult[];
}

interface GapFillingResponse {
  gap_filling_content: SearchResult[];
}

interface ReviewRecommendationsResponse {
  review_recommendations: SearchResult[];
}

interface CollaborativeContentResponse {
  collaborative_content: SearchResult[];
}

class SemanticSearchService {
  private baseUrl = '/api/v2';

  /**
   * Perform semantic search across available content
   */
  async searchContent(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<SearchResultsResponse>>(`${this.baseUrl}/search/semantic`, searchQuery);
      return response.data.results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error('Failed to search content');
    }
  }

  /**
   * Perform search (wrapper for searchContent with response format)
   */
  async performSearch(params: {
    query: string;
    user_id?: string;
    content_types?: string[];
    difficulty_level?: string;
    limit?: number;
    include_related?: boolean;
  }): Promise<{ success: boolean; data: { results: SearchResult[] } }> {
    try {
      const searchQuery: SearchQuery = {
        query: params.query,
      };
      if (params.content_types) {
        searchQuery.content_types = params.content_types;
      }
      if (params.difficulty_level) {
        searchQuery.difficulty_filter = params.difficulty_level as 'beginner' | 'intermediate' | 'advanced';
      }
      if (params.limit !== undefined) {
        searchQuery.limit = params.limit;
      }
      const results = await this.searchContent(searchQuery);
      return { success: true, data: { results } };
    } catch (error) {
      console.error('Search failed:', error);
      return { success: false, data: { results: [] } };
    }
  }

  /**
   * Get personalized learning recommendations based on user profile
   */
  async getLearningRecommendations(
    userInterests: string[],
    currentKnowledge: Record<string, string>,
    learningGoals: string[]
  ): Promise<LearningRecommendation> {
    try {
      const response = await apiClient.post<ApiDataResponse<LearningRecommendation>>(`${this.baseUrl}/recommendations/learning`, {
        user_interests: userInterests,
        current_knowledge_level: currentKnowledge,
        learning_goals: learningGoals
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get learning recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  /**
   * Get personalized content feed for student dashboard
   */
  async getPersonalizedFeed(): Promise<PersonalizedFeed> {
    try {
      const response = await apiClient.get<ApiDataResponse<PersonalizedFeed>>(`${this.baseUrl}/feed/personalized`);
      return response.data;
    } catch (error) {
      console.error('Failed to get personalized feed:', error);
      throw new Error('Failed to get personalized feed');
    }
  }

  /**
   * Search for topics similar to a given topic
   */
  async findSimilarTopics(topic: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<SimilarTopicsResponse>>(`${this.baseUrl}/search/similar-topics`, {
        topic,
        limit
      });
      return response.data.similar_topics;
    } catch (error) {
      console.error('Failed to find similar topics:', error);
      throw new Error('Failed to find similar topics');
    }
  }

  /**
   * Get content recommendations based on current learning progress
   */
  async getProgressBasedRecommendations(
    completedTopics: string[],
    currentTopic?: string
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<ProgressRecommendationsResponse>>(`${this.baseUrl}/recommendations/progress-based`, {
        completed_topics: completedTopics,
        current_topic: currentTopic
      });
      return response.data.recommendations;
    } catch (error) {
      console.error('Failed to get progress-based recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  /**
   * Search for prerequisite content for a given topic
   */
  async findPrerequisites(topic: string): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<PrerequisitesResponse>>(`${this.baseUrl}/search/prerequisites`, {
        topic
      });
      return response.data.prerequisites;
    } catch (error) {
      console.error('Failed to find prerequisites:', error);
      throw new Error('Failed to find prerequisites');
    }
  }

  /**
   * Search for advanced content related to a topic
   */
  async findAdvancedContent(topic: string, currentLevel: string): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<AdvancedContentResponse>>(`${this.baseUrl}/search/advanced-content`, {
        topic,
        current_level: currentLevel
      });
      return response.data.advanced_content;
    } catch (error) {
      console.error('Failed to find advanced content:', error);
      throw new Error('Failed to find advanced content');
    }
  }

  /**
   * Get trending topics and content
   */
  async getTrendingContent(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 20
  ): Promise<SearchResult[]> {
    try {
      const url = `${this.baseUrl}/content/trending?timeframe=${timeframe}&limit=${limit}`;
      const response = await apiClient.get<ApiDataResponse<TrendingContentResponse>>(url);
      return response.data.trending;
    } catch (error) {
      console.error('Failed to get trending content:', error);
      throw new Error('Failed to get trending content');
    }
  }

  /**
   * Search for content by difficulty level
   */
  async searchByDifficulty(
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    subjects?: string[],
    limit: number = 20
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<SearchResultsResponse>>(`${this.baseUrl}/search/by-difficulty`, {
        difficulty_level: difficulty,
        subjects,
        limit
      });
      return response.data.results;
    } catch (error) {
      console.error('Failed to search by difficulty:', error);
      throw new Error('Failed to search by difficulty');
    }
  }

  /**
   * Get content suggestions for knowledge gap filling
   */
  async getGapFillingContent(
    currentTopic: string,
    strugglingAreas: string[]
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<GapFillingResponse>>(`${this.baseUrl}/recommendations/gap-filling`, {
        current_topic: currentTopic,
        struggling_areas: strugglingAreas
      });
      return response.data.gap_filling_content;
    } catch (error) {
      console.error('Failed to get gap filling content:', error);
      throw new Error('Failed to get gap filling content');
    }
  }

  /**
   * Search content with natural language queries
   */
  async naturalLanguageSearch(
    query: string,
    context?: {
      user_interests: string[];
      current_knowledge: Record<string, string>;
      learning_style: string;
    }
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<SearchResultsResponse>>(`${this.baseUrl}/search/natural-language`, {
        query,
        context
      });
      return response.data.results;
    } catch (error) {
      console.error('Natural language search failed:', error);
      throw new Error('Failed to perform natural language search');
    }
  }

  /**
   * Get content recommendations for review and reinforcement
   */
  async getReviewRecommendations(
    completedContent: string[],
    lastReviewDates: Record<string, string>
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<ReviewRecommendationsResponse>>(`${this.baseUrl}/recommendations/review`, {
        completed_content: completedContent,
        last_review_dates: lastReviewDates
      });
      return response.data.review_recommendations;
    } catch (error) {
      console.error('Failed to get review recommendations:', error);
      throw new Error('Failed to get review recommendations');
    }
  }

  /**
   * Search for collaborative learning opportunities
   */
  async findCollaborativeContent(
    userInterests: string[],
    skillLevel: string
  ): Promise<SearchResult[]> {
    try {
      const response = await apiClient.post<ApiDataResponse<CollaborativeContentResponse>>(`${this.baseUrl}/search/collaborative`, {
        user_interests: userInterests,
        skill_level: skillLevel
      });
      return response.data.collaborative_content;
    } catch (error) {
      console.error('Failed to find collaborative content:', error);
      throw new Error('Failed to find collaborative content');
    }
  }

  /**
   * Get AI-powered study plan recommendations
   */
  async getStudyPlanRecommendations(
    learningGoals: string[],
    availableTime: number, // hours per week
    targetCompletionDate?: string
  ): Promise<{
    study_plan: {
      week: number;
      topics: string[];
      estimated_hours: number;
      milestones: string[];
    }[];
    total_duration: string;
    success_probability: number;
  }> {
    try {
      const response = await apiClient.post<ApiDataResponse<{
        study_plan: {
          week: number;
          topics: string[];
          estimated_hours: number;
          milestones: string[];
        }[];
        total_duration: string;
        success_probability: number;
      }>>(`${this.baseUrl}/recommendations/study-plan`, {
        learning_goals: learningGoals,
        available_time: availableTime,
        target_completion_date: targetCompletionDate
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get study plan recommendations:', error);
      throw new Error('Failed to get study plan recommendations');
    }
  }
}

// Export singleton instance
export const semanticSearchService = new SemanticSearchService();

// Export class for dependency injection
export { SemanticSearchService };
