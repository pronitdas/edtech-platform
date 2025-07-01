import { Knowledge, VideoMetadata } from '@/types/api'

/**
 * Determines the appropriate content type for a knowledge entry
 */
export function getContentType(knowledge: Knowledge): string {
  // Check for explicit content type
  if (
    knowledge?.metadata &&
    typeof knowledge.metadata === 'object' &&
    'content_type' in knowledge.metadata
  ) {
    return knowledge.metadata.content_type as string
  }

  // Try to infer from available fields
  if (knowledge?.video_url) {
    return 'video'
  }

  // Check if metadata indicates this is a course with chapters
  if (
    knowledge?.metadata &&
    typeof knowledge.metadata === 'object' &&
    'has_chapters' in knowledge.metadata
  ) {
    return 'course'
  }

  // Default fallback
  return 'text'
}

/**
 * Ensures video metadata has all required fields with defaults
 */
export function normalizeVideoMetadata(knowledge: Knowledge): VideoMetadata {
  // Get description from metadata if available
  let description = ''
  if (knowledge?.metadata && typeof knowledge.metadata === 'object') {
    description =
      ((knowledge.metadata as Record<string, unknown>)
        ?.description as string) || ''
  }

  return {
    ...knowledge,
    title: knowledge?.name || 'Untitled Content',
    description,
    summary: knowledge?.summary || '',
    video_url: knowledge?.video_url || '',
    video_duration: knowledge?.video_duration || 0,
    difficulty_level: knowledge?.difficulty_level || 'Intermediate',
    target_audience:
      typeof knowledge?.target_audience === 'string'
        ? JSON.parse(knowledge.target_audience)
        : ['General audience'],
    prerequisites:
      typeof knowledge?.prerequisites === 'string'
        ? JSON.parse(knowledge.prerequisites)
        : [],
  }
}
