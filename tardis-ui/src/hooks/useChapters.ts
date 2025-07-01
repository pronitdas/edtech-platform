import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  getChapters,
  getChapterMetaDataByLanguage,
  getEdTechContent,
} from '@/services/edtech-content'
import useAuthState from './useAuth'
import { EdTechAPI, ContentType, ProcessingStatus } from '@/services/edtech-api'
import { knowledgeService } from '@/services/knowledge'
import { Chapter, ChapterContent, EdTechChapter } from '@/types/api'

// Create an instance of the EdTechAPI
const edtechApi = new EdTechAPI()

// Throttling constants
const STATUS_CHECK_INTERVAL = 30000 // 30 seconds between status checks
const MAX_STATUS_CHECKS = 1 // Maximum number of consecutive status checks

interface ChaptersState {
  uploadedFiles: Chapter[]
  chaptersMeta: EdTechChapter[]
  content: ChapterContent | null
  knowledgeData: {
    video_url: string | null
    roleplay: any | null
  } | null
  error: Error | null
  processingStatus: ProcessingStatus | null
  isCheckingStatus: boolean
  isGeneratingContent: boolean
  generationProgress: {
    total: number
    completed: number
    failed: number
  }
  lastGenerationError: string | null
}

export const useChapters = () => {
  // Use a single state object to reduce re-renders when multiple properties change
  const [state, setState] = useState<ChaptersState>({
    uploadedFiles: [],
    chaptersMeta: [],
    content: null,
    knowledgeData: null,
    error: null,
    processingStatus: null,
    isCheckingStatus: false,
    isGeneratingContent: false,
    generationProgress: {
      total: 0,
      completed: 0,
      failed: 0,
    },
    lastGenerationError: null,
  })

  // Use refs for values that don't trigger re-renders
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const statusCheckCountRef = useRef<number>(0)
  const generationAttemptsRef = useRef<Record<string, number>>({})

  // Memoized state update functions using useCallback
  const fetchChapters = useCallback(
    async (knowledgeId: number, language: string): Promise<Chapter[]> => {
      try {
        const chapters = await getChapters(knowledgeId, language)
        if (chapters) {
          setState(prev => ({
            ...prev,
            uploadedFiles: chapters,
          }))
          return chapters
        }
        return []
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error
              : new Error('Unknown error fetching chapters'),
        }))
        return []
      }
    },
    []
  )

  const fetchChapterMeta = useCallback(
    async (knowledgeId: number, language: string): Promise<void> => {
      try {
        const metadata = await getChapterMetaDataByLanguage(
          knowledgeId,
          language
        )
        setState(prev => ({
          ...prev,
          chaptersMeta: metadata,
        }))
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error
              : new Error('Unknown error fetching chapter metadata'),
        }))
      }
    },
    []
  )

  const fetchKnowledgeData = useCallback(
    async (knowledgeId: number): Promise<void> => {
      if (!knowledgeId) return
      console.log('Fetching knowledge data for knowledgeId:', knowledgeId)
      try {
        const knowledge = await knowledgeService.getKnowledge(knowledgeId)

        setState(prev => ({
          ...prev,
          knowledgeData: {
            video_url: knowledge.video_url || null,
            roleplay: knowledge.roleplay || null,
          },
        }))
        console.log('Fetched knowledge data:', knowledge)
      } catch (error) {
        console.error('Error fetching knowledge data:', error)
        setState(prev => ({
          ...prev,
          knowledgeData: { video_url: null, roleplay: null },
          error:
            error instanceof Error
              ? error
              : new Error('Unknown error fetching knowledge data'),
        }))
      }
    },
    []
  )

  const getEdTechContentForChapter = useCallback(
    async (
      chapter: Chapter,
      language: string
    ): Promise<ChapterContent | null> => {
      try {
        console.log(
          'Getting EdTech content for chapter:',
          chapter,
          'language:',
          language
        )

        if (!chapter || !chapter.id) {
          console.error(
            'Invalid chapter provided to getEdTechContentForChapter'
          )
          return null
        }

        const contentResult = await getEdTechContent(
          {
            knowledge_id: Number(chapter.knowledge_id),
            id: Number(chapter.id),
          },
          language
        )
        console.log('Raw EdTech content result:', contentResult)

        let chapterContent: ChapterContent | null = null
        if (contentResult && contentResult.length > 0) {
          chapterContent = contentResult[0] as unknown as ChapterContent
        }

        setState(prev => ({
          ...prev,
          content: chapterContent,
        }))

        console.log('Set chapter content in state:', chapterContent)
        return chapterContent
      } catch (error) {
        console.error('Error in getEdTechContentForChapter:', error)
        setState(prev => ({
          ...prev,
          content: null,
          error:
            error instanceof Error
              ? error
              : new Error('Unknown error fetching EdTech content'),
        }))
        return null
      }
    },
    []
  )

  const generateMissingContent = useCallback(
    async (
      chapter: Chapter,
      language: string,
      contentTypes: ContentType[]
    ): Promise<ChapterContent | null> => {
      if (!chapter || contentTypes.length === 0) return null

      // Reset progress and set generation state to true
      setState(prev => ({
        ...prev,
        isGeneratingContent: true,
        generationProgress: {
          total: contentTypes.length,
          completed: 0,
          failed: 0,
        },
        lastGenerationError: null,
      }))

      try {
        // Track this generation attempt
        const chapterKey = `${chapter.id}-${language}`
        generationAttemptsRef.current[chapterKey] =
          (generationAttemptsRef.current[chapterKey] || 0) + 1

        const generationResponse = await edtechApi.generateContent(
          chapter.knowledge_id,
          {
            chapterId: chapter.id.toString(),
            types: contentTypes,
            language,
          }
        )

        if (
          generationResponse.success &&
          (generationResponse.data?.chapters?.length ?? 0) > 0
        ) {
          const newContent = generationResponse.data
            ?.chapters?.[0] as ChapterContent

          // Check if we have partial success (some content types failed)
          if (
            generationResponse.message &&
            generationResponse.message.includes('Partially successful')
          ) {
            setState(prev => ({
              ...prev,
              content: newContent,
              isGeneratingContent: false,
              generationProgress: {
                total: contentTypes.length,
                completed: generationResponse.data?.processed_chapters || 0,
                failed: generationResponse.data?.failed_chapters || 0,
              },
              lastGenerationError: generationResponse.message || null,
            }))
          } else {
            // Complete success
            setState(prev => ({
              ...prev,
              content: newContent,
              isGeneratingContent: false,
              generationProgress: {
                total: contentTypes.length,
                completed: contentTypes.length,
                failed: 0,
              },
            }))
          }

          return newContent
        } else {
          // Complete failure
          setState(prev => ({
            ...prev,
            isGeneratingContent: false,
            generationProgress: {
              ...prev.generationProgress,
              failed: contentTypes.length,
            },
            lastGenerationError:
              generationResponse.error ||
              'Unknown error during content generation',
          }))
        }

        return null
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error generating content'

        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error
              : new Error('Error generating content'),
          isGeneratingContent: false,
          generationProgress: {
            ...prev.generationProgress,
            failed: contentTypes.length,
          },
          lastGenerationError: errorMessage,
        }))

        console.error('Error generating content:', error)
        return null
      }
    },
    []
  )

  // Retry failed content generation
  const retryContentGeneration = useCallback(
    async (
      chapter: Chapter,
      language: string,
      contentTypes?: ContentType[]
    ): Promise<ChapterContent | null> => {
      // If no specific content types provided, use missing types
      if (!contentTypes) {
        const missingTypes = getMissingContentTypes(state.content)
        if (missingTypes.length === 0) {
          console.log('No missing content types to generate')
          return state.content
        }
        contentTypes = missingTypes
      }

      // Reset error state before retry
      setState(prev => ({
        ...prev,
        error: null,
        lastGenerationError: null,
      }))

      return generateMissingContent(chapter, language, contentTypes)
    },
    [state.content, generateMissingContent]
  )

  // Memoized utility function for identifying missing content types
  const getMissingContentTypes = useCallback(
    (contentData: ChapterContent | null | undefined): ContentType[] => {
      if (!contentData) return []

      const missingTypes: ContentType[] = []

      if (!contentData.notes) missingTypes.push('notes')
      if (!contentData.summary) missingTypes.push('summary')
      if (!contentData.quiz && contentData.notes) missingTypes.push('quiz')
      if (!contentData.mindmap && contentData.notes)
        missingTypes.push('mindmap')

      return missingTypes
    },
    []
  )

  // Check if content has errors in any types
  const getContentTypesWithErrors = useCallback(
    (contentData: ChapterContent | null): ContentType[] => {
      if (!contentData) return []

      const errorTypes: ContentType[] = []

      // Check for errors in each content type
      // Using String() to safely convert to string regardless of type
      if (
        contentData.notes &&
        String(contentData.notes).includes('Error generating')
      ) {
        errorTypes.push('notes')
      }
      if (
        contentData.summary &&
        String(contentData.summary).includes('Error generating')
      ) {
        errorTypes.push('summary')
      }
      if (
        contentData.quiz &&
        typeof contentData.quiz === 'string' &&
        String(contentData.quiz).includes('Error generating')
      ) {
        errorTypes.push('quiz')
      }
      if (
        contentData.mindmap &&
        typeof contentData.mindmap === 'string' &&
        String(contentData.mindmap).includes('Error generating')
      ) {
        errorTypes.push('mindmap')
      }

      return errorTypes
    },
    []
  )

  // Memoized setter for content to avoid unnecessary re-renders
  const setContent = useCallback((newContent: ChapterContent | null) => {
    setState(prev => ({
      ...prev,
      content: newContent,
    }))
  }, [])

  // Reset generation state
  const resetGenerationState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isGeneratingContent: false,
      generationProgress: {
        total: 0,
        completed: 0,
        failed: 0,
      },
      lastGenerationError: null,
    }))
  }, [])

  // Memoize derived values to prevent unnecessary recalculations
  const {
    uploadedFiles,
    chaptersMeta,
    content,
    error,
    processingStatus,
    isCheckingStatus,
    isGeneratingContent,
    generationProgress,
    lastGenerationError,
    knowledgeData,
  } = state

  // Memoized combined content (merges chapter content with knowledge data)
  const combinedContent = useMemo(() => {
    if (!content && !knowledgeData) return null

    const baseContent = content || {}
    const knowledge = knowledgeData || { video_url: null, roleplay: null }

    return {
      ...baseContent,
      video_url: baseContent.video_url || knowledge.video_url,
      roleplay: knowledge.roleplay,
    }
  }, [content, knowledgeData])

  return {
    uploadedFiles,
    chaptersMeta,
    fetchChapters,
    setContent,
    content: combinedContent,
    fetchChapterMeta,
    fetchKnowledgeData,
    getEdTechContentForChapter,
    generateMissingContent,
    retryContentGeneration,
    getMissingContentTypes,
    getContentTypesWithErrors,
    processingStatus,
    isCheckingStatus,
    isGeneratingContent,
    generationProgress,
    lastGenerationError,
    resetGenerationState,
    knowledgeData,
    error,
  }
}
