import React, { useRef, useEffect, useState } from 'react';
import VideoCore, { VideoRefType } from './VideoCore';
import VideoControls from './VideoControls';
import VideoTimeline from './VideoTimeline';
import { TimelineMarker } from './VideoTypes';
import { useVideoState } from './useVideoState';

interface VideoPlayerProps {
  src: string;
  title: string;
  markers?: TimelineMarker[];
  onTimeUpdate?: (currentTime: number) => void;
  onMarkerClick?: (marker: TimelineMarker) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: () => void;
  activeChapterId?: string;
  className?: string;
}

/**
 * Modern video player component with enhanced accessibility and modular architecture
 */
const ModernVideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  markers = [],
  onTimeUpdate,
  onMarkerClick,
  onPlay,
  onPause,
  onSeek,
  activeChapterId,
  className = ''
}) => {
  // Create refs
  const videoRef = useRef<VideoRefType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hook for video state management
  const [state, actions] = useVideoState(
    videoRef,
    containerRef,
    markers,
    onPlay,
    onPause,
    onSeek
  );
  
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isSeeking,
    error,
    currentChapter
  } = state;
  
  const {
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    skipTime,
    setCurrentTime
  } = actions;

  // Control visibility of video controls
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update the active chapter when activeChapterId changes from props
  useEffect(() => {
    if (activeChapterId && markers) {
      const marker = markers.find(m => m.id === activeChapterId);
      if (marker) {
        seek(marker.time);
      }
    }
  }, [activeChapterId, markers, seek]);

  // Handle time update from the video
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  };

  // Handle marker click
  const handleMarkerClick = (marker: TimelineMarker) => {
    seek(marker.time);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  // Handle seeking start
  const handleSeekStart = () => {
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Handle seeking during drag
  const handleSeeking = (time: number) => {
    setCurrentTime(time);
  };

  // Handle seeking end
  const handleSeekEnd = (time: number) => {
    seek(time);
  };

  // Show/hide controls based on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`video-player relative w-full bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Video Core Component */}
      <VideoCore
        ref={videoRef}
        src={src}
        title={title}
        onTimeUpdate={handleTimeUpdate}
        onMetadataLoaded={(duration) => setCurrentTime(currentTime)} // Just trigger a time update
        onPlay={onPlay}
        onPause={onPause}
        onError={(errorMsg) => console.error(errorMsg)}
        volume={volume}
        muted={isMuted}
        className="w-full"
      />
      
      {/* Error Message */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 text-center">
          {error}
        </div>
      )}
      
      {/* Controls Overlay - conditionally shown */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Timeline with markers */}
        <VideoTimeline
          currentTime={currentTime}
          duration={duration}
          markers={markers}
          isSeeking={isSeeking}
          onSeekStart={handleSeekStart}
          onSeeking={handleSeeking}
          onSeekEnd={handleSeekEnd}
          onMarkerClick={handleMarkerClick}
          className="mb-1"
        />
        
        {/* Video Controls */}
        <VideoControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          onPlayPause={togglePlayPause}
          onSkip={skipTime}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
      
      {/* Current Chapter Information - shown if available */}
      {currentChapter && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {currentChapter.label || (currentChapter.chapterTitle ? `Chapter: ${currentChapter.chapterTitle}` : 'Marker')}
        </div>
      )}
    </div>
  );
};

export default ModernVideoPlayer; 