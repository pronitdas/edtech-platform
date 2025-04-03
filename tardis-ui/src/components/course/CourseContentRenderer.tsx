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

// --- Updated fetchSignedVideoUrl function using Supabase ---
async function fetchSignedVideoUrl(filePath: string): Promise<string> {
  console.log(`Requesting Supabase signed URL for: ${filePath}`);
  // Assuming 'videos' is your storage bucket name
  const bucketName = 'videos'; 
  const expiresIn = 3600; // 1 hour in seconds

  try {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Supabase signing error:", error);
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
       console.error("Supabase signing error: No signedUrl in data");
       throw new Error("Failed to get signed URL: Invalid response from Supabase.");
    }

    console.log(`Successfully obtained signed URL.`);
    return data.signedUrl;

  } catch (error) {
     // Catch any other potential errors during the process
     console.error("Error in fetchSignedVideoUrl:", error);
     // Re-throw the error to be caught by the useEffect hook
     throw error;
  }
}
// --- End Updated fetchSignedVideoUrl function ---

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
  const { notes, latex_code, mindmap, quiz = [], summary, og, video_url, roleplay } = content;

  // State for video URL signing
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const [isSigningUrl, setIsSigningUrl] = useState<boolean>(false);
  const [signingError, setSigningError] = useState<string | null>(null);

  // Effect to fetch signed URL when video tab is active
  useEffect(() => {
    if (activeTab === 'video' && video_url) {
      let isMounted = true; // Prevent state update on unmounted component
      const signUrl = async () => {
        setIsSigningUrl(true);
        setSigningError(null);
        setSignedVideoUrl(null); // Reset previous URL
        try {
          const url = await fetchSignedVideoUrl(video_url);
          if (isMounted) {
            setSignedVideoUrl(url);
          }
        } catch (error) {
          console.error("Error signing video URL:", error);
          if (isMounted) {
            setSigningError("Could not load video. Please try again later.");
          }
        } finally {
          if (isMounted) {
            setIsSigningUrl(false);
          }
        }
      };
      signUrl();

      return () => {
        isMounted = false; // Cleanup function to set isMounted to false
      };
    } else {
       // Reset state if not on video tab or no video_url
       setSignedVideoUrl(null);
       setIsSigningUrl(false);
       setSigningError(null);
    }
  }, [activeTab, video_url]); // Re-run effect if tab or video_url changes

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
    // **TODO: Video URL Signing Check** - Logic moved to useEffect

    // Show loader while signing
    if (isSigningUrl) {
       return <div className="flex items-center justify-center h-full"><Loader size="medium" /></div>;
    }

    // Show error if signing failed
    if (signingError) {
        return (
            <div className="flex items-center justify-center h-full p-4 text-center text-red-400">
                {signingError}
            </div>
        );
    }

    // Render player only if signed URL is available
    if (signedVideoUrl) {
        return (
          // ModernVideoPlayer might handle its own layout internally, adjust as needed
          // The sidebar state might influence layout here or be passed to ModernVideoPlayer
          <ModernVideoPlayer
            src={signedVideoUrl} // Use the state variable
            title={chapter.chaptertitle}
            // markers={timelineMarkers} // Pass markers if available
            // onMarkerClick={onVideoMarkerClick} // Pass handler if needed
            // Pass other relevant props like chapterId, knowledgeId if needed by ModernVideoPlayer
          />
        );
    }

    // Fallback if signing finishes but URL is somehow still null (shouldn't happen with current placeholder)
    return <div className="flex items-center justify-center h-full p-4 text-center text-gray-400">Preparing video...</div>;
  }

  // Original Content Tab (from chapter.chapter)
  if (activeTab === "og" && chapter?.chapter) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-900 text-white">
          <div className="prose prose-invert prose-lg max-w-none">
              <ModernMarkdownSlideshow
                  content={[chapter.chapter]} // Pass original content
                  knowledge_id={chapter.knowledge_id.toString()}
                  // Add any other relevant props if needed
              />
          </div>
      </div>
    );
  }

  // Notes Tab
  if (activeTab === "notes" && notes) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <ModernMarkdownSlideshow
          content={[notes]} // Modern component might expect an array
          knowledge_id={chapter.knowledge_id.toString()}
          // Pass other relevant props like theme, controls config
        />
      </div>
    );
  }

  // Summary Tab
  if (activeTab === "summary" && summary) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-900 text-white">
        {/* Consider if a title is needed here or handled by the slideshow */}
        {/* <h1 className="text-2xl font-bold mb-4">{chapter.chaptertitle} - Summary</h1> */}
        <div className="prose prose-invert prose-lg max-w-none">
          <ModernMarkdownSlideshow
            content={[summary]} // Modern component might expect an array
            knowledge_id={chapter.knowledge_id.toString()}
            // Pass other relevant props
          />
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