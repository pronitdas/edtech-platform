'use client';

import { useCallback, useEffect, useState } from 'react';
import FileUploader from '@/components/FileUploader';
import CourseMain from '@/components/course/CourseMain';
import ChapterAdapter from '@/components/ChapterAdapter';
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
import { ChevronLeft, Menu, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { ChapterV1 } from '../types/database';

// Enum for application views
const VIEW_TYPES = {
  KNOWLEDGE_SELECTION: 'knowledge_selection',
  CHAPTER_SELECTION: 'chapter_selection',
  COURSE_CONTENT: 'course_content',
  LEARNING_MODULE: 'learning_module'
};

function EdtechApp() {
  // User auth state - use a simpler approach for user ID
  const {user} = useUser();
  const navigate = useNavigate(); // Initialize useNavigate hook

  let userId = null;
  if(user) {
    userId = user.id; // We'll use a fixed ID for now, in a real app this would come from auth
  } else {
    navigate('/login');
  }

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
    getEdTechContentForChapter,
    fetchKnowledgeData
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
  
  // Sidebar mobile toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle knowledge domain selection
  const handleKnowledgeClick = async (id) => {
    await fetchChapters(id, language);
    setCurrentTopic({ ...currentTopic, knowledgeId: id, topic: null });
    await fetchChapterMeta(id, language);
    await fetchKnowledgeData(id);
    setCurrentView(VIEW_TYPES.CHAPTER_SELECTION);
    setContent(null);
  };

  // Handle chapter/topic selection
  const handleChapterClick = useCallback(
    async (chapter: ChapterV1) => {
      console.log("Chapter clicked:", chapter); // Debug log
      if (currentTopic.topic?.id !== chapter.id) {
        console.log("Loading chapter content for:", chapter); // Debug log
        const content = await getEdTechContentForChapter(chapter, language);
        if (content) {
          setCurrentTopic((prev) => ({ ...prev, topic: chapter, language }));
          setCurrentView(VIEW_TYPES.COURSE_CONTENT);
        } else {
          console.error("Failed to load chapter content");
        }
      } else {
        console.log("Chapter already selected:", chapter); // Debug log
      }
    },  
    [language, currentTopic, getEdTechContentForChapter, setCurrentView]
  );

  // Handle navigation to learning module (video, quiz, etc.)
  const handleModuleSelect = (moduleType, moduleContent) => {
    console.log(`handleModuleSelect called with type: ${moduleType}, content:`, moduleContent); // Add logging

    let actualContent = moduleContent;

    // Attempt to extract nested content if moduleContent has keys like 'version' and a dynamic content key
    // This structure was observed in logs, e.g., { version: "1", "some-key-v1": { ...data... } }
    if (moduleContent && typeof moduleContent === 'object' && !Array.isArray(moduleContent) && moduleContent.version) {
        const keys = Object.keys(moduleContent).filter(k => k !== 'version');
        if (keys.length === 1 && typeof moduleContent[keys[0]] === 'object' && moduleContent[keys[0]] !== null) {
            console.log(`Extracting nested content under key: ${keys[0]}`);
            actualContent = moduleContent[keys[0]];
        } else if (keys.length > 1) {
             console.warn("Module content has 'version' but multiple other keys, structure unclear:", moduleContent);
             // Proceeding with original moduleContent, hoping it's the correct flat structure somehow
             actualContent = moduleContent; 
        }
        // If keys.length === 0, actualContent remains moduleContent, which might be just { version: "..." } - error handled below
    } 
    
    // General check for invalid content after potential extraction
    if (!actualContent || typeof actualContent !== 'object') {
         console.error(`Invalid or non-object moduleContent received for type ${moduleType} after potential extraction:`, actualContent);
         // Optionally reset state or show an error to the user
         // For now, just prevent changing the view
         // Consider navigating back: setCurrentView(VIEW_TYPES.COURSE_CONTENT);
         return; 
    }

    if (moduleType === 'video') {
      // Basic validation for video content
      if (actualContent && actualContent.id && actualContent.url) {
          setVideoContent(actualContent);
          setCurrentView(VIEW_TYPES.LEARNING_MODULE);
      } else {
          console.error("Invalid video content structure:", actualContent);
          // Handle error - maybe go back or show message
          // Consider navigating back: setCurrentView(VIEW_TYPES.COURSE_CONTENT);
      }
    } else if (moduleType === 'quiz') {
       // Basic validation for quiz content
       if (actualContent && actualContent.id && actualContent.title && Array.isArray(actualContent.questions)) {
           setQuizContent(actualContent);
           setCurrentView(VIEW_TYPES.LEARNING_MODULE);
       } else {
           console.error("Invalid quiz content structure:", actualContent);
           // Handle error - maybe go back or show message
           // Consider navigating back: setCurrentView(VIEW_TYPES.COURSE_CONTENT);
       }
    } else {
        console.warn(`Unhandled module type in handleModuleSelect: ${moduleType}`);
        // Don't change view if type is unknown or content was invalid
    }
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
        {/* Main content area with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Show in all views except knowledge selection */}
          {currentView !== VIEW_TYPES.KNOWLEDGE_SELECTION && (
            <aside className={`${sidebarOpen ? 'absolute inset-y-0 left-0 z-50' : 'hidden'} md:relative md:flex bg-gray-800 text-white md:w-1/4 md:min-w-[250px] md:max-w-[300px] flex-col overflow-hidden border-r border-gray-700 shadow-lg`}>
              {/* Mobile close button */}
              <button 
                className="md:hidden absolute top-2 right-2 p-1 rounded-full bg-gray-700 text-gray-300"
                onClick={toggleSidebar}
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Course Completion Tracker */}
              {currentTopic.knowledgeId && (
                <div className="p-3 sm:p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">Your Progress</h3>
                  <LearningDashboard 
                    userId={userId} 
                    courseId={currentTopic.knowledgeId}
                    compact={true}
                  />
                </div>
              )}
              
              {/* Chapter Selector */}
              {uploadedFiles.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-3 sm:p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">Chapters</h3>
                  </div>
                  <div className="sidebar-chapters overflow-y-auto">
                    <ChapterAdapter
                      chaptersMeta={chaptersMeta}
                      onLessonClick={(chapter) => {
                        handleChapterClick(chapter);
                        if (sidebarOpen) setSidebarOpen(false);
                      }}
                      chapters={uploadedFiles}
                      compact={true}
                    />
                  </div>
                </div>
              )}
              
              {/* File uploader - only show in chapter selection view */}
              
            </aside>
          )}

          <main className="flex flex-col flex-grow overflow-hidden">
            {/* Top navigation bar with back button, sidebar toggle and language selector */}
            {currentView !== VIEW_TYPES.KNOWLEDGE_SELECTION && (
              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-800 text-white border-b border-gray-700">
                <div className="flex items-center gap-2">
                  {/* Mobile sidebar toggle */}
                  <button
                    onClick={toggleSidebar}
                    className="md:hidden p-1.5 rounded bg-gray-700 text-white"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleBack}
                    className="px-3 py-1 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                </div>
                <LanguageSelector language={language} onChange={setLanguage} />
              </div>
            )}

            {/* Main content area */}
            <div className="flex-grow overflow-auto">
              {currentView === VIEW_TYPES.KNOWLEDGE_SELECTION && (
                <div className="flex h-full flex-col md:flex-row">
                  {/* Sidebar for knowledge selection view */}
                  <aside className="bg-gray-800 text-white w-full md:w-1/4 md:min-w-[250px] md:max-w-[300px] p-3 sm:p-4 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-700">
                    <FileUploader />
                  </aside>
                  
                  {/* Knowledge grid */}
                  <div className="flex-1 overflow-auto">
                    <Knowledge dimensions={knowledge} onClick={handleKnowledgeClick} />
                  </div>
                </div>
              )}

              {currentView === VIEW_TYPES.CHAPTER_SELECTION && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center max-w-md mx-auto p-6">
                    <h2 className="text-2xl font-bold mb-4">Select a Chapter</h2>
                    <p className="mb-4 text-gray-400">Please select a chapter from the sidebar to view its content.</p>
                  </div>
                </div>
              )}

              {currentView === VIEW_TYPES.COURSE_CONTENT && (
                <div className="flex h-full flex-col">
                  <div className="flex-grow">
                    {content && currentTopic.topic ? (
                      <CourseMain
                        content={content}
                        language={language}
                        chapter={currentTopic.topic}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <Loader size="medium" color="green" />
                      </div>
                    )}
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
