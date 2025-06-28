import { apiClient } from './api-client'
import { Chapter } from '../types/api'
import { knowledgeService } from './knowledge'
import { roleplayService } from './roleplay'

interface ChapterUpdate {
  notes?: string
  summary?: string
  quiz?: any
  mindmap?: any
}

export class ContentService {
  async getChapters(knowledgeId: number): Promise<Chapter[]> {
    return apiClient.get<Chapter[]>(`/v2/chapters/${knowledgeId}`)
  }

  async getChapter(knowledgeId: number, chapterId: string): Promise<Chapter> {
    return apiClient.get<Chapter>(`/v2/chapters/${knowledgeId}/${chapterId}`)
  }

  async updateChapter(
    knowledgeId: number,
    chapterId: string,
    updates: ChapterUpdate
  ): Promise<Chapter> {
    return apiClient.put<Chapter>(
      `/v2/chapters/${knowledgeId}/${chapterId}`,
      updates
    )
  }

  async generateContent(knowledgeId: number): Promise<void> {
    return apiClient.post(`/v2/content/generate/${knowledgeId}`)
  }
}

export const contentService = new ContentService()

// Legacy function replacements that now use the new API
export const getEdTechContent = async (chapter: any, language = 'English') => {
  try {
    const content = await contentService.getChapter(
      chapter.knowledge_id,
      chapter.id.toString()
    )
    return [content] // Maintain legacy array format
  } catch (error) {
    console.error('Error getting EdTech content:', error)
    return []
  }
}

export const getChapterMetaDataByLanguage = async (
  knowledgeId: number,
  language: string
) => {
  try {
    return await contentService.getChapters(knowledgeId)
  } catch (error) {
    console.error('Error getting chapter metadata:', error)
    return []
  }
}

export const getChapters = async (knowledgeId: number, language: string) => {
  try {
    return await contentService.getChapters(knowledgeId)
  } catch (error) {
    console.error('Error getting chapters:', error)
    return []
  }
}

export const updateEdtechContent = async (
  updateObject: ChapterUpdate,
  edtechId: string,
  chapterId: string,
  knowledgeId: number,
  language = 'English'
) => {
  try {
    return await contentService.updateChapter(
      knowledgeId,
      chapterId,
      updateObject
    )
  } catch (error) {
    console.error('Error updating EdTech content:', error)
    return null
  }
}

export const getKnowledge = async () => {
  try {
    return await knowledgeService.getKnowledgeList()
  } catch (error) {
    console.error('Error getting knowledge:', error)
    return []
  }
}

export const getKnowledgeMeta = async (id: number) => {
  try {
    const knowledge = await knowledgeService.getKnowledge(id)
    return [{ id: knowledge.id, name: knowledge.name }]
  } catch (error) {
    console.error('Error getting knowledge meta:', error)
    return []
  }
}

export const getRoleplayData = async (knowledgeId: number) => {
  try {
    const scenarios = await roleplayService.getScenarios(knowledgeId)
    return scenarios
  } catch (error) {
    console.error('Error getting roleplay data:', error)
    return null
  }
}

export const generateRoleplayScenarios = async (
  knowledgeId: number,
  topic: string,
  content: string,
  apiKey: string,
  language: string = 'English'
) => {
  try {
    const response = await roleplayService.generateScenario({
      knowledge_id: knowledgeId,
      topic,
      content,
      language
    })
    return response
  } catch (error) {
    console.error('Error generating roleplay scenarios:', error)
    return null
  }
}

// Legacy functions for compatibility
export const insertKnowledge = async (name: string, user: any, fileName: string) => {
  console.warn('insertKnowledge is deprecated, use knowledgeService.uploadFiles instead')
  return { id: Date.now() } // Mock response
}

export const uploadFiles = async (files: File[], knowledge_id: number, fileType: string) => {
  console.warn('uploadFiles is deprecated, use knowledgeService.uploadFiles instead')
  return [] // Mock response
}
