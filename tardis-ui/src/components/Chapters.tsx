'use client';

import React, { useState } from "react";
import { CheckCircleIcon, PlusCircleIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Chapter {
  id: string;
  topic: string;
  chaptertitle: string;
  chapter: string;
  subtopic: string;
}

interface ChaptersProps {
  chapters: Chapter[];
  chaptersMeta: any[];
  onLessonClick: (chapter: Chapter) => void;
  compact?: boolean;
}

const Chapters: React.FC<ChaptersProps> = ({ chapters, chaptersMeta, onLessonClick, compact = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chapters based on search query
  const filteredChapters = chapters.filter((chapter) =>
    chapter.chaptertitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const chaptersPerPage = compact ? 8 : 6;
  const totalPages = Math.ceil(filteredChapters.length / chaptersPerPage);
  const paginatedChapters = filteredChapters.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );

  return (
    <div className={`w-full ${compact ? 'p-2' : 'p-4'}`}>
      <SearchBar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        compact={compact}
      />

      {compact ? (
        <ChapterList
          chapters={paginatedChapters}
          chaptersMeta={chaptersMeta}
          onLessonClick={onLessonClick}
        />
      ) : (
        <ChapterGrid
          chapters={paginatedChapters}
          chaptersMeta={chaptersMeta}
          onLessonClick={onLessonClick}
        />
      )}

      {totalPages > 1 && (
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          compact={compact}
        />
      )}
    </div>
  );
};

const SearchBar = ({ value, onChange, compact = false }) => (
  <div className={`${compact ? 'mb-2' : 'mb-4'}`}>
    <div className="relative">
      <input
        type="text"
        placeholder="Search chapters..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${compact ? 'py-1.5 px-3 text-sm' : 'py-2 px-4'} bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
    </div>
  </div>
);

const ChapterGrid = ({ chapters, chaptersMeta, onLessonClick }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {chapters.length > 0 ? (
      chapters.map((chapter) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          chapterMeta={chaptersMeta.find((cm) => cm.chapter_id === chapter.id)}
          onClick={() => onLessonClick(chapter)}
        />
      ))
    ) : (
      <div className="col-span-3 text-center text-gray-400 py-8">
        No chapters found
      </div>
    )}
  </div>
);

const ChapterCard = ({ chapter, chapterMeta, onClick }) => (
  <Card
    className="hover:shadow-lg transition-all duration-200 cursor-pointer"
    onClick={onClick}
  >
    <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3">
      <CardTitle className="text-sm font-semibold truncate">{chapter.chaptertitle}</CardTitle>
    </CardHeader>
    <CardContent className="p-3">
      <p className="text-xs text-gray-600 h-[80px] overflow-hidden">
        {chapter.chapter.slice(0, 120)}...
      </p>
      <ChapterMetaBadges chapterMeta={chapterMeta} />
    </CardContent>
  </Card>
);

const ChapterMetaBadges = ({ chapterMeta }) => (
  <div className="bg-gradient-to-r from-blue-600 to-red-500 p-2 rounded-lg flex flex-wrap gap-2">
    <MetaBadge
      available={chapterMeta?.has_quiz}
      label="Quiz"
    />
    <MetaBadge
      available={chapterMeta?.has_notes}
      label="Notes"
    />
    <MetaBadge
      available={chapterMeta?.has_summary}
      label="Summary"
    />
  </div>
);

const MetaBadge = ({ available, label }) => (
  <div className="flex items-center space-x-1">
    {available ? (
      <>
        <CheckCircleIcon className="w-4 h-4 text-green-500" />
        <span className="text-xs text-white">{label}</span>
      </>
    ) : (
      <>
        <PlusCircleIcon className="w-4 h-4 text-blue-300" />
        <span className="text-xs text-white">Add {label}</span>
      </>
    )}
  </div>
);

const ChapterList = ({ chapters, chaptersMeta, onLessonClick }) => (
  <div className="space-y-2 mt-2">
    {chapters.length > 0 ? (
      chapters.map((chapter) => (
        <div
          key={chapter.id}
          onClick={() => onLessonClick(chapter)}
          className="cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-md p-2 transition-colors"
        >
          <h3 className="text-sm font-medium text-white truncate">{chapter.chaptertitle}</h3>
          <p className="text-xs text-gray-300 truncate mt-1">
            {chapter.chapter.length > 60 ? `${chapter.chapter.slice(0, 60)}...` : chapter.chapter}
          </p>
          <div className="flex gap-1 mt-1">
            {chaptersMeta.find((cm) => cm.chapter_id === chapter.id)?.has_quiz && (
              <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Quiz</span>
            )}
            {chaptersMeta.find((cm) => cm.chapter_id === chapter.id)?.has_notes && (
              <span className="text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">Notes</span>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-400 py-4">
        No chapters found
      </div>
    )}
  </div>
);

const SimplePagination = ({ currentPage, totalPages, onPageChange, compact = false }) => {
  const pageNumbers = [];
  const maxVisiblePages = compact ? 3 : 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={`mt-4 flex justify-center ${compact ? 'scale-90' : ''}`}>
      <div className="flex space-x-1">
        <PageButton
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          label="Prev"
          compact={compact}
        />

        {pageNumbers.map(num => (
          <PageButton
            key={num}
            onClick={() => onPageChange(num)}
            active={currentPage === num}
            label={num.toString()}
            compact={compact}
          />
        ))}

        <PageButton
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          label="Next"
          compact={compact}
        />
      </div>
    </div>
  );
};

const PageButton = ({ onClick, disabled = false, active = false, label, compact = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'} rounded ${active
        ? 'bg-blue-500 text-white'
        : disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gray-200 hover:bg-gray-300'
      }`}
  >
    {label}
  </button>
);

export default Chapters;
