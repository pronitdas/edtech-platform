#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import fetch from 'node-fetch';
import FormData from 'form-data';

// ---------------------- Supabase Initialization ----------------------
const supabaseUrl = '';
const supabaseKey =
    '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Walks through the textbook object to generate an array of objects for DB storage.
 */
const walkTextbook = (textbook, knowledgeId) => {
    const result = [];
    let idCounter = 1;

    // Iterate through subtopics and chapters
    textbook.subtopics.forEach((subtopic, subtopicIndex) => {
        subtopic.chapters.forEach((chapter, chapterIndex) => {
            result.push({
                id: idCounter++,
                topic: textbook.topic, // Top-level topic
                subtopic: `${subtopic.title} ${subtopicIndex + 1}`, // Subtopic title with index
                chaptertitle: chapter.title, // Chapter title
                chapter: chapter.content, // Chapter content
                lines: chapter.content ? chapter.content.split('\n').length : 0, // Number of lines
                knowledge_id: Number(knowledgeId), // Knowledge ID
                k_id: Number(knowledgeId), // Duplicate for convenience
            });
        });
    });
    return result;
};

/**
 * Analyzes a Markdown string and returns a structured textbook object and detected heading patterns.
 */
const analyzeMarkdown = (mdContent, knowledgeId, knowledgeName) => {
    const lines = mdContent.split('\n');
    const headingRegex = /^(#{1,6})\s+(.*)/; // Matches headings (#, ##, etc.)
    const patterns = {};

    const textbook = {
        topic: knowledgeName, // Default topic
        knowledge_id: knowledgeId,
        subtopics: [],
    };

    let currentSubtopic = null;
    let currentChapter = null;

    // Utility to finalize a chapter
    const finalizeChapter = (subtopic, chapter, endLine) => {
        if (chapter) {
            const content = lines.slice(chapter.startLine, endLine).join('\n').trim();
            if (content) {
                chapter.content = content;
                subtopic.chapters.push({ ...chapter });
            }
        }
    };

    // Utility to finalize a subtopic
    const finalizeSubtopic = (subtopic, endLine) => {
        if (subtopic) {
            if (currentChapter) {
                finalizeChapter(subtopic, currentChapter, endLine);
                currentChapter = null;
            }
            const leftoverContent = lines.slice(subtopic.startLine, endLine).join('\n').trim();
            if (leftoverContent) {
                subtopic.chapters.push({
                    title: "Notes",
                    content: leftoverContent,
                });
            }
            if (subtopic.chapters.length > 0) {
                textbook.subtopics.push({ ...subtopic });
            }
        }
    };

    // Step 1: Analyze Headings and Patterns
    lines.forEach((line, index) => {
        const headingMatch = line.match(headingRegex);
        const lineNumber = index + 1;
        if (headingMatch) {
            const [_, hashes, title] = headingMatch;
            const level = hashes.length;
            // Update patterns for frequent word detection
            const firstWord = title.split(' ')[0];
            patterns[firstWord] = (patterns[firstWord] || 0) + 1;
            if (level === 1 || level === 2) {
                // Finalize the current subtopic
                finalizeSubtopic(currentSubtopic, lineNumber - 1);
                // Start a new subtopic
                currentSubtopic = {
                    title: title.trim(),
                    startLine: lineNumber,
                    chapters: [],
                };
            } else if (level === 3 && currentSubtopic) {
                // Finalize the current chapter
                finalizeChapter(currentSubtopic, currentChapter, lineNumber - 1);
                // Start a new chapter
                currentChapter = {
                    title: title.trim(),
                    startLine: lineNumber,
                    content: null,
                };
            }
        }
    });
    const frequentPatterns = Object.entries(patterns)
        .filter(([_, count]) => count > 4)
        .map(([pattern]) => new RegExp(`^${pattern}`, 'i'));

    // Finalize the last subtopic and chapter
    finalizeSubtopic(currentSubtopic, lines.length);
    return { textbook, patterns: frequentPatterns };
};

/**
 * Recursively lists files from the storage bucket.
 * It starts at the given folder (default is the root) and, for each folder encountered (heuristically
 * determined by the lack of a file extension), it lists one level deep.
 */
async function getFilesRecursively(folder = '', level = 2) {
    const { data, error } = await supabase.storage
        .from('media')
        .list(folder, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
        });
    if (error) {
        console.error(`Error listing files in folder "${folder}":`, error.message);
        return [];
    }
    let files = [];
    for (const item of data) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name;
        // If the file name ends with .pdf, then treat it as a PDF file.
        console.log(item);
        if (item.name.toLowerCase().endsWith('.pdf')) {
            files.push(itemPath);
        } else {
            // Otherwise, assume it could be a folder (using a simple heuristic) and, if allowed, list one level deeper.
            if (level > 0 && !item.name.includes('.')) {
                const subFiles = await getFilesRecursively(itemPath, level - 1);
                files.push(...subFiles);
            }
        }
    }
    return files;
}

/**
 * Instead of simulating a placeholder conversion, this function now retrieves the PDF file from Supabase storage
 * and makes an HTTP POST request to the FastAPI /upload-pdf endpoint to have it converted into Markdown.
 */
async function pdfToMarkdown(pdfPath) {
    console.log(`Attempting to convert PDF "${pdfPath}" via API endpoint...`);

    // Download the PDF file from Supabase.
    const { data: pdfData, error: downloadError } = await supabase.storage.from('media').download(pdfPath);
    if (downloadError) {
        console.error(`Error downloading PDF "${pdfPath}": ${downloadError.message}`);
        throw downloadError;
    }

    // Convert pdfData (which is typically a Blob in browser environments or a stream/Buffer in Node) to a Buffer.
    let buffer;
    if (typeof pdfData.arrayBuffer === 'function') {
        const arrayBuffer = await pdfData.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
    } else {
        buffer = pdfData;
    }

    // Set up FormData to mimic an upload via a form.
    const formData = new FormData();
    formData.append('file', buffer, {
        filename: path.basename(pdfPath),
        contentType: 'application/pdf',
    });

    const apiUrl = 'http://localhost:8000/upload-pdf';
    console.log(`Uploading PDF "${pdfPath}" to API server at ${apiUrl}...`);

    // Make the POST request to the FastAPI endpoint.
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // Note: Do NOT manually set the Content-Type header when using FormData.
    });

    if (!response.ok) {
        throw new Error(`Failed to convert PDF. API responded with status ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully converted PDF "${pdfPath}".`);

    // Return the markdown text from the API response.
    return result.markdown;
}

// ---------------------- Fetch and Convert Data from Supabase Storage ----------------------
async function getEdtech() {
    try {
        console.log("Fetching file list from Supabase storage recursively (up to 1 level)...");
        // Get all PDF file paths (recursive up to one level)
        const pdfFiles = await getFilesRecursively('media/doc', 1);
        if (!pdfFiles.length) {
            console.error("No PDF files found in storage.");
            process.exit(1);
        }
        console.log(`Found ${pdfFiles.length} PDF file(s).`);

        // Process each PDF file
        for (let i = 0; i < pdfFiles.length; i++) {
            const filePath = pdfFiles[i];
            // Use the file name (without extension) as the display name
            const fileName = path.basename(filePath, '.pdf');
            console.log(`Processing file: ${filePath}`);

            // Convert the PDF to Markdown using the placeholder API
            const markdownContent = await pdfToMarkdown(filePath);

            // Write the markdown content to a Markdown file
            const outputMdPath = `./new_content/${fileName}.md`;
            fs.writeFileSync(outputMdPath, markdownContent, 'utf8');

            // Analyze the markdown content
            const { textbook, patterns } = analyzeMarkdown(markdownContent, i + 1, fileName);

            // Save the structured JSON analysis to a file
            const analysisPath = `./new_content/${fileName}.analysis.json`;
            fs.writeFileSync(analysisPath, JSON.stringify({ textbook, patterns }, null, 4), 'utf-8');

            // Walk the textbook to create a DB-friendly file
            const dbData = walkTextbook(textbook, i + 1);
            const dbPath = `./new_content/${fileName}.db.json`;
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 4), 'utf-8');

            console.log(`Analysis complete for "${fileName}". Files saved:
    Markdown -> ${outputMdPath}
    Analysis JSON -> ${analysisPath}
    DB JSON -> ${dbPath}`);
        }
        console.log("Content successfully saved.");
    } catch (error) {
        console.error("Error fetching data:", error.message);
        process.exit(1);
    }
}

// ---------------------- CLI Configuration ----------------------
program
    .name('EdTech CLI')
    .description('Fetch edtech content from Supabase storage, convert PDF to Markdown, and save analysis.')
    .version('1.0.0')
    .action(async () => {
        await getEdtech();
    });

program.parse(process.argv);
