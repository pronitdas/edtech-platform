"use client"

import { windowedChunk } from "@/components/utils";
import supabase from "./supabase";
import { analyzeMarkdown, cleanMarkdown, processMarkdown } from "./markdown-utils";
import { OpenAIClient } from "./openAi";


export const getEdTechContent = async (chapter, language = "English") => {
    console.log("Getting EdTech content for chapter:", chapter.id, "language:", language);
    
    // Check if content exists in EdTechContent table
    const { data: EdTechContent, error } = await supabase
        .from(`EdTechContent_${language}`)
        .select('*') // Select only fields belonging to EdTechContent
        .eq('chapter_id', chapter.id)
        .eq('knowledge_id', chapter.knowledge_id)
        .limit(1);
    
    console.log(`EdTechContent_${language} from DB:`, EdTechContent, "Error:", error);
        
    // If no content is found, create a minimal entry (without knowledge fields like video/roleplay)
    if (!EdTechContent || EdTechContent.length === 0) {
        console.log("No EdTechContent found, creating minimal new entry");
        
        const { data: newEdtechContent, error: insertError } = await supabase
            .from(`EdTechContent_${language}`)
            .insert([{
                chapter_id: chapter.id,
                knowledge_id: chapter.knowledge_id,
                id: chapter.lines + chapter.id, // Consider if this ID generation is correct
                latex_code: chapter.chapter, // Original chapter text might go here?
                subtopic: chapter.subtopic,
                chapter: chapter.chaptertitle,
                // video_url is now fetched separately if needed, not inserted here by default
            }])
            .select();
            
        console.log("Inserted new minimal EdTechContent:", newEdtechContent, "Error:", insertError);
        return newEdtechContent;
    }
    
    // If content exists, just return it. Merging happens elsewhere.
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
export async function insertKnowledge(name, user, fileName) {
    // Assumes you have a function to insert knowledge into the database and return its ID
    const { data, error } = await supabase.from('knowledge').insert([{ name, userId: user.id, filename: [fileName] }]).select();
    if (error) {
        console.error("Failed to insert knowledge:", error);
        throw new Error("Failed to insert knowledge.");
    }
    return data[0]?.id; // Assumes `id` is the primary key for the `knowledge` table
}

export async function uploadFiles(files, knowledge_id, fileType) {
    const basePath = `${fileType}/${knowledge_id}/`;

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

    const results = await Promise.all(promises); // Wait for all uploads to complete

    // After successful upload, trigger the knowledge processing
    if (fileType === 'doc' || fileType === 'pdf') {
        try {
            // Call the process/knowledge endpoint to start processing
            const apiUrl = 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/process/${knowledge_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                console.warn(`Processing request for knowledge_id ${knowledge_id} returned status ${response.status}`);
                // We don't throw here to avoid failing the upload if processing fails
            } else {
                console.log(`Successfully triggered processing for knowledge_id ${knowledge_id}`);
            }
        } catch (error) {
            console.warn(`Failed to trigger processing for knowledge_id ${knowledge_id}:`, error);
            // We don't throw here to avoid failing the upload if processing fails
        }
    }

    return results;
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
    try {
        const { data, error } = await supabase
            .from('knowledge')
            .select('id, name, seeded, video_url, status, filename, roleplay, difficulty_level, target_audience, prerequisites, summary, chapters_v1(k_id, subtopic, chaptertitle)') // Combined both sets of fields
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching knowledge:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Exception fetching knowledge:', error);
        return [];
    }
}

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

// Function to get roleplay data for a specific knowledge entry
export const getRoleplayData = async (knowledgeId: number) => {
    const { data, error } = await supabase
        .from('knowledge')
        .select('roleplay')
        .eq('id', knowledgeId)
        .single();

    if (error) {
        console.error('Error fetching roleplay data:', error);
        return null;
    }

    return data?.roleplay;
}


// Function to generate roleplay scenarios based on course content
export const generateRoleplayScenarios = async (
    knowledgeId: number,
    topic: string,
    content: string,
    apiKey: string,
    language: string = 'English'
) => {
    try {
        // Initialize the OpenAI client
        const openAIClient = new OpenAIClient(apiKey);

        const systemPrompt = `
You are an educational roleplay designer. Create 2 engaging roleplay scenarios for students learning about "${topic}" in ${language}.
Each scenario should:
1. Be relevant to the subject matter
2. Feature one character persona that helps understanding the content
3. Include a compelling initial prompt
4. Be engaging and educational

Content context to base scenarios on:
${content.substring(0, 1500)} // Limiting to 1500 chars to avoid token issues

Format your response as a valid JSON object with a 'scenarios' array:
{
  "scenarios": [
    {
      "id": "${topic.toLowerCase().replace(/\s+/g, '-')}-scenario-1",
      "title": "Scenario Title",
      "description": "Brief description of the scenario",
      "characters": [
        {
          "id": "${topic.toLowerCase().replace(/\s+/g, '-')}-character-1",
          "name": "Character Name",
          "description": "Brief description of the character"
        }
      ],
      "initialPrompt": "The initial message from the character to start the conversation",
      "relatedCourse": "${topic}"
    }
  ]
}`;

        const scenariosJson = await openAIClient.chatCompletion(
            [{ role: 'system', content: systemPrompt }],
            'gpt-4o-mini',
            2000,
            {
                name: 'roleplay',
                schema: {
                    type: 'object',
                    properties: {
                        scenarios: {
                            type: 'array',
                            items: { 
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    characters: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                name: { type: 'string' },
                                                description: { type: 'string' }
                                            },
                                            required: ['id', 'name', 'description'],
                                            additionalProperties: false
                                        }
                                    },
                                    initialPrompt: { type: 'string' },
                                    relatedCourse: { type: 'string' }
                                },
                                required: ['id', 'title', 'description', 'characters', 'initialPrompt', 'relatedCourse'],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ['scenarios'],
                    additionalProperties: false
                }
            }
        );

        let parsedResponse;
        try {
            parsedResponse = JSON.stringify(scenariosJson);
        } catch (parseError) {
            console.error('Error parsing generated scenarios:', parseError);
            return null;
        }

        console.log('Sending roleplay data to update:', parsedResponse);
        
        // Update roleplay directly with the parsed object (not stringified)
        const { data, error } = await supabase
            .from('knowledge')
            .update({ 
                roleplay: parsedResponse
            })
            .eq('id', knowledgeId);
            
        if (error) {
            console.error('Error updating roleplay data:', error);
            return null;
        }
        
        // Add small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the updated data separately to confirm it was saved
        const { data: updatedData, error: fetchError } = await supabase
            .from('knowledge')
            .select('roleplay')
            .eq('id', knowledgeId)
            .single();
            
        if (fetchError) {
            console.error('Error fetching updated roleplay data:', fetchError);
            return null;
        }
        
        console.log('Retrieved updated roleplay data:', updatedData?.roleplay);
        return updatedData?.roleplay;
    } catch (error) {
        console.error('Error generating roleplay scenarios:', error);
        return null;
    }
};
