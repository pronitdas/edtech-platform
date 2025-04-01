import { useState, useEffect } from 'react';
import { BookOpen, Video, ArrowLeftRight } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import MarkdownSlideshow from './MarkdownSlideshow';
import { interactionTracker } from '@/services/interaction-tracking';

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

interface ContentToggleProps {
  videoSrc: string;
  videoTitle: string;
  markers?: TimelineMarker[];
  notes: string | string[];
  knowledgeId: string;
}

const ContentToggle = ({ 
  videoSrc, 
  videoTitle, 
  markers = [], 
  notes,
  knowledgeId
}: ContentToggleProps) => {
  const [showVideo, setShowVideo] = useState(true);
  const [processedNotes, setProcessedNotes] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);

  // Process notes on component mount
  useEffect(() => {
    if (!notes) {
      setProcessedNotes(["Content is being generated..."]);
    } else if (typeof notes === 'string') {
      setProcessedNotes(notes.includes("|||||") ? notes.split("|||||") : [notes]);
    } else if (Array.isArray(notes)) {
      setProcessedNotes(notes);
    }
  }, [notes]);

  // Sync note index with active chapter
  useEffect(() => {
    if (markers.length && activeChapterId) {
      const index = markers.findIndex(marker => marker.id === activeChapterId);
      if (index >= 0 && index < processedNotes.length) {
        setActiveNoteIndex(index);
      }
    }
  }, [activeChapterId, markers, processedNotes]);

  // Toggle between video and notes with animation
  const toggleContent = () => {
    setIsTransitioning(true);
    
    // Track interaction
    if (showVideo) {
      interactionTracker.trackNotesClick();
    }
    
    // Delay state change for animation
    setTimeout(() => {
      setShowVideo(!showVideo);
      setIsTransitioning(false);
    }, 300);
  };

  // Handle marker click from notes
  const handleMarkerClick = (marker: TimelineMarker) => {
    setActiveChapterId(marker.id);
    if (!showVideo) {
      setShowVideo(true);
    }
  };

  // Handle video time update to sync with notes
  const handleVideoTimeUpdate = (time: number) => {
    setCurrentTime(time);
    
    // Find the current marker based on time
    const currentMarker = [...markers]
      .sort((a, b) => a.time - b.time)
      .filter(marker => marker.time <= time)
      .pop();
    
    if (currentMarker && (!activeChapterId || currentMarker.id !== activeChapterId)) {
      setActiveChapterId(currentMarker.id);
    }
  };

  // Handle video events for tracking
  const handleVideoPlay = () => {
    interactionTracker.trackVideoPlay();
  };

  const handleVideoPause = () => {
    interactionTracker.trackVideoPause();
  };

  const handleVideoSeek = () => {
    interactionTracker.trackTimelineSeek();
  };

  // Handle note navigation
  const handleNoteChange = (index: number) => {
    setActiveNoteIndex(index);
    
    // Find corresponding marker for this note index
    if (markers.length > index) {
      setActiveChapterId(markers[index].id);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={toggleContent}
        className="absolute top-4 right-4 z-50 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-200 ease-in-out flex items-center gap-2"
        disabled={isTransitioning}
      >
        {showVideo ? (
          <>
            <BookOpen className="w-4 h-4" />
            <span>View Notes</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span>Return to Video</span>
          </>
        )}
      </button>

      {/* Content Switcher */}
      <div className="relative w-full h-full">
        {/* Video Player */}
        <div 
          className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out ${
            showVideo 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 -translate-x-full pointer-events-none'
          }`}
        >
          <VideoPlayer
            src={videoSrc}
            title={videoTitle}
            markers={markers}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onSeek={handleVideoSeek}
            onMarkerClick={handleMarkerClick}
            onTimeUpdate={handleVideoTimeUpdate}
            activeChapterId={activeChapterId}
          />
        </div>

        {/* Notes */}
        <div 
          className={`absolute inset-0 w-full h-full bg-white transition-all duration-300 ease-in-out ${
            !showVideo 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          <div className="h-full overflow-auto">
            <MarkdownSlideshow
              content={processedNotes}
              knowledge_id={knowledgeId}
              currentIndex={activeNoteIndex}
              onSlideChange={handleNoteChange}
            />
          </div>
        </div>
      </div>

      {/* Transition Indicator */}
      {isTransitioning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
};

export default ContentToggle; 