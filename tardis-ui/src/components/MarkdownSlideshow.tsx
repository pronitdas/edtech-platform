'use client'

import React, { useState, useEffect } from 'react'
import MarkdownViewer from './MarkDownViewer'

// Markdown Slideshow Component
const MarkdownSlideshow: React.FC<{
  content: string[]
  images?: string[]
  knowledge_id: string
  currentIndex?: number
  onSlideChange?: (index: number) => void
}> = ({ content, images = [], knowledge_id, currentIndex, onSlideChange }) => {
  const [currentSlide, setCurrentSlide] = useState(currentIndex || 0)
  const hasNextSlide = currentSlide < content.length - 1
  const hasPreviousSlide = currentSlide > 0

  // Sync with external control
  useEffect(() => {
    if (currentIndex !== undefined && currentIndex !== currentSlide) {
      setCurrentSlide(currentIndex)
    }
  }, [currentIndex])

  const nextSlide = () => {
    if (hasNextSlide) {
      const newIndex = currentSlide + 1
      setCurrentSlide(newIndex)
      if (onSlideChange) {
        onSlideChange(newIndex)
      }
    }
  }

  const previousSlide = () => {
    if (hasPreviousSlide) {
      const newIndex = currentSlide - 1
      setCurrentSlide(newIndex)
      if (onSlideChange) {
        onSlideChange(newIndex)
      }
    }
  }

  return (
    <div className='markdown-slideshow flex w-full flex-col border-double p-2'>
      {/* Slide Content */}
      <div className='max-h-[calc(100vh-10rem)] w-full overflow-auto rounded-lg bg-gray-800 p-3 shadow'>
        <MarkdownViewer
          key={currentSlide}
          content={content[currentSlide] || ''}
          images={images}
          knowledge_id={knowledge_id}
        />
      </div>

      {/* Navigation Buttons */}
      <div className='navigation-buttons mt-4 flex items-center justify-between'>
        <button
          onClick={previousSlide}
          disabled={!hasPreviousSlide}
          className='rounded-lg bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400'
        >
          Previous
        </button>
        <span className='text-sm text-gray-500'>{`Slide ${currentSlide + 1} of ${content.length}`}</span>
        <button
          onClick={nextSlide}
          disabled={!hasNextSlide}
          className='rounded-lg bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400'
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default MarkdownSlideshow
