'use client';

import { useCallback, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import MainCourse from '@/components/MainCourse';
import Chapters from '@/components/Chapters';
import Knowledge from '@/components/Knowledge';
import { useKnowledgeData } from '@/hooks/useKnowledgeData';
import { useLanguage } from '@/hooks/useLanguage';
import { useChapters } from '@/hooks/useChapters';
import Loader from '@/components/ui/Loader';
import { useEdtechState } from '@/hooks/useEdtechState';

function Edtech() {
  const { knowledge } = useKnowledgeData();
  const { language, setLanguage } = useLanguage();
  const {
    uploadedFiles,
    content,
    setContent,
    chaptersMeta,
    fetchChapters,
    fetchChapterMeta,
    reset,
    getEdTechContentForChapter
  } = useChapters();

  const {
    currentTopic,
    setCurrentTopic,
    courseView,
    setCourseView
  } = useEdtechState();

  const handleBackButton = () => {
    setCourseView(false);
    if (content) {
      setContent(null);
      setCurrentTopic({ ...currentTopic, topic: null });
    } else {
      reset();
    }
  };

  const handleKnowledgeClick = async (id) => {
    await fetchChapters(id, language);
    setCurrentTopic({ ...currentTopic, knowledgeId: id });
    await fetchChapterMeta(id, language);
  };

  useEffect(() => {
    if (currentTopic.knowledgeId) {
      fetchChapterMeta(currentTopic.knowledgeId, language);
    }
  }, [currentTopic.knowledgeId, language, fetchChapterMeta]);

  useEffect(() => {
    if (courseView && currentTopic.topic) {
      getEdTechContentForChapter(currentTopic.topic, language);
    }
  }, [courseView, currentTopic.topic, language, getEdTechContentForChapter]);

  const handleTextProcessed = useCallback(
    async (topic) => {
      getEdTechContentForChapter(topic, language);
      setCourseView(true);
      setCurrentTopic({ ...currentTopic, topic, language });
    },
    [language, currentTopic, setCurrentTopic, getEdTechContentForChapter, setCourseView]
  );

  return (
    <div className="bg-gray-900 w-screen h-screen flex shadow-lg overflow-hidden">
      <aside className="bg-gray-800 text-white w-1/4 min-w-[300px] max-w-[350px] p-4 overflow-y-auto">
        <FileUploader />
      </aside>

      <main className="flex flex-col w-screen">
        {(courseView || uploadedFiles.length > 0) && (
          <div className="flex justify-between items-center p-1">
            <button
              onClick={handleBackButton}
              className="px-4 py-1 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Back
            </button>
            <LanguageSelector
              language={language}
              onChange={setLanguage}
            />
          </div>
        )}

        <ContentView
          courseView={courseView}
          content={content}
          uploadedFiles={uploadedFiles}
          chaptersMeta={chaptersMeta}
          knowledge={knowledge}
          language={language}
          onLessonClick={handleTextProcessed}
          onKnowledgeClick={handleKnowledgeClick}
        />
      </main>
      <Footer />
    </div>
  );
}

const LanguageSelector = ({ language, onChange }) => (
  <select
    value={language}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-1 bg-white border rounded-lg"
  >
    <option value="English">English</option>
    <option value="Hindi">Hindi</option>
    <option value="Vietnamese">Vietnamese</option>
    <option value="Bengali">Bengali</option>
    <option value="Marathi">Marathi</option>
  </select>
);

const ContentView = ({
  courseView,
  content,
  uploadedFiles,
  chaptersMeta,
  knowledge,
  language,
  onLessonClick,
  onKnowledgeClick
}) => {
  if (courseView) {
    return content ? (
      <MainCourse language={language} content={content} />
    ) : (
      <div className="flex justify-center items-center h-full">
        <Loader size="medium" color="green" />
      </div>
    );
  }

  if (uploadedFiles.length > 0) {
    return (
      <Chapters
        chaptersMeta={chaptersMeta}
        onLessonClick={onLessonClick}
        chapters={uploadedFiles}
      />
    );
  }

  return <Knowledge dimensions={knowledge} onClick={onKnowledgeClick} />;
};

const Footer = () => (
  <div className="absolute px-8 bottom-10 flex items-center gap-4">
    <img className="h-[50px] w-[50px]" src="./trs.svg" alt="TRS Logo" />
    <span className="text-white">Made with love at TRS</span>
  </div>
);

export default Edtech;
