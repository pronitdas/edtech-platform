'use client';

import { useCallback, useEffect, useState } from 'react';
import FileUploader from '@/components/FileUploader';
import MainCourse from '@/components/MainCourse';
import Chapters from '@/components/Chapters';
import Knowledge from '@/components/Knowledge';
import { useKnowledgeData } from '@/hooks/useKnowledgeData';
import { useLanguage } from '@/hooks/useLanguage';
import { useChapters } from '@/hooks/useChapters';
import useAuth from '@/hooks/useAuth';
import Loader from '@/components/ui/Loader';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { QuizComponent } from '@/components/quiz/QuizComponent';
import { LearningDashboard } from '@/components/analytics/LearningDashboard';
import { InteractionTrackerProvider } from '@/contexts/InteractionTrackerContext';
import { analyticsService } from '@/services/analytics-service';
import { ChevronLeft } from 'lucide-react';

// Enum for application views
const VIEW_TYPES = {
  KNOWLEDGE_SELECTION: 'knowledge_selection',
  CHAPTER_SELECTION: 'chapter_selection',
  COURSE_CONTENT: 'course_content',
  LEARNING_MODULE: 'learning_module'
};

function EdtechApp() {
  // User auth state - use a simpler approach for user ID
  const userId = 'user123'; // We'll use a fixed ID for now, in a real app this would come from auth

  // Knowledge and language hooks
  const { knowledge } = useKnowledgeData();
  const { language, setLanguage } = useLanguage();
  
  // Chapters and content state
  const {
    uploadedFiles,
    content,
    setContent,
    chaptersMeta,
    fetchChapters,
    fetchChapterMeta,
    getEdTechContentForChapter
  } = useChapters();

  // Application state
  const [currentView, setCurrentView] = useState(VIEW_TYPES.KNOWLEDGE_SELECTION);
  const [currentTopic, setCurrentTopic] = useState({
    knowledgeId: null,
    topicId: null,
    topic: null,
    language: language
  });
  
  // Learning module content 
  const [videoContent, setVideoContent] = useState(null);
  const [quizContent, setQuizContent] = useState(null);
  
  // Handle knowledge domain selection
  const handleKnowledgeClick = async (id) => {
    await fetchChapters(id, language);
    setCurrentTopic({ ...currentTopic, knowledgeId: id });
    await fetchChapterMeta(id, language);
    setCurrentView(VIEW_TYPES.CHAPTER_SELECTION);
  };

  // Handle chapter/topic selection
  const handleChapterClick = useCallback(
    async (topic) => {
      if (currentTopic.topic !== topic) {
        await getEdTechContentForChapter(topic, language);
        setCurrentTopic((prev) => ({ ...prev, topic, language }));
        setCurrentView(VIEW_TYPES.COURSE_CONTENT);
      }
    },  
    [language, currentTopic]
  );

  // Handle navigation to learning module (video, quiz, etc.)
  const handleModuleSelect = (moduleType, moduleContent) => {
    if (moduleType === 'video') {
      setVideoContent(moduleContent);
    } else if (moduleType === 'quiz') {
      setQuizContent(moduleContent);
    }
    setCurrentView(VIEW_TYPES.LEARNING_MODULE);
  };

  // Handle back button logic
  const handleBack = () => {
    switch (currentView) {
      case VIEW_TYPES.LEARNING_MODULE:
        setCurrentView(VIEW_TYPES.COURSE_CONTENT);
        setVideoContent(null);
        setQuizContent(null);
        break;
      case VIEW_TYPES.COURSE_CONTENT:
        setCurrentView(VIEW_TYPES.CHAPTER_SELECTION);
        setContent(null);
        break;
      case VIEW_TYPES.CHAPTER_SELECTION:
        setCurrentView(VIEW_TYPES.KNOWLEDGE_SELECTION);
        setContent(null);
        break;
      default:
        // Do nothing if we're already at the root view
        break;
    }
  };

  // Fetch chapter metadata when knowledge or language changes
  useEffect(() => {
    if (currentTopic.knowledgeId) {
      fetchChapterMeta(currentTopic.knowledgeId, language);
    }
  }, [currentTopic.knowledgeId, language]);

  // Fetch course content when topic changes
  useEffect(() => {
    if (currentView === VIEW_TYPES.COURSE_CONTENT && currentTopic.topic) {
      getEdTechContentForChapter(currentTopic.topic, language);
    }
  }, [currentView, currentTopic.topic, language]);

  return (
    <InteractionTrackerProvider dataService={analyticsService} userId={userId}>
      <div className="bg-gray-900 w-screen h-screen flex flex-col shadow-lg overflow-hidden">
        {/* Sidebar - Only show in certain views */}
        <div className="flex flex-1 overflow-hidden">
          {(currentView === VIEW_TYPES.KNOWLEDGE_SELECTION || currentView === VIEW_TYPES.CHAPTER_SELECTION) && (
            <aside className="bg-gray-800 text-white w-full md:w-1/4 md:min-w-[250px] md:max-w-[300px] p-3 sm:p-4 overflow-y-auto">
              <FileUploader />
            </aside>
          )}

          <main className="flex flex-col flex-grow overflow-hidden">
            {/* Top navigation bar with back button and language selector */}
            {currentView !== VIEW_TYPES.KNOWLEDGE_SELECTION && (
              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-800 text-white border-b border-gray-700">
                <button
                  onClick={handleBack}
                  className="px-3 py-1 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <LanguageSelector language={language} onChange={setLanguage} />
              </div>
            )}

            {/* Main content area */}
            <div className="flex-grow overflow-auto">
              {currentView === VIEW_TYPES.KNOWLEDGE_SELECTION && (
                <Knowledge dimensions={knowledge} onClick={handleKnowledgeClick} />
              )}

              {currentView === VIEW_TYPES.CHAPTER_SELECTION && (
                <Chapters
                  chaptersMeta={chaptersMeta}
                  onLessonClick={handleChapterClick}
                  chapters={uploadedFiles}
                />
              )}

              {currentView === VIEW_TYPES.COURSE_CONTENT && (
                <div className="flex h-full flex-col lg:flex-row">
                  <div className="flex-grow">
                    {content ? (
                      <MainCourse 
                        language={language} 
                        content={content}
                        chapter={currentTopic.topic}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <Loader size="medium" color="green" />
                      </div>
                    )}
                  </div>
                  <div className="lg:w-1/4 lg:min-w-[280px] border-t lg:border-t-0 lg:border-l border-gray-700 bg-gray-800 text-white overflow-y-auto">
                    {/* Show compact dashboard on smaller screens */}
                    <div className="block lg:hidden">
                      <LearningDashboard 
                        userId={userId} 
                        courseId={currentTopic.knowledgeId}
                        compact={true} 
                      />
                    </div>
                    {/* Show full dashboard on larger screens */}
                    <div className="hidden lg:block">
                      <LearningDashboard 
                        userId={userId} 
                        courseId={currentTopic.knowledgeId}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentView === VIEW_TYPES.LEARNING_MODULE && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 p-3 sm:p-6">
                  <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    {videoContent && (
                      <section>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Video Lesson</h2>
                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                          <VideoPlayer 
                            contentId={videoContent.id} 
                            videoUrl={videoContent.url}
                            title={videoContent.title}
                            poster={videoContent.thumbnail}
                          />
                        </div>
                      </section>
                    )}

                    {quizContent && (
                      <section>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Knowledge Check</h2>
                        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4">
                          <QuizComponent
                            quizId={quizContent.id}
                            title={quizContent.title}
                            questions={quizContent.questions}
                          />
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="lg:col-span-1">
                    <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Your Progress</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                      <LearningDashboard 
                        userId={userId} 
                        courseId={currentTopic.knowledgeId}
                        compact={window.innerWidth < 1024}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <Footer />
          </main>
        </div>
      </div>
    </InteractionTrackerProvider>
  );
}

const LanguageSelector = ({ language, onChange }) => (
  <select
    value={language}
    onChange={(e) => onChange(e.target.value)}
    className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-700 text-white border border-gray-600 rounded-md text-sm"
  >
    <option value="English">English</option>
    <option value="Hindi">Hindi</option>
    <option value="Vietnamese">Vietnamese</option>
    <option value="Bengali">Bengali</option>
    <option value="Marathi">Marathi</option>
  </select>
);

const Footer = () => (
  <div className="p-2 sm:p-4 bg-gray-800 text-white flex items-center justify-center gap-2 sm:gap-4 border-t border-gray-700 text-sm">
    <img className="h-[20px] sm:h-[30px] w-[20px] sm:w-[30px]" src="./trs.svg" alt="TRS Logo" />
    <span>Made with love at TRS</span>
  </div>
);

export default EdtechApp;
