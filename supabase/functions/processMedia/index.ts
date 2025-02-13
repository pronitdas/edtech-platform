import { createClient } from '@supabase/supabase-js';

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

//
// Markdown Analysis Functions
//
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
  let currentChapter: { title: string; startLine: number } | null = null;

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

//
// Database Insertion Function
//
async function insertChapters(
  supabase: ReturnType<typeof createClient>,
  chapters: ChapterEntry[],
  batchSize: number = 50
): Promise<void> {
  for (let i = 0; i < chapters.length; i += batchSize) {
    const batch = chapters.slice(i, i + batchSize);
    const { error } = await supabase
      .from('chapters_v1')
      .insert(batch)
      .select();

    if (error) {
      throw new Error(`Error inserting batch starting at index ${i}: ${error.message}`);
    }
  }
}

//
// Edge Function Handler
//
export default async (req: Request, ctx: ExecutionContext): Promise<Response> => {
  try {
    // Only support POST requests.
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed, use POST" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Expecting a JSON body with { bucket, filePath, insert?, batchSize? }
    const { bucket, filePath, insert, batchSize } = await req.json();
    if (!bucket || !filePath) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: bucket and filePath" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client using environment variables.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Download the file from Supabase Storage.
    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucket)
      .download(filePath);
    if (fileError || !fileData) {
      return new Response(
        JSON.stringify({ error: `Error downloading file: ${fileError?.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine file extension.
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    let markdownContent: string = '';

    if (ext === 'pdf') {
      // For PDF files, extract text using pdfjs-dist.
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const { getDocument } = await import("https://esm.sh/pdfjs-dist@3.9.179/build/pdf.js");
      const loadingTask = getDocument({ data: uint8Array });
      const pdfDoc = await loadingTask.promise;
      let extractedText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        extractedText += pageText + "\n";
      }
      markdownContent = extractedText;
    } else if (ext === 'md') {
      // For Markdown files, simply read the text.
      markdownContent = await fileData.text();
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported file type. Only PDF and Markdown files are supported." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Infer the knowledge name/id from the file name.
    const baseName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, "") || "unknown";
    const knowledgeName = baseName;
    const knowledgeId = baseName;

    // Process the markdown content.
    const { textbook, patterns } = analyzeMarkdown(markdownContent, knowledgeId, knowledgeName);
    const chapters = walkTextbook(textbook, knowledgeId);

    // Optionally, if the insert flag is provided, insert the chapters into Supabase.
    let insertMessage = "";
    if (insert) {
      await insertChapters(supabase, chapters, batchSize ? Number(batchSize) : 50);
      insertMessage = "Chapters inserted into Supabase table.";
    }

    // Return a JSON response with the analysis results.
    const responseBody = {
      markdownContent,
      analysis: { textbook, patterns },
      chapters,
      insertMessage,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}; 