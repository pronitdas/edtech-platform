import React from 'react'

const ChapterView: React.FC = () => {
  return (
    <div className='flex h-full w-full items-center justify-center text-white'>
      <div className='mx-auto max-w-md p-6 text-center'>
        <h2 className='mb-4 text-2xl font-bold'>
          Select a Chapter
        </h2>
        <p className='mb-4 text-gray-400'>
          Please select a chapter from the sidebar to view its content.
        </p>
      </div>
    </div>
  )
}

export default ChapterView