#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

// ---------------------- Supabase Initialization ----------------------
const supabaseUrl = 'https://onyibiwnfwxatadlkygz.supabase.co';
const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWliaXduZnd4YXRhZGxreWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTA5NzIsImV4cCI6MjA0NzQyNjk3Mn0.fSowEy_-abbGvLM0_A17SiORxgWqAc1G4mV1w7v3d28';
const supabase = createClient(supabaseUrl, supabaseKey);
const walkTextbook = (textbook, knowledgeId) => {
    const result = [];
    let idCounter = 1;

    // Iterate through subtopics and chapters
    textbook.subtopics.forEach((subtopic, subtopicIndex) => {
        subtopic.chapters.forEach((chapter, chapterIndex) => {
            result.push({
                id: idCounter++,
                topic: textbook.topic, // Top-level topic0
                 
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

    // Step 2: Detect Frequent Patterns (Occurrences > 4)
   

    return { textbook, patterns: frequentPatterns };
};

// ---------------------- Fetch Data from Supabase ----------------------
async function getEdtech() {
    try {
        const {data: s3Data, error} = await supabase.storage.from('media').list('/media/doc/',{
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          });
        // const { data, error } = await supabase
        //     .from('knowledge')
        //     .select('docling_content, id, name')
        //     .eq("id" , 39)
        console.log(s3Data);
          console.log(error)
        const data = []
        if (error) {
            console.error('Error fetching data from Supabase:', error.message);
            process.exit(1);
        }

        if (!data || data.length === 0) {
            console.error('No data found for the given ID:');
            
            process.exit(1);
        }
        data.forEach(d => {
            if (d.docling_content && d.docling_content.markdown) {
                const content = d.docling_content.markdown;

                // Write content to a Markdown file
                const outputPath = `./new_content/${d.id || 'content'}.md`;
                fs.writeFileSync(outputPath, JSON.stringify(content), 'utf8');
                const { textbook, patterns } = analyzeMarkdown(content, d.id, d.name);

                // Save the structured JSON to the specified output file
                const outputPathDb = `./new_content/${d.id || 'content'}.analysis.json`;

                const dbPath =  `./new_content/${d.id || 'content'}.db.json`;
    
                fs.writeFileSync(outputPathDb, JSON.stringify({ textbook, patterns }, null, 4), 'utf-8');
                const supadb = walkTextbook(textbook, d.id)
                fs.writeFileSync(dbPath, JSON.stringify(supadb, null, 4), 'utf-8');
                console.log(`Analysis complete. Textbook saved to ${outputPathDb}`);
            }

        })

        console.log(`Content successfully saved `);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        process.exit(1);
    }
}

// ---------------------- CLI Configuration ----------------------
program
    .name('EdTech CLI')
    .description('Fetch edtech content from Supabase and save as Markdown file.')
    .version('1.0.0')
    .action(async () => {
        
        await getEdtech();
    });

program.parse(process.argv);
