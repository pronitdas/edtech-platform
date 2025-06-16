import { apiClient } from './api'

export interface ContentGenerationRequest {
  chapter_id?: string
  content_type: 'notes' | 'summary' | 'quiz' | 'mindmap'
  language?: string
  auto_process?: boolean
}

export interface ContentGenerationResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  websocket_channel?: string
}

export class ContentService {
  async generateContent(
    knowledgeId: string,
    request: ContentGenerationRequest
  ): Promise<ContentGenerationResponse> {
    return apiClient.request(`/v2/content/generate/${knowledgeId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getGenerationStatus(jobId: string) {
    return apiClient.request(`/v2/content/status/${jobId}`)
  }

  async updateChapterContent(
    knowledgeId: string,
    chapterId: string,
    updates: {
      content?: string
      notes?: string
      summary?: string
      quiz?: any
      mindmap?: any
      language?: string
    }
  ) {
    return apiClient.request(`/v2/chapters/${knowledgeId}/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async getChapters(knowledgeId: string) {
    return apiClient.request(`/v2/chapters/${knowledgeId}`)
  }

  async regenerateAllContent(
    knowledgeId: string,
    options?: {
      content_types?: string[]
      language?: string
      force?: boolean
    }
  ) {
    return apiClient.request(`/v2/content/regenerate/${knowledgeId}`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    })
  }
}

export const contentService = new ContentService()
export default contentService
