import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Bookmark,
  MessageSquare,
  Download,
  Share,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { useVideoState } from './useVideoState'
import { useVideoAnalytics } from '@/hooks/useVideoAnalytics'
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration'
import useVideoData from '@/hooks/useVideoData'
import VoiceControlBar from '@/components/practice/VoiceControlBar'
import ChapterListSidebar from './ChapterListSidebar'
import EnhancedVideoTimeline from './EnhancedVideoTimeline'
import { TimelineMarker } from './VideoTypes'

interface PlaybackSpeed {
  value: number
  label: string
}

interface UdemyPlusVideoPlayerProps {
  knowledgeId: number
  title?: string
  markers?: TimelineMarker[]
  autoPlay?: boolean
  onProgress?: (progress: any) => void
  className?: string
}

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2, label: '2x' }
]

const UdemyPlusVideoPlayer: React.FC<UdemyPlusVideoPlayerProps> = ({
  knowledgeId,
  title,
  markers = [],
  autoPlay = false,
  onProgress,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Video data hook for real API integration
  const videoData = useVideoData({ 
    knowledgeId, 
    autoLoad: true, 
    enableRealTimeProgress: true 
  })
  
  // Video state management
  const [state, actions] = useVideoState(
    videoRef,
    containerRef,
    markers,
    undefined,
    undefined,
    undefined
  )
  
  // Component state
  const [showSidebar, setShowSidebar] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string>('')
  
  // Control visibility timeout
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // Analytics and voice integration
  const analytics = useVideoAnalytics({
    videoId: knowledgeId.toString(),
    knowledgeId: knowledgeId.toString(),
    moduleId: 'default'
  })
  
  const voice = useVoiceIntegration({
    autoRead: false,
    language: 'english',
    enableCommands: true
  })

  // Load video stream URL
  useEffect(() => {
    const loadVideoSrc = async () => {
      if (videoData.isReady) {
        try {
          const streamUrl = await videoData.getStreamUrl()
          setVideoSrc(streamUrl)
        } catch (error) {
          console.error('Failed to load video stream:', error)
        }
      }
    }
    
    loadVideoSrc()
  }, [videoData.isReady])

  // Sync current time with video data hook
  useEffect(() => {
    videoData.setCurrentTime(state.currentTime)
  }, [state.currentTime, videoData.setCurrentTime])

  // Track video events
  useEffect(() => {
    if (!videoData.currentChapter) return

    const handleTimeUpdate = async () => {
      await videoData.trackProgress({
        chapter_id: videoData.currentChapter!.id,
        timestamp: state.currentTime,
        event_type: state.isPlaying ? 'video_start' : 'video_pause'
      })
    }

    // Throttle time updates to avoid too many API calls
    const timeoutId = setTimeout(handleTimeUpdate, 1000)
    return () => clearTimeout(timeoutId)
  }, [state.currentTime, state.isPlaying, videoData.currentChapter, videoData.trackProgress])

  // Setup voice commands
  useEffect(() => {
    voice.addVoiceCommand({
      command: 'play',
      variations: ['play video', 'start', 'resume'],
      action: () => actions.play()
    })
    
    voice.addVoiceCommand({
      command: 'pause',
      variations: ['pause video', 'stop'],
      action: () => actions.pause()
    })
    
    voice.addVoiceCommand({
      command: 'next chapter',
      variations: ['next', 'skip chapter'],
      action: () => goToNextChapter()
    })
    
    voice.addVoiceCommand({
      command: 'previous chapter',
      variations: ['previous', 'back'],
      action: () => goToPreviousChapter()
    })
    
    voice.addVoiceCommand({
      command: 'faster',
      variations: ['speed up', 'increase speed'],
      action: () => changePlaybackSpeed(1)
    })
    
    voice.addVoiceCommand({
      command: 'slower',
      variations: ['slow down', 'decrease speed'],
      action: () => changePlaybackSpeed(-1)
    })
  }, [actions])

  // Control visibility management
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [state.isPlaying])

  // Update buffered time
  useEffect(() => {
    const updateBuffered = () => {
      if (videoRef.current?.buffered.length) {
        const buffered = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
        setBufferedTime(buffered)
      }
    }

    const video = videoRef.current
    if (video) {
      video.addEventListener('progress', updateBuffered)
      return () => video.removeEventListener('progress', updateBuffered)
    }
    return undefined
  }, [])

  // Track analytics
  useEffect(() => {
    if (state.isPlaying) {
      analytics.trackPlay(state.currentTime, state.duration)
    } else {
      analytics.trackPause(state.currentTime, state.duration)
    }
  }, [state.isPlaying, state.currentTime, state.duration, analytics])

  useEffect(() => {
    if (state.duration > 0) {
      analytics.checkAndTrackProgress(state.currentTime, state.duration)
    }
  }, [state.currentTime, state.duration, analytics])

  // Chapter navigation
  const goToNextChapter = () => {
    const currentIndex = videoData.chapters.findIndex(ch => ch.id === videoData.currentChapter?.id)
    if (currentIndex < videoData.chapters.length - 1) {
      const nextChapter = videoData.chapters[currentIndex + 1]
      if (nextChapter) {
        actions.seek(nextChapter.timestamp_start)
        voice.speak(`Moving to next chapter: ${nextChapter.title}`)
      }
    }
  }

  const goToPreviousChapter = () => {
    const currentIndex = videoData.chapters.findIndex(ch => ch.id === videoData.currentChapter?.id)
    if (currentIndex > 0) {
      const prevChapter = videoData.chapters[currentIndex - 1]
      if (prevChapter) {
        actions.seek(prevChapter.timestamp_start)
        voice.speak(`Moving to previous chapter: ${prevChapter.title}`)
      }
    }
  }

  // Playback speed control
  const changePlaybackSpeed = (direction: number) => {
    const currentIndex = PLAYBACK_SPEEDS.findIndex(speed => speed.value === playbackSpeed)
    const newIndex = Math.max(0, Math.min(PLAYBACK_SPEEDS.length - 1, currentIndex + direction))
    const newSpeed = PLAYBACK_SPEEDS[newIndex]?.value
    if (newSpeed !== undefined) {
      setPlaybackSpeed(newSpeed)
      if (videoRef.current) {
        videoRef.current.playbackRate = newSpeed
      }
    }
  }

  // Handle chapter click
  const handleChapterClick = (startTime: number, chapterId: string) => {
    actions.seek(startTime)
    
    const chapter = videoData.chapters.find(ch => ch.id === chapterId)
    if (chapter) {
      voice.speak(`Jumping to ${chapter.title}`)
      
      // Track seek event
      videoData.trackProgress({
        chapter_id: chapterId,
        timestamp: startTime,
        event_type: 'video_seek'
      })
    }
  }

  // Handle marker click
  const handleMarkerClick = (marker: TimelineMarker) => {
    actions.seek(marker.time)
    if (marker.label) {
      voice.speak(`Marker: ${marker.label}`)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.toLowerCase() === 'input') return
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          actions.togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          actions.skipTime(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          actions.skipTime(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          actions.setVolume(Math.min(1, state.volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          actions.setVolume(Math.max(0, state.volume - 0.1))
          break
        case 'f':
          e.preventDefault()
          actions.toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          actions.toggleMute()
          break
        case 'n':
          e.preventDefault()
          goToNextChapter()
          break
        case 'p':
          e.preventDefault()
          goToPreviousChapter()
          break
        case '>':
          e.preventDefault()
          changePlaybackSpeed(1)
          break
        case '<':
          e.preventDefault()
          changePlaybackSpeed(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [actions, state.volume])

  // Show loading state while video data is loading
  if (videoData.isLoading || videoData.isProcessing) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">
            {videoData.isProcessing ? 'Processing Video...' : 'Loading Video...'}
          </h3>
          <p className="text-gray-400">
            {videoData.isProcessing 
              ? 'Generating chapters and educational content' 
              : 'Preparing your video experience'
            }
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (videoData.error) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Video</div>
          <p className="text-gray-400 mb-4">{videoData.error}</p>
          <button 
            onClick={videoData.loadVideoData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show process video option if no chapters
  if (!videoData.hasChapters && !videoData.isProcessing) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <h3 className="text-white text-lg font-semibold mb-2">Process Video</h3>
          <p className="text-gray-400 mb-4">Generate chapters and educational content from this video</p>
          <button 
            onClick={() => videoData.processVideo({
              generateChapters: true,
              generateContent: true,
              contentTypes: ['notes', 'summary', 'quiz', 'mindmap']
            })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Processing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${state.isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => state.isPlaying && setShowControls(false)}
    >
      {/* Voice Control Bar */}
      {!state.isFullscreen && (
        <div className="absolute top-4 right-4 z-40">
          <VoiceControlBar
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            voiceEnabled={voice.voiceEnabled}
            isSupported={voice.isSupported}
            onToggleListening={voice.startListening}
            onToggleSpeaking={() => {
              if (voice.isSpeaking) {
                voice.stopSpeaking()
              } else if (videoData.currentChapter) {
                voice.speak(`Currently watching: ${videoData.currentChapter.title}`)
              }
            }}
            onToggleVoiceEnabled={() => voice.setVoiceEnabled(!voice.voiceEnabled)}
            onShowHelp={() => voice.speak('Voice commands: say play, pause, next chapter, previous chapter, faster, or slower')}
            className="bg-black/50 backdrop-blur-sm"
          />
        </div>
      )}

      <div className="flex h-full">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onClick={actions.togglePlayPause}
            autoPlay={autoPlay}
          />

          {/* Video Controls Overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-between p-4"
              >
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-lg font-semibold truncate flex-1">
                    {title || videoData.currentChapter?.title || 'Video'}
                  </h2>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                    >
                      {showSidebar ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="space-y-4">
                  {/* Timeline */}
                  <EnhancedVideoTimeline
                    currentTime={state.currentTime}
                    duration={state.duration}
                    bufferedTime={bufferedTime}
                    chapters={videoData.chapters.map(ch => ({
                      id: ch.id,
                      title: ch.title,
                      startTime: ch.timestamp_start,
                      endTime: ch.timestamp_end,
                      type: ch.meta_data.type,
                      color: ch.meta_data.type === 'lecture' ? '#3B82F6' : 
                             ch.meta_data.type === 'demo' ? '#10B981' :
                             ch.meta_data.type === 'exercise' ? '#F59E0B' :
                             ch.meta_data.type === 'quiz' ? '#EF4444' : '#8B5CF6',
                      isCompleted: videoData.completedChapters.has(ch.id)
                    }))}
                    markers={markers}
                    onSeek={actions.seek}
                    onMarkerClick={handleMarkerClick}
                    onChapterClick={(chapter) => handleChapterClick(chapter.startTime, chapter.id)}
                  />

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={actions.togglePlayPause}
                        className="p-3 text-white hover:bg-white/20 rounded-full transition-colors"
                      >
                        {state.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </button>

                      <button
                        onClick={() => actions.skipTime(-10)}
                        className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => actions.skipTime(10)}
                        className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                      >
                        <RotateCw className="h-5 w-5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={actions.toggleMute}
                          className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                        >
                          {state.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={state.isMuted ? 0 : state.volume}
                          onChange={(e) => actions.setVolume(parseFloat(e.target.value))}
                          className="w-20 accent-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Playback Speed */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="px-3 py-1 text-sm text-white hover:bg-white/20 rounded transition-colors"
                        >
                          {PLAYBACK_SPEEDS.find(s => s.value === playbackSpeed)?.label}
                        </button>
                        
                        <AnimatePresence>
                          {showSpeedMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full mb-2 right-0 bg-gray-900 border border-gray-600 rounded-lg py-2 min-w-24"
                            >
                              {PLAYBACK_SPEEDS.map((speed) => (
                                <button
                                  key={speed.value}
                                  onClick={() => {
                                    setPlaybackSpeed(speed.value)
                                    if (videoRef.current) {
                                      videoRef.current.playbackRate = speed.value
                                    }
                                    setShowSpeedMenu(false)
                                  }}
                                  className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-700 transition-colors ${
                                    playbackSpeed === speed.value ? 'text-blue-400' : 'text-white'
                                  }`}
                                >
                                  {speed.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={actions.toggleFullscreen}
                        className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                      >
                        {state.isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chapter Sidebar */}
        <AnimatePresence>
          {showSidebar && !state.isFullscreen && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <ChapterListSidebar
                chapters={videoData.chapters.map(ch => ({
                  id: ch.id,
                  title: ch.title,
                  startTime: ch.timestamp_start,
                  endTime: ch.timestamp_end,
                  duration: ch.meta_data.duration,
                  type: ch.meta_data.type,
                  description: ch.content?.substring(0, 200) + (ch.content?.length > 200 ? '...' : ''),
                  thumbnailUrl: ch.meta_data.thumbnail_url,
                  isCompleted: videoData.completedChapters.has(ch.id),
                  watchProgress: videoData.getChapterData(ch.id).watchProgress,
                  hasNotes: videoData.getChapterData(ch.id).notes.length > 0,
                  hasBookmarks: videoData.getChapterData(ch.id).bookmarks.length > 0,
                  difficulty: ch.meta_data.difficulty,
                  learningObjectives: ch.meta_data.learning_objectives,
                  prerequisites: ch.meta_data.prerequisites,
                  resources: [] // TODO: Add resources from chapter meta_data
                }))}
                currentTime={state.currentTime}
                videoDuration={state.duration}
                isPlaying={state.isPlaying}
                onChapterClick={handleChapterClick}
                onChapterComplete={videoData.markChapterComplete}
                onAddNote={async (chapterId, timestamp) => {
                  const content = prompt('Enter your note:')
                  if (content) {
                    await videoData.addNote(chapterId, timestamp, content)
                  }
                }}
                onAddBookmark={async (chapterId, timestamp) => {
                  const title = prompt('Enter bookmark title:')
                  if (title) {
                    await videoData.addBookmark(chapterId, timestamp, title)
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UdemyPlusVideoPlayer