#!/usr/bin/env ts-node

/**
 * Media Processor Pipeline
 *
 * This file performs the following steps:
 *  1. Reads an input media file (PDF or Markdown).
 *  2. If a PDF is supplied, it uses the `pdf-parse` library to extract text.
 *  3. Analyzes the Markdown content to structure it into "textbook" chapters,
 *     by processing heading levels (level 1 designates a new subtopic and level 2 a new chapter).
 *  4. Converts the structured textbook into an array of chapters (using walkTextbook).
 *  5. Writes the output Markdown and JSON analysis into an output directory.
 *  6. Optionally, inserts the chapters into a Supabase table (in batches) if the --insert flag is set.
 */

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';

// ---------------------- Supabase Initialization ----------------------
const supabaseUrl = 'https://onyibiwnfwxatadlkygz.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWliaXduZnd4YXRhZGxreWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTA5NzIsImV4cCI6MjA0NzQyNjk3Mn0.fSowEy_-abbGvLM0_A17SiORxgWqAc1G4mV1w7v3d28';
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------- INTERFACES ----------------------
interface ChapterEntry {
  id: number;
  topic: string;
  subtopic: string;
  chaptertitle: string;
  chapter: string;
  lines: number;
  knowledge_id: number;
  k_id: number;
}

interface ChapterContent {
  title: string;
  startLine: number;
  content: string;
}

interface Subtopic {
  title: string;
  startLine: number;
  chapters: ChapterContent[];
}

interface Textbook {
  topic: string;
  knowledge_id: number;
  subtopics: Subtopic[];
}

interface Pattern {
  word: string;
  regex: RegExp;
  count: number;
}

// ---------------------- Markdown Analysis Functions ----------------------
function analyzeMarkdown(
  mdContent: string,
  knowledgeId: string | number,
  knowledgeName: string = 'Unknown'
): { textbook: Textbook; patterns: Pattern[] } {
  const lines = mdContent.split('\n');
  const headingRegex = /^(#{1,6})\s+(.*)/; // Matches markdown headings
  const patterns: Record<string, number> = {};

  const textbook: Textbook = {
    topic: knowledgeName,
    knowledge_id: Number(knowledgeId),
    subtopics: [],
  };

  let currentSubtopic: Subtopic | null = null;
  let currentChapter: { title: string; startLine: number; content?: string } | null = null;

  // Utility to finalize a chapter
  const finalizeChapter = (subtopic: Subtopic, chapter: typeof currentChapter, endLine: number) => {
    if (chapter) {
      const content = lines.slice(chapter.startLine, endLine).join('\n').trim();
      if (content) {
        subtopic.chapters.push({
          title: chapter.title,
          startLine: chapter.startLine,
          content,
        });
      }
    }
  };

  // Utility to finalize a subtopic
  const finalizeSubtopic = (subtopic: Subtopic | null, endLine: number) => {
    if (subtopic) {
      if (currentChapter) {
        finalizeChapter(subtopic, currentChapter, endLine);
        currentChapter = null;
      }
      // If there is any leftover content after the last heading, add it as "Notes"
      const leftoverContent = lines.slice(subtopic.startLine, endLine).join('\n').trim();
      if (leftoverContent) {
        subtopic.chapters.push({
          title: "Notes",
          startLine: subtopic.startLine,
          content: leftoverContent,
        });
      }
      if (subtopic.chapters.length > 0) {
        textbook.subtopics.push({ ...subtopic });
      }
    }
  };

  // Process each line to detect headings and fill pattern counts
  lines.forEach((line, index) => {
    const headingMatch = line.match(headingRegex);
    const lineNumber = index + 1;
    if (headingMatch) {
      const [, hashes, title] = headingMatch;
      const level = hashes.length;
      const firstWord = title.split(' ')[0].toLowerCase(); // Normalize word for pattern detection
      patterns[firstWord] = (patterns[firstWord] || 0) + 1;

      if (level === 1) {
        // Finalize any current subtopic before starting a new one
        finalizeSubtopic(currentSubtopic, lineNumber - 1);
        currentSubtopic = {
          title: title.trim(),
          startLine: lineNumber,
          chapters: [],
        };
      } else if (level === 2 && currentSubtopic) {
        finalizeChapter(currentSubtopic, currentChapter, lineNumber - 1);
        currentChapter = {
          title: title.trim(),
          startLine: lineNumber,
        };
      }
    }
  });

  // Finalize the last active subtopic
  finalizeSubtopic(currentSubtopic, lines.length);

  // Determine frequent patterns with occurrences > 6
  const frequentPatterns: Pattern[] = Object.entries(patterns)
    .filter(([_, count]) => count > 6)
    .map(([word, count]) => ({
      word,
      regex: new RegExp(`\\b${word}\\b`, 'i'),
      count,
    }));

  return { textbook, patterns: frequentPatterns };
}

function walkTextbook(textbook: Textbook, knowledgeId: string | number): ChapterEntry[] {
  const result: ChapterEntry[] = [];
  let idCounter = 1;

  textbook.subtopics.forEach((subtopic, subtopicIndex) => {
    subtopic.chapters.forEach((chapter) => {
      result.push({
        id: idCounter++,
        topic: textbook.topic,
        subtopic: `${subtopic.title} ${subtopicIndex + 1}`,
        chaptertitle: chapter.title,
        chapter: chapter.content,
        lines: chapter.content ? chapter.content.split('\n').length : 0,
        knowledge_id: Number(knowledgeId),
        k_id: Number(knowledgeId),
      });
    });
  });

  return result;
}

// ---------------------- Database Insertion Function ----------------------
async function insertChapters(chapters: ChapterEntry[], batchSize: number = 50): Promise<void> {
  for (let i = 0; i < chapters.length; i += batchSize) {
    const batch = chapters.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('chapters_v1')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch starting at index ${i}:`, error);
      process.exit(1);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} successfully.`);
    }
  }
  console.log("All chapters inserted successfully.");
}

// ---------------------- Main Media Processing Pipeline ----------------------

async function processMedia(
  inputFilePath: string,
  outputDir: string,
  insertFlag: boolean,
  batchSize: number
) {
  if (!fs.existsSync(inputFilePath)) {
    console.error(`Error: File not found at ${inputFilePath}`);
    process.exit(1);
  }

  const ext = path.extname(inputFilePath).toLowerCase();
  let markdownContent: string = '';

  try {
    if (ext === '.pdf') {
      // Read PDF file as a buffer and extract text using pdf-parse
      const pdfBuffer = fs.readFileSync(inputFilePath);
      const pdfData = await pdf(pdfBuffer);
      markdownContent = pdfData.text;
      console.log("PDF parsed to plain text successfully.");
    } else if (ext === '.md') {
      markdownContent = fs.readFileSync(inputFilePath, 'utf-8');
      console.log("Markdown file read successfully.");
    } else {
      console.error("Unsupported file type. Only PDF and Markdown files are supported.");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Error processing the input file:", error.message);
    process.exit(1);
  }

  // Use the input file name (without extension) as the knowledge id/name.
  const knowledgeName = path.basename(inputFilePath, ext);
  const knowledgeId = knowledgeName;

  // Analyze markdown content
  const { textbook, patterns } = analyzeMarkdown(markdownContent, knowledgeId, knowledgeName);
  const chapters = walkTextbook(textbook, knowledgeId);

  // Prepare output directory.
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write out the raw markdown content (optionally, you could write the original markdown if needed)
  const markdownOutPath = path.join(outputDir, `${knowledgeName}.md`);
  fs.writeFileSync(markdownOutPath, markdownContent, 'utf-8');

  // Write the analysis result (structured JSON with textbook and patterns)
  const analysisOutPath = path.join(outputDir, `${knowledgeName}.analysis.json`);
  fs.writeFileSync(analysisOutPath, JSON.stringify({ textbook, patterns }, null, 4), 'utf-8');

  // Write the chapters in db format (the final array to be inserted)
  const dbOutPath = path.join(outputDir, `${knowledgeName}.db.json`);
  fs.writeFileSync(dbOutPath, JSON.stringify(chapters, null, 4), 'utf-8');

  console.log(`Processing complete. Analysis saved to:
    Markdown: ${markdownOutPath}
    Analysis JSON: ${analysisOutPath}
    DB JSON: ${dbOutPath}`);

  // Optionally, insert chapters into Supabase.
  if (insertFlag) {
    await insertChapters(chapters, batchSize);
  }
}

// ---------------------- Commander CLI Setup ----------------------
program
  .name('Media Processor Pipeline')
  .description('Process a media file (PDF/Markdown), generate structured content, and optionally insert into Supabase.')
  .version('1.0.0')
  .requiredOption('-i, --input <filepath>', 'Path to the input media file (PDF or Markdown)')
  .option('-o, --output <directory>', 'Output directory for processed files', './processed')
  .option('--insert', 'Insert chapters into Supabase after processing', false)
  .option('-b, --batch-size <number>', 'Batch size for database insertion (if inserting)', '50')
  .action(async (opts) => {
    const inputFilePath = path.resolve(opts.input);
    const outputDir = path.resolve(opts.output);
    const insertFlag = opts.insert;
    const batchSize = Number(opts.batchSize);
    await processMedia(inputFilePath, outputDir, insertFlag, batchSize);
  });

program.parseAsync(process.argv); 