'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Knowledge({ dimensions, onClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Number of items per page

  // Calculate pagination indices
  const totalItems = dimensions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = dimensions.slice(startIndex, endIndex);

  // Change page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen scrollbar-thin overflow-y-scroll bg-gradient-to-br from-purple-100 to-indigo-200 p-4 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {paginatedItems.length > 0 &&
          paginatedItems.map((d) => {
            // Group chapters by subtopic
            const subtopicMap = {};
            d.chapters_v1.forEach((chapter) => {
              if (!subtopicMap[chapter.subtopic]) {
                subtopicMap[chapter.subtopic] = [];
              }
              subtopicMap[chapter.subtopic].push(chapter);
            });

            return (
              <motion.div
                key={d.id}
                className="bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onClick={() => onClick(d.id)}
              >
                <div className="p-4 h-14 bg-gradient-to-r from-blue-500 to-teal-500 rounded-t-xl">
                  <h2 className="text-l text-ellipsis	 font-bold mb-2 text-gray-800">{d.name}</h2>
                </div>
                <div
                  style={{ height: '150px' }}
                  className="p-4 scrollbar-thin overflow-y-scroll rounded-b-xl"
                >
                  {Object.entries(subtopicMap).map(([subtopic, chapters]) => (
                    <div key={subtopic} className="mb-2">
                      <h3 className="font-semibold text-gray-600">{subtopic}</h3>
                      <ul key={subtopic} className="list-inside list-disc">
                        {chapters.map((c) => (
                          <li className="p-1" key={c.id}>
                            {c.chaptertitle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center space-x-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
            }`}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-lg font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
            }`}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
