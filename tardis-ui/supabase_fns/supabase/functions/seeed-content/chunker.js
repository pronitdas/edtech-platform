const fs = require('fs');
// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = 'https://onyibiwnfwxatadlkygz.supabase.co'
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWliaXduZnd4YXRhZGxreWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTA5NzIsImV4cCI6MjA0NzQyNjk3Mn0.fSowEy_-abbGvLM0_A17SiORxgWqAc1G4mV1w7v3d28'
// if (!supabaseKey) {
//     throw new Error('SUPABASE_KEY environment variable is required')
// }
// const supabase = createClient(supabaseUrl, supabaseKey)
const extractChapters = async (content, metadata) => {
    const { topics } = metadata;
    const { lines, titles } = topics;

    const contentLines = content.split("\n");
    const chapters = [];

    for (let i = 0; i < lines.length; i++) {
        const startLine = lines[i];
        const endLine = i < lines.length - 1 ? lines[i + 1] : contentLines.length;

        const chapterText = contentLines.slice(startLine - 1, endLine - 1).join("\n").trim();
        const chapterTitle = titles[i] || `Chapter ${i + 1}`;

        chapters.push({
            topic: "BSC Computer Science", // Update this if topics are nested in metadata
            subtopic: `Subtopic ${i + 1}`, // Customize if subtopics are available
            chaptertitle: chapterTitle,
            chaptertext: chapterText,
        });
    }
    // const { data, error } = await supabase
    //     .from('chapters')
    //     .insert(chapters)
    //     .select()
    return chapters;
};

function analyzeMarkdown(mdContent) {
    const analysis = {
        chapters: { count: 0, lines: [], titles: [], spans: [] },
        topics: { count: 0, lines: [], titles: [], spans: [] },
        subtopics: { count: 0, lines: [], titles: [], spans: [] },
    };

    const lines = mdContent.split('\n');
    const headings = []; // To track all headings with their line numbers

    // Parse the Markdown and track headings
    lines.forEach((line, index) => {
        const lineNumber = index + 1; // Line numbers start at 1
        if (line.startsWith('# ')) {
            analysis.chapters.count++;
            analysis.chapters.lines.push(lineNumber);
            analysis.chapters.titles.push(line.slice(2).trim());
            headings.push({ type: 'chapter', line: lineNumber });
        } else if (line.startsWith('## ')) {
            analysis.topics.count++;
            analysis.topics.lines.push(lineNumber);
            analysis.topics.titles.push(line.slice(3).trim());
            headings.push({ type: 'topic', line: lineNumber });
        } else if (line.startsWith('### ')) {
            analysis.subtopics.count++;
            analysis.subtopics.lines.push(lineNumber);
            analysis.subtopics.titles.push(line.slice(4).trim());
            headings.push({ type: 'subtopic', line: lineNumber });
        }
    });

    // Calculate spans (number of lines for each heading)
    headings.forEach((heading, index) => {
        const endLine = index < headings.length - 1 ? headings[index + 1].line - 1 : lines.length;
        const span = endLine - heading.line + 1;

        if (heading.type === 'chapter') {
            analysis.chapters.spans.push(span);
        } else if (heading.type === 'topic') {
            analysis.topics.spans.push(span);
        } else if (heading.type === 'subtopic') {
            analysis.subtopics.spans.push(span);
        }
    });

    return analysis;
}

function parseMarkdown(mdContent) {
    const chapters = [];
    let currentChapter = null;

    const lines = mdContent.split('\n');

    lines.forEach(line => {
        if (line.startsWith('# ')) { // Chapter
            if (currentChapter) {
                chapters.push(currentChapter);
            }
            currentChapter = { title: line.slice(2).trim(), topics: [] };
        } else if (line.startsWith('## ')) { // Topic
            if (currentChapter) {
                currentChapter.topics.push({ title: line.slice(3).trim(), subtopics: [] });
            }
        } else if (line.startsWith('### ')) { // Subtopic
            if (currentChapter && currentChapter.topics.length > 0) {
                currentChapter.topics[currentChapter.topics.length - 1].subtopics.push(line.slice(4).trim());
            }
        } else { // Additional content under subtopic
            if (currentChapter && currentChapter.topics.length > 0) {
                const lastTopic = currentChapter.topics[currentChapter.topics.length - 1];
                if (lastTopic.subtopics.length > 0) {
                    const lastSubtopicIndex = lastTopic.subtopics.length - 1;
                    lastTopic.subtopics[lastSubtopicIndex] += ' ' + line.trim();
                }
            }
        }
    });
    // Push the last chapter
    if (currentChapter) {
        chapters.push(currentChapter);
    }

    return chapters;

}

const mergeChaptersIntoLarger = (content, metadata, lineRanges) => {
    const { topics } = metadata;
    const { lines, titles } = topics;
  
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
  
      if (lineCount > lineRanges.large) {
        // Finalize the buffer if it exists (merge into this large chapter)
        if (currentBuffer) {
          mergedChapters.push({
            topic: "General Topic",
            subtopic: `Merged Subtopic ${mergedChapters.length + 1}`,
            chaptertitle: `${currentTitleBuffer} / ${chapterTitle}`,
            chaptertext: `${currentBuffer.trim()}\n\n${chapterText}`,
            lines: currentLineCount + lineCount,
          });
          currentBuffer = ""; // Reset the buffer
          currentTitleBuffer = "";
          currentLineCount = 0;
        } else {
          // If no buffer, add this large chapter directly
          mergedChapters.push({
            topic: "General Topic",
            subtopic: `Subtopic ${mergedChapters.length + 1}`,
            chaptertitle: chapterTitle,
            chaptertext: chapterText,
            lines: lineCount,
          });
        }
      } else {
        // Accumulate small/medium chapters into the buffer
        currentBuffer += `${chapterText}\n\n`;
        currentTitleBuffer += `${chapterTitle} / `;
        currentLineCount += lineCount;
      }
    }
  
    // Add any remaining buffer as a new chapter
    if (currentBuffer.trim()) {
      mergedChapters.push({
        topic: "General Topic",
        subtopic: `Merged Subtopic ${mergedChapters.length + 1}`,
        chaptertitle: currentTitleBuffer.replace(/ \/ $/, ""), // Remove trailing slash
        chaptertext: currentBuffer.trim(),
        lines: currentLineCount,
      });
    }
  
    return mergedChapters;
  };
const lineRanges = {
    small: 1,   // Chapters with 10 lines or less
    medium: 4,  // Chapters with 11 to 50 lines
    large: 10, // Chapters with more than 50 lines
};

// Read Markdown content from file
const markdownFile = '/home/pronit/workspace/tardis/templateoftemplates/edtech-platform/tardis-ui/supabase_fns/supabase/functions/seeed-content/test.json';
fs.readFile(markdownFile, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    const jsondata = JSON.parse(data)
    const structuredContent = analyzeMarkdown(jsondata.markdown);
    const chapters = await extractChapters(jsondata.markdown, structuredContent);
    const groupChapter = mergeChaptersIntoLarger(jsondata.markdown, structuredContent, lineRanges)
    // Log the structured content
    console.log(JSON.stringify(groupChapter, null, 2));

    // Save the output as a JSON file (optional)
    fs.writeFile('structured_content.json', JSON.stringify(groupChapter, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Structured content saved as structured_content.json');
        }
    });
});
