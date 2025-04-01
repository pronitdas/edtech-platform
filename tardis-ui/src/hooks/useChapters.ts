import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getChapters, getChapterMetaDataByLanguage, getEdTechContent } from '@/services/edtech-content';
import useAuthState from './useAuth';
import { EdTechAPI, ContentType, ProcessingStatus } from '@/services/edtech-api';
import supabase from '@/services/supabase';
import { ChapterContent, ChapterV1, EdTechChapter } from '@/types/database';

// Create an instance of the EdTechAPI
const edtechApi = new EdTechAPI();

// Throttling constants
const STATUS_CHECK_INTERVAL = 30000; // 30 seconds between status checks
const MAX_STATUS_CHECKS = 1; // Maximum number of consecutive status checks

interface ChaptersState {
  uploadedFiles: ChapterV1[];
  chaptersMeta: EdTechChapter[];
  content: ChapterContent | null;
  error: Error | null;
  processingStatus: ProcessingStatus | null;
  isCheckingStatus: boolean;
  isGeneratingContent: boolean;
}

export const useChapters = () => {
    // Use a single state object to reduce re-renders when multiple properties change
    const [state, setState] = useState<ChaptersState>({
        uploadedFiles: [],
        chaptersMeta: [],
        content: null,
        error: null,
        processingStatus: null,
        isCheckingStatus: false,
        isGeneratingContent: false,
    });

    // Use refs for values that don't trigger re-renders
    const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusCheckCountRef = useRef<number>(0);

    // Memoized state update functions using useCallback
    const fetchChapters = useCallback(async (knowledgeId: number, language: string): Promise<ChapterV1[]> => {
        try {
            const chapters = await getChapters(knowledgeId, language);
            if (chapters) {
                setState(prev => ({
                    ...prev,
                    uploadedFiles: chapters
                }));
                return chapters;
            }
            return [];
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Unknown error fetching chapters')
            }));
            return [];
        }
    }, []);

    const fetchChapterMeta = useCallback(async (knowledgeId: number, language: string): Promise<void> => {
        try {
            const metadata = await getChapterMetaDataByLanguage(knowledgeId, language);
            setState(prev => ({
                ...prev,
                chaptersMeta: metadata
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Unknown error fetching chapter metadata')
            }));
        }
    }, []);

    const getEdTechContentForChapter = useCallback(async (chapter: ChapterV1, language: string): Promise<ChapterContent | null> => {
        try {
            const content = await getEdTechContent(chapter, language);
            if (content.length > 0) {
                // Fetch roleplay data and video_url from knowledge
                const { data: knowledgeData, error } = await supabase
                    .from('knowledge')
                    .select('roleplay, video_url')
                    .eq('id', chapter.knowledge_id)
                    .single();
                
                const contentData = content[0] as ChapterContent;
                
                if (knowledgeData) {
                    // Use immutability pattern when merging data
                    const enhancedContent = {
                        ...contentData,
                        ...(knowledgeData.roleplay && { roleplay: knowledgeData.roleplay }),
                        ...(knowledgeData.video_url && { video_url: knowledgeData.video_url })
                    };
                    
                    setState(prev => ({
                        ...prev,
                        content: enhancedContent
                    }));
                    
                    return enhancedContent;
                } else {
                    setState(prev => ({
                        ...prev,
                        content: contentData
                    }));
                    
                    return contentData;
                }
            }
            return null;
        } catch (error) {
            console.error('Error in getEdTechContentForChapter:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Unknown error fetching EdTech content')
            }));
            return null;
        }
    }, []);

    const generateMissingContent = useCallback(async (
        chapter: ChapterV1, 
        language: string, 
        contentTypes: ContentType[]
    ): Promise<ChapterContent | null> => {
        if (!chapter || contentTypes.length === 0) return null;

        setState(prev => ({
            ...prev,
            isGeneratingContent: true
        }));
        
        try {
            const generationResponse = await edtechApi.generateContent(
                chapter.knowledge_id,
                {
                    chapterId: chapter.id.toString(),
                    types: contentTypes,
                    language
                }
            );

            if (generationResponse.success && generationResponse.data?.chapters?.length > 0) {
                const newContent = generationResponse.data.chapters[0] as ChapterContent;
                
                setState(prev => ({
                    ...prev,
                    content: newContent,
                    isGeneratingContent: false
                }));
                
                return newContent;
            }
            
            setState(prev => ({
                ...prev,
                isGeneratingContent: false
            }));
            
            return null;
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error : new Error('Error generating content'),
                isGeneratingContent: false
            }));
            
            console.error('Error generating content:', error);
            return null;
        }
    }, []);

    // Memoized utility function for identifying missing content types
    const getMissingContentTypes = useCallback((contentData: ChapterContent | null): ContentType[] => {
        if (!contentData) return [];

        const missingTypes: ContentType[] = [];
        
        if (!contentData.notes) missingTypes.push('notes');
        if (!contentData.summary) missingTypes.push('summary');
        if (!contentData.quiz && contentData.notes) missingTypes.push('quiz');
        if (!contentData.mindmap && contentData.notes) missingTypes.push('mindmap');

        return missingTypes;
    }, []);

    // Memoized setter for content to avoid unnecessary re-renders
    const setContent = useCallback((newContent: ChapterContent | null) => {
        setState(prev => ({
            ...prev,
            content: newContent
        }));
    }, []);

    // Memoize derived values to prevent unnecessary recalculations
    const { 
        uploadedFiles, 
        chaptersMeta, 
        content, 
        error, 
        processingStatus, 
        isCheckingStatus, 
        isGeneratingContent 
    } = state;

    return {
        uploadedFiles,
        chaptersMeta,
        fetchChapters,
        setContent,
        content,
        fetchChapterMeta,
        getEdTechContentForChapter,
        generateMissingContent,
        getMissingContentTypes,
        processingStatus,
        isCheckingStatus,
        isGeneratingContent,
        error
    };
};

