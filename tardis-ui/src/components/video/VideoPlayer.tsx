import React, { useRef, useEffect, useState } from 'react'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'

interface VideoPlayerProps {
  contentId: number
  videoUrl: string
  title: string
  poster?: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  contentId,
  videoUrl,
  title,
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const lastPlayTime = useRef(0)

  const { trackVideoPlay, trackVideoPause, trackVideoComplete } =
    useInteractionTracker()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      lastPlayTime.current = video.currentTime
      trackVideoPlay(contentId, {
        timestamp: Date.now(),
        videoPosition: video.currentTime,
      })
    }

    const handlePause = () => {
      setIsPlaying(false)
      const elapsedTime = video.currentTime - lastPlayTime.current
      trackVideoPause(contentId, elapsedTime, {
        timestamp: Date.now(),
        videoPosition: video.currentTime,
      })
    }

    const handleEnded = () => {
      setIsPlaying(false)
      trackVideoComplete(contentId, {
        timestamp: Date.now(),
        totalDuration: video.duration,
      })
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [contentId, trackVideoPlay, trackVideoPause, trackVideoComplete])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(e.target.value)
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  return (
    <div className='relative w-full'>
      <div className='relative aspect-video'>
        <video
          ref={videoRef}
          className='h-full w-full'
          poster={poster}
          title={title}
        >
          <source src={videoUrl} type='video/mp4' />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className='mt-2 rounded-lg bg-gray-100 p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <button
            onClick={togglePlay}
            className='rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <div className='text-sm text-gray-600'>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <input
          type='range'
          min='0'
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className='w-full'
        />

        <h2 className='mt-2 text-lg font-semibold'>{title}</h2>
      </div>
    </div>
  )
}
