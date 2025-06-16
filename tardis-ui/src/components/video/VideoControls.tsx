import React from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
} from 'lucide-react'

// Format time (seconds) to MM:SS
function defaultFormatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

interface VideoControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  onPlayPause: () => void
  onSkip: (seconds: number) => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  formatTime?: (time: number) => string
  className?: string
}

/**
 * Video controls component that provides UI controls for the video player
 * Handles play/pause, volume control, skipping, and fullscreen
 */
const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  onPlayPause,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  formatTime = defaultFormatTime,
  className = '',
}) => {
  // Handle volume change from slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    onVolumeChange(newVolume)
  }

  return (
    <div
      className={`video-controls flex items-center rounded-b bg-gray-800 bg-opacity-80 p-2 ${className}`}
    >
      {/* Play/Pause Button */}
      <button
        onClick={onPlayPause}
        className='p-2 text-white hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      {/* Skip Backwards */}
      <button
        onClick={() => onSkip(-10)}
        className='p-2 text-white hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
        aria-label='Skip backwards 10 seconds'
      >
        <SkipBack size={20} />
      </button>

      {/* Skip Forward */}
      <button
        onClick={() => onSkip(10)}
        className='p-2 text-white hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
        aria-label='Skip forward 10 seconds'
      >
        <SkipForward size={20} />
      </button>

      {/* Time Display */}
      <div className='mx-2 text-sm text-white' aria-live='polite'>
        <span>{formatTime(currentTime)}</span>
        <span className='mx-1'>/</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Spacer */}
      <div className='flex-grow'></div>

      {/* Volume Controls */}
      <div className='flex items-center'>
        <button
          onClick={onToggleMute}
          className='p-2 text-white hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input
          type='range'
          min='0'
          max='1'
          step='0.05'
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className='mx-2 w-16'
          aria-label='Volume'
        />
      </div>

      {/* Fullscreen Toggle */}
      <button
        onClick={onToggleFullscreen}
        className='p-2 text-white hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        <Maximize size={20} />
      </button>
    </div>
  )
}

export default VideoControls
