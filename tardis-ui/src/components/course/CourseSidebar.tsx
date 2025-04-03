import React from 'react';

// Placeholder type for Chapter navigation items - Replace with actual type
interface ChapterNavItem {
  id: string;
  title: string;
  isActive: boolean;
}

interface CourseSidebarProps {
  // Add props needed for chapter navigation, e.g., list of chapters, active chapter
  // chapterNavItems: ChapterNavItem[];
  // onChapterSelect: (chapterId: string) => void;
  isOpen: boolean;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ isOpen }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-full md:w-1/4 h-full md:overflow-y-auto bg-gray-800 border-l border-gray-700 p-3 transition-all duration-300">
      <h3 className="text-white text-sm font-semibold mb-2 pb-2 border-b border-gray-700">
        Chapter Sections
      </h3>
      <div className="space-y-1">
        {/* Placeholder for Chapter Navigation List */}
        <p className="text-gray-400 text-xs">Chapter navigation items will be listed here.</p>
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
  );
};

export default CourseSidebar; 