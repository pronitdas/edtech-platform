'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { ChapterContent, ChapterV1 } from '@/types/database';
import { useCourseState } from '@/hooks/useCourseState';
import { ContentType } from '@/services/edtech-api';

// CourseState interface defined here for export
export interface CourseState {
  // Course data
  content: ChapterContent;
  chapter: ChapterV1;
  language: string;
  
  // UI state
  activeTab: string;
  showReport: boolean;
  isFullscreenMindmap: boolean;
  timelineMarkers: any[];
  isLoading: boolean;
  showSettings: boolean;
  generatingTypes: ContentType[];
  isMobileView: boolean;
  sidebarOpen: boolean;
  isGeneratingRoleplay: boolean;
  activeChapterId: string | undefined;
  availableTabs: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
  }>;
}

// Create the context with a default undefined value
const CourseContext = createContext<ReturnType<typeof useCourseState> | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
  content: ChapterContent;
  chapter: ChapterV1;
  language?: string;
}

export const CourseProvider: React.FC<CourseProviderProps> = ({ 
  children, 
  content,
  chapter,
  language = 'English',
}) => {
  // Log any missing data for debugging
  useEffect(() => {
    if (!chapter || !chapter.id) {
      console.warn('CourseProvider: Missing or invalid chapter data', chapter);
    }
    if (!content) {
      console.warn('CourseProvider: Missing content data');
    }
  }, [chapter, content]);

  // If content or chapter is missing, don't render children
  if (!chapter?.id) {
    console.error('CourseProvider: Required chapter data is missing', { chapter });
    return null;
  }
  
  console.log('CourseProvider rendering with combined content:', content);
  console.log('Video URL in provider:', content?.video_url);
  console.log('Roleplay data in provider:', content?.roleplay);

  const courseState = useCourseState(content, chapter, language);
  
  return (
    <CourseContext.Provider value={courseState}>
      {children}
    </CourseContext.Provider>
  );
};

// Custom hook to use the course context
export function useCourse() {
  const context = useContext(CourseContext);
  
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  
  return context;
} 