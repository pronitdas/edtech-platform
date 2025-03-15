import { normalizeVideoMetadata } from '@/utils/contentHelpers';

/**
 * Fetches video content with all metadata
 */
export async function fetchVideoContent(id: number) {
  try {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*, chapters_v1(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Check if video content
    if (!data.video_url) {
      throw new Error('Not video content');
    }
    
    // Parse JSON fields if needed
    try {
      if (typeof data.target_audience === 'string') {
        data.target_audience = JSON.parse(data.target_audience);
      }
      if (typeof data.prerequisites === 'string') {
        data.prerequisites = JSON.parse(data.prerequisites);
      }
      if (typeof data.metadata === 'string') {
        data.metadata = JSON.parse(data.metadata);
      }
    } catch (e) {
      console.warn('Error parsing JSON fields', e);
    }
    
    return normalizeVideoMetadata(data);
  } catch (error) {
    console.error('Error fetching video content:', error);
    throw error;
  }
} 