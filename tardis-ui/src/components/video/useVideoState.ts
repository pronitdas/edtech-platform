import { useState, useCallback, useRef } from 'react'
import { VideoState, VideoStateActions, TimelineMarker } from './VideoTypes'

/**
 * Custom hook for managing video player state and actions
 * @param videoRef Reference to the video element
 * @param containerRef Reference to the container element
 * @param markers Array of timeline markers
 * @param onPlay Callback for when video starts playing
 * @param onPause Callback for when video is paused
 * @param onSeek Callback for when video is seeked
 * @returns Video state and actions
 */
export function useVideoState(
  videoRef: React.RefObject<HTMLVideoElement>,
  containerRef: React.RefObject<HTMLDivElement>,
  markers: TimelineMarker[] = [],
  onPlay?: () => void,
  onPause?: () => void,
  onSeek?: () => void
): [VideoState, VideoStateActions] {
  // Initialize state
  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isSeeking: false,
    error: null,
    currentChapter: null,
  })

  // Create refs for internal use
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Set metadata loaded
  const handleMetadataLoaded = useCallback(() => {
    if (videoRef.current) {
      setState(prev => ({
        ...prev,
        duration: videoRef.current!.duration,
      }))
    }
  }, [videoRef])

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (state.isPlaying) {
        videoRef.current.pause()
        if (onPause) onPause()
      } else {
        videoRef.current.play().catch(err => {
          setState(prev => ({
            ...prev,
            error: `Error playing video: ${err.message}`,
          }))
        })
        if (onPlay) onPlay()
      }
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
    }
  }, [state.isPlaying, videoRef, onPlay, onPause])

  // Play the video
  const play = useCallback(() => {
    if (videoRef.current && !state.isPlaying) {
      videoRef.current.play().catch(err => {
        setState(prev => ({
          ...prev,
          error: `Error playing video: ${err.message}`,
        }))
      })
      if (onPlay) onPlay()
      setState(prev => ({ ...prev, isPlaying: true }))
    }
  }, [state.isPlaying, videoRef, onPlay])

  // Pause the video
  const pause = useCallback(() => {
    if (videoRef.current && state.isPlaying) {
      videoRef.current.pause()
      if (onPause) onPause()
      setState(prev => ({ ...prev, isPlaying: false }))
    }
  }, [state.isPlaying, videoRef, onPause])

  // Seek to a specific time
  const seek = useCallback(
    (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
        setState(prev => ({ ...prev, currentTime: time }))
        if (onSeek) onSeek()

        // Update current chapter based on new time
        if (markers && markers.length > 0) {
          const currentMarker =
            [...markers]
              .sort((a, b) => a.time - b.time)
              .filter(marker => marker.time <= time)
              .pop() || null

          setState(prev => ({
            ...prev,
            currentChapter: currentMarker,
          }))
        }
      }
    },
    [videoRef, onSeek, markers]
  )

  // Set current time
  const setCurrentTime = useCallback(
    (time: number) => {
      setState(prev => ({ ...prev, currentTime: time }))

      // Update current chapter based on time
      if (markers && markers.length > 0) {
        const currentMarker =
          [...markers]
            .sort((a, b) => a.time - b.time)
            .filter(marker => marker.time <= time)
            .pop() || null

        if (
          currentMarker &&
          (!state.currentChapter ||
            currentMarker.id !== state.currentChapter.id)
        ) {
          setState(prev => ({
            ...prev,
            currentChapter: currentMarker,
          }))
        }
      }
    },
    [markers, state.currentChapter]
  )

  // Set volume
  const setVolume = useCallback(
    (volume: number) => {
      if (videoRef.current) {
        videoRef.current.volume = volume
        setState(prev => ({
          ...prev,
          volume,
          isMuted: volume === 0,
        }))
      }
    },
    [videoRef]
  )

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !state.isMuted
      videoRef.current.muted = newMutedState
      setState(prev => ({ ...prev, isMuted: newMutedState }))
    }
  }, [state.isMuted, videoRef])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setState(prev => ({ ...prev, isFullscreen: true }))
        })
        .catch(err => {
          setState(prev => ({
            ...prev,
            error: `Error entering fullscreen: ${err.message}`,
          }))
        })
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setState(prev => ({ ...prev, isFullscreen: false }))
        })
        .catch(err => {
          setState(prev => ({
            ...prev,
            error: `Error exiting fullscreen: ${err.message}`,
          }))
        })
    }
  }, [containerRef])

  // Skip forward or backward
  const skipTime = useCallback(
    (seconds: number) => {
      if (videoRef.current) {
        const newTime = Math.max(
          0,
          Math.min(state.duration, videoRef.current.currentTime + seconds)
        )
        videoRef.current.currentTime = newTime
        setState(prev => ({ ...prev, currentTime: newTime }))
        if (onSeek) onSeek()
      }
    },
    [videoRef, state.duration, onSeek]
  )

  // Actions object
  const actions: VideoStateActions = {
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    skipTime,
    setCurrentTime,
  }

  return [state, actions]
}
