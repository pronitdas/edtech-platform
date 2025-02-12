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

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="flex ">
      {/* Collapsible Sidebar */}
      <motion.aside
        className={`flex-shrink-0 ${isSidebarCollapsed ? 'w-16 h-16' : 'w-1/4 '
          } bg-gray-800 text-white p-4 transition-all duration-600`}
      >
        {/* Collapse Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-md font-bold ${isSidebarCollapsed ? 'hidden' : ''}`}>Subtopics</h2>
          <Button
            variant="ghost"
            className="p-2 text-white"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>

        {/* Subtopics List */}
        {!isSidebarCollapsed &&
          <div className="relative mb-">
            <input
              type="text"
              value={subtopicSearchQuery}
              onChange={(e) => setSubtopicSearchQuery(e.target.value)}
              placeholder="Search subtopics..."
              className="w-full p-2 text-white rounded-lg shadow focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <svg
              className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        }
        <ul className={`space-y-2 px-2 h-full ${isSidebarCollapsed ? 'hidden' : 'overflow-y-auto'}`}>
          <li
            className={`cursor-pointer py-2rounded-lg hover:bg-gray-700 ${currentSubtopic === null ? "bg-gray-700" : ""
              }`}
            onClick={() => {
              setCurrentSubtopic(null);
              setCurrentPage(1);
            }}
          >
            All Subtopics
          </li>
          {filteredSubtopics.map((subtopic) => (
            <li
              key={subtopic}
              className={`cursor-pointer text-sm text-ellipsis py-2 px-2 rounded-lg hover:bg-gray-700 ${currentSubtopic === subtopic ? "bg-gray-700" : ""
                }`}
              onClick={() => {
                setCurrentSubtopic(subtopic);
                setCurrentPage(1);
              }}
            >
              {subtopic}
            </li>
          ))}
        </ul>
      </motion.aside>

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
            className="absolute left-0 top-0 h-6 w-6 text-gray-400 pointer-events-none"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-12">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              variant="outline"
              className="flex items-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              className="flex items-center"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="text-m font-semibold truncate">{chapter.chaptertitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 h-[170px]">
        <p className="text-xs text-gray-600 h-[100px]">{chapter.chapter.slice(0, 150)}...</p>
        <div className="bg-gradient-to-r rounded-lg to-red-500 from-blue-600 flex flex-wrap gap-2 items-end">
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
