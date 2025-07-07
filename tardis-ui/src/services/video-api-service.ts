/**
 * Video API Service
 * Integrates with the unified API service for video and chapter operations
 */

import { unifiedApiService } from './unified-api-service'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  format: string
  hasSubtitles: boolean
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface Chapter {
  id: string
  knowledge_id: number
  title: string
  content: string
  timestamp_start: number
  timestamp_end: number
  chapter_order: number
  meta_data: {
    duration: number
    type: 'lecture' | 'demo' | 'exercise' | 'quiz' | 'discussion'
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    learning_objectives: string[]
    prerequisites: string[]
    has_notes: boolean
    has_quiz: boolean
    has_mindmap: boolean
    thumbnail_url?: string
  }
}

export interface VideoProgress {
  user_id: number
  knowledge_id: number
  chapter_id: string
  current_timestamp: number
  completion_percentage: number
  watch_time: number
  last_watched: string
  is_completed: boolean
}

export interface VideoAnalytics {
  total_watch_time: number
  completion_rate: number
  average_session_duration: number
  chapter_completion_rates: { [chapterId: string]: number }
  popular_chapters: string[]
  drop_off_points: number[]
  engagement_score: number
}

export interface VideoNote {
  id: string
  user_id: number
  knowledge_id: number
  chapter_id: string
  timestamp: number
  content: string
  created_at: string
  updated_at: string
}

export interface VideoBookmark {
  id: string
  user_id: number
  knowledge_id: number
  chapter_id: string
  timestamp: number
  title: string
  description?: string
  created_at: string
}

export class VideoApiService {
  /**
   * Upload a video file for processing
   */
  static async uploadVideo(file: File, title: string): Promise<{ knowledge_id: number; media_id: string }> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    // Upload the video file to media service
    const uploadResponse = await (client as any).uploadMediaV2MediaUploadPost({
      file,
      title
    })

    // Create knowledge entry for the video
    const knowledgeResponse = await unifiedApiService.uploadKnowledgeFiles([file], title)
    
    return {
      knowledge_id: knowledgeResponse.knowledge_id,
      media_id: uploadResponse.media_id
    }
  }

  /**
   * Get video metadata and processing status
   */
  static async getVideoMetadata(knowledgeId: number): Promise<VideoMetadata> {
    const processingStatus = await unifiedApiService.getProcessingStatus(knowledgeId)
    
    return {
      duration: processingStatus.meta_data?.duration || 0,
      width: processingStatus.meta_data?.width || 1920,
      height: processingStatus.meta_data?.height || 1080,
      fps: processingStatus.meta_data?.fps || 30,
      bitrate: processingStatus.meta_data?.bitrate || 5000,
      format: processingStatus.meta_data?.format || 'mp4',
      hasSubtitles: processingStatus.meta_data?.has_subtitles || false,
      processingStatus: processingStatus.status
    }
  }

  /**
   * Get all chapters for a video with their timestamps
   */
  static async getVideoChapters(knowledgeId: number): Promise<Chapter[]> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).getChaptersV2ChaptersKnowledgeIdGet({
      knowledge_id: knowledgeId
    })

    return response.chapters.map((chapter: any) => ({
      id: chapter.id,
      knowledge_id: knowledgeId,
      title: chapter.meta_data?.title || `Chapter ${chapter.chapter_order}`,
      content: chapter.content,
      timestamp_start: chapter.meta_data?.timestamp_start || 0,
      timestamp_end: chapter.meta_data?.timestamp_end || 0,
      chapter_order: chapter.chapter_order,
      meta_data: {
        duration: (chapter.meta_data?.timestamp_end || 0) - (chapter.meta_data?.timestamp_start || 0),
        type: chapter.meta_data?.type || 'lecture',
        difficulty: chapter.meta_data?.difficulty || 'intermediate',
        learning_objectives: chapter.meta_data?.learning_objectives || [],
        prerequisites: chapter.meta_data?.prerequisites || [],
        has_notes: !!chapter.meta_data?.has_notes,
        has_quiz: !!chapter.meta_data?.has_quiz,
        has_mindmap: !!chapter.meta_data?.has_mindmap,
        thumbnail_url: chapter.meta_data?.thumbnail_url
      }
    }))
  }

  /**
   * Get specific chapter content
   */
  static async getChapter(knowledgeId: number, chapterId: string): Promise<Chapter> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).getChapterV2ChaptersKnowledgeIdChapterIdGet({
      knowledge_id: knowledgeId,
      chapter_id: chapterId
    })

    return {
      id: response.id,
      knowledge_id: knowledgeId,
      title: response.meta_data?.title || `Chapter ${response.chapter_order}`,
      content: response.content,
      timestamp_start: response.meta_data?.timestamp_start || 0,
      timestamp_end: response.meta_data?.timestamp_end || 0,
      chapter_order: response.chapter_order,
      meta_data: {
        duration: (response.meta_data?.timestamp_end || 0) - (response.meta_data?.timestamp_start || 0),
        type: response.meta_data?.type || 'lecture',
        difficulty: response.meta_data?.difficulty || 'intermediate',
        learning_objectives: response.meta_data?.learning_objectives || [],
        prerequisites: response.meta_data?.prerequisites || [],
        has_notes: !!response.meta_data?.has_notes,
        has_quiz: !!response.meta_data?.has_quiz,
        has_mindmap: !!response.meta_data?.has_mindmap,
        thumbnail_url: response.meta_data?.thumbnail_url
      }
    }
  }

  /**
   * Start video processing to generate chapters and content
   */
  static async processVideo(knowledgeId: number, options: {
    generateChapters?: boolean
    generateContent?: boolean
    contentTypes?: string[]
    language?: string
  } = {}): Promise<{ task_id: string }> {
    return await unifiedApiService.startProcessing(knowledgeId, {
      generateContent: options.generateContent ?? true,
      contentTypes: options.contentTypes ?? ['notes', 'summary', 'quiz', 'mindmap'],
      contentLanguage: options.language ?? 'English'
    })
  }

  /**
   * Track video viewing progress
   */
  static async trackVideoProgress(data: {
    knowledge_id: number
    chapter_id: string
    timestamp: number
    event_type: 'video_start' | 'video_pause' | 'video_seek' | 'chapter_complete'
    session_id?: string
  }): Promise<void> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    await (client as any).trackEventV2AnalyticsTrackEventPost({
      user_id: 1, // TODO: Get from auth context
      knowledge_id: data.knowledge_id,
      chapter_id: data.chapter_id,
      event_type: data.event_type,
      data: {
        timestamp: data.timestamp,
        session_id: data.session_id
      }
    })
  }

  /**
   * Get user's video progress
   */
  static async getVideoProgress(knowledgeId: number, userId: number): Promise<VideoProgress[]> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).getUserProgressV2AnalyticsUserUserIdProgressGet({
      user_id: userId,
      knowledge_id: knowledgeId
    })

    return response.progress_data || []
  }

  /**
   * Get video analytics
   */
  static async getVideoAnalytics(knowledgeId: number): Promise<VideoAnalytics> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).getVideoStatsV2AnalyticsKnowledgeKnowledgeIdVideoStatsGet({
      knowledge_id: knowledgeId
    })

    return {
      total_watch_time: response.total_watch_time || 0,
      completion_rate: response.completion_rate || 0,
      average_session_duration: response.average_session_duration || 0,
      chapter_completion_rates: response.chapter_completion_rates || {},
      popular_chapters: response.popular_chapters || [],
      drop_off_points: response.drop_off_points || [],
      engagement_score: response.engagement_score || 0
    }
  }

  /**
   * Create a note at specific timestamp
   */
  static async createVideoNote(data: {
    knowledge_id: number
    chapter_id: string
    timestamp: number
    content: string
  }): Promise<VideoNote> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).createNoteV2NotesPost({
      user_id: 1, // TODO: Get from auth context
      knowledge_id: data.knowledge_id,
      chapter_id: data.chapter_id,
      timestamp: data.timestamp,
      content: data.content
    })

    return response
  }

  /**
   * Get notes for a video
   */
  static async getVideoNotes(knowledgeId: number, chapterId?: string): Promise<VideoNote[]> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).getNotesV2NotesKnowledgeIdGet({
      knowledge_id: knowledgeId,
      chapter_id: chapterId
    })

    return response.notes || []
  }

  /**
   * Create a bookmark at specific timestamp
   */
  static async createVideoBookmark(data: {
    knowledge_id: number
    chapter_id: string
    timestamp: number
    title: string
    description?: string
  }): Promise<VideoBookmark> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).createBookmarkV2BookmarksPost({
      user_id: 1, // TODO: Get from auth context
      knowledge_id: data.knowledge_id,
      chapter_id: data.chapter_id,
      timestamp: data.timestamp,
      title: data.title,
      description: data.description
    })

    return response
  }

  /**
   * Get bookmarks for a video
   */
  static async getVideoBookmarks(knowledgeId: number, chapterId?: string): Promise<VideoBookmark[]> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).getBookmarksV2BookmarksKnowledgeIdGet({
      knowledge_id: knowledgeId,
      chapter_id: chapterId
    })

    return response.bookmarks || []
  }

  /**
   * Mark chapter as completed
   */
  static async markChapterComplete(knowledgeId: number, chapterId: string): Promise<void> {
    await this.trackVideoProgress({
      knowledge_id: knowledgeId,
      chapter_id: chapterId,
      timestamp: 0, // Will be set by the backend
      event_type: 'chapter_complete'
    })
  }

  /**
   * Get video streaming URL with optional quality
   */
  static async getVideoStreamUrl(knowledgeId: number, quality?: string): Promise<string> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    // First get the media ID from knowledge
    const processingStatus = await unifiedApiService.getProcessingStatus(knowledgeId)
    const mediaId = processingStatus.meta_data?.media_id

    if (!mediaId) {
      throw new Error('No media file found for this knowledge entry')
    }

    // Get presigned URL for streaming
    const response = await (client as any).getPresignedUrlV2MediaMediaIdPresignedUrlPost({
      media_id: mediaId,
      quality: quality || 'original'
    })

    return response.url
  }

  /**
   * Search within video content
   */
  static async searchVideoContent(knowledgeId: number, query: string): Promise<{
    chapters: Array<{
      chapter_id: string
      title: string
      matches: Array<{
        timestamp: number
        text: string
        relevance: number
      }>
    }>
  }> {
    const client = unifiedApiService.getClient()
    if (!client) throw new Error('API client not initialized')

    const response = await (client as any).searchContentV2SearchKnowledgeIdGet({
      knowledge_id: knowledgeId,
      query: query,
      include_timestamps: true
    })

    return response
  }
}

export default VideoApiService