'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Loader from '../ui/Loader'
import LearningReport from '../LearningReport' // Assuming path
import ModernVideoPlayer from '../video/ModernVideoPlayer' // Use modernized video player
import ModernMarkdownSlideshow from '../slideshow/ModernMarkdownSlideshow' // Use modernized slideshow
import Quiz from '../Quiz' // Assuming path
import EnhancedMindMap from '../EnhancedMindMap' // Assuming path
import RoleplayComponent from '../RoleplayComponent' // Import RoleplayComponent
import { ChapterContent, ChapterV1, QuizQuestion } from '@/types/database' // Removed RoleplayScenario
import { ChevronLeft } from 'lucide-react'
import supabase from '@/services/supabase' // Import Supabase client
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext' // Import the hook
import { SlopeDrawing, InteractiveComponentTypes } from '../interactive' // Import interactive components

// TODO: Define proper types for timelineMarkers and interactionTracker if needed here
// import { InteractionTracker } from '@/contexts/InteractionTrackerContext';
// import { VideoMarkerType } from '../video/VideoTypes';

// Import the actual types used by RoleplayComponent if possible
// Assuming TeacherPersona is defined like this within RoleplayComponent's scope or types
interface TeacherPersona {
  name: string
  description: string
  icon: string // Expect icon here
}

// Define Scenario type locally, ensuring it includes icon
interface Scenario {
  title: string
  context: string
  roles: Array<{
    name: string
    description: string
    icon: string // Add icon here
  }>
}

// Helper function to recursively parse JSON strings
const recursiveJSONParse = (data: any): any => {
  if (typeof data !== 'string') {
    return data
  }
  try {
    const parsed = JSON.parse(data)
    if (typeof parsed === 'string') {
      return recursiveJSONParse(parsed)
    }
    return parsed
  } catch (e) {
    console.error('Failed to parse JSON string:', e)
    return data
  }
}

// Map the incoming data structure to our Scenario format, including icon
const mapToScenario = (rawScenario: any): Scenario | null => {
  if (!rawScenario || typeof rawScenario !== 'object') {
    return null
  }
  try {
    return {
      title: rawScenario.title || '',
      context:
        rawScenario.description ||
        rawScenario.initialPrompt ||
        rawScenario.context ||
        '',
      // Ensure roles/characters are mapped correctly and include an icon
      roles: Array.isArray(rawScenario.characters)
        ? rawScenario.characters.map((char: any) => ({
            name: char.name || '',
            description: char.description || '',
            // Provide default icon if missing, e.g., emoji or placeholder
            icon: char.icon || '🧑‍🏫', // Default teacher emoji
          }))
        : Array.isArray(rawScenario.roles)
          ? rawScenario.roles.map((role: any) => ({
              name: role.name || '',
              description: role.description || '',
              icon: role.icon || '🧑‍🏫', // Default icon for roles too
            }))
          : [],
    }
  } catch (error) {
    console.error('Error mapping scenario:', error)
    return null
  }
}

// Placeholder validation/mapping function for quiz data
const ensureQuizDataFormat = (data: any): QuizQuestion[] => {
  // TODO: Implement proper validation or mapping logic
  if (Array.isArray(data)) {
    // Basic check: are essential properties present?
    if (
      data.length > 0 ||
      (data[0] &&
        data[0].question &&
        data[0].options &&
        data[0].correct_option !== undefined)
    ) {
      return data as QuizQuestion[] // Still casting, but after a basic check
    }
  }
  console.warn('Invalid quiz data format received', data)
  return [] // Return empty array or throw error on invalid format
}

// Placeholder validation/mapping function for roleplay data
const ensureRoleplayDataFormat = (data: any): Scenario[] => {
  console.log('Raw roleplay data:', data)

  try {
    // First, handle potentially multiple levels of JSON string encoding
    const parsedData = recursiveJSONParse(data)
    console.log('Parsed roleplay data:', parsedData)

    // Handle different potential data structures
    let rawScenarios: any[] = []

    if (Array.isArray(parsedData)) {
      rawScenarios = parsedData
    } else if (parsedData && typeof parsedData === 'object') {
      if (Array.isArray(parsedData.scenarios)) {
        rawScenarios = parsedData.scenarios
      } else if (parsedData.title || parsedData.context || parsedData.roles) {
        rawScenarios = [parsedData]
      }
    }

    // Map and validate each scenario, checking for icon
    const scenarios = rawScenarios
      .map(mapToScenario)
      .filter((scenario): scenario is Scenario => {
        if (!scenario) return false
        const isValid =
          typeof scenario.title === 'string' &&
          scenario.title.length > 0 &&
          typeof scenario.context === 'string' &&
          scenario.context.length > 0 &&
          Array.isArray(scenario.roles) &&
          scenario.roles.length > 0 &&
          scenario.roles.every(
            role =>
              role &&
              typeof role.name === 'string' &&
              role.name.length > 0 &&
              typeof role.description === 'string' &&
              role.description.length > 0 &&
              typeof role.icon === 'string' &&
              role.icon.length > 0 // Add check for icon
          )
        if (!isValid) {
          console.warn(
            'Invalid scenario structure (might be missing icon):',
            scenario
          )
        }
        return isValid
      })

    console.log('Validated roleplay scenarios:', scenarios)
    return scenarios
  } catch (error) {
    console.error('Error processing roleplay data:', error)
    return []
  }
}

// --- Updated function to use public URLs instead of signed URLs ---
async function fetchPublicVideoUrl(filePath: string): Promise<string> {
  try {
    console.log('Using direct public URL for:', filePath)

    if (!filePath) {
      throw new Error('No video URL provided')
    }

    // If already a full URL, return it directly
    if (filePath.startsWith('http')) {
      return filePath
    }

    return null
  } catch (error) {
    console.error('Error processing video URL:', error)
    throw error
  }
}

interface CourseContentRendererProps {
  activeTab: string
  content: ChapterContent
  chapter: ChapterV1
  chaptersMeta?: ChapterV1[]
  isLoading: boolean
  showReport: boolean
  isFullscreenMindmap: boolean
  sidebarOpen: boolean
  language: string
  onMindmapBack: () => void
  onToggleMindmapFullscreen: () => void
  onCloseReport: () => void
  onGenerateContentRequest: () => void
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Add a combined video and notes view
const CombinedVideoAndNotes: React.FC<{
  videoUrl: string
  chapter: ChapterV1
  chaptersMeta: ChapterV1[]
  content: ChapterContent
  currentVideoChapter: ChapterV1 | null
  setCurrentVideoChapter: (chapter: ChapterV1 | null) => void
}> = ({
  videoUrl,
  chapter,
  chaptersMeta = [],
  content,
  currentVideoChapter,
  setCurrentVideoChapter,
}) => {
  const notesContainerRef = useRef<HTMLDivElement>(null)

  // Debug log for chaptersMeta
  useEffect(() => {
    console.log('CombinedVideoAndNotes - chaptersMeta:', chaptersMeta)
  }, [chaptersMeta])

  const handleVideoTimeUpdate = useCallback(
    (currentTime: number) => {
      console.log('Video time update:', currentTime)
      // Find the chapter that matches the current time
      const matchingChapter = chaptersMeta?.find(chapter => {
        const start = Number(chapter.timestamp_start) || 0
        const end = Number(chapter.timestamp_end) || Infinity
        console.log(`Checking chapter ${chapter.chaptertitle}:`, {
          start,
          end,
          currentTime,
        })
        return currentTime >= start && currentTime < end
      })

      if (matchingChapter) {
        console.log('Found matching chapter:', matchingChapter.chaptertitle)
        if (
          !currentVideoChapter ||
          matchingChapter.id !== currentVideoChapter.id
        ) {
          setCurrentVideoChapter(matchingChapter)
          const chapterElement = notesContainerRef.current?.querySelector(
            `[data-chapter-id="${matchingChapter.id}"]`
          )
          chapterElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        console.log('No matching chapter found for time:', currentTime)
      }
    },
    [chaptersMeta, currentVideoChapter, setCurrentVideoChapter]
  )

  // Create video markers only if chaptersMeta exists and has items
  const videoMarkers = useMemo(() => {
    if (!chaptersMeta?.length) {
      console.log('No chapters available for video markers')
      return []
    }

    const markers = chaptersMeta
      .map(chapterMeta => ({
        id: chapterMeta.id.toString(),
        time: Number(chapterMeta.timestamp_start) || 0,
        title: chapterMeta.chaptertitle,
        description: chapterMeta.subtopic,
        type: 'chapter' as const,
      }))
      .filter(marker => marker.time >= 0)

    console.log('Created video markers:', markers)
    return markers
  }, [chaptersMeta])

  // If no chapters are available, show a message
  if (!chaptersMeta?.length) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center text-gray-400'>
          <p className='mb-2'>No chapters available for this content.</p>
          <p className='text-sm'>
            Please make sure chapters are properly configured.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full gap-4'>
      {/* Video Section */}
      <div className='h-full w-1/2'>
        <ModernVideoPlayer
          src={videoUrl}
          title={chapter.chaptertitle}
          chapterId={chapter.id.toString()}
          knowledgeId={chapter.knowledge_id.toString()}
          className='h-full w-full'
          markers={videoMarkers}
          onMarkerClick={marker => {
            const selectedChapter = chaptersMeta.find(
              c => c.id.toString() === marker.id
            )
            if (selectedChapter) {
              setCurrentVideoChapter(selectedChapter)
            }
          }}
          onTimeUpdate={handleVideoTimeUpdate}
          showChapterOverlay={true}
          currentChapter={
            currentVideoChapter
              ? {
                  title: currentVideoChapter.chaptertitle,
                  startTime: Number(currentVideoChapter.timestamp_start) || 0,
                  endTime:
                    Number(currentVideoChapter.timestamp_end) || undefined,
                }
              : undefined
          }
        />
      </div>

      {/* Notes Section */}
      <div className='h-full w-1/2'>
        <div
          ref={notesContainerRef}
          className='h-full overflow-y-auto rounded-lg bg-gray-900 p-4'
        >
          {chaptersMeta.map(chapterMeta => {
            const isCurrentChapter = currentVideoChapter?.id === chapterMeta.id

            // Get chapter notes with proper null checking
            let chapterNotes = null
            if (content.notes) {
              if (
                typeof content.notes === 'object' &&
                !Array.isArray(content.notes)
              ) {
                chapterNotes = content.notes[chapterMeta.id] || null
              } else {
                chapterNotes = content.notes
              }
            }

            return (
              <div
                key={chapterMeta.id}
                data-chapter-id={chapterMeta.id}
                className={`mb-8 rounded-lg p-4 transition-colors ${
                  isCurrentChapter
                    ? 'border-2 border-blue-500 bg-blue-900/20'
                    : 'bg-gray-800'
                }`}
              >
                <h3 className='mb-2 flex items-center justify-between text-lg font-semibold text-white'>
                  <span>{chapterMeta.chaptertitle}</span>
                  {isCurrentChapter && (
                    <span className='rounded-full bg-blue-900/40 px-3 py-1 text-sm text-blue-400'>
                      Currently Playing
                    </span>
                  )}
                </h3>
                <div className='mb-4 text-sm text-gray-400'>
                  {formatTime(Number(chapterMeta.timestamp_start) || 0)} -{' '}
                  {formatTime(Number(chapterMeta.timestamp_end) || 0)}
                </div>
                {chapterNotes ? (
                  <div
                    className={`prose prose-invert max-w-none ${
                      isCurrentChapter ? 'prose-blue' : ''
                    }`}
                  >
                    <ModernMarkdownSlideshow
                      content={
                        Array.isArray(chapterNotes)
                          ? chapterNotes
                          : [chapterNotes]
                      }
                      knowledge_id={chapter.knowledge_id.toString()}
                    />
                  </div>
                ) : (
                  <p className='text-gray-400'>
                    No notes available for this chapter.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const CourseContentRenderer: React.FC<CourseContentRendererProps> = ({
  activeTab,
  content,
  chapter,
  chaptersMeta = [],
  isLoading,
  showReport,
  isFullscreenMindmap,
  sidebarOpen,
  language,
  onMindmapBack,
  onToggleMindmapFullscreen,
  onCloseReport,
  onGenerateContentRequest,
}) => {
  const { session } = useInteractionTracker() // Get session context
  const userId = session?.metadata?.userId // Extract userId

  // Add debug logging for props
  useEffect(() => {
    console.log('CourseContentRenderer - Props:', {
      activeTab,
      chapter,
      chaptersMeta,
      content,
    })
  }, [activeTab, chapter, chaptersMeta, content])

  const [currentVideoChapter, setCurrentVideoChapter] =
    useState<ChapterV1 | null>(null)
  const [viewMode, setViewMode] = useState<'video' | 'notes' | 'combined'>(
    'combined'
  )

  // State for video URL
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null)
  const [isSigningUrl, setIsSigningUrl] = useState<boolean>(false)
  const [signingError, setSigningError] = useState<string | null>(null)

  const notesContainerRef = useRef<HTMLDivElement>(null)

  // Function to scroll to current chapter's notes
  const scrollToChapterNotes = useCallback((chapterId: string) => {
    if (notesContainerRef.current) {
      const chapterElement = notesContainerRef.current.querySelector(
        `[data-chapter-id="${chapterId}"]`
      )
      if (chapterElement) {
        chapterElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  // Add debug logging for video time updates
  const handleVideoTimeUpdate = useCallback(
    (currentTime: number) => {
      console.log('Video time update:', currentTime)
      const currentChapter = chaptersMeta.find(chapter => {
        const start = chapter.timestamp_start || 0
        const end = chapter.timestamp_end || Infinity
        console.log(`Checking chapter ${chapter.chaptertitle}:`, {
          start,
          end,
          currentTime,
        })
        return currentTime >= start && currentTime < end
      })

      if (currentChapter) {
        console.log('Found current chapter:', currentChapter.chaptertitle)
        if (
          !currentVideoChapter ||
          currentChapter.id !== currentVideoChapter.id
        ) {
          console.log('Updating current chapter and scrolling')
          setCurrentVideoChapter(currentChapter)
          if (activeTab === 'notes') {
            scrollToChapterNotes(currentChapter.id.toString())
          }
        }
      } else {
        console.log('No matching chapter found for time:', currentTime)
      }
    },
    [chaptersMeta, currentVideoChapter, activeTab, scrollToChapterNotes]
  )

  // Effect to handle video URL
  useEffect(() => {
    if (activeTab === 'video' && content.video_url) {
      console.log('Setting up video with URL:', content.video_url)
      let isMounted = true

      const setupVideoUrl = async () => {
        setIsSigningUrl(true)
        setSigningError(null)
        setSignedVideoUrl(null)
        try {
          const url = await fetchPublicVideoUrl(content.video_url)
          console.log('Ready to use URL:', url)
          if (isMounted) {
            setSignedVideoUrl(url)
          }
        } catch (error) {
          console.error('Error processing video URL:', error)
          if (isMounted) {
            setSigningError(
              `Could not load video: ${error.message || 'Unknown error'}`
            )
          }
        } finally {
          if (isMounted) {
            setIsSigningUrl(false)
          }
        }
      }

      setupVideoUrl()

      return () => {
        isMounted = false
      }
    } else {
      setSignedVideoUrl(null)
      setIsSigningUrl(false)
      setSigningError(null)
    }
  }, [activeTab, content.video_url])

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader size='large' />
      </div>
    )
  }

  // Render Learning Report Overlay if active
  // Note: This was rendered outside the main content area in the original. Consider if it should be a modal overlay instead.
  if (showReport) {
    // This might be better handled as a modal in the parent MainCourse component
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
        <div className='max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-gray-800'>
          {userId && chapter?.knowledge_id ? (
            <LearningReport
              userId={userId}
              knowledgeId={String(chapter.knowledge_id)}
              onClose={onCloseReport}
            />
          ) : (
            // Optional: Show a loading or error state if IDs are missing
            <div className='p-6 text-center text-red-500'>
              Required information (User or Knowledge ID) is missing to load the
              report.
            </div>
          )}
        </div>
      </div>
    )
    // Alternatively, render null here and handle the modal in MainCourse.tsx
    // return null;
  }

  // Video and Notes Combined View
  if (activeTab === 'video' && content.video_url) {
    if (isSigningUrl) {
      return (
        <div className='flex h-full items-center justify-center'>
          <div className='text-center'>
            <Loader size='medium' />
            <p className='mt-4 text-gray-400'>Loading video...</p>
          </div>
        </div>
      )
    }

    if (signingError) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-4 text-center'>
          <div className='mb-4 text-red-400'>{signingError}</div>
          <button
            onClick={() => {
              setSigningError(null)
              setIsSigningUrl(true)
              fetchPublicVideoUrl(content.video_url)
                .then(url => setSignedVideoUrl(url))
                .catch(err => setSigningError(err.message))
                .finally(() => setIsSigningUrl(false))
            }}
            className='rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700'
          >
            Retry Loading
          </button>
        </div>
      )
    }

    if (signedVideoUrl) {
      return (
        <div className='flex h-full flex-col'>
          {/* View Mode Selector */}
          <div className='flex items-center gap-4 border-b border-gray-700 bg-gray-800 p-4'>
            <button
              onClick={() => setViewMode('video')}
              className={`rounded px-4 py-2 ${viewMode === 'video' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Video Only
            </button>
            <button
              onClick={() => setViewMode('notes')}
              className={`rounded px-4 py-2 ${viewMode === 'notes' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Notes Only
            </button>
            <button
              onClick={() => setViewMode('combined')}
              className={`rounded px-4 py-2 ${viewMode === 'combined' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Side by Side
            </button>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-hidden'>
            {viewMode === 'combined' ? (
              <CombinedVideoAndNotes
                videoUrl={signedVideoUrl}
                chapter={chapter}
                chaptersMeta={chaptersMeta}
                content={content}
                currentVideoChapter={currentVideoChapter}
                setCurrentVideoChapter={setCurrentVideoChapter}
              />
            ) : viewMode === 'video' ? (
              <div className='h-full'>
                <ModernVideoPlayer
                  src={signedVideoUrl}
                  title={chapter.chaptertitle}
                  chapterId={chapter.id.toString()}
                  knowledgeId={chapter.knowledge_id.toString()}
                  className='h-full w-full'
                  markers={chaptersMeta.map(cm => ({
                    id: cm.id.toString(),
                    time: Number(cm.timestamp_start) || 0,
                    title: cm.chaptertitle,
                    description: cm.subtopic,
                    type: 'chapter' as const,
                  }))}
                  showChapterOverlay={true}
                />
              </div>
            ) : (
              <div
                ref={notesContainerRef}
                className='h-full overflow-y-auto p-4'
              >
                {chaptersMeta.map(chapterMeta => {
                  const isCurrentChapter =
                    currentVideoChapter?.id === chapterMeta.id

                  // Get chapter notes with proper null checking
                  let chapterNotes = null
                  if (content.notes) {
                    if (
                      typeof content.notes === 'object' &&
                      !Array.isArray(content.notes)
                    ) {
                      chapterNotes = content.notes[chapterMeta.id] || null
                    } else {
                      chapterNotes = content.notes
                    }
                  }

                  return (
                    <div
                      key={chapterMeta.id}
                      data-chapter-id={chapterMeta.id}
                      className={`mb-8 rounded-lg p-4 transition-colors ${
                        isCurrentChapter
                          ? 'border-2 border-blue-500 bg-blue-900/20'
                          : 'bg-gray-800'
                      }`}
                    >
                      <h3 className='mb-2 flex items-center justify-between text-lg font-semibold text-white'>
                        <span>{chapterMeta.chaptertitle}</span>
                        {isCurrentChapter && (
                          <span className='rounded-full bg-blue-900/40 px-3 py-1 text-sm text-blue-400'>
                            Currently Playing
                          </span>
                        )}
                      </h3>
                      <div className='mb-4 text-sm text-gray-400'>
                        {formatTime(Number(chapterMeta.timestamp_start) || 0)} -{' '}
                        {formatTime(Number(chapterMeta.timestamp_end) || 0)}
                      </div>
                      {chapterNotes ? (
                        <div
                          className={`prose prose-invert max-w-none ${
                            isCurrentChapter ? 'prose-blue' : ''
                          }`}
                        >
                          <ModernMarkdownSlideshow
                            content={
                              Array.isArray(chapterNotes)
                                ? chapterNotes
                                : [chapterNotes]
                            }
                            knowledge_id={chapter.knowledge_id.toString()}
                          />
                        </div>
                      ) : (
                        <p className='text-gray-400'>
                          No notes available for this chapter.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  // Original Content Tab (from chapter.chapter)
  if (activeTab === 'og') {
    return (
      <div className='h-full overflow-y-auto bg-gray-900 p-4 text-white md:p-6'>
        <div className='prose prose-invert prose-lg max-w-none'>
          {chapter?.chapter ? (
            <ModernMarkdownSlideshow
              content={[chapter.chapter]}
              knowledge_id={chapter.knowledge_id.toString()}
            />
          ) : (
            <div className='text-center text-gray-400'>
              <p>No original content available.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Notes Tab with synchronized highlighting
  if (activeTab === 'notes') {
    console.log('Rendering notes tab with chapters:', chaptersMeta)
    console.log('Current video chapter:', currentVideoChapter)

    return (
      <div
        ref={notesContainerRef}
        className='h-full overflow-y-auto p-4 md:p-6'
      >
        {chaptersMeta.map(chapterMeta => {
          const isCurrentChapter = currentVideoChapter?.id === chapterMeta.id

          // Get chapter notes with proper null checking
          let chapterNotes = null
          if (content.notes) {
            if (
              typeof content.notes === 'object' &&
              !Array.isArray(content.notes)
            ) {
              chapterNotes = content.notes[chapterMeta.id] || null
            } else {
              chapterNotes = content.notes
            }
          }

          console.log(`Chapter ${chapterMeta.chaptertitle}:`, {
            isCurrentChapter,
            hasNotes: !!chapterNotes,
            notes: chapterNotes,
          })

          return (
            <div
              key={chapterMeta.id}
              data-chapter-id={chapterMeta.id}
              className={`mb-8 rounded-lg p-4 transition-colors ${
                isCurrentChapter
                  ? 'border-2 border-blue-500 bg-blue-900/20'
                  : 'bg-gray-800'
              }`}
            >
              <h3 className='mb-2 flex items-center justify-between text-lg font-semibold text-white'>
                <span>{chapterMeta.chaptertitle}</span>
                {isCurrentChapter && (
                  <span className='rounded-full bg-blue-900/40 px-3 py-1 text-sm text-blue-400'>
                    Currently Playing
                  </span>
                )}
              </h3>
              <div className='mb-4 text-sm text-gray-400'>
                {formatTime(Number(chapterMeta.timestamp_start) || 0)} -{' '}
                {formatTime(Number(chapterMeta.timestamp_end) || 0)}
              </div>
              {chapterNotes ? (
                <div
                  className={`prose prose-invert max-w-none ${
                    isCurrentChapter ? 'prose-blue' : ''
                  }`}
                >
                  <ModernMarkdownSlideshow
                    content={
                      Array.isArray(chapterNotes)
                        ? chapterNotes
                        : [chapterNotes]
                    }
                    knowledge_id={chapter.knowledge_id.toString()}
                  />
                </div>
              ) : (
                <p className='text-gray-400'>
                  No notes available for this chapter.
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Summary Tab
  if (activeTab === 'summary') {
    return (
      <div className='h-full overflow-y-auto bg-gray-900 p-4 text-white md:p-6'>
        <div className='prose prose-invert prose-lg max-w-none'>
          {content.summary ? (
            <ModernMarkdownSlideshow
              content={
                Array.isArray(content.summary)
                  ? content.summary
                  : [content.summary]
              }
              knowledge_id={chapter.knowledge_id.toString()}
            />
          ) : (
            <div className='text-center text-gray-400'>
              <p>Summary is not available for this content.</p>
              <button
                onClick={onGenerateContentRequest}
                className='mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700'
              >
                Generate Summary
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Quiz Tab
  if (activeTab === 'quiz' && content.quiz) {
    // Check if quiz exists
    const validatedQuizQuestions = ensureQuizDataFormat(content.quiz)
    if (validatedQuizQuestions.length > 0) {
      return (
        <div className='h-full overflow-y-auto p-4 md:p-6'>
          <Quiz questions={validatedQuizQuestions} />
        </div>
      )
    }
    // Optionally render a message if quiz data is present but invalid
  }

  // Mindmap Tab
  if (activeTab === 'mindmap' && content.mindmap) {
    return (
      <div
        className={`h-full ${isFullscreenMindmap ? 'fixed inset-0 z-20 bg-gray-900' : 'relative'}`}
      >
        {isFullscreenMindmap && (
          <button
            onClick={onMindmapBack}
            className='absolute left-4 top-4 z-30 rounded-full bg-gray-800 p-2 text-white shadow-lg hover:bg-gray-700'
            aria-label='Exit fullscreen mindmap'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>
        )}
        <EnhancedMindMap
          data={content.mindmap} // Ensure data format is correct
          isFullscreen={isFullscreenMindmap}
          onToggleFullscreen={onToggleMindmapFullscreen} // Pass the callback
        />
      </div>
    )
  }

  // Roleplay Tab
  if (activeTab === 'roleplay') {
    if (!content.roleplay) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
          <div className='max-w-md rounded-lg bg-gray-800 p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-semibold text-gray-200'>
              No Roleplay Scenarios Available
            </h2>
            <p className='mb-6 text-gray-400'>
              There are no roleplay scenarios available for this chapter yet.
            </p>
            <button
              onClick={onGenerateContentRequest}
              className='flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-indigo-700'
            >
              <span>Generate Roleplay Scenarios</span>
            </button>
          </div>
        </div>
      )
    }

    const validatedScenarios = ensureRoleplayDataFormat(content.roleplay)
    if (validatedScenarios.length === 0) {
      return (
        <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
          <div className='max-w-md rounded-lg bg-gray-800 p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-semibold text-gray-200'>
              Invalid Roleplay Data
            </h2>
            <p className='mb-6 text-gray-400'>
              The roleplay scenarios could not be loaded due to invalid data
              format.
            </p>
            <button
              onClick={onGenerateContentRequest}
              className='flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-indigo-700'
            >
              <span>Regenerate Roleplay Scenarios</span>
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className='h-full overflow-y-auto p-4 md:p-6'>
        <RoleplayComponent
          scenarios={validatedScenarios as any}
          onRegenerate={onGenerateContentRequest}
          openaiApiKey={''}
          userId={userId || 'anonymous'}
          language={language}
        />
      </div>
    )
  }

  // Interactive Tab - Add new tab for slope drawing and other interactive components
  if (activeTab === 'interactive') {
    // Create mock default interactive content if none exists
    const mockInteractiveContent = {
      type: 'slope-drawer',
      problems: [
        {
          id: 'p1',
          question: 'Draw a line with slope 2 and y-intercept 3',
          difficulty: 'easy' as const,
          hints: [
            'Remember slope is rise over run',
            'Try plotting (0,3) first',
          ],
          solution: 'y = 2x + 3',
          data: { slope: 2, yIntercept: 3 },
        },
        {
          id: 'p2',
          question: 'Draw a line with slope -1 and y-intercept 5',
          difficulty: 'medium' as const,
          hints: [
            'Negative slope means the line goes down as x increases',
            'Try plotting (0,5) first',
          ],
          solution: 'y = -1x + 5',
          data: { slope: -1, yIntercept: 5 },
        },
        {
          id: 'p3',
          question: 'Draw a vertical line at x = 4',
          difficulty: 'hard' as const,
          hints: [
            'Vertical lines have undefined slope',
            'All points on the line have the same x-value',
          ],
          solution: 'Vertical line: x = 4',
        },
      ],
      conceptExplanations: [
        {
          id: 'c1',
          title: 'Understanding Slope',
          content:
            'Slope measures the steepness of a line. It is calculated as the ratio of vertical change (rise) to horizontal change (run).',
          examples: [
            {
              id: 'e1',
              description:
                'A line with slope 2 rises 2 units for every 1 unit it runs horizontally.',
            },
          ],
        },
      ],
    }

    // Use existing interactive content if available, otherwise use mock data
    const interactiveContent = content?.interactive || mockInteractiveContent

    return (
      <div className='h-full overflow-y-auto p-4 md:p-6'>
        <SlopeDrawing
          interactiveContent={interactiveContent}
          userId={userId || 'anonymous'}
          knowledgeId={chapter.knowledge_id?.toString()}
          language={language}
          onUpdateProgress={progress => {
            console.log('Progress updated:', progress)
            // Here you would implement logic to update user progress
          }}
        />
      </div>
    )
  }

  // Fallback: Content Not Available
  // TODO: Roleplay, Interactive Modules, etc. need to be added here based on `activeTab`

  // Default message if no specific content matches the active tab
  return (
    <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
      <div className='max-w-md rounded-lg bg-gray-800 p-6 shadow-lg'>
        <h2 className='mb-4 text-xl font-semibold text-gray-200'>
          Content Not Available
        </h2>
        <p className='mb-6 text-gray-400'>
          The <span className='font-medium text-gray-300'>{activeTab}</span>{' '}
          content for this chapter isn't available right now.
        </p>
        {/* Trigger the parent component to show the generation panel */}
        <button
          onClick={onGenerateContentRequest} // Use the passed callback
          className='flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-indigo-700'
        >
          {/* <RefreshCw className="w-4 h-4" /> // Icon can be added if needed */}
          <span>Generate Content</span>
        </button>
      </div>
    </div>
  )
}

export default CourseContentRenderer
