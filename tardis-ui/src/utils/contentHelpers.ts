/**
 * Determines the appropriate content type for a knowledge entry
 */
export function getContentType(knowledge: any): string {
  // Check for explicit content type
  if (knowledge?.content_type) {
    return knowledge.content_type;
  }
  
  // Try to infer from available fields
  if (knowledge?.video_url) {
    return 'video';
  }
  
  if (knowledge?.chapters?.length > 0) {
    return 'course';
  }
  
  // Default fallback
  return 'text';
}

/**
 * Ensures video metadata has all required fields with defaults
 */
export function normalizeVideoMetadata(knowledge: any): any {
  return {
    ...knowledge,
    title: knowledge?.name || knowledge?.title || 'Untitled Content',
    description: knowledge?.description || '',
    summary: knowledge?.summary || '',
    video_url: knowledge?.video_url || '',
    video_duration: knowledge?.video_duration || 0,
    difficulty_level: knowledge?.difficulty_level || 'Intermediate',
    target_audience: Array.isArray(knowledge?.target_audience) 
      ? knowledge.target_audience 
      : ['General audience'],
    prerequisites: Array.isArray(knowledge?.prerequisites)
      ? knowledge.prerequisites
      : []
  };
} 