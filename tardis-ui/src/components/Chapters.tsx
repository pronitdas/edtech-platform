'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircleIcon, PlusCircleIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Chapter {
  id: string;
  topic: string;
  chaptertitle: string;
  chapter: string;
  subtopic: string;
}

interface ChaptersProps {
  chapters: Chapter[];
  chaptersMeta: any;
  onLessonClick: (chapter: Chapter) => void;
}

const Chapters: React.FC<ChaptersProps> = ({ chapters, chaptersMeta, onLessonClick }) => {
  const [currentSubtopic, setCurrentSubtopic] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subtopicSearchQuery, setSubtopicSearchQuery] = useState('');

  // Group chapters by subtopic
  const filteredChapters = chapters.filter((chapter) =>
    chapter.chaptertitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subtopicMap: { [subtopic: string]: Chapter[] } = {};
  filteredChapters.forEach((chapter) => {
    const subtopic = chapter.subtopic || "No Subtopic";
    if (!subtopicMap[subtopic]) {
      subtopicMap[subtopic] = [];
    }
    subtopicMap[subtopic].push(chapter);
  });

  const subtopics = Object.keys(subtopicMap);
  const filteredSubtopics = subtopics.filter((subtopic) =>
    subtopic.toLowerCase().includes(subtopicSearchQuery.toLowerCase())
  ).sort((b, a) => subtopicMap[a].length - subtopicMap[b].length);

  const chaptersInSubtopic = currentSubtopic
    ? subtopicMap[currentSubtopic]
    : filteredChapters;

  // Pagination logic
  const chaptersPerPage = 6;
  const totalPages = Math.ceil((chaptersInSubtopic?.length || 0) / chaptersPerPage);
  const paginatedChapters = chaptersInSubtopic?.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );

  // Generate page numbers array
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="w-full h-full p-2">
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search chapters..."
            className="w-full pt-2 pl-10 text-white rounded-lg shadow-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <svg
            className="absolute left-0 top-0 px-1 h-8 w-8 text-gray-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Chapters List */}
        {paginatedChapters?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedChapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ChapterTile
                  chapter={chapter}
                  chapterMeta={chaptersMeta.find((cm: any) => cm.chapter_id === chapter.id)}
                  onLessonClick={onLessonClick}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No chapters found.</div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-3 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                variant="outline"
                className="flex items-center"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                className="flex items-center"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              <div className="flex space-x-1">
                {getPageNumbers().map((pageNum) => (
                  <Button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className={`px-4 py-2 ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                className="flex items-center"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                className="flex items-center"
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

interface ChapterTileProps {
  chapter: Chapter;
  chapterMeta: any;
  onLessonClick: (chapter: Chapter) => void;
}

const ChapterTile: React.FC<ChapterTileProps> = ({ chapter, chapterMeta, onLessonClick }) => {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onLessonClick(chapter)}
    >
      <CardHeader className="rounded-lg m-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="text-m font-semibold truncate">{chapter.chaptertitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <p className="text-xs text-gray-600 h-[100px]">{chapter.chapter.slice(0, 150)}...</p>
        <div className="bg-gradient-to-r p-1 rounded-lg to-red-500 from-blue-600 flex flex-wrap gap-2 items-end">
          {/* Quiz Section */}
          <div className="flex items-center space-x-1">
            {chapterMeta?.has_quiz ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-white">Quiz Available</span>
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-white">Add Quiz</span>
              </>
            )}
          </div>

          {/* Notes Section */}
          <div className="flex items-center space-x-1">
            {chapterMeta?.has_notes ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-white">Notes Available</span>
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-white">Add Notes</span>
              </>
            )}
          </div>

          {/* Summary Section */}
          <div className="flex items-center space-x-1">
            {chapterMeta?.has_summary ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-white">Summary Available</span>
              </>
            ) : (
              <>
                <PlusCircleIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-white">Add Summary</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chapters;
