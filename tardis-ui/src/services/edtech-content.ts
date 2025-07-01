import { apiClient } from './api-client'
import { Chapter, QuizQuestion, User } from '../types/api'
import { knowledgeService } from './knowledge'
import { roleplayService } from './roleplay'

interface MindMapStructure {
  nodes: Array<{
    id: string
    type?: 'input' | 'default' | 'output'
    data: { label: string }
  }>
  edges: Array<{
    id: string
    source: string
    target: string
  }>
}

interface ChapterUpdate {
  notes?: string
  summary?: string
  quiz?: QuizQuestion[]
  mindmap?: MindMapStructure
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
export const getEdTechContent = async (
  chapter: { knowledge_id: number; id: number },
  _language = 'English'
) => {
  try {
    const content = await contentService.getChapter(
      chapter.knowledge_id,
      chapter.id.toString()
    )
    return [content] // Maintain legacy array format
  } catch (error) {
    // Error getting EdTech content
    return []
  }
}

export const getChapterMetaDataByLanguage = async (
  knowledgeId: number,
  _language: string
) => {
  try {
    return await contentService.getChapters(knowledgeId)
  } catch (error) {
    // Error getting chapter metadata
    return []
  }
}

export const getChapters = async (knowledgeId: number, _language: string) => {
  try {
    return await contentService.getChapters(knowledgeId)
  } catch (error) {
    // Error getting chapters
    return []
  }
}

export const updateEdtechContent = async (
  updateObject: ChapterUpdate,
  edtechId: string,
  chapterId: string,
  knowledgeId: number,
  _language = 'English'
) => {
  try {
    return await contentService.updateChapter(
      knowledgeId,
      chapterId,
      updateObject
    )
  } catch (error) {
    // Error updating EdTech content
    return null
  }
}

export const getKnowledge = async () => {
  try {
    return await knowledgeService.getKnowledgeList()
  } catch (error) {
    // Error getting knowledge
    return []
  }
}

export const getKnowledgeMeta = async (id: number) => {
  try {
    const knowledge = await knowledgeService.getKnowledge(id)
    return [{ id: knowledge.id, name: knowledge.name }]
  } catch (error) {
    // Error getting knowledge meta
    return []
  }
}

export const getRoleplayData = async (knowledgeId: number) => {
  try {
    const scenarios = await roleplayService.getScenarios(knowledgeId)
    return scenarios
  } catch (error) {
    // Error getting roleplay data
    return null
  }
}

export const generateRoleplayScenarios = async (
  knowledgeId: number,
  topic: string,
  content: string,
  _apiKey: string,
  language: string = 'English'
) => {
  try {
    const response = await roleplayService.generateScenario({
      knowledge_id: knowledgeId,
      topic,
      content,
      language,
    })
    return response
  } catch (error) {
    // Error generating roleplay scenarios
    return null
  }
}

// Legacy functions for compatibility
export const insertKnowledge = async (
  _name: string,
  _user: User,
  _fileName: string
) => {
  // insertKnowledge is deprecated, use knowledgeService.uploadFiles instead
  return { id: Date.now() } // Mock response
}

export const uploadFiles = async (
  _files: File[],
  _knowledge_id: number,
  _fileType: string
) => {
  // uploadFiles is deprecated, use knowledgeService.uploadFiles instead
  return [] // Mock response
}
