function extractSubheadings(markdown: string, level = 2) {
  // Create a regex for headings of the specified level (e.g., ## for level 2)
  const regex = new RegExp(`^#{${level}}\\s+(.*)`, 'gm')
  const subheadings = []
  let match

  // Iterate over all matches
  while ((match = regex.exec(markdown)) !== null) {
    subheadings.push(match[1].trim()) // Capture the subheading text
  }
  if (subheadings.length == 0 && level < 5) {
    extractSubheadings(markdown, level + 1)
  }
  return subheadings
}
export const windowedChunk = (array: any[], size: number, overlap = 0) => {
  if (size <= overlap) {
    throw new Error('Size must be greater than overlap.')
  }

  const chunks = []
  for (let i = 0; i < array.length; i += size - overlap) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const stripMarkdown = (text: string) => {
  return text
    .replace(/([*_~`]|#+\s*|>|\[|\]\(.*?\)|!\[.*?\]\(.*?\))/g, '') // remove Markdown symbols
    .replace(/\n+/g, ' ') // replace newlines with a space
    .trim()
}
// Create Task for generating 3D model
