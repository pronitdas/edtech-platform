import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from 'lucide-react';

interface TimelineMarker {
  time: number;
  label?: string;
  type?: 'latex' | 'code' | 'roleplay' | 'default';
  content?: string;
  active?: boolean;
  id?: string;
  chapterTitle?: string;
  description?: string;
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
  const [currentChapter, setCurrentChapter] = useState<TimelineMarker | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<TimelineMarker | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize video when src changes
  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.load();
      setError(null);
    }
  }, [src]);

  // Update active chapter based on current time
  useEffect(() => {
    if (markers && markers.length > 0) {
      // Find the current chapter based on video time
      const currentMarker = [...markers]
        .sort((a, b) => a.time - b.time)
        .filter(marker => marker.time <= currentTime)
        .pop() || null;
      
      if (currentMarker && (!currentChapter || currentMarker.id !== currentChapter.id)) {
        setCurrentChapter(currentMarker);
      }
    }
  }, [currentTime, markers]);

  // Update active marker when activeChapterId changes from props
  useEffect(() => {
    if (activeChapterId && markers) {
      const marker = markers.find(m => m.id === activeChapterId);
      if (marker && videoRef.current) {
        videoRef.current.currentTime = marker.time;
        setCurrentTime(marker.time);
        if (timelineRef.current) {
          timelineRef.current.value = marker.time.toString();
        }
        setCurrentChapter(marker);
      }
    }
  }, [activeChapterId, markers]);

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
      setCurrentChapter(marker);
    }
  };

  // Handle marker mouse enter
  const handleMarkerMouseEnter = (marker: TimelineMarker, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.left, y: rect.top - 40 });
    setTooltipContent(marker);
    setShowTooltip(true);
  };

  // Handle marker mouse leave
  const handleMarkerMouseLeave = () => {
    setShowTooltip(false);
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
        return '📝';
    }
  };

  // Render the tooltip
  const renderTooltip = () => {
    if (!showTooltip || !tooltipContent) return null;
    
    return (
      <div 
        className="absolute z-50 bg-gray-800 text-white px-3 py-2 rounded-md shadow-lg text-sm"
        style={{ 
          left: `${tooltipPosition.x}px`, 
          top: `${tooltipPosition.y}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="font-medium">{tooltipContent.chapterTitle || tooltipContent.label}</div>
        {tooltipContent.description && (
          <div className="text-xs text-gray-300 mt-1">{tooltipContent.description}</div>
        )}
        <div className="text-xs text-gray-400">{formatTime(tooltipContent.time)}</div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="border-8 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    );
  };

  // Calculate marker position on timeline
  const calculateMarkerPosition = (markerTime: number) => {
    if (duration === 0) return '0%';
    return `${(markerTime / duration) * 100}%`;
  };

  // Render timeline markers
  const renderMarkers = () => {
    return markers.map((marker, index) => {
      const isActive = currentChapter?.id === marker.id;
      return (
        <button
          key={`marker-${index}`}
          className={`absolute w-3 h-3 -mt-1.5 rounded-full ${getMarkerColor(marker)} ${
            isActive ? 'ring-2 ring-offset-1 ring-white' : ''
          } hover:transform hover:scale-150 transition-transform`}
          style={{ left: calculateMarkerPosition(marker.time) }}
          onClick={() => handleMarkerClick(marker)}
          onMouseEnter={(e) => handleMarkerMouseEnter(marker, e)}
          onMouseLeave={handleMarkerMouseLeave}
          aria-label={marker.label || `Marker at ${formatTime(marker.time)}`}
        />
      );
    });
  };

  // Render current chapter display
  const renderCurrentChapter = () => {
    if (!currentChapter) return null;
    
    return (
      <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-md max-w-xs">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-3 h-3 rounded-full ${getMarkerColor(currentChapter)}`}></span>
          <span className="font-medium text-sm">{currentChapter.chapterTitle || currentChapter.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded}
        onError={handleVideoError}
        playsInline
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Current Chapter Overlay */}
      {renderCurrentChapter()}

      {/* Marker Tooltip */}
      {renderTooltip()}
      
      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Time and Timeline */}
        <div className="relative w-full mb-2 group">
          <input
            ref={timelineRef}
            type="range"
            min="0"
            max="100"
            value={currentTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            className="w-full h-1 rounded-full bg-gray-600 outline-none appearance-none cursor-pointer hover:h-2 transition-all"
            style={{
              backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
            }}
          />
          
          {/* Timeline Markers */}
          <div className="absolute top-1/2 left-0 right-0 pointer-events-none">
            {renderMarkers()}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button 
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 focus:outline-none transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            {/* Skip Buttons */}
            <button 
              onClick={() => skipTime(-10)} 
              className="text-white hover:text-blue-400 focus:outline-none transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack size={18} />
            </button>
            
            <button 
              onClick={() => skipTime(10)} 
              className="text-white hover:text-blue-400 focus:outline-none transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward size={18} />
            </button>
            
            {/* Time Display */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleMute}
                className="text-white hover:text-blue-400 focus:outline-none transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 rounded-full bg-gray-600 outline-none appearance-none cursor-pointer"
                style={{
                  backgroundImage: `linear-gradient(to right, white 0%, white ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
                }}
              />
            </div>
            
            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 focus:outline-none transition-colors"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-red-600 text-white p-4 rounded-md max-w-md text-center">
            <p className="text-lg font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 