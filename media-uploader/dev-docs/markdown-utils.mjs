#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
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
    const patterns = {}; // Tracks the frequency of words in headings

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
            const firstWord = title.split(' ')[0].toLowerCase(); // Convert to lowercase for consistent pattern detection
            patterns[firstWord] = (patterns[firstWord] || 0) + 1;

            if (level === 1) {
                // Finalize the current subtopic
                finalizeSubtopic(currentSubtopic, lineNumber - 1);

                // Start a new subtopic
                currentSubtopic = {
                    title: title.trim(),
                    startLine: lineNumber,
                    chapters: [],
                };
            } else if (level === 2 && currentSubtopic) {
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

    // Finalize the last subtopic and chapter
    finalizeSubtopic(currentSubtopic, lines.length);

    // Step 2: Detect Frequent Patterns (Occurrences > 4)
    const frequentPatterns = Object.entries(patterns)
        .filter(([_, count]) => count > 6) // Only include words with more than 4 occurrences
        .map(([word]) => ({
            word,
            regex: new RegExp(`\\b${word}\\b`, 'i'), // Create regex for pattern matching
            count: patterns[word], // Add occurrence count for debugging or reporting
        }));

    return { textbook, patterns: frequentPatterns };
};


program
    .name('Markdown Analyzer with Validated Subtopics')
    .description(
        'Analyze a Markdown file, detect frequent patterns dynamically, and structure it into subtopics and chapters, removing empty entries.'
    )
    .version('1.0.0')
    .argument('<filepath>', 'Path to the Markdown file to analyze')
    .option('-o, --output <filepath>', 'Output file to save the structured JSON', 'textbook.json')
    .action((filepath, options) => {
        try {
            const absPath = path.resolve(filepath);
            if (!fs.existsSync(absPath)) {
                console.error(`Error: File not found at ${absPath}`);
                process.exit(1);
            }

            const markdownContent = fs.readFileSync(absPath, 'utf-8');
            const knowledgeId = path.basename(filepath, path.extname(filepath)); // Use file name as knowledge_id
            const { textbook, patterns } = analyzeMarkdown(markdownContent, knowledgeId);

            // Save the structured JSON to the specified output file
            const outputPath = path.resolve(options.output);
            const dbPath = path.resolve(`db-${options.output}`);

            fs.writeFileSync(outputPath, JSON.stringify({ textbook, patterns }, null, 4), 'utf-8');
            const supadb = walkTextbook(textbook, '12')
            fs.writeFileSync(dbPath, JSON.stringify(supadb, null, 4), 'utf-8');
            console.log(`Analysis complete. Textbook saved to ${outputPath}`);
        } catch (error) {
            console.error(`Error analyzing Markdown file: ${error.message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);
