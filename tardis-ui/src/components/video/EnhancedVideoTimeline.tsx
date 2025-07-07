import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimelineMarker } from './VideoTypes'

interface Chapter {
  id: string
  title: string
  startTime: number
  endTime: number
  type: 'lecture' | 'demo' | 'exercise' | 'quiz' | 'discussion'
  color: string
  isCompleted: boolean
}

interface EnhancedVideoTimelineProps {
  currentTime: number
  duration: number
  bufferedTime: number
  chapters: Chapter[]
  markers: TimelineMarker[]
  onSeek: (time: number) => void
  onMarkerClick?: (marker: TimelineMarker) => void
  onChapterClick?: (chapter: Chapter) => void
  isSeekable?: boolean
  showPreview?: boolean
  className?: string
}

interface PreviewData {
  time: number
  position: number
  thumbnailUrl?: string
  chapterTitle?: string
  visible: boolean
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const getChapterColor = (type: string): string => {
  switch (type) {
    case 'lecture': return '#3B82F6' // blue
    case 'demo': return '#10B981' // green
    case 'exercise': return '#F59E0B' // yellow
    case 'quiz': return '#EF4444' // red
    case 'discussion': return '#8B5CF6' // purple
    default: return '#6B7280' // gray
  }
}

const EnhancedVideoTimeline: React.FC<EnhancedVideoTimelineProps> = ({
  currentTime,
  duration,
  bufferedTime,
  chapters,
  markers,
  onSeek,
  onMarkerClick,
  onChapterClick,
  isSeekable = true,
  showPreview = true,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<PreviewData>({
    time: 0,
    position: 0,
    visible: false
  })
  const timelineRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercentage = duration > 0 ? (bufferedTime / duration) * 100 : 0

  // Find current chapter
  const currentChapter = chapters.find(chapter => 
    currentTime >= chapter.startTime && currentTime <= chapter.endTime
  )

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current || !showPreview) return

    const rect = timelineRef.current.getBoundingClientRect()
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const time = position * duration
    
    // Find chapter at preview time
    const previewChapter = chapters.find(chapter => 
      time >= chapter.startTime && time <= chapter.endTime
    )

    setPreview({
      time,
      position: e.clientX - rect.left,
      chapterTitle: previewChapter?.title,
      visible: true
    })
  }

  const handleMouseLeave = () => {
    if (!isDragging) {
      setPreview(prev => ({ ...prev, visible: false }))
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || !isSeekable) return

    const rect = timelineRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(duration, position * duration))
    
    onSeek(time)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isSeekable) return
    setIsDragging(true)
    handleClick(e)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setPreview(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return
      
      const rect = timelineRef.current.getBoundingClientRect()
      const position = (e.clientX - rect.left) / rect.width
      const time = Math.max(0, Math.min(duration, position * duration))
      
      onSeek(time)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, duration, onSeek])

  return (
    <div className={`relative group ${className}`}>
      {/* Timeline Preview Tooltip */}
      <AnimatePresence>
        {preview.visible && showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 pointer-events-none z-50"
            style={{ 
              left: Math.max(60, Math.min(preview.position - 60, timelineRef.current?.clientWidth || 0 - 120)),
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 shadow-lg">
              {/* Thumbnail placeholder */}
              <div className="w-32 h-18 bg-gray-800 rounded mb-2 flex items-center justify-center">
                <span className="text-xs text-gray-400">Preview</span>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium text-white mb-1">
                  {formatTime(preview.time)}
                </div>
                {preview.chapterTitle && (
                  <div className="text-xs text-gray-300 truncate max-w-32">
                    {preview.chapterTitle}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Labels */}
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Chapters</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Chapter Segments */}
      <div className="relative h-2 mb-1">
        {chapters.map((chapter) => {
          const startPercentage = (chapter.startTime / duration) * 100
          const widthPercentage = ((chapter.endTime - chapter.startTime) / duration) * 100
          
          return (
            <div
              key={chapter.id}
              className="absolute h-full cursor-pointer group/chapter transition-all hover:h-3 hover:-mt-0.5"
              style={{
                left: `${startPercentage}%`,
                width: `${widthPercentage}%`,
                backgroundColor: getChapterColor(chapter.type),
                opacity: chapter.isCompleted ? 1 : 0.7
              }}
              onClick={() => onChapterClick?.(chapter)}
              title={`${chapter.title} (${formatTime(chapter.startTime)} - ${formatTime(chapter.endTime)})`}
            >
              {/* Chapter completion indicator */}
              {chapter.isCompleted && (
                <div className="absolute inset-0 bg-green-500 opacity-30" />
              )}
              
              {/* Chapter label on hover */}
              <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/chapter:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {chapter.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Timeline */}
      <div 
        ref={timelineRef}
        className="relative h-1 bg-gray-700 rounded-full cursor-pointer group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onMouseDown={handleDragStart}
      >
        {/* Buffered progress */}
        <div 
          className="absolute h-full bg-gray-600 rounded-full transition-all"
          style={{ width: `${bufferedPercentage}%` }}
        />
        
        {/* Current progress */}
        <div 
          ref={progressRef}
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Markers */}
        {markers.map((marker, index) => {
          const markerPosition = (marker.time / duration) * 100
          
          return (
            <motion.div
              key={marker.id || index}
              className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
              style={{ left: `${markerPosition}%` }}
              whileHover={{ scale: 1.3 }}
              onClick={(e) => {
                e.stopPropagation()
                onMarkerClick?.(marker)
              }}
            >
              <div 
                className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${
                  marker.type === 'latex' ? 'bg-purple-500' :
                  marker.type === 'code' ? 'bg-green-500' :
                  marker.type === 'roleplay' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
                title={marker.label || `Marker at ${formatTime(marker.time)}`}
              />
            </motion.div>
          )
        })}

        {/* Current time indicator */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20"
          style={{ left: `${progressPercentage}%` }}
        >
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-grab group-hover:scale-110 transition-transform" />
        </div>

        {/* Hover indicator */}
        {preview.visible && (
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: preview.position }}
          >
            <div className="w-1 h-6 bg-white/50 rounded-full" />
          </div>
        )}
      </div>

      {/* Time indicators */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{formatTime(currentTime)}</span>
        {currentChapter && (
          <span className="text-blue-400 font-medium">
            {currentChapter.title}
          </span>
        )}
        <span>{formatTime(duration)}</span>
      </div>

      {/* Chapter progress indicator */}
      {currentChapter && (
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">
            Chapter Progress: {Math.round(((currentTime - currentChapter.startTime) / (currentChapter.endTime - currentChapter.startTime)) * 100)}%
          </div>
          <div className="h-1 bg-gray-700 rounded-full">
            <div 
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ 
                width: `${Math.max(0, Math.min(100, ((currentTime - currentChapter.startTime) / (currentChapter.endTime - currentChapter.startTime)) * 100))}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedVideoTimeline