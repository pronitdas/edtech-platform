'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
import FileUploader from '@/components/FileUploader';
import MainCourse from '@/components/MainCourse';
import Chapters from '@/components/Chapters';
import Knowledge from '@/components/Knowledge';
import { useKnowledgeData } from '@/hooks/useKnowledgeData'; // Custom Hook
import { useLanguage } from '@/hooks/useLanguage'; // Custom Hook
import { useChapters } from '@/hooks/useChapters'; // Custom Hook
import Loader from '@/components/ui/Loader';


function Edtech() {

  const { knowledge, fetchKnowledge, setKnowledge } = useKnowledgeData();
  const { language, setLanguage } = useLanguage();
  const { uploadedFiles, content, setContent, chaptersMeta, fetchChapters, fetchChapterMeta, reset, getEdTechContentForChapter } = useChapters();
  const [currentTopic, setCurrentTopic] = useState({ topicId: null, topic: null, language: null, knowledgeId: null });
  const [courseView, setCourseView] = useState(false);
  // Handle navigating back to the previous view
  const handleBackButton = () => {
    setCourseView(false);
    if (content) {
      setContent(null);
      setCurrentTopic({ ...currentTopic, topic: null })
    }
    else {
      reset();
    }
  };

  // useEffect(() => {
  //   if (currentTopic?.topic && (!content || currentTopic.language !== language)) {
  //     getEdTechContentForChapter(currentTopic?.topic, language).then(() => {
  //       setCurrentTopic({...currentTopic, language});
  //     })
  //     console.log("is this called")
  //   }
  // }, [currentTopic?.language, currentTopic?.topic, getEdTechContentForChapter, content, language, currentTopic])

  // Handle selecting a knowledge item
  const handleKnowledgeClick = async (id) => {
    await fetchChapters(id, language);
    setCurrentTopic({ ...currentTopic, knowledgeId: id })
    await fetchChapterMeta(id, language);
  };

  useEffect(() => {
    fetchChapterMeta(currentTopic.knowledgeId, language);
  }, [currentTopic.knowledgeId, language])

  // Handle chapter text processing
  const handleTextProcessed = useCallback(
    async (topic) => {
      console.log(topic, language);
      getEdTechContentForChapter(topic, language);
      setCourseView(true);
      setCurrentTopic({ ...currentTopic, topic: topic, language })
    },
    [language, currentTopic, setCurrentTopic, getEdTechContentForChapter]
  );


  return (
    <div className="w-screen h-screen bg-green-900 flex flex-col p-4 overflow-hidden">
      {/* Main Classroom Container */}
      <div className="bg-gray-900 w-full h-full flex rounded-lg shadow-lg overflow-hidden">
        {/* Sidebar for Uploading Files */}
        <aside className="bg-gray-800 text-white w-1/4 min-w-[300px] max-w-[350px] p-4 flex flex-col overflow-y-auto">
          <FileUploader />
        </aside>

        {/* Main Content Area */}
        <main
          style={{ backgroundImage: '/Blackboard.jpeg' }}
          className="flex flex-col p-2 space-y-2 w-full"
        >
          {/* Top Controls */}
          {(courseView || uploadedFiles.length > 0) && (
            <div className="flex justify-between items-center p-1 px-2">
              <button
                onClick={handleBackButton}
                className="px-4 py-1 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg shadow-md hover:from-purple-600 hover:via-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 transform hover:scale-105 transition-transform duration-300"
              >
                Back
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 text-lg bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Bengali">Bengali</option>
                <option value="Marathi">Marathi</option>
              </select>
            </div>
          )}

          {/* Main View: Course or Knowledge */}
          {
            courseView ? (
              content ? (
                <MainCourse language={language} content={content} />
              ) : (
                <div className="flex flex-col items-center">
                  <Loader size="medium" color="green" />
                </div>
              )
            ) : uploadedFiles.length > 0 ? (
              <Chapters
                chaptersMeta={chaptersMeta}
                onLessonClick={handleTextProcessed}
                chapters={uploadedFiles}
              />
            ) : (
              <Knowledge dimensions={knowledge} onClick={handleKnowledgeClick} />
            )}
        </main>
        <div className="absolute gap-4 px-8 bottom-10 flex flex-row items-center">
          <img style={{ height: "50px", width: "50px" }} className='' src="./trs.svg" alt="Description of the image" />
          <span className='text-white'> Made with love at TRS </span>
        </div>

      </div>

    </div>
  );
}

export default Edtech;
