import React, { useRef, useEffect, useState, useMemo } from 'react';
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
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Find current marker based on video time
    const currentMarker = useMemo(() => {
        return markers
            .slice()
            .reverse()
            .find(marker => currentTime >= marker.time);
    }, [currentTime, markers]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdateEvent = () => {
            const newTime = video.currentTime;
            setCurrentTime(newTime);
            onTimeUpdate?.(newTime); // Call the callback with current time
        };
        
        const handleDurationChange = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => setVolume(video.volume);
        const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === video);

        // Add event listeners
        video.addEventListener('timeupdate', handleTimeUpdateEvent);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('volumechange', handleVolumeChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            // Remove event listeners
            video.removeEventListener('timeupdate', handleTimeUpdateEvent);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('volumechange', handleVolumeChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [onTimeUpdate]); // Add onTimeUpdate to dependencies

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = parseFloat(e.target.value);
            videoRef.current.currentTime = time;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const vol = parseFloat(e.target.value);
            videoRef.current.volume = vol;
        }
    };

    const toggleFullscreen = async () => {
        if (!videoRef.current) return;

        if (!document.fullscreenElement) {
            try {
                await videoRef.current.requestFullscreen();
            } catch (err) {
                console.error('Error attempting to enable fullscreen:', err);
            }
        } else {
            await document.exitFullscreen();
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative aspect-video">
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    src={src}
                    title={title}
                    playsInline
                >
                    Your browser does not support the video tag.
                </video>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-white">
                            <button
                                onClick={togglePlay}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-20"
                                    />
                                </div>

                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                >
                                    {isFullscreen ? 'Exit' : 'Full'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="flex-grow"
                            />
                            <div className="text-white text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-white text-lg font-semibold p-4">{title}</h2>

            {showChapterOverlay && markers.length > 0 && (
                <div className="absolute bottom-16 left-0 right-0 bg-black/50 text-white p-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold">{currentChapter?.title}</h3>
                            <p className="text-xs text-gray-300">
                                {formatTime(currentChapter?.startTime || 0)}
                                {currentChapter?.endTime && ` - ${formatTime(currentChapter.endTime)}`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {markers.map((marker) => (
                                <button
                                    key={marker.id}
                                    onClick={() => onMarkerClick?.(marker)}
                                    className="px-2 py-1 text-xs bg-blue-500 rounded hover:bg-blue-600"
                                >
                                    {marker.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernVideoPlayer; 