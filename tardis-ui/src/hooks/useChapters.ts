import { useEffect, useState } from 'react';
import { getChapters, getChapterMetaDataByLanguage, getEdTechContent } from '@/services/edtech-content';
import useAuthState from './useAuth';
import supabase from "../services/supabase";


export const useChapters = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [chaptersMeta, setChapterMeta] = useState([]);
    const [content, setContent] = useState(null);
    const [error, setError] = useState(null);
    const fetchChapters = async (knowledgeId, language) => {
        const chapters = await getChapters(knowledgeId, language);
        setUploadedFiles(chapters);
        return chapters;
    };

    const fetchChapterMeta = async (knowledgeId, language) => {
        const metadata = await getChapterMetaDataByLanguage(knowledgeId, language);
        setChapterMeta(metadata);
    };

    const reset = () => {
        setUploadedFiles([]);
        setChapterMeta([]);
        setContent(null);
    };

    const getEdTechContentForChapter = async (chapter, language) => {
        try {
            const content = await getEdTechContent(chapter, language);
            if (content.length > 0) {
                setContent(content[0]);
                
                // Check which content types need to be generated
                const missingTypes = [];
                if (!content[0].notes) missingTypes.push('notes');
                if (!content[0].summary) missingTypes.push('summary');
                if (!content[0].quiz && content[0].notes) missingTypes.push('quiz');
                if (!content[0].mindmap && content[0].notes) missingTypes.push('mindmap');

                if (missingTypes.length > 0 && !error) {
                    // Call the Edge Function to generate missing content
                    const { data, error } = await supabase.functions.invoke('edtech-generation', {
                        body: {
                            edtechId: content[0].id,
                            chapter,
                            knowledgeId: chapter.k_id,
                            types: missingTypes,
                            language
                        }
                    });

                    if (error) {
                        console.error('Error generating content:', error);
                        return;
                    }

                    if (data) {
                        setContent(data[0]);
                    }
                }
            }
        } catch (error) {
            setError(error);
            console.error('Error in getEdTechContentForChapter:', error);
        }
    };

    return {
        uploadedFiles,
        chaptersMeta,
        fetchChapters,
        setContent,
        content,
        fetchChapterMeta,
        reset,
        getEdTechContentForChapter,
    };
};

