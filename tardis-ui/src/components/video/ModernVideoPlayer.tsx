import React, { useRef, useEffect, useState, useMemo } from 'react';
// Assuming you might add icons later, e.g., from react-icons
// import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import VideoCore, { VideoRefType } from './VideoCore';
import VideoControls from './VideoControls';
import VideoTimeline from './VideoTimeline';
import { TimelineMarker } from './VideoTypes';
import { useVideoState } from './useVideoState';

interface VideoMarker {
    id: string;
    time: number;
    title: string;
    description: string;
    type: 'chapter';
}

interface ChapterInfo {
    title: string;
    startTime: number;
    endTime?: number;
}

interface ModernVideoPlayerProps {
    src: string;
    title: string;
    chapterId: string;
    knowledgeId: string;
    className?: string;
    markers?: VideoMarker[];
    onMarkerClick?: (marker: VideoMarker) => void;
    onTimeUpdate?: (currentTime: number) => void;
    showChapterOverlay?: boolean;
    currentChapter?: ChapterInfo;
}

/**
 * Modern video player component with enhanced accessibility and modular architecture
 */
const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
    src,
    title,
    chapterId,
    knowledgeId,
    className = '',
    markers = [],
    onMarkerClick,
    onTimeUpdate,
    showChapterOverlay = false,
    currentChapter
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the main container
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(false); // State to manage controls visibility
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seekInitiatedRef = useRef<boolean>(false); // Ref to track if seek was just initiated
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout to reset the seek flag

    // Find current marker based on video time
    const currentMarker = useMemo(() => {
        return markers
            .slice()
            .reverse()
            .find(marker => currentTime >= marker.time);
    }, [currentTime, markers]);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        const handleTimeUpdateEvent = () => {
            const newTime = video.currentTime;
            setCurrentTime(newTime);

            // If a seek was just initiated, skip calling the parent's onTimeUpdate for a brief moment
            if (seekInitiatedRef.current) {
                console.log('[ModernVideoPlayer] Time update skipped due to recent seek');
                return;
            }

            onTimeUpdate?.(newTime);
        };

        const handleDurationChange = () => {
          if (!isNaN(video.duration) && isFinite(video.duration)) {
             setDuration(video.duration);
          } else {
            // Handle cases like live streams or unloaded video where duration isn't available
            setDuration(0);
          }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted || video.volume === 0);
        };

        // Use the fullscreen API specific to the container for better control
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === container);
        };

        // Initial duration set
        if (video.readyState >= 1) { // HAVE_METADATA
            handleDurationChange();
        }


        video.addEventListener('timeupdate', handleTimeUpdateEvent);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('loadedmetadata', handleDurationChange); // Handle async metadata loading
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('volumechange', handleVolumeChange);
        // Listen on the container for fullscreen changes
        document.addEventListener('fullscreenchange', handleFullscreenChange);


        // Auto-hide controls logic
        const hideControls = () => setShowControls(false);

        const resetControlsTimeout = () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            setShowControls(true);
            // Hide controls after 3 seconds of inactivity, only if playing
            if (isPlaying) {
                 controlsTimeoutRef.current = setTimeout(hideControls, 3000);
            }
        };

        container.addEventListener('mousemove', resetControlsTimeout);
        container.addEventListener('mouseleave', hideControls);
        container.addEventListener('click', resetControlsTimeout); // Show controls on click too


        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdateEvent);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('loadedmetadata', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('volumechange', handleVolumeChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);

            container.removeEventListener('mousemove', resetControlsTimeout);
            container.removeEventListener('mouseleave', hideControls);
            container.removeEventListener('click', resetControlsTimeout);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            // Clear the seek timeout on unmount
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, [onTimeUpdate, isPlaying]); // Added isPlaying dependency for auto-hide logic

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(error => console.error("Error playing video:", error));
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement> | number) => {
        const targetTime = typeof e === 'number' ? e : parseFloat(e.target.value);
        console.log('[ModernVideoPlayer] handleSeek called with time:', targetTime);
        if (videoRef.current) {
            const video = videoRef.current;
            console.log('[ModernVideoPlayer] videoRef exists. Duration:', video.duration, 'ReadyState:', video.readyState);
             const canSeek = isFinite(targetTime) && video.duration > 0 && targetTime >= 0 && targetTime <= video.duration;
            console.log('[ModernVideoPlayer] Can seek?', canSeek);
             if (canSeek) {
                console.log('[ModernVideoPlayer] Seeking video to:', targetTime);
                video.currentTime = targetTime;
                console.log('[ModernVideoPlayer] video.currentTime set to:', video.currentTime); // Log immediately after setting
                setCurrentTime(targetTime); // Update state immediately for responsiveness

                // Set the flag to ignore the next time update(s)
                seekInitiatedRef.current = true;
                // Clear any existing timeout
                if (seekTimeoutRef.current) {
                    clearTimeout(seekTimeoutRef.current);
                }
                // Reset the flag after a short delay (e.g., 250ms)
                seekTimeoutRef.current = setTimeout(() => {
                    seekInitiatedRef.current = false;
                    console.log('[ModernVideoPlayer] Seek flag reset');
                }, 250); // Adjust delay if needed

            } else {
                console.warn('[ModernVideoPlayer] Seek prevented. Time:', targetTime, 'Duration:', video.duration);
            }
        } else {
            console.warn('[ModernVideoPlayer] handleSeek called but videoRef is null.');
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const vol = parseFloat(e.target.value);
            videoRef.current.volume = vol;
            videoRef.current.muted = vol === 0;
        }
    };

     const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            // If unmuting and volume was 0, set to a default volume (e.g., 0.5)
            if (!videoRef.current.muted && videoRef.current.volume === 0) {
                videoRef.current.volume = 0.5;
            }
        }
    };


    const toggleFullscreen = async () => {
       const elem = containerRef.current; // Target the container
        if (!elem) return;

        if (!document.fullscreenElement) {
            try {
                // Standard fullscreen request
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                // Fallbacks for older browsers (consider removing if not needed)
                } else if ((elem as any).mozRequestFullScreen) { /* Firefox */
                    await (elem as any).mozRequestFullScreen();
                } else if ((elem as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                   await (elem as any).webkitRequestFullscreen();
                } else if ((elem as any).msRequestFullscreen) { /* IE/Edge */
                   await (elem as any).msRequestFullscreen();
                }
            } catch (err) {
                console.error('Error attempting to enable fullscreen:', err);
            }
        } else {
             try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).mozCancelFullScreen) { /* Firefox */
                    await (document as any).mozCancelFullScreen();
                } else if ((document as any).webkitExitFullscreen) { /* Chrome, Safari & Opera */
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).msExitFullscreen) { /* IE/Edge */
                   await (document as any).msExitFullscreen();
                }
            } catch (err) {
                console.error('Error attempting to disable fullscreen:', err);
            }
        }
    };


    const formatTime = (seconds: number): string => {
         if (isNaN(seconds) || !isFinite(seconds)) {
            return '00:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress for the seek bar's background gradient
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const seekBarBackground = `linear-gradient(to right, #3b82f6 ${progressPercent}%, #4b5563 ${progressPercent}%)`; // Tailwind blue-500 and gray-600


    return (
        <div ref={containerRef} className={`relative group ${className} bg-black`} // Use group for hover/focus states within children
             onMouseEnter={() => setShowControls(true)}
             // onMouseLeave={() => !isPlaying && setShowControls(false)} // Keep controls visible when paused and mouse leaves
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full block aspect-video" // block removes extra space below video
                src={src}
                title={title}
                playsInline // Important for mobile inline playback
                onClick={togglePlay} // Allow clicking video to play/pause
                onDoubleClick={toggleFullscreen} // Double click for fullscreen
            >
                Your browser does not support the video tag.
            </video>

            {/* Controls Overlay - Conditionally Render based on showControls or group-hover/focus-within */}
             <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ease-in-out p-2 sm:p-4 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside controls from toggling play/pause on the video element itself
            >
                 {/* Timeline / Seek Bar */}
                 <div className="flex items-center gap-2 mb-2">
                     <input
                         type="range"
                         min="0"
                         max={duration || 0} // Ensure max is 0 if duration is not available yet
                         value={currentTime}
                         onChange={handleSeek}
                         className="w-full h-2 rounded-lg appearance-none cursor-pointer range-lg bg-gray-700" // Basic styling
                         style={{ background: seekBarBackground }} // Dynamic background
                         aria-label="Video progress"
                         disabled={duration <= 0} // Disable if duration is 0 or invalid
                    />
                 </div>


                {/* Bottom Row Controls */}
                <div className="flex items-center justify-between text-white">
                    {/* Left Controls */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={togglePlay}
                            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                           {/* Replace with actual icons */}
                           {isPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg> // Basic Pause Icon
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> // Basic Play Icon
                            )}
                        </button>

                         {/* Volume Control */}
                        <div className="flex items-center gap-1 group">
                             <button
                                onClick={toggleMute}
                                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {/* Replace with actual icons */}
                                {isMuted ? (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0L19 5.858l-1.414 1.414L16.172 6.5a1 1 0 01-1.414-1.414l-1.06-1.061zm-1.06 1.06a1 1 0 010 1.414L11.172 7.914a1 1 0 01-1.414-1.414l1.414-1.414zm3.535 2.122a1 1 0 010 1.414L15.757 9.33a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zm-1.414 1.414a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707z" clipRule="evenodd" /></svg> // Mute Icon Placeholder
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l-1.293 1.293a1 1 0 11-1.414-1.414l.293-.293zm4.707 4.707a1 1 0 01-1.414 0L15 11.414l1.293-1.293a1 1 0 011.414 1.414l-.293.293z" clipRule="evenodd" /></svg> // Volume Icon Placeholder
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-0 group-hover:w-16 h-1.5 sm:h-2 rounded-lg appearance-none cursor-pointer transition-all duration-200 ease-in-out bg-gray-600" // Hide by default, show on hover
                                aria-label="Volume control"
                            />
                         </div>


                        {/* Time Display */}
                         <div className="text-xs sm:text-sm tabular-nums whitespace-nowrap ml-2">
                             {formatTime(currentTime)} / {formatTime(duration)}
                         </div>
                    </div>


                    {/* Right Controls */}
                    <div className="flex items-center gap-2 sm:gap-4">
                       {/* Potential place for settings, chapters, quality etc. */}

                         <button
                            onClick={toggleFullscreen}
                            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {/* Replace with actual icons */}
                            {isFullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 4.293a1 1 0 011.414 0L10 7.586l3.293-3.293a1 1 0 111.414 1.414L11.414 9H15a1 1 0 110 2h-5a1 1 0 01-1-1V5a1 1 0 112 0v3.586L5.293 5.707a1 1 0 010-1.414zM10 18a1 1 0 01-1-1v-3.586l-3.293 3.293a1 1 0 11-1.414-1.414L7.586 12H4a1 1 0 110-2h5a1 1 0 011 1z" clipRule="evenodd" /></svg> // Exit Fullscreen Icon
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 11-2 0V4zm14 0a1 1 0 011 1v4a1 1 0 11-2 0V5h-3a1 1 0 110-2h4zM4 17a1 1 0 01-1-1v-4a1 1 0 112 0v3h3a1 1 0 110 2H4zm13-1a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z" clipRule="evenodd" /></svg> // Enter Fullscreen Icon
                            )}
                        </button>
                    </div>
                </div>
             </div>


            {/* Optional Chapter Overlay */}
            {showChapterOverlay && currentChapter && (
                <div className={`absolute top-4 left-4 bg-black/60 text-white p-2 rounded-md text-sm transition-opacity duration-300 ease-in-out ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                    <h3 className="font-semibold">{currentChapter.title}</h3>
                    <p className="text-xs text-gray-300">
                        {formatTime(currentChapter.startTime)}
                        {currentChapter.endTime && ` - ${formatTime(currentChapter.endTime)}`}
                    </p>
                </div>
            )}

             {/* Floating Chapter Markers (Example) */}
             {showChapterOverlay && markers.length > 0 && (
                 <div className={`absolute bottom-20 right-4 flex flex-col gap-1 transition-opacity duration-300 ease-in-out ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                    {markers.map((marker) => (
                         <button
                            key={marker.id}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent video click toggle
                                console.log('[ModernVideoPlayer] Marker clicked:', marker.title, 'Target Time:', marker.time);
                                // Seek the video first to ensure responsiveness
                                handleSeek(marker.time);
                                // Then notify the parent component if needed
                                onMarkerClick?.(marker);
                            }}
                            className={`px-3 py-1 text-xs rounded shadow hover:bg-blue-600 transition-colors ${currentTime >= marker.time && (!currentChapter || marker.time >= currentChapter.startTime) ? 'bg-blue-500 font-semibold' : 'bg-gray-700/80'}`}
                            title={marker.description || marker.title}
                        >
                             {marker.title}
                         </button>
                     ))}
                 </div>
            )}
        </div>
    );
};

export default ModernVideoPlayer; 