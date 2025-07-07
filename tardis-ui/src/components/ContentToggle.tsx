import { useState, useEffect } from 'react'
import { BookOpen, Video, ArrowLeftRight } from 'lucide-react'
import { VideoPlayer } from './video/VideoPlayer'
import MarkdownSlideshow from './MarkdownSlideshow'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'

interface TimelineMarker {
  time: number
  label?: string
  type?: 'latex' | 'code' | 'roleplay' | 'default'
  content?: string
  active?: boolean
  id?: string
  chapterTitle?: string
  description?: string
}

interface ContentToggleProps {
  videoSrc: string
  videoTitle: string
  markers?: TimelineMarker[]
  notes: string | string[]
  knowledgeId: string
}

const ContentToggle = ({
  videoSrc,
  videoTitle,
  markers = [],
  notes,
  knowledgeId,
}: ContentToggleProps) => {
  const [showVideo, setShowVideo] = useState(true)
  const [processedNotes, setProcessedNotes] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeChapterId, setActiveChapterId] = useState<string | undefined>(
    undefined
  )
  const [currentTime, setCurrentTime] = useState(0)
  const [activeNoteIndex, setActiveNoteIndex] = useState(0)

  const {
    trackVideoPlay,
    trackVideoPause,
    trackContentView,
    trackEvent, // Internal method for custom events like seek
  } = useInteractionTracker() as any // Cast to access internal trackEvent

  // Process notes on component mount
  useEffect(() => {
    if (!notes) {
      setProcessedNotes(['Content is being generated...'])
    } else if (typeof notes === 'string') {
      setProcessedNotes(
        notes.includes('|||||') ? notes.split('|||||') : [notes]
      )
    } else if (Array.isArray(notes)) {
      setProcessedNotes(notes)
    }
  }, [notes])

  // Sync note index with active chapter
  useEffect(() => {
    if (markers.length && activeChapterId) {
      const index = markers.findIndex(marker => marker.id === activeChapterId)
      if (index >= 0 && index < processedNotes.length) {
        setActiveNoteIndex(index)
      }
    }
  }, [activeChapterId, markers, processedNotes])

  // Toggle between video and notes with animation
  const toggleContent = () => {
    setIsTransitioning(true)

    // Track interaction
    if (showVideo) {
      trackContentView(knowledgeId, { type: 'notes_view' })
    }

    // Delay state change for animation
    setTimeout(() => {
      setShowVideo(!showVideo)
      setIsTransitioning(false)
    }, 300)
  }

  // Handle marker click from notes
  const handleMarkerClick = (marker: TimelineMarker) => {
    setActiveChapterId(marker.id)
    if (!showVideo) {
      setShowVideo(true)
    }
  }

  // Handle video time update to sync with notes
  const handleVideoTimeUpdate = (time: number) => {
    setCurrentTime(time)

    // Find the current marker based on time
    const currentMarker = [...markers]
      .sort((a, b) => a.time - b.time)
      .filter(marker => marker.time <= time)
      .pop()

    if (
      currentMarker &&
      (!activeChapterId || currentMarker.id !== activeChapterId)
    ) {
      setActiveChapterId(currentMarker.id)
    }
  }

  // Handle video events for tracking
  const handleVideoPlay = () => {
    trackVideoPlay(parseInt(knowledgeId, 10), {
      chapterId: activeChapterId,
      time: currentTime,
    })
  }

  const handleVideoPause = () => {
    trackVideoPause(parseInt(knowledgeId, 10), {
      chapterId: activeChapterId,
      time: currentTime,
    })
  }

  const handleVideoSeek = () => {
    if (trackEvent) {
      trackEvent('video_seek', parseInt(knowledgeId, 10), {
        chapterId: activeChapterId,
        time: currentTime,
      })
    }
  }

  // Handle note navigation
  const handleNoteChange = (index: number) => {
    setActiveNoteIndex(index)

    // Find corresponding marker for this note index
    if (markers.length > index && markers[index]?.id) {
      setActiveChapterId(markers[index].id)
    }
  }

  return (
    <div className='relative h-full w-full overflow-hidden rounded-lg bg-gray-900'>
      {/* Toggle Button */}
      <button
        onClick={toggleContent}
        className='absolute right-4 top-4 z-50 flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-md transition duration-200 ease-in-out hover:bg-indigo-700'
        disabled={isTransitioning}
      >
        {showVideo ? (
          <>
            <BookOpen className='h-4 w-4' />
            <span>View Notes</span>
          </>
        ) : (
          <>
            <Video className='h-4 w-4' />
            <span>Return to Video</span>
          </>
        )}
      </button>

      {/* Content Switcher */}
      <div className='relative h-full w-full'>
        {/* Video Player */}
        <div
          className={`absolute inset-0 h-full w-full transition-all duration-300 ease-in-out ${
            showVideo
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-full opacity-0'
          }`}
        >
          <VideoPlayer
            src={videoSrc}
            title={videoTitle}
            markers={markers}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onSeek={handleVideoSeek}
            onMarkerClick={handleMarkerClick}
            onTimeUpdate={handleVideoTimeUpdate}
            activeChapterId={activeChapterId}
          />
        </div>

        {/* Notes */}
        <div
          className={`absolute inset-0 h-full w-full bg-white transition-all duration-300 ease-in-out ${
            !showVideo
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-full opacity-0'
          }`}
        >
          <div className='h-full overflow-auto'>
            <MarkdownSlideshow
              content={processedNotes}
              knowledge_id={knowledgeId}
              currentIndex={activeNoteIndex}
              onSlideChange={handleNoteChange}
            />
          </div>
        </div>
      </div>

      {/* Transition Indicator */}
      {isTransitioning && (
        <div className='absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600'></div>
        </div>
      )}
    </div>
  )
}

export default ContentToggle
