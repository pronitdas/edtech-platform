import React from 'react'

// Placeholder type for Chapter navigation items - Replace with actual type
interface ChapterNavItem {
  id: string
  title: string
  isActive: boolean
}

interface CourseSidebarProps {
  // Add props needed for chapter navigation, e.g., list of chapters, active chapter
  // chapterNavItems: ChapterNavItem[];
  // onChapterSelect: (chapterId: string) => void;
  isOpen: boolean
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ isOpen }) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className='h-full w-full border-l border-gray-700 bg-gray-800 p-3 transition-all duration-300 md:w-1/4 md:overflow-y-auto'>
      <h3 className='mb-2 border-b border-gray-700 pb-2 text-sm font-semibold text-white'>
        Chapter Sections
      </h3>
      <div className='space-y-1'>
        {/* Placeholder for Chapter Navigation List */}
        <p className='text-xs text-gray-400'>
          Chapter navigation items will be listed here.
        </p>
        {/* Example item structure (replace with actual map) */}
        {/* 
          chapterNavItems.map(item => (
            <button 
              key={item.id}
              onClick={() => onChapterSelect(item.id)}
              className={`block w-full text-left px-2 py-1 rounded text-xs ${item.isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              {item.title}
            </button>
          ))
        */}
      </div>
    </div>
  )
}

export default CourseSidebar
