import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from 'lucide-react';

interface TimelineMarker {
  time: number;
  label?: string;
  type?: 'latex' | 'code' | 'roleplay' | 'default';
  content?: string;
  active?: boolean;
  id?: string;
}

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
}

const VideoPlayer = ({ 
  src, 
  title, 
  markers = [], 
  onTimeUpdate, 
  onMarkerClick,
  onPlay,
  onPause,
  onSeek,
  activeChapterId
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize video when src changes
  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.load();
      setError(null);
    }
  }, [src]);

  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (timelineRef.current) {
        timelineRef.current.max = videoRef.current.duration.toString();
      }
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (timelineRef.current) {
        timelineRef.current.value = time.toString();
      }
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    }
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (onPause) onPause();
      } else {
        videoRef.current.play()
          .catch(err => {
            setError(`Error playing video: ${err.message}`);
          });
        if (onPlay) onPlay();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle timeline seek start
  const handleSeekStart = () => {
    setIsSeeking(true);
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
  };

  // Handle timeline seek end
  const handleSeekEnd = () => {
    if (videoRef.current && timelineRef.current) {
      const newTime = parseFloat(timelineRef.current.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (isPlaying) {
        videoRef.current.play()
          .catch(err => {
            setError(`Error playing video: ${err.message}`);
          });
      }
      if (onSeek) onSeek();
    }
    setIsSeeking(false);
  };

  // Handle timeline seek during drag
  const handleSeekChange = () => {
    if (timelineRef.current) {
      setCurrentTime(parseFloat(timelineRef.current.value));
    }
  };

  // Format time (seconds) to MM:SS
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle marker click
  const handleMarkerClick = (marker: TimelineMarker) => {
    if (videoRef.current) {
      videoRef.current.currentTime = marker.time;
      setCurrentTime(marker.time);
      if (timelineRef.current) {
        timelineRef.current.value = marker.time.toString();
      }
      if (onMarkerClick) {
        onMarkerClick(marker);
      }
    }
  };

  // Handle video error
  const handleVideoError = () => {
    setError(`Error loading video: ${title}. Please check if the file exists and the path is correct.`);
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (timelineRef.current) {
        timelineRef.current.value = newTime.toString();
      }
      if (onSeek) onSeek();
    }
  };

  // Show/hide controls on mouse movement
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

  // Get marker color based on type
  const getMarkerColor = (marker: TimelineMarker) => {
    switch (marker.type) {
      case 'latex':
        return 'bg-purple-500';
      case 'code':
        return 'bg-green-500';
      case 'roleplay':
        return 'bg-indigo-500';
      default:
        return 'bg-red-500';
    }
  };

  // Get marker icon based on type
  const getMarkerIcon = (marker: TimelineMarker) => {
    switch (marker.type) {
      case 'latex':
        return '∑';
      case 'code':
        return '<>';
      case 'roleplay':
        return '👥';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Title */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>

      {/* Video Element */}
      <div className="relative w-full pb-[56.25%] bg-black">
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full cursor-pointer"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleMetadataLoaded}
          onError={handleVideoError}
          onClick={togglePlayPause}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Play/Pause Overlay */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
          onClick={togglePlayPause}
        >
          <div className="bg-indigo-600 bg-opacity-70 rounded-full p-4 shadow-lg">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Custom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Timeline Slider */}
        <div className="relative mb-3">
          <input
            ref={timelineRef}
            type="range"
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            value={currentTime}
            min="0"
            max={duration || 100}
            step="0.01"
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            style={{
              background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${(currentTime / (duration || 1)) * 100}%, #4b5563 ${(currentTime / (duration || 1)) * 100}%, #4b5563 100%)`
            }}
          />

          {/* Timeline Markers */}
          <div className="absolute bottom-0 left-0 right-0 h-2 pointer-events-none">
            {markers.map((marker, index) => {
              const percent = (marker.time / (duration || 100)) * 100;
              const isActive = marker.id === activeChapterId;
              return (
                <button
                  key={index}
                  className={`absolute w-3 h-3 ${getMarkerColor(marker)} rounded-full transform -translate-y-1/2 cursor-pointer pointer-events-auto 
                    ${isActive ? 'ring-2 ring-white' : 'hover:scale-125'} transition-transform`}
                  style={{ left: `${percent}%` }}
                  onClick={() => handleMarkerClick(marker)}
                  title={marker.label || `Marker at ${formatTime(marker.time)}`}
                  data-tooltip-id="marker-tooltip"
                  data-tooltip-content={marker.label || `Marker at ${formatTime(marker.time)}`}
                >
                  {getMarkerIcon(marker) && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">
                      {getMarkerIcon(marker)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-indigo-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Skip Buttons */}
            <button
              onClick={() => skipTime(-10)}
              className="text-white hover:text-indigo-400 transition-colors"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => skipTime(10)}
              className="text-white hover:text-indigo-400 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleMute}
                className="text-white hover:text-indigo-400 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer md:w-24"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
                }}
              />
            </div>

            {/* Time Display */}
            <div className="text-white text-xs md:text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div>
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-indigo-400 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-red-500 text-white p-4 rounded-md max-w-md text-center">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 