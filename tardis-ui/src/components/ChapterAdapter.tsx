'use client';

import React from 'react';
import Chapters from './Chapters';
import { ChapterV1 } from '@/types/database';

// This adapter component converts ChapterV1[] to Chapter[] for compatibility
// with the Chapters component
interface ChapterAdapterProps {
  chapters: ChapterV1[];
  chaptersMeta: any[];
  onLessonClick: (chapter: ChapterV1) => void;
  compact?: boolean;
}

const ChapterAdapter: React.FC<ChapterAdapterProps> = ({ 
  chapters, 
  chaptersMeta, 
  onLessonClick,
  compact = false
}) => {
  // Convert ChapterV1[] to Chapter[] by ensuring id is a string
  const adaptedChapters = chapters.map(chapter => ({
    ...chapter,
    id: String(chapter.id) // Convert id to string
  }));

  return (
    <Chapters
      chapters={adaptedChapters}
      chaptersMeta={chaptersMeta}
      onLessonClick={(adaptedChapter) => {
        // Find the original chapter to pass back to the handler
        const originalChapter = chapters.find(
          c => String(c.id) === adaptedChapter.id
        );
        if (originalChapter) {
          onLessonClick(originalChapter);
        }
      }}
      compact={compact}
    />
  );
};

export default ChapterAdapter; 