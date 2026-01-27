/**
 * Video Data Hook
 * Provides video, chapter, and progress data with real-time updates
 */

import { useState, useEffect, useCallback } from 'react'
import VideoApiService, { Chapter, VideoMetadata, VideoProgress, VideoNote, VideoBookmark } from '@/services/video-api-service'
import { useUser } from '@/contexts/UserContext'

interface UseVideoDataOptions {
  knowledgeId: number
  autoLoad?: boolean
  enableRealTimeProgress?: boolean
}

interface VideoDataState {
  // Video metadata
  metadata: VideoMetadata | null
  chapters: Chapter[]
  
  // User progress
  progress: VideoProgress[]
  currentChapter: Chapter | null
  completedChapters: Set<string>
  
  // User generated content
  notes: VideoNote[]
  bookmarks: VideoBookmark[]
  
  // Loading states
  isLoading: boolean
  isProcessing: boolean
  error: string | null
}

export const useVideoData = ({ knowledgeId, autoLoad = true, enableRealTimeProgress = true }: UseVideoDataOptions) => {
  const { user } = useUser()
  const [state, setState] = useState<VideoDataState>({
    metadata: null,
    chapters: [],
    progress: [],
    currentChapter: null,
    completedChapters: new Set(),
    notes: [],
    bookmarks: [],
    isLoading: false,
    isProcessing: false,
    error: null
  })

  // Track current time for real-time chapter detection
  const [currentTime, setCurrentTime] = useState(0)

  // Load initial data
  const loadVideoData = useCallback(async () => {
    if (!knowledgeId || !user) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Load all data in parallel
      const [metadata, chapters, progress, notes, bookmarks] = await Promise.all([
        VideoApiService.getVideoMetadata(knowledgeId),
        VideoApiService.getVideoChapters(knowledgeId),
        VideoApiService.getVideoProgress(knowledgeId, typeof user.id === 'number' ? user.id : Number(user.id)),
        VideoApiService.getVideoNotes(knowledgeId),
        VideoApiService.getVideoBookmarks(knowledgeId)
      ])

      const completedChapters = new Set(
        progress.filter(p => p.is_completed).map(p => p.chapter_id)
      )

      setState(prev => ({
        ...prev,
        metadata,
        chapters: chapters.sort((a, b) => a.chapter_order - b.chapter_order),
        progress,
        completedChapters,
        notes,
        bookmarks,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load video data',
        isLoading: false
      }))
    }
  }, [knowledgeId, user])

  // Check processing status
  const checkProcessingStatus = useCallback(async () => {
    if (!knowledgeId) return

    try {
      const metadata = await VideoApiService.getVideoMetadata(knowledgeId)
      
      setState(prev => ({
        ...prev,
        metadata,
        isProcessing: metadata.processingStatus === 'processing'
      }))

      // If processing completed, reload chapters
      if (metadata.processingStatus === 'completed' && state.chapters.length === 0) {
        loadVideoData()
      }
    } catch (error) {
      console.error('Failed to check processing status:', error)
    }
  }, [knowledgeId, state.chapters.length, loadVideoData])

  // Update current chapter based on timestamp
  useEffect(() => {
    if (!state.chapters.length) return

    const currentChapter = state.chapters.find(chapter =>
      currentTime >= chapter.timestamp_start && currentTime <= chapter.timestamp_end
    )

    setState(prev => ({
      ...prev,
      currentChapter: currentChapter || null
    }))
  }, [currentTime, state.chapters])

  // Track video progress
  const trackProgress = useCallback(async (data: {
    chapter_id: string
    timestamp: number
    event_type: 'video_start' | 'video_pause' | 'video_seek' | 'chapter_complete'
  }) => {
    if (!knowledgeId) return

    try {
      await VideoApiService.trackVideoProgress({
        knowledge_id: knowledgeId,
        ...data
      })

      // Update local progress if it's a completion event
      if (data.event_type === 'chapter_complete') {
        setState(prev => ({
          ...prev,
          completedChapters: new Set([...prev.completedChapters, data.chapter_id])
        }))
      }
    } catch (error) {
      console.error('Failed to track progress:', error)
    }
  }, [knowledgeId])

  // Mark chapter as complete
  const markChapterComplete = useCallback(async (chapterId: string) => {
    try {
      await VideoApiService.markChapterComplete(knowledgeId, chapterId)
      setState(prev => ({
        ...prev,
        completedChapters: new Set([...prev.completedChapters, chapterId])
      }))
    } catch (error) {
      console.error('Failed to mark chapter complete:', error)
    }
  }, [knowledgeId])

  // Add note
  const addNote = useCallback(async (chapterId: string, timestamp: number, content: string) => {
    try {
      const note = await VideoApiService.createVideoNote({
        knowledge_id: knowledgeId,
        chapter_id: chapterId,
        timestamp,
        content
      })

      setState(prev => ({
        ...prev,
        notes: [...prev.notes, note]
      }))

      return note
    } catch (error) {
      console.error('Failed to add note:', error)
      throw error
    }
  }, [knowledgeId])

  // Add bookmark
  const addBookmark = useCallback(async (chapterId: string, timestamp: number, title: string, description?: string) => {
    try {
      const bookmarkData: {
        knowledge_id: number
        chapter_id: string
        timestamp: number
        title: string
        description?: string
      } = {
        knowledge_id: knowledgeId,
        chapter_id: chapterId,
        timestamp,
        title
      }
      if (description !== undefined) {
        bookmarkData.description = description
      }
      const bookmark = await VideoApiService.createVideoBookmark(bookmarkData)

      setState(prev => ({
        ...prev,
        bookmarks: [...prev.bookmarks, bookmark]
      }))

      return bookmark
    } catch (error) {
      console.error('Failed to add bookmark:', error)
      throw error
    }
  }, [knowledgeId])

  // Process video (generate chapters and content)
  const processVideo = useCallback(async (options?: {
    generateChapters?: boolean
    generateContent?: boolean
    contentTypes?: string[]
    language?: string
  }) => {
    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      await VideoApiService.processVideo(knowledgeId, options)
      
      // Start polling for completion
      const pollInterval = setInterval(() => {
        checkProcessingStatus()
      }, 5000)

      // Clean up polling when processing completes
      const cleanup = () => clearInterval(pollInterval)
      setTimeout(cleanup, 300000) // Stop polling after 5 minutes max

      return cleanup
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      throw error
    }
  }, [knowledgeId, checkProcessingStatus])

  // Get video stream URL
  const getStreamUrl = useCallback(async (quality?: string) => {
    return await VideoApiService.getVideoStreamUrl(knowledgeId, quality)
  }, [knowledgeId])

  // Search video content
  const searchContent = useCallback(async (query: string) => {
    return await VideoApiService.searchVideoContent(knowledgeId, query)
  }, [knowledgeId])

  // Get chapter-specific data
  const getChapterData = useCallback((chapterId: string) => {
    const chapter = state.chapters.find(c => c.id === chapterId)
    const chapterProgress = state.progress.find(p => p.chapter_id === chapterId)
    const chapterNotes = state.notes.filter(n => n.chapter_id === chapterId)
    const chapterBookmarks = state.bookmarks.filter(b => b.chapter_id === chapterId)
    const isCompleted = state.completedChapters.has(chapterId)

    return {
      chapter,
      progress: chapterProgress,
      notes: chapterNotes,
      bookmarks: chapterBookmarks,
      isCompleted,
      watchProgress: chapterProgress?.completion_percentage || 0
    }
  }, [state.chapters, state.progress, state.notes, state.bookmarks, state.completedChapters])

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadVideoData()
    }
  }, [autoLoad, loadVideoData])

  // Set up real-time progress tracking
  useEffect(() => {
    if (!enableRealTimeProgress) return

    // Update current time every second during playback
    const interval = setInterval(() => {
      // This would be triggered by the video player
      // For now, it's a placeholder for the integration
    }, 1000)

    return () => clearInterval(interval)
  }, [enableRealTimeProgress])

  return {
    // Data
    ...state,
    currentTime,
    
    // Actions
    loadVideoData,
    processVideo,
    trackProgress,
    markChapterComplete,
    addNote,
    addBookmark,
    getStreamUrl,
    searchContent,
    getChapterData,
    setCurrentTime,
    
    // Computed values
    totalDuration: state.metadata?.duration || 0,
    totalChapters: state.chapters.length,
    completedChaptersCount: state.completedChapters.size,
    overallProgress: state.chapters.length > 0 
      ? (state.completedChapters.size / state.chapters.length) * 100 
      : 0,
    
    // Status checks
    isReady: !state.isLoading && !state.isProcessing && state.chapters.length > 0,
    hasChapters: state.chapters.length > 0,
    hasNotes: state.notes.length > 0,
    hasBookmarks: state.bookmarks.length > 0
  }
}

export default useVideoData