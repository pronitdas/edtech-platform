import { useEffect, useRef, useState } from 'react';
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

export const useChapters = () => {
    const [uploadedFiles, setUploadedFiles] = useState<ChapterV1[]>([]);
    const [chaptersMeta, setChapterMeta] = useState<EdTechChapter[]>([]);
    const [content, setContent] = useState<ChapterContent | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
    const [isGeneratingContent, setIsGeneratingContent] = useState<boolean>(false);

    // Refs for throttling
   
    const fetchChapters = async (knowledgeId: number, language: string): Promise<ChapterV1[]> => {
        const chapters = await getChapters(knowledgeId, language);
        setUploadedFiles(chapters);
        return chapters;
    };

    const fetchChapterMeta = async (knowledgeId: number, language: string): Promise<void> => {
        const metadata = await getChapterMetaDataByLanguage(knowledgeId, language);
        setChapterMeta(metadata);
    };

    const getEdTechContentForChapter = async (chapter: ChapterV1, language: string): Promise<ChapterContent | null> => {
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
                    // Merge roleplay data with content
                    if (knowledgeData.roleplay) {
                        contentData.roleplay = knowledgeData.roleplay;
                    }
                    
                    // Add video_url from knowledge to content
                    if (knowledgeData.video_url) {
                        contentData.video_url = knowledgeData.video_url;
                    }
                }
                
                setContent(contentData);
                
                return contentData;
            }
            return null;
        } catch (error) {
            console.error('Error in getEdTechContentForChapter:', error);
            return null;
        }
    };

    const generateMissingContent = async (chapter: ChapterV1, language: string, contentTypes: ContentType[]): Promise<ChapterContent | null> => {
        if (!chapter || contentTypes.length === 0) return null;

        setIsGeneratingContent(true);
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
                setContent(newContent);
                return newContent;
            }
            return null;
        } catch (error) {
            if (error instanceof Error) {
                setError(error);
            }
            console.error('Error generating content:', error);
            return null;
        } finally {
            setIsGeneratingContent(false);
        }
    };

    const getMissingContentTypes = (contentData: ChapterContent | null): ContentType[] => {
        if (!contentData) return [];

        const missingTypes: ContentType[] = [];
        if (!contentData.notes) missingTypes.push('notes');
        if (!contentData.summary) missingTypes.push('summary');
        if (!contentData.quiz && contentData.notes) missingTypes.push('quiz');
        if (!contentData.mindmap && contentData.notes) missingTypes.push('mindmap');

        return missingTypes;
    };

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

