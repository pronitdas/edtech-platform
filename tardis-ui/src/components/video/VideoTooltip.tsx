import React from 'react'
import { TimelineMarker } from './VideoTypes'

interface VideoTooltipProps {
  content: TimelineMarker
  position: { x: number; y: number }
  className?: string
}

/**
 * Video tooltip component for displaying information about markers
 * when hovering over them on the timeline
 */
const VideoTooltip: React.FC<VideoTooltipProps> = ({
  content,
  position,
  className = '',
}) => {
  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`pointer-events-none absolute z-10 max-w-xs rounded-md bg-black bg-opacity-80 p-2 text-sm text-white ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
      role='tooltip'
    >
      <div className='font-bold'>
        {content.label ||
          (content.chapterTitle
            ? `Chapter: ${content.chapterTitle}`
            : 'Marker')}
      </div>
      <div className='text-xs text-gray-300'>{formatTime(content.time)}</div>
      {content.description && (
        <div className='mt-1 text-xs text-gray-300'>{content.description}</div>
      )}
      {/* Triangle pointer at the bottom */}
      <div
        className='absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-full transform'
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgba(0, 0, 0, 0.8)',
        }}
      ></div>
    </div>
  )
}

export default VideoTooltip
