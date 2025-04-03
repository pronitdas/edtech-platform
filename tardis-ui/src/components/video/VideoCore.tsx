import { useState, useRef, useEffect, forwardRef, ForwardedRef } from 'react';

export interface VideoRefType extends HTMLVideoElement {}

interface VideoCoreProps {
  src: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: string) => void;
  onMetadataLoaded?: (duration: number) => void;
  autoPlay?: boolean;
  volume?: number;
  muted?: boolean;
  className?: string;
}

/**
 * Core video component that handles basic video functionality
 * This component is meant to be used by the VideoPlayer component
 * and not used directly in the application
 */
const VideoCore = forwardRef(
  (
    {
      src,
      title,
      onTimeUpdate,
      onPlay,
      onPause,
      onError,
      onMetadataLoaded,
      autoPlay = false,
      volume = 1,
      muted = false,
      className = ''
    }: VideoCoreProps,
    ref: ForwardedRef<VideoRefType>
  ) => {
    // Initialize state for error handling
    const [error, setError] = useState<string | null>(null);

    // Initialize video when src changes
    useEffect(() => {
      const videoElement = ref as React.RefObject<HTMLVideoElement>;
      if (videoElement && videoElement.current && src) {
        videoElement.current.load();
        if (autoPlay) {
          videoElement.current.play()
            .catch(err => {
              const errorMessage = `Error playing video: ${err.message}`;
              setError(errorMessage);
              if (onError) onError(errorMessage);
            });
        }
      }
      setError(null);
    }, [src, autoPlay, ref, onError]);

    // Update volume and muted state when props change
    useEffect(() => {
      const videoElement = ref as React.RefObject<HTMLVideoElement>;
      if (videoElement && videoElement.current) {
        videoElement.current.volume = volume;
        videoElement.current.muted = muted;
      }
    }, [volume, muted, ref]);

    // Handle metadata loaded
    const handleMetadataLoaded = () => {
      const videoElement = ref as React.RefObject<HTMLVideoElement>;
      if (videoElement && videoElement.current && onMetadataLoaded) {
        onMetadataLoaded(videoElement.current.duration);
      }
    };

    // Handle time update
    const handleTimeUpdate = () => {
      const videoElement = ref as React.RefObject<HTMLVideoElement>;
      if (videoElement && videoElement.current && onTimeUpdate) {
        onTimeUpdate(videoElement.current.currentTime);
      }
    };

    // Handle play event
    const handlePlay = () => {
      if (onPlay) onPlay();
    };

    // Handle pause event
    const handlePause = () => {
      if (onPause) onPause();
    };

    // Handle error
    const handleError = () => {
      const errorMessage = "Error loading video";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    };

    return (
      <video
        ref={ref}
        className={`w-full ${className}`}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadedMetadata={handleMetadataLoaded}
        onError={handleError}
        title={title}
        playsInline
        aria-label={`Video player for ${title}`}
      >
        {src && <source src={src} type="video/mp4" />}
        {error && <p className="text-red-500">{error}</p>}
        Your browser does not support the video tag.
      </video>
    );
  }
);

VideoCore.displayName = 'VideoCore';

export default VideoCore; 