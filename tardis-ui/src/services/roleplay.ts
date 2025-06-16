import { apiClient } from './api-client'
import { RoleplayScenario } from '../types/api'

interface GenerateRoleplayRequest {
  knowledge_id: number
  topic: string
  content: string
  language?: string
}

export class RoleplayService {
  async generateScenario(
    request: GenerateRoleplayRequest
  ): Promise<RoleplayScenario> {
    return apiClient.post<RoleplayScenario>('/roleplay/generate', request)
  }

  async getScenarios(knowledgeId: number): Promise<RoleplayScenario[]> {
    return apiClient.get<RoleplayScenario[]>(`/roleplay/${knowledgeId}`)
  }
}

export const roleplayService = new RoleplayService()
