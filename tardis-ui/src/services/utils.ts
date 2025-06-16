// utils.ts
export function extractSubheadings(markdown: string, level = 2): string[] {
  const regex = new RegExp(`^#{${level}}\\s+(.*)`, 'gm')
  const subheadings = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    subheadings.push(match[1].trim())
  }

  if (subheadings.length === 0 && level < 5) {
    return extractSubheadings(markdown, level + 1)
  }

  return subheadings
}

export function windowedChunk<T>(array: T[], size: number, overlap = 0): T[][] {
  if (size <= overlap) {
    throw new Error('Size must be greater than overlap.')
  }

  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size - overlap) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/([*_~`]|#+\s*|>|\[|\]\(.*?\)|!\[.*?\]\(.*?\))/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
