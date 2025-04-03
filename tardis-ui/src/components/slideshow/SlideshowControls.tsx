import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideshowControlsProps {
  currentSlide: number;
  totalSlides: number;
  onNext: () => void;
  onPrevious: () => void;
  showProgressIndicator?: boolean;
  variant?: 'default' | 'minimal' | 'text-only';
  className?: string;
}

/**
 * Slideshow navigation controls component
 * Provides next/previous buttons and optional progress indicator
 */
const SlideshowControls: React.FC<SlideshowControlsProps> = ({
  currentSlide,
  totalSlides,
  onNext,
  onPrevious,
  showProgressIndicator = true,
  variant = 'default',
  className = '',
}) => {
  const hasNextSlide = currentSlide < totalSlides - 1;
  const hasPreviousSlide = currentSlide > 0;

  // Render different button styles based on variant
  const renderButtons = () => {
    switch (variant) {
      case 'minimal':
        return (
          <>
            <button
              onClick={onPrevious}
              disabled={!hasPreviousSlide}
              className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNextSlide}
              className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        );
      case 'text-only':
        return (
          <>
            <button
              onClick={onPrevious}
              disabled={!hasPreviousSlide}
              className="px-4 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:underline"
              aria-label="Previous slide"
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={!hasNextSlide}
              className="px-4 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:underline"
              aria-label="Next slide"
            >
              Next
            </button>
          </>
        );
      default:
        return (
          <>
            <button
              onClick={onPrevious}
              disabled={!hasPreviousSlide}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous slide"
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={!hasNextSlide}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next slide"
            >
              Next
            </button>
          </>
        );
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    if (!showProgressIndicator) return null;

    return (
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-500" aria-live="polite">
          {`Slide ${currentSlide + 1} of ${totalSlides}`}
        </span>
        <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentSlide + 1}
            aria-valuemin={1}
            aria-valuemax={totalSlides}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex justify-between items-center py-3 ${className}`}>
      <div className="flex space-x-2">
        {renderButtons()}
      </div>
      {renderProgressIndicator()}
    </div>
  );
};

export default SlideshowControls; 