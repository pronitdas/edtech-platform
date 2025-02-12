"use client"

import { windowedChunk } from "@/components/utils";
import supabase from "./supabase";
import { analyzeMarkdown, cleanMarkdown, processMarkdown } from "./markdown-utils";


export const getEdTechContent = async (chapter, language = "English") => {
    const { data: EdTechContent } = await supabase
        .from(`EdTechContent_${language}`)
        .select('*')
        .eq('chapter_id', chapter.id)
        .eq('knowledge_id', chapter.knowledge_id)
        .limit(1)
    if (EdTechContent.length == 0) {
        const { data: newEdtechContent } = await supabase
            .from(`EdTechContent_${language}`)
            .insert([{
                chapter_id: chapter.id,
                knowledge_id: chapter.knowledge_id,
                id: chapter.lines + chapter.id,
                latex_code: chapter.chapter,
                subtopic: chapter.subtopic,
                chapter: chapter.chaptertitle
            }])
            .select()

        return newEdtechContent;
    }
    return EdTechContent;
}

export const updateEdtechContent = async (updateObject, edtechId, chapterId, knowledgeId, language = "English") => {
    const { data, error } = await supabase
        .from(`EdTechContent_${language}`)
        .update(updateObject)
        .eq('id', edtechId)
        .eq('chapter_id', chapterId)
        .eq('knowledge_id', knowledgeId)
        .select("*")

    console.log(error);
    return data;
}
export const getChapterMetaDataByLanguage = async (id: number, language) => {
    let { data: goldenContent, error: errTemp } = await supabase
        .rpc('check_edtech_columns', {
            knowledge_id: id,
            language: language
        })
    if (errTemp) console.error(errTemp)
    return goldenContent
}
export const getChapters = async (id: number, language) => {
    const { data: chapters, error } = await supabase
        .from('chapters_v1')
        .select("*")
        .eq('k_id', id)

    if (error) {
        console.error("Error fetching chapters:", error);
        return null;
    }
    if (chapters?.length == 0) {
        const { data } = await supabase
            .from('knowledge')
            .select('docling_content')
            .eq('id', id)
        data[0].docling_content.markdown = cleanMarkdown(data[0].docling_content.markdown);

        const { data: updatedData } = await insertChapters(id, data[0].docling_content)
        return updatedData;
    }
    const sortedData = chapters.sort((a, b) => a.id - b.id)
    return sortedData;
}
export async function insertKnowledge(name) {
    // Assumes you have a function to insert knowledge into the database and return its ID
    const { data, error } = await supabase.from('knowledge').insert([{ name }]).select();
    if (error) {
        console.error("Failed to insert knowledge:", error);
        throw new Error("Failed to insert knowledge.");
    }
    return data[0]?.id; // Assumes `id` is the primary key for the `knowledge` table
}

