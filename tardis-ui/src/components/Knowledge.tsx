'use client';
import { useState } from 'react';

interface KnowledgeProps {
  dimensions: any[];
  onClick: (id: string) => void;
}

export default function Knowledge({ dimensions, onClick }: KnowledgeProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Calculate pagination
  const totalPages = Math.ceil(dimensions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = dimensions.slice(startIndex, startIndex + itemsPerPage);

  // Get visible page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-4 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {paginatedItems.map((item) => (
          <KnowledgeCard
            key={item.id}
            item={item}
            onClick={() => onClick(item.id)}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        pageNumbers={getPageNumbers()}
      />
    </div>
  );
}

interface KnowledgeCardProps {
  item: any;
  onClick: () => void;
}

const KnowledgeCard = ({ item, onClick }: KnowledgeCardProps) => {
  // Group chapters by subtopic
  const subtopicMap: Record<string, any[]> = {};
  item.chapters_v1?.forEach((chapter: any) => {
    const subtopic = chapter.subtopic || 'General';
    if (!subtopicMap[subtopic]) {
      subtopicMap[subtopic] = [];
    }
    subtopicMap[subtopic].push(chapter);
  });

  return (
    <div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:translate-y-[-5px] cursor-pointer"
      onClick={onClick}
    >
      <div className="p-3 bg-gradient-to-r from-blue-500 to-teal-500 rounded-t-xl">
        <h2 className="text-lg font-bold text-white truncate">{item.name}</h2>
      </div>
      <div className="p-3 h-[150px] overflow-y-auto rounded-b-xl">
        {Object.entries(subtopicMap).map(([subtopic, chapters]) => (
          <div key={subtopic} className="mb-2">
            <h3 className="font-semibold text-gray-600">{subtopic}</h3>
            <ul className="list-disc list-inside">
              {chapters.map((chapter) => (
                <li key={chapter.id} className="text-sm text-gray-700 truncate">
                  {chapter.chaptertitle}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageNumbers: number[];
}

const Pagination = ({ currentPage, totalPages, onPageChange, pageNumbers }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="flex items-center space-x-1">
        <PaginationButton
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          label="First"
        />

        <PaginationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          label="Previous"
        />

        {pageNumbers.map(num => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`px-3 py-1 rounded ${currentPage === num
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            {num}
          </button>
        ))}

        <PaginationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          label="Next"
        />

        <PaginationButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          label="Last"
        />
      </div>

      <div className="mt-2 text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

const PaginationButton = ({ onClick, disabled, label }: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-2 py-1 bg-gray-200 rounded ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
      }`}
  >
    {label}
  </button>
);
