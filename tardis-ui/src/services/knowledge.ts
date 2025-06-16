import { apiClient } from './api-client'
import { Knowledge } from '../types/api'

interface UploadOptions {
  auto_process?: boolean
  generate_content?: boolean
  content_types?: string[]
  content_language?: string
}

export class KnowledgeService {
  async uploadFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<{ knowledge_id: number; ws_channel: string }> {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(
          key,
          Array.isArray(value) ? JSON.stringify(value) : String(value)
        )
      }
    })

    return apiClient.upload('/knowledge', formData)
  }

  async getKnowledgeList(): Promise<Knowledge[]> {
    return apiClient.get<Knowledge[]>('/knowledge')
  }

  async getKnowledge(id: number): Promise<Knowledge> {
    return apiClient.get<Knowledge>(`/knowledge/${id}`)
  }

  async deleteKnowledge(id: number): Promise<void> {
    return apiClient.delete(`/knowledge/${id}`)
  }

  createStatusWebSocket(knowledgeId: number): WebSocket {
    return apiClient.createWebSocket(`/knowledge/${knowledgeId}/status`)
  }
}

export const knowledgeService = new KnowledgeService()