export async function uploadFiles(files, knowledge_id, fileType) {
    const basePath = `media/${fileType}/${knowledge_id}/`;

    const promises = files.map(async (file) => {
        // Convert the file to a Blob if not already a Blob
        const blob = file instanceof Blob ? file : new Blob([file], { type: file.type });

        // Upload to Supabase storage
        const { data, error } = await supabase.storage.from('media').upload(basePath + file.name, blob);

        if (error) {
            console.error("File upload error:", error);
            throw new Error("File upload failed.");
        }

        return data; // Return upload result for tracking
    });

    return await Promise.all(promises); // Wait for all uploads to complete
}
async function uploadImages(files, knowledge_id) {
    const basePath = `image/${knowledge_id}/`
    const promises = files.map(async f => {
        const binary = atob(f.image);
        const array = [];

        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }

        // Convert binary data to Blob
        const blob = new Blob([new Uint8Array(array)], { type: 'image/png' }); // Change MIME type if necessary

        // Upload to Supabase storage
        const { data, error } = await supabase.storage.from('media').upload(basePath + f.filename, blob)
    })
    await Promise.all(promises)
}
const insertChapters = async (knowledge_id, markdownData) => {
    const structuredContent = analyzeMarkdown(markdownData.markdown);
    const { images } = markdownData;
    structuredContent.knowledge_id = knowledge_id;
    await uploadImages(images, knowledge_id)
    console.log(structuredContent);
    const topics = distributeChaptersEqually(markdownData.markdown, structuredContent, lineRanges, 'topics');
    const subtopics = distributeChaptersEqually(markdownData.markdown, structuredContent, lineRanges, 'subtopics');
    // const chapters = mergeChaptersIntoLarger(markdownData.markdown, structuredContent, lineRanges, 'chapters');
    const chapters = distributeChaptersEqually(markdownData.markdown, structuredContent, lineRanges, 'chapters')
    // console.log(chapters, "Chapters");
    // console.log(subtopics, "suptopics");
    // console.log(topics, "topics")
    let selectionCriteria =
        (Array.isArray(chapters) && chapters.length > 0) ? chapters :
            (Array.isArray(topics) && topics.length > 0) ? topics :
                (Array.isArray(subtopics) && subtopics.length > 0) ? subtopics :
                    null; // Fallback if all are empty
    if (!selectionCriteria) {
        const chunkedData = windowedChunk(markdownData.markdown.split("."), 40, 5)
        selectionCriteria = chunkedData.map((d, i) => {

            return {
                id: i + 1,
                topic: d[0],
                subtopic: `Subtopic ${d[0].length + 1}`,
                chaptertitle: d[0],
                chapter: d.join("."),
                lines: d.length,
                knowledge_id,
                k_id: knowledge_id,
            }
        })
    }
    const mergedMap = selectionCriteria.map((topic, index) => {
        topic.id = index + 1;
        if (images) {
            let mdText = topic.chapter

            topic.chapter = processMarkdown(mdText, images)
        }
        return topic;
    })
    const { data, error } = await supabase
        .from('chapters_v1')
        .upsert(
            mergedMap
        )
        .select()
    // console.log(data);
    const sortedData = data.sort((a, b) => a.id - b.id)
    return { sortedData, error }
}
export const insertKnowledgeDep = async (markdownData) => {
    markdownData.markdown = cleanMarkdown(markdownData.markdown)
    const { data, error } = await supabase
        .from('knowledge')
        .insert([
            { name: markdownData.filename, docling_content: markdownData },
        ])
        .select()
    const { data: chaptersDAta } = await insertChapters(data[0].id, markdownData);
    return { data: chaptersDAta, error }
}

export const getKnowledgeMeta = async (id) => {
    const { data } = await supabase
        .from('knowledge')
        .select("id, name")
        .eq('id', id)
    return data;
}
export const getKnowledge = async () => {
    const { data, error } = await supabase
        .from('knowledge')
        .select("id, name, chapters_v1(k_id, subtopic, chaptertitle)")
        .order('created_at', { ascending: false }); // Order by created_at in descending order

    if (error) {
        console.error("Error fetching knowledge:", error);
        throw error;
    }

    return data;
};

export const lineRanges = {
    small: 6,   // Chapters with 10 lines or less
    medium: 18,  // Chapters with 11 to 50 lines
    large: 30, // Chapters with more than 50 lines
};
export const mergeChaptersIntoLarger = (content, metadata, lineRanges, key) => {
    const { knowledge_id } = metadata;
    const topics = metadata[key];
    const { lines, titles } = content.chapters;

    const contentLines = content.split("\n");
    const mergedChapters = [];
    let currentBuffer = ""; // Buffer for small/medium chapters
    let currentTitleBuffer = ""; // Buffer for their titles
    let currentLineCount = 0; // Line count for current buffer

    for (let i = 0; i < lines.length; i++) {
        const startLine = lines[i];
        const endLine = i < lines.length - 1 ? lines[i + 1] : contentLines.length;

        const chapterText = contentLines.slice(startLine - 1, endLine - 1).join("\n").trim();
        const chapterTitle = titles[i] || `Chapter ${i + 1}`;
        const lineCount = endLine - startLine;

        if (lineCount < lineRanges.large) {
            // Finalize the buffer if it exists (merge into this large chapter)
            if (currentBuffer) {
                mergedChapters.push({
                    topic: chapterTitle,
                    id: i,
                    subtopic: `Subtopic ${mergedChapters.length + 1}`,
                    chaptertitle: `${chapterTitle}`,
                    chapter: `${currentBuffer.trim()}\n\n${chapterText}`,
                    lines: currentLineCount + lineCount,
                    knowledge_id
                });
                currentBuffer = ""; // Reset the buffer
                currentTitleBuffer = "";
                currentLineCount = 0;
            } else {
                // If no buffer, add this large chapter directly
                mergedChapters.push({
                    topic: chapterTitle,
                    id: i,
                    subtopic: `Subtopic ${mergedChapters.length + 1}`,
                    chaptertitle: chapterTitle,
                    chapter: chapterText,
                    lines: lineCount,
                    knowledge_id
                });
            }
        } else {
            // Accumulate small/medium chapters into the buffer
            currentBuffer += `${chapterText}\n\n`;
            currentLineCount += lineCount;
        }
    }

    // Add any remaining buffer as a new chapter
    if (currentBuffer.trim()) {
        mergedChapters.push({
            topic: "Conclusion",
            id: currentLineCount,
            subtopic: `Subtopic ${mergedChapters.length + 1}`,
            chaptertitle: currentTitleBuffer.replace(/ \/ $/, ""), // Remove trailing slash
            chapter: currentBuffer.trim(),
            lines: currentLineCount,
            knowledge_id
        });
    }

    return mergedChapters;
};
export const distributeChaptersEqually = (content, metadata, lineRanges, key) => {
    const { knowledge_id } = metadata;
    const topics = metadata[key];
    const { lines, titles } = metadata[key];

    const contentLines = content.split("\n");
    const distributedChapters = [];
    let idCounter = 1;

    for (let i = 0; i < lines.length; i++) {
        const startLine = lines[i];
        const endLine = i < lines.length - 1 ? lines[i + 1] : contentLines.length;

        const chapterText = contentLines.slice(startLine - 1, endLine - 1).join("\n").trim();
        const chapterTitle = titles[i] || `Chapter ${i + 1}`;
        const lineCount = endLine - startLine;

        // Split the chapter into smaller parts if it exceeds the maximum allowed size
        if (lineCount > lineRanges.large) {
            const chapterLines = chapterText.split("\n");
            let currentBuffer = [];
            let currentLineCount = 0;

            chapterLines.forEach((line) => {
                currentBuffer.push(line);
                currentLineCount++;

                if (currentLineCount >= lineRanges.large) {
                    distributedChapters.push({
                        id: idCounter++,
                        topic: chapterTitle,
                        subtopic: `Subtopic ${distributedChapters.length + 1}`,
                        chaptertitle: `${chapterTitle} (Part ${distributedChapters.length + 1})`,
                        chapter: currentBuffer.join("\n").trim(),
                        lines: currentLineCount,
                        knowledge_id
                    });
                    currentBuffer = [];
                    currentLineCount = 0;
                }
            });

            // Add any remaining lines as a final part
            if (currentBuffer.length > 0) {
                distributedChapters.push({
                    id: idCounter++,
                    topic: chapterTitle,
                    subtopic: `Subtopic ${distributedChapters.length + 1}`,
                    chaptertitle: `${chapterTitle} (Part ${distributedChapters.length + 1})`,
                    chapter: currentBuffer.join("\n").trim(),
                    lines: currentBuffer.length,
                    knowledge_id
                });
            }
        } else {
            // Directly add chapters that fit within the limits
            distributedChapters.push({
                id: idCounter++,
                topic: chapterTitle,
                subtopic: `Subtopic ${distributedChapters.length + 1}`,
                chaptertitle: chapterTitle,
                chapter: chapterText,
                lines: lineCount,
                knowledge_id
            });
        }
    }

    return distributedChapters;
};