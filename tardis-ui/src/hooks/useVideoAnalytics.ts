import { useCallback, useRef } from 'react'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import {
  VideoPlayEvent,
  VideoPauseEvent,
  VideoCompleteEvent,
  VideoProgressEvent,
} from '@/types/analytics'

interface VideoAnalyticsParams {
  knowledgeId: string
  moduleId: string
  videoId: string
  videoTitle?: string
}

/**
 * Hook for standardized video analytics tracking
 *
 * @param params Base video parameters that will be included in all events
 * @returns Object with tracking methods for video interactions
 */
export const useVideoAnalytics = (params: VideoAnalyticsParams) => {
  const {
    trackVideoPlay,
    trackVideoPause,
    trackVideoComplete,
    trackVideoProgress,
  } = useInteractionTracker()

  const watchedSegmentsRef = useRef<[number, number][]>([])
  const playStartTimeRef = useRef<number | null>(null)
  const totalWatchedTimeRef = useRef<number>(0)
  const lastMilestoneRef = useRef<number>(0)
  const playCountRef = useRef<number>(0)

  /**
   * Track video play event
   * @param currentTime Current playback position in seconds
   * @param totalDuration Total video duration in seconds
   * @param quality Video quality (optional)
   */
  const trackPlay = useCallback(
    (currentTime: number, totalDuration: number, quality?: string) => {
      // Record play start time for calculating watched duration
      playStartTimeRef.current = Date.now()

      // Increment play count
      playCountRef.current += 1

      // Calculate progress percentage
      const progressPercent =
        totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

      // Prepare event data
      const eventData: VideoPlayEvent = {
        ...params,
        currentTime,
        totalDuration,
        progressPercent,
        videoId: params.videoId,
        ...(quality !== undefined && { quality }),
      }

      // Track the event
      trackVideoPlay(parseInt(params.videoId, 10) || 0, eventData)
    },
    [params, trackVideoPlay]
  )

  /**
   * Track video pause event
   * @param currentTime Current playback position in seconds
   * @param totalDuration Total video duration in seconds
   * @param pauseReason Reason for pausing (optional)
   */
  const trackPause = useCallback(
    (currentTime: number, totalDuration: number, pauseReason?: string) => {
      // Calculate time watched since last play event
      let timeWatched = 0
      if (playStartTimeRef.current) {
        timeWatched = (Date.now() - playStartTimeRef.current) / 1000 // Convert to seconds

        // Add to total watched time
        totalWatchedTimeRef.current += timeWatched

        // Record segment watched
        if (currentTime > 0 && timeWatched > 0) {
          const startTime = Math.max(0, currentTime - timeWatched)
          watchedSegmentsRef.current.push([startTime, currentTime])
        }

        // Reset play start time
        playStartTimeRef.current = null
      }

      // Calculate progress percentage
      const progressPercent =
        totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

      // Prepare event data
      const eventData: VideoPauseEvent = {
        ...params,
        currentTime,
        totalDuration,
        progressPercent,
        videoId: params.videoId,
        timeWatched,
        ...(pauseReason !== undefined && { pauseReason }),
      }

      // Track the event
      trackVideoPause(parseInt(params.videoId, 10) || 0, eventData)
    },
    [params, trackVideoPause]
  )

  /**
   * Track video progress milestone (25%, 50%, 75%, 100%)
   * @param currentTime Current playback position in seconds
   * @param totalDuration Total video duration in seconds
   */
  const checkAndTrackProgress = useCallback(
    (currentTime: number, totalDuration: number) => {
      if (totalDuration <= 0) return

      const progressPercent = (currentTime / totalDuration) * 100

      // Check for milestone progress (25%, 50%, 75%, 100%)
      const currentMilestone = Math.floor(progressPercent / 25) * 25

      // Only track if we've reached a new milestone
      if (
        currentMilestone > lastMilestoneRef.current &&
        currentMilestone <= 100
      ) {
        lastMilestoneRef.current = currentMilestone

        // Prepare event data
        const eventData: VideoProgressEvent = {
          ...params,
          currentTime,
          totalDuration,
          progressPercent,
          videoId: params.videoId,
          milestone: currentMilestone,
        }

        // Track the event
        trackVideoProgress(parseInt(params.videoId, 10) || 0, eventData)

        return true // Milestone was tracked
      }

      return false // No milestone tracked
    },
    [params, trackVideoProgress]
  )

  /**
   * Track video complete event
   * @param totalDuration Total video duration in seconds
   */
  const trackComplete = useCallback(
    (totalDuration: number) => {
      // Prepare event data
      const eventData: VideoCompleteEvent = {
        ...params,
        videoId: params.videoId,
        watchedSegments: watchedSegmentsRef.current,
        totalWatchedTime: totalWatchedTimeRef.current,
        completePercent:
          totalDuration > 0
            ? Math.min(100, (totalWatchedTimeRef.current / totalDuration) * 100)
            : 0,
        watchCount: playCountRef.current,
      }

      // Track the event
      trackVideoComplete(parseInt(params.videoId, 10) || 0, eventData)

      // Reset tracking data
      watchedSegmentsRef.current = []
      totalWatchedTimeRef.current = 0
      lastMilestoneRef.current = 0
      playCountRef.current = 0
    },
    [params, trackVideoComplete]
  )

  /**
   * Reset all tracking data (useful when changing videos)
   */
  const resetTracking = useCallback(() => {
    watchedSegmentsRef.current = []
    playStartTimeRef.current = null
    totalWatchedTimeRef.current = 0
    lastMilestoneRef.current = 0
    playCountRef.current = 0
  }, [])

  return {
    trackPlay,
    trackPause,
    checkAndTrackProgress,
    trackComplete,
    resetTracking,
  }
}
