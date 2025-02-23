import { useEffect, useState } from 'react';
import { getChapters, getChapterMetaDataByLanguage, getEdTechContent, updateEdtechContent } from '@/services/edtech-content';
import { metaMap } from '@/services/openAiFns';
import useAuthState from './useAuth';
import { OpenAIClient } from '@/services/openAi';

export const useChapters = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [chaptersMeta, setChapterMeta] = useState([]);
    const [content, setContent] = useState(null)
    const { oAiKey } = useAuthState()
    const [apiClient, setApiClient] = useState(null)
    const fetchChapters = async (knowledgeId, language) => {
        const chapters = await getChapters(knowledgeId, language);
        setUploadedFiles(chapters);
        return chapters;
    };

    useEffect(() => {
        if (!apiClient && oAiKey) {
            setApiClient(new OpenAIClient(oAiKey))
        }

    }, [oAiKey, apiClient])
    const fetchChapterMeta = async (knowledgeId, language) => {
        const metadata = await getChapterMetaDataByLanguage(knowledgeId, language);
        setChapterMeta(metadata);
    };

    const reset = () => {
        setUploadedFiles([]);
        setChapterMeta([]);
    };

    const generateEdtechContentText = async (edtechId, chapter, knowledgeId, types, language) => {
        // Content generation and update logic
        try {
            // Iterate over each type to generate content
            await Promise.all(types.map(async (type) => {
                if (!metaMap[type]) {
                    console.log(`${type} not supported`);
                    return;
                }

                const generator = metaMap[type];
                const generated = await generator(apiClient, chapter.chapter, language);

                if (!Array.isArray(generated)) {
                    console.log(`Generated content for ${type} is not an array`);
                    return;
                }

                const upsertContent = {
                    [type]: type === "quiz" ? generated : generated.join("|||||")
                };

                // Update content in the database
                await updateEdtechContent(upsertContent, edtechId, chapter.id, knowledgeId, language);

                console.log(upsertContent); // Log updated content
            }));
        } catch (error) {
            console.error('Error generating content:', error);
        }
    };

    const getEdTechContentForChapter = async (chapter, language) => {

        const c = await getEdTechContent(chapter, language);
        if (c.length > 0) {
            setContent(c[0])
            if (!c[0].notes) {
                await generateEdtechContentText(c[0].id, chapter, chapter.k_id, ["notes"], language)
            }
            if (!c[0].summary) {
                await generateEdtechContentText(c[0].id, chapter, chapter.k_id, ["summary"], language)
            }
            if (!c[0].quiz && c[0].notes) {
                await generateEdtechContentText(c[0].id, chapter, chapter.k_id, ["quiz"], language)
            }
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

