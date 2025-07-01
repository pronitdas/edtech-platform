export const cleanMarkdown = (markdownContent: string): string => {
  return markdownContent
    .split('\n') // Split the content into lines
    .map((line: string) => line.trimEnd()) // Trim trailing spaces from each line
    .filter((line: string, index: number, array: string[]) => !(line === '' && array[index - 1] === '')) // Remove consecutive blank lines
    .join('\n') // Join lines back into a single string
}

export const analyzeMarkdown = (mdContent: string) => {
  const analysis = {
    chapters: { count: 0, lines: [] as number[], titles: [] as string[], spans: [] as number[] },
    topics: { count: 0, lines: [] as number[], titles: [] as string[], spans: [] as number[] },
    subtopics: { count: 0, lines: [] as number[], titles: [] as string[], spans: [] as number[] },
  }

  const lines = mdContent.split('\n')
  const headings: Array<{ type: string; line: number }> = [] // To track all headings with their line numbers

  // Parse the Markdown and track headings
  lines.forEach((line: string, index: number) => {
    const lineNumber = index + 1 // Line numbers start at 1
    if (line.startsWith('#### ')) {
      analysis.chapters.count++
      analysis.chapters.lines.push(lineNumber)
      analysis.chapters.titles.push(line.slice(2).trim())
      headings.push({ type: 'chapter', line: lineNumber })
    } else if (line.startsWith('# ') || line.startsWith('## ')) {
      analysis.topics.count++
      analysis.topics.lines.push(lineNumber)
      analysis.topics.titles.push(line.slice(3).trim())
      headings.push({ type: 'topic', line: lineNumber })
    } else if (line.startsWith('###')) {
      analysis.subtopics.count++
      analysis.subtopics.lines.push(lineNumber)
      analysis.subtopics.titles.push(line.slice(4).trim())
      headings.push({ type: 'subtopic', line: lineNumber })
    }
  })

  // Calculate spans (number of lines for each heading)
  headings.forEach((heading, index) => {
    const endLine =
      index < headings.length - 1 ? (headings[index + 1]?.line ?? lines.length) - 1 : lines.length
    const span = endLine - heading.line + 1

    if (heading.type === 'chapter') {
      analysis.chapters.spans.push(span)
    } else if (heading.type === 'topic') {
      analysis.topics.spans.push(span)
    } else if (heading.type === 'subtopic') {
      analysis.subtopics.spans.push(span)
    }
  })

  return analysis
}
export const processMarkdown = (markdown: string, images: any[]) => {
  const lines = markdown.split('\n') // Split markdown into lines
  const updatedLines = lines.map((line: string) => {
    const image = images.find((img: any) => img.filename === line.trim())
    if (image) {
      // Replace line with proper Markdown image syntax
      return `![${image.filename}](${image.filename})`
    }
    return line // Leave the line unchanged if no match is found
  })
  return updatedLines.join('\n') // Recombine lines into markdown
}
