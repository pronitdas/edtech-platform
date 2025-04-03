/**
 * Timeline marker interface used for navigation points in video
 */
export interface TimelineMarker {
  time: number;
  label?: string;
  type?: 'latex' | 'code' | 'roleplay' | 'default';
  content?: string;
  active?: boolean;
  id?: string;
  chapterTitle?: string;
  description?: string;
}

/**
 * Video state interface for managing video playback state
 */
export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isSeeking: boolean;
  error: string | null;
  currentChapter: TimelineMarker | null;
}

/**
 * Hook actions interface for video state management
 */
export interface VideoStateActions {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  skipTime: (seconds: number) => void;
  setCurrentTime: (time: number) => void;
}

/**
 * Video player options interface
 */
export interface VideoPlayerOptions {
  autoPlay?: boolean;
  showControls?: boolean;
  controlsTimeout?: number;
  seekingThrottle?: number;
} 