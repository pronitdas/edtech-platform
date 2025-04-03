import React, { useRef, useEffect, useState } from 'react';
import VideoCore, { VideoRefType } from './VideoCore';
import VideoControls from './VideoControls';
import VideoTimeline from './VideoTimeline';
import { TimelineMarker } from './VideoTypes';
import { useVideoState } from './useVideoState';

interface ModernVideoPlayerProps {
    src: string;
    title: string;
    chapterId: string;
    knowledgeId: string;
    className?: string;
}

/**
 * Modern video player component with enhanced accessibility and modular architecture
 */
const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
    src,
    title,
    chapterId,
    knowledgeId,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleDurationChange = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => setVolume(video.volume);
        const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === video);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('volumechange', handleVolumeChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('volumechange', handleVolumeChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

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

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`relative bg-black ${className}`}>
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
        </div>
    );
};

export default ModernVideoPlayer; 