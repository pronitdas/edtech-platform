'use client'

import React from 'react'
import Chapters from './Chapters'
import { Chapter } from '@/types/api'

// This adapter component converts ChapterV1[] to Chapter[] for compatibility
// with the Chapters component
interface ChapterAdapterProps {
  chapters: Chapter[]
  chaptersMeta: any[]
  onLessonClick: (chapter: Chapter) => void
  compact?: boolean
}

const ChapterAdapter: React.FC<ChapterAdapterProps> = ({
  chapters,
  chaptersMeta,
  onLessonClick,
  compact = false,
}) => {
  // Convert ChapterV1[] to Chapter[] by ensuring id is a string and topic is not null
  const adaptedChapters = chapters.map(chapter => ({ 
    ...chapter,
    topic: chapter.topic || chapter.subtopic || 'General'
  }))

  return (
    <Chapters
      chapters={adaptedChapters}
      chaptersMeta={chaptersMeta}
      onLessonClick={adaptedChapter => {
        // Find the original chapter to pass back to the handler
        const originalChapter = chapters.find(c => c.id === adaptedChapter.id)
        if (originalChapter) {
          onLessonClick(originalChapter)
        }
      }}
      compact={compact}
    />
  )
}

export default ChapterAdapter
