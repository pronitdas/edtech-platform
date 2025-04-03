import React, { useState, useEffect, useCallback } from "react";
import MarkdownViewer from "../MarkDownViewer";
import SlideshowControls from "./SlideshowControls";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernMarkdownSlideshowProps {
  /**
   * Array of markdown content strings, one for each slide
   */
  content: string[];
  
  /**
   * Optional array of image URLs that can be referenced in the markdown
   */
  images?: string[];
  
  /**
   * Knowledge ID for the content
   */
  knowledge_id: string;
  
  /**
   * Optional initial slide index
   */
  currentIndex?: number;
  
  /**
   * Optional callback fired when the slide changes
   */
  onSlideChange?: (index: number) => void;
  
  /**
   * Optional theme for the slideshow
   */
  theme?: 'light' | 'dark' | 'system';
  
  /**
   * Optional controls variant
   */
  controlsVariant?: 'default' | 'minimal' | 'text-only';
  
  /**
   * Optional class name for styling
   */
  className?: string;
}

/**
 * Modern Markdown Slideshow component with enhanced accessibility and theming
 * 
 * Features:
 * - Keyboard navigation (arrow keys)
 * - Theme support (light/dark)
 * - Various control styles
 * - Proper ARIA attributes for accessibility
 * - Progress indicator
 */
const ModernMarkdownSlideshow: React.FC<ModernMarkdownSlideshowProps> = ({
  content,
  images = [],
  knowledge_id,
  currentIndex = 0,
  onSlideChange,
  theme = 'system',
  controlsVariant = 'default',
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(currentIndex);
  const hasNextSlide = currentSlide < content.length - 1;
  const hasPreviousSlide = currentSlide > 0;

  // Determine theme class based on prop or system setting
  const getThemeClass = () => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return theme;
  };
  
  const [themeClass, setThemeClass] = useState(getThemeClass());
  
  // Update theme when system preference changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setThemeClass(mediaQuery.matches ? 'dark' : 'light');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setThemeClass(theme);
    }
  }, [theme]);

  // Sync with external control
  useEffect(() => {
    if (currentIndex !== undefined && currentIndex !== currentSlide) {
      setCurrentSlide(currentIndex);
    }
  }, [currentIndex, currentSlide]);

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    if (hasNextSlide) {
      const newIndex = currentSlide + 1;
      setCurrentSlide(newIndex);
      if (onSlideChange) {
        onSlideChange(newIndex);
      }
    }
  }, [currentSlide, hasNextSlide, onSlideChange]);

  // Navigate to previous slide
  const previousSlide = useCallback(() => {
    if (hasPreviousSlide) {
      const newIndex = currentSlide - 1;
      setCurrentSlide(newIndex);
      if (onSlideChange) {
        onSlideChange(newIndex);
      }
    }
  }, [currentSlide, hasPreviousSlide, onSlideChange]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        previousSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, previousSlide]);

  // Styles based on theme
  const getContainerStyles = () => {
    return themeClass === 'dark' 
      ? 'bg-gray-800 text-white border-gray-700' 
      : 'bg-white text-gray-800 border-gray-200';
  };

  return (
    <div 
      className={`markdown-slideshow border-2 rounded-lg overflow-hidden flex flex-col w-full ${getContainerStyles()} ${className}`}
      role="region"
      aria-label="Slideshow"
    >
      {/* Content Area */}
      <div className="relative w-full">
        {/* Side Navigation for Larger Screens */}
        <div className="hidden sm:flex absolute inset-y-0 left-0 items-center px-2 z-10">
          {hasPreviousSlide && (
            <button
              onClick={previousSlide}
              className="p-1 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        
        {/* Slide Content */}
        <div 
          className="w-full max-h-[calc(100vh-10rem)] overflow-auto rounded-lg shadow p-6"
          aria-live="polite"
        >
          <MarkdownViewer
            key={currentSlide}
            content={content[currentSlide]}
            images={images}
            knowledge_id={knowledge_id}
          />
        </div>
        
        {/* Side Navigation for Larger Screens */}
        <div className="hidden sm:flex absolute inset-y-0 right-0 items-center px-2 z-10">
          {hasNextSlide && (
            <button
              onClick={nextSlide}
              className="p-1 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Controls at bottom */}
      <SlideshowControls
        currentSlide={currentSlide}
        totalSlides={content.length}
        onNext={nextSlide}
        onPrevious={previousSlide}
        variant={controlsVariant}
        className={themeClass === 'dark' ? 'border-t border-gray-700 px-4' : 'border-t border-gray-200 px-4'}
      />
    </div>
  );
};

export default ModernMarkdownSlideshow; 