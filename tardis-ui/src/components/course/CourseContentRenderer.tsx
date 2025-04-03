'use client';

import React, { useState, useEffect } from 'react';
import Loader from '../ui/Loader';
import LearningReport from '../LearningReport'; // Assuming path
import ModernVideoPlayer from '../video/ModernVideoPlayer'; // Use modernized video player
import ModernMarkdownSlideshow from '../slideshow/ModernMarkdownSlideshow'; // Use modernized slideshow
import Quiz from '../Quiz'; // Assuming path
import EnhancedMindMap from '../EnhancedMindMap'; // Assuming path
import RoleplayComponent from '../RoleplayComponent'; // Import RoleplayComponent
import { ChapterContent, ChapterV1, QuizQuestion } from '@/types/database'; // Removed RoleplayScenario
import { ChevronLeft } from 'lucide-react';
import supabase from '@/services/supabase'; // Import Supabase client

// TODO: Define proper types for timelineMarkers and interactionTracker if needed here
// import { InteractionTracker } from '@/contexts/InteractionTrackerContext';
// import { VideoMarkerType } from '../video/VideoTypes';

// Define Scenario type locally based on ChapterContent structure
interface Scenario {
    title: string;
    context: string;
    roles: Array<{
        name: string;
        description: string;
    }>;
}

// Placeholder validation/mapping function for quiz data
const ensureQuizDataFormat = (data: any): QuizQuestion[] => {
  // TODO: Implement proper validation or mapping logic
  if (Array.isArray(data)) {
    // Basic check: are essential properties present?
    if (data.length === 0 || (data[0] && data[0].question && data[0].options && data[0].correct_option !== undefined)) {
       return data as QuizQuestion[]; // Still casting, but after a basic check
    }
  }
  console.warn("Invalid quiz data format received", data);
  return []; // Return empty array or throw error on invalid format
};

// Placeholder validation/mapping function for roleplay data
// Now returns the locally defined Scenario[] type
const ensureRoleplayDataFormat = (data: any): Scenario[] => {
    // TODO: Implement proper validation or mapping logic
    if (data && Array.isArray(data.scenarios)) {
        // Perform deeper checks if necessary (e.g., check properties of each scenario)
        return data.scenarios as Scenario[]; // Cast to local Scenario type
    }
    console.warn("Invalid roleplay data format received", data);
    return [];
};

// --- Updated function to use public URLs instead of signed URLs ---
async function fetchPublicVideoUrl(filePath: string): Promise<string> {
  try {
    console.log("Using direct public URL for:", filePath);
    
    if (!filePath) {
      throw new Error("No video URL provided");
    }
    
    // If already a full URL, return it directly
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    return null;
  } catch (error) {
    console.error("Error processing video URL:", error);
    throw error;
  }
}

interface CourseContentRendererProps {
  activeTab: string;
  content: ChapterContent;
  chapter: ChapterV1;
  isLoading: boolean;
  showReport: boolean;
  isFullscreenMindmap: boolean;
  sidebarOpen: boolean; // Needed for video layout
  // timelineMarkers: VideoMarkerType[]; // Prop for video player
  onMindmapBack: () => void;
  onToggleMindmapFullscreen: () => void;
  onCloseReport: () => void;
  onGenerateContentRequest: () => void; // Callback to trigger settings/generation panel
  // interactionTracker?: InteractionTracker; // Pass if needed by sub-components
  // onVideoMarkerClick?: (marker: any) => void; // Pass to video player if needed
}

const CourseContentRenderer: React.FC<CourseContentRendererProps> = ({
  activeTab,
  content,
  chapter,
  isLoading,
  showReport,
  isFullscreenMindmap,
  sidebarOpen,
  // timelineMarkers,
  onMindmapBack,
  onToggleMindmapFullscreen,
  onCloseReport,
  onGenerateContentRequest,
}) => {
  // Parse content data
  const parseContent = (content: ChapterContent) => {
    console.log('Raw content before parsing:', content);
    try {
      // Create a base object with all properties, using defaults for missing ones
      const parsed = {
        notes: content.notes || '',
        latex_code: content.latex_code || '',
        mindmap: content.mindmap || '',
        quiz: content.quiz || [],
        summary: content.summary || '',
        og: content.og || content.chapter || '',
        video_url: content.video_url || '',
        roleplay: null as any
      };
      
      // Special handling for roleplay which can be a string or object
      if (content.roleplay) {
        if (typeof content.roleplay === 'string') {
          try {
            parsed.roleplay = JSON.parse(content.roleplay);
          } catch (e) {
            console.error('Error parsing roleplay JSON:', e);
            parsed.roleplay = content.roleplay; // Keep as string if parsing fails
          }
        } else {
          parsed.roleplay = content.roleplay; // Already an object
        }
      }
      
      console.log('Parsed content:', parsed);
      return parsed;
    } catch (error) {
      console.error('Error parsing content:', error);
      return content; // Return original if parsing fails
    }
  };

  const parsedContent = parseContent(content);
  console.log('Parsed content:', parsedContent); // Debug log
  console.log('Active tab:', activeTab); // Debug log

  const { notes, latex_code, mindmap, quiz, summary, og, video_url, roleplay } = parsedContent;

  // State for video URL signing
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const [isSigningUrl, setIsSigningUrl] = useState<boolean>(false);
  const [signingError, setSigningError] = useState<string | null>(null);

  // Effect to handle video URL
  useEffect(() => {
    if (activeTab === 'video' && video_url) {
      console.log('Setting up video with URL:', video_url);
      let isMounted = true;
      
      const setupVideoUrl = async () => {
        setIsSigningUrl(true);
        setSigningError(null);
        setSignedVideoUrl(null);
        try {
          const url = await fetchPublicVideoUrl(video_url);
          console.log('Ready to use URL:', url);
          if (isMounted) {
            setSignedVideoUrl(url);
          }
        } catch (error) {
          console.error("Error processing video URL:", error);
          if (isMounted) {
            setSigningError(`Could not load video: ${error.message || 'Unknown error'}`);
          }
        } finally {
          if (isMounted) {
            setIsSigningUrl(false);
          }
        }
      };
      
      setupVideoUrl();

      return () => {
        isMounted = false;
      };
    } else {
      setSignedVideoUrl(null);
      setIsSigningUrl(false);
      setSigningError(null);
    }
  }, [activeTab, video_url]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader size="large" /></div>;
  }

  // Render Learning Report Overlay if active
  // Note: This was rendered outside the main content area in the original. Consider if it should be a modal overlay instead.
  if (showReport) {
    // This might be better handled as a modal in the parent MainCourse component
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
                <LearningReport onClose={onCloseReport} />
            </div>
        </div>
    );
    // Alternatively, render null here and handle the modal in MainCourse.tsx
    // return null;
  }

  // Video Tab
  if (activeTab === "video" && video_url) {
    // Show loader while signing
    if (isSigningUrl) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader size="medium" />
                    <p className="mt-4 text-gray-400">Loading video...</p>
                </div>
            </div>
        );
    }

    // Show error if signing failed
    if (signingError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="text-red-400 mb-4">{signingError}</div>
                <button 
                    onClick={() => {
                        setSigningError(null);
                        setIsSigningUrl(true);
                        fetchPublicVideoUrl(video_url)
                            .then(url => setSignedVideoUrl(url))
                            .catch(err => setSigningError(err.message))
                            .finally(() => setIsSigningUrl(false));
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    // Render player only if signed URL is available
    if (signedVideoUrl) {
        return (
            <div className={`h-full ${sidebarOpen ? 'md:pr-64' : ''}`}>
                <ModernVideoPlayer
                    src={signedVideoUrl}
                    title={chapter.chaptertitle}
                    chapterId={chapter.id.toString()}
                    knowledgeId={chapter.knowledge_id.toString()}
                    className="w-full h-full"
                />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full p-4 text-center text-gray-400">
            <div>
                <Loader size="small" />
                <p className="mt-2">Preparing video playback...</p>
            </div>
        </div>
    );
  }

  // Original Content Tab (from chapter.chapter)
  if (activeTab === "og") {
    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-900 text-white">
            <div className="prose prose-invert prose-lg max-w-none">
                {chapter?.chapter ? (
                    <ModernMarkdownSlideshow
                        content={[chapter.chapter]}
                        knowledge_id={chapter.knowledge_id.toString()}
                    />
                ) : (
                    <div className="text-center text-gray-400">
                        <p>No original content available.</p>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // Notes Tab
  if (activeTab === "notes") {
    return (
        <div className="h-full overflow-y-auto p-4 md:p-6">
            {notes ? (
                <ModernMarkdownSlideshow
                    content={Array.isArray(notes) ? notes : [notes]}
                    knowledge_id={chapter.knowledge_id.toString()}
                />
            ) : (
                <div className="text-center text-gray-400">
                    <p>Notes are not available for this content.</p>
                    <button
                        onClick={onGenerateContentRequest}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Generate Notes
                    </button>
                </div>
            )}
        </div>
    );
  }

  // Summary Tab
  if (activeTab === "summary") {
    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-900 text-white">
            <div className="prose prose-invert prose-lg max-w-none">
                {summary ? (
                    <ModernMarkdownSlideshow
                        content={Array.isArray(summary) ? summary : [summary]}
                        knowledge_id={chapter.knowledge_id.toString()}
                    />
                ) : (
                    <div className="text-center text-gray-400">
                        <p>Summary is not available for this content.</p>
                        <button
                            onClick={onGenerateContentRequest}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Generate Summary
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // Quiz Tab
  if (activeTab === "quiz" && quiz) { // Check if quiz exists
    const validatedQuizQuestions = ensureQuizDataFormat(quiz);
    if (validatedQuizQuestions.length > 0) {
        return (
            <div className="h-full overflow-y-auto p-4 md:p-6">
                <Quiz
                questions={validatedQuizQuestions}
                // chapterId={chapter.id.toString()} // Removed earlier
                // knowledgeId={chapter.knowledge_id.toString()} // Removed earlier
                />
            </div>
        );
    }
    // Optionally render a message if quiz data is present but invalid
  }

  // Mindmap Tab
  if (activeTab === "mindmap" && mindmap) {
    return (
      <div className={`h-full ${isFullscreenMindmap ? 'fixed inset-0 z-20 bg-gray-900' : 'relative'}`}>
        {isFullscreenMindmap && (
          <button
            onClick={onMindmapBack}
            className="absolute top-4 left-4 z-30 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg"
            aria-label="Exit fullscreen mindmap"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <EnhancedMindMap
          data={mindmap} // Ensure data format is correct
          isFullscreen={isFullscreenMindmap}
          onToggleFullscreen={onToggleMindmapFullscreen} // Pass the callback
        />
      </div>
    );
  }

  // Roleplay Tab
  if (activeTab === "roleplay" && roleplay) {
      const validatedScenarios = ensureRoleplayDataFormat(roleplay);
      if (validatedScenarios.length > 0) {
        return (
            <div className="h-full overflow-y-auto p-4 md:p-6">
                <RoleplayComponent scenarios={validatedScenarios} />
            </div>
        );
      }
      // Optionally render message if roleplay data is present but invalid
  }

  // Fallback: Content Not Available
  // TODO: Roleplay, Interactive Modules, etc. need to be added here based on `activeTab`

  // Default message if no specific content matches the active tab
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Content Not Available</h2>
        <p className="text-gray-400 mb-6">
          The <span className="font-medium text-gray-300">{activeTab}</span> content for this chapter isn't available right now.
        </p>
        {/* Trigger the parent component to show the generation panel */}
        <button
          onClick={onGenerateContentRequest} // Use the passed callback
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          {/* <RefreshCw className="w-4 h-4" /> // Icon can be added if needed */}
          <span>Generate Content</span>
        </button>
      </div>
    </div>
  );
};

export default CourseContentRenderer;