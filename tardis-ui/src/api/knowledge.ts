import { normalizeVideoMetadata } from '@/utils/contentHelpers';
import supabase from '@/services/supabase';
import { Knowledge, VideoMetadata } from '@/types/database';

/**
 * Fetches video content with all metadata
 */
export async function fetchVideoContent(id: number): Promise<VideoMetadata> {
  try {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*, chapters_v1(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    const knowledgeData = data as Knowledge;
    
    // Check if video content
    if (!knowledgeData.video_url) {
      throw new Error('Not video content');
    }
    
    // Parse JSON fields if needed
    try {
      if (typeof knowledgeData.target_audience === 'string') {
        knowledgeData.target_audience = JSON.parse(knowledgeData.target_audience);
      }
      if (typeof knowledgeData.prerequisites === 'string') {
        knowledgeData.prerequisites = JSON.parse(knowledgeData.prerequisites);
      }
      if (typeof knowledgeData.metadata === 'string') {
        knowledgeData.metadata = JSON.parse(knowledgeData.metadata);
      }
    } catch (e) {
      console.warn('Error parsing JSON fields', e);
    }
    
    return normalizeVideoMetadata(knowledgeData);
  } catch (error) {
    console.error('Error fetching video content:', error);
    throw error;
  }
} 