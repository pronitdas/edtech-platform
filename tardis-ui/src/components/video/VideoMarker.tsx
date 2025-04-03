import React from 'react';
import { BookOpen, Code, Play, MessageSquare } from 'lucide-react';
import { TimelineMarker } from './VideoTypes';

interface VideoMarkerProps {
  marker: TimelineMarker;
  position: number;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

/**
 * Video marker component for displaying markers on the timeline
 * Each marker represents a specific point in the video
 */
const VideoMarker: React.FC<VideoMarkerProps> = ({
  marker,
  position,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  // Get marker color based on type and active state
  const getMarkerColor = (): string => {
    if (isActive) {
      return 'bg-blue-500';
    }
    
    switch (marker.type) {
      case 'latex':
        return 'bg-purple-500';
      case 'code':
        return 'bg-green-500';
      case 'roleplay':
        return 'bg-orange-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Get marker icon based on type
  const getMarkerIcon = () => {
    switch (marker.type) {
      case 'latex':
        return <BookOpen size={12} />;
      case 'code':
        return <Code size={12} />;
      case 'roleplay':
        return <MessageSquare size={12} />;
      default:
        return <Play size={12} />;
    }
  };

  return (
    <div
      className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full ${getMarkerColor()} flex items-center justify-center cursor-pointer pointer-events-auto`}
      style={{ left: `${position}%` }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={marker.label || `Marker at ${marker.time} seconds`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="text-white">
        {getMarkerIcon()}
      </div>
    </div>
  );
};

export default VideoMarker; 