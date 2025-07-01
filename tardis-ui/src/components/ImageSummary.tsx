'use client'

import React, { useState } from 'react'
import MarkdownViewer from './MarkDownViewer'

interface ImageCarouselProps {
  slides: string[] // Array of summary slide content
  imageUrls: string[] // Array of image URLs corresponding to each slide
  isVertical?: boolean // Option to choose vertical or horizontal layout
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  slides,
  imageUrls,
  isVertical = false,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0)

  // Navigation handlers
  const goToNextPage = () => {
    if (currentPage < slides.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Carousel container styling
  const carouselContainerStyles = {
    transform: isVertical
      ? `translateY(-${currentPage * 100}%)`
      : `translateX(-${currentPage * 100}%)`,
    transition: 'transform 0.5s ease-in-out',
  }

  return (
    <div className='max-w-3xl overflow-hidden rounded-lg shadow-lg'>
      <div
        className={`flex ${isVertical ? 'flex-col' : 'flex-row'} w-full`}
        style={carouselContainerStyles}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className='flex h-full w-full flex-shrink-0 flex-col items-center space-y-4 p-4'
            style={{
              width: isVertical ? '100%' : '100%',
              height: isVertical ? '100%' : '100%',
            }}
          >
            {imageUrls[index] && (
              <img
                src={imageUrls[index]}
                alt={`Visual for slide ${index + 1}`}
                className='h-64 w-64 rounded-lg object-cover shadow-lg'
              />
            )}
            <MarkdownViewer key={index} content={slide} />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className='mt-4 flex justify-between'>
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          className='rounded bg-blue-500 px-4 py-2 text-white disabled:bg-blue-200'
        >
          Previous
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage === slides.length - 1}
          className='rounded bg-blue-500 px-4 py-2 text-white disabled:bg-blue-200'
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default ImageCarousel
