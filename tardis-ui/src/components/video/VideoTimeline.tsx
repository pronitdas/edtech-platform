import React, { useState, useRef, useEffect } from 'react'
import { TimelineMarker } from './VideoTypes'
import VideoMarker from './VideoMarker'
import VideoTooltip from './VideoTooltip'

interface VideoTimelineProps {
  currentTime: number
  duration: number
  markers?: TimelineMarker[]
  isSeeking: boolean
  onSeekStart: () => void
  onSeeking: (time: number) => void
  onSeekEnd: (time: number) => void
  onMarkerClick: (marker: TimelineMarker) => void
  className?: string
}

/**
 * Video timeline component with markers
 * Provides a timeline slider and visual markers for video navigation
 */
const VideoTimeline: React.FC<VideoTimelineProps> = ({
  currentTime,
  duration,
  markers = [],
  isSeeking,
  onSeekStart,
  onSeeking,
  onSeekEnd,
  onMarkerClick,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipContent, setTooltipContent] = useState<TimelineMarker | null>(
    null
  )
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const timelineRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update timeline value when currentTime changes (if not seeking)
  useEffect(() => {
    if (timelineRef.current && !isSeeking) {
      timelineRef.current.value = currentTime.toString()
    }
  }, [currentTime, isSeeking])

  // Handle timeline change during seeking
  const handleTimelineChange = () => {
    if (timelineRef.current) {
      const newTime = parseFloat(timelineRef.current.value)
      onSeeking(newTime)
    }
  }

  // Handle timeline seek end
  const handleSeekEnd = () => {
    if (timelineRef.current) {
      const newTime = parseFloat(timelineRef.current.value)
      onSeekEnd(newTime)
    }
  }

  // Calculate marker position in percentage
  const calculateMarkerPosition = (markerTime: number): number => {
    return (markerTime / duration) * 100
  }

  // Handle marker mouse enter
  const handleMarkerMouseEnter = (
    marker: TimelineMarker,
    event: React.MouseEvent
  ) => {
    if (!containerRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()

    setTooltipPosition({
      x: rect.left - containerRect.left,
      y: -40, // Position above the marker
    })
    setTooltipContent(marker)
    setShowTooltip(true)
  }

  // Handle marker mouse leave
  const handleMarkerMouseLeave = () => {
    setShowTooltip(false)
  }

  // Render timeline markers
  const renderMarkers = () => {
    return markers.map((marker, index) => (
      <VideoMarker
        key={`marker-${index}`}
        marker={marker}
        position={calculateMarkerPosition(marker.time)}
        isActive={marker.time <= currentTime}
        onClick={() => onMarkerClick(marker)}
        onMouseEnter={e => handleMarkerMouseEnter(marker, e)}
        onMouseLeave={handleMarkerMouseLeave}
      />
    ))
  }

  return (
    <div
      ref={containerRef}
      className={`video-timeline relative flex h-10 w-full items-center ${className}`}
    >
      <input
        ref={timelineRef}
        type='range'
        min='0'
        max={duration || 100}
        step='0.01'
        value={currentTime}
        onChange={handleTimelineChange}
        onMouseDown={onSeekStart}
        onTouchStart={onSeekStart}
        onMouseUp={handleSeekEnd}
        onTouchEnd={handleSeekEnd}
        className='h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700'
        aria-label='Video timeline'
        style={
          {
            // Custom styling for the timeline
            '--seek-percent': `${(currentTime / (duration || 1)) * 100}%`,
          } as React.CSSProperties
        }
      />

      {/* Render markers */}
      <div className='markers-container pointer-events-none absolute left-0 right-0 top-0 h-full'>
        {renderMarkers()}
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipContent && (
        <VideoTooltip content={tooltipContent} position={tooltipPosition} />
      )}
    </div>
  )
}

export default VideoTimeline
