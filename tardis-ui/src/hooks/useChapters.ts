import { useEffect, useRef, useState } from 'react';
import { getChapters, getChapterMetaDataByLanguage, getEdTechContent } from '@/services/edtech-content';
import useAuthState from './useAuth';
import { EdTechAPI, ContentType, ProcessingStatus } from '@/services/edtech-api';
import supabase from '@/services/supabase';

// Create an instance of the EdTechAPI
const edtechApi = new EdTechAPI();

// Throttling constants
const STATUS_CHECK_INTERVAL = 30000; // 30 seconds between status checks
const MAX_STATUS_CHECKS = 1; // Maximum number of consecutive status checks

export const useChapters = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [chaptersMeta, setChapterMeta] = useState([]);
    const [content, setContent] = useState(null);
    const [error, setError] = useState(null);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);

    // Refs for throttling
   

    const fetchChapters = async (knowledgeId, language) => {
        const chapters = await getChapters(knowledgeId, language);
        setUploadedFiles(chapters);
        return chapters;
    };

    const fetchChapterMeta = async (knowledgeId, language) => {
        const metadata = await getChapterMetaDataByLanguage(knowledgeId, language);
        setChapterMeta(metadata);
        //         }
        //     } else if (statusResponse?.status === 'processing' || statusResponse?.status === 'queued') {
        //         // If still processing, schedule a single check after delay
        //         scheduleStatusCheck(knowledgeId);
        //         // Set empty metadata while waiting
        //         setChapterMeta([]);
        //     } else {
        //         // For failed or unknown status, just set empty metadata
        //         setChapterMeta([]);
        //     }
        // } catch (error) {
        //     console.error("Error fetching chapter metadata:", error);
        //     setError(error);
        // }
    };

    const getEdTechContentForChapter = async (chapter, language) => {
        try {
            const content = await getEdTechContent(chapter, language);
            if (content.length > 0) {
                // Fetch roleplay data and video_url from knowledge
                const { data: knowledgeData, error } = await supabase
                    .from('knowledge')
                    .select('roleplay, video_url')
                    .eq('id', chapter.knowledge_id)
                    .single();
                
                if (knowledgeData) {
                    // Merge roleplay data with content
                    if (knowledgeData.roleplay) {
                        content[0].roleplay = knowledgeData.roleplay;
                    }
                    
                    // Add video_url from knowledge to content
                    if (knowledgeData.video_url) {
                        content[0].video_url = knowledgeData.video_url;
                    }
                }
                
                setContent(content[0]);

                // Check which content types need to be generated
                const missingTypes = [];
                if (!content[0].notes) missingTypes.push('notes');
                if (!content[0].summary) missingTypes.push('summary');
                if (!content[0].quiz && content[0].notes) missingTypes.push('quiz');
                if (!content[0].mindmap && content[0].notes) missingTypes.push('mindmap');
            }
        } catch (error) {
            // setError(error);
            console.error('Error in getEdTechContentForChapter:', error);
            return null;
        }
    };

    const generateMissingContent = async (chapter, language, contentTypes: ContentType[]) => {
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
                const newContent = generationResponse.data.chapters[0];
                setContent(newContent);
                debugger
                return newContent;
            }
            return null;
        } catch (error) {
            setError(error);
            console.error('Error generating content:', error);
            return null;
        } finally {
            setIsGeneratingContent(false);
        }
    };

    const getMissingContentTypes = (contentData): ContentType[] => {
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
        isGeneratingContent
    };
};

