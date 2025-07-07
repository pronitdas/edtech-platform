/**
 * Unified API Service
 * Provides a single interface for all API operations using the dynamic client
 */

import { createApiClient, DynamicApiClient } from './dynamic-api-client'

export class UnifiedApiService {
  private static instance: UnifiedApiService
  private client: DynamicApiClient | null = null
  private initPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): UnifiedApiService {
    if (!UnifiedApiService.instance) {
      UnifiedApiService.instance = new UnifiedApiService()
    }
    return UnifiedApiService.instance
  }

  async initialize(baseUrl?: string): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.doInitialize(baseUrl)
    return this.initPromise
  }

  private async doInitialize(baseUrl?: string): Promise<void> {
    try {
      this.client = await createApiClient(baseUrl)
      console.log('✅ Unified API Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Unified API Service:', error)
      throw error
    }
  }

  getClient(): DynamicApiClient | null {
    return this.client
  }

  setAuthToken(token: string): void {
    if (this.client) {
      this.client.setAuthToken(token)
    }
  }

  clearAuth(): void {
    if (this.client) {
      this.client.clearAuth()
    }
  }

  // Authentication methods
  async login(flowId: string) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).loginUserAuthLoginPost({ flow_id: flowId })
  }

  async register(flowId: string) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).registerUserAuthRegisterPost({ flow_id: flowId })
  }

  // Knowledge management methods
  async uploadKnowledgeFiles(files: File[], knowledgeName: string) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).uploadKnowledgeFileUploadKnowledgeFilePost({
      files,
      knowledge_name: knowledgeName
    })
  }

  async getKnowledgeFiles(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getKnowledgeFilesKnowledgeKnowledgeIdFilesGet({
      knowledge_id: knowledgeId
    })
  }

  async startProcessing(knowledgeId: number, options: {
    generateContent?: boolean
    contentTypes?: string[]
    contentLanguage?: string
  } = {}) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).startProcessingProcessKnowledgeIdGet({
      knowledge_id: knowledgeId,
      generate_content: options.generateContent ?? true,
      content_types: options.contentTypes ?? ['notes', 'summary', 'quiz'],
      content_language: options.contentLanguage ?? 'English'
    })
  }

  async getProcessingStatus(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getProcessingStatusProcessKnowledgeIdStatusGet({
      knowledge_id: knowledgeId
    })
  }

  async retryProcessing(knowledgeId: number, reason: string = 'Manual retry') {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).retryProcessingProcessKnowledgeIdRetryPost({
      knowledge_id: knowledgeId,
      body: { reason }
    })
  }

  async getRetryHistory(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getRetryHistoryProcessKnowledgeIdRetryHistoryGet({
      knowledge_id: knowledgeId
    })
  }

  // Content generation methods
  async generateContent(knowledgeId: number, options: {
    chapterId?: string
    types: string[]
    language?: string
  }) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).generateContentGenerateContentKnowledgeIdGet({
      knowledge_id: knowledgeId,
      chapter_id: options.chapterId,
      types: options.types,
      language: options.language ?? 'English'
    })
  }

  async getChapterData(knowledgeId: number, options: {
    chapterId?: string
    types?: string[]
    language?: string
  } = {}) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getChapterDataChaptersKnowledgeIdGet({
      knowledge_id: knowledgeId,
      chapter_id: options.chapterId,
      types: options.types,
      language: options.language ?? 'English'
    })
  }

  // Analytics methods
  async getAnalyticsDashboard() {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getAnalyticsDashboardAnalyticsDashboardGet()
  }

  async getContentAnalytics(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getContentAnalyticsAnalyticsContentKnowledgeIdGet({
      knowledge_id: knowledgeId
    })
  }

  async getEngagementMetrics(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getEngagementMetricsAnalyticsEngagementKnowledgeIdGet({
      knowledge_id: knowledgeId
    })
  }

  async getPerformanceStats(options: {
    operationType?: string
    limit?: number
  } = {}) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getPerformanceStatsAnalyticsPerformanceGet({
      operation_type: options.operationType,
      limit: options.limit ?? 100
    })
  }

  // Knowledge graph methods
  async syncKnowledgeGraph(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).syncKnowledgeGraphKnowledgeGraphKnowledgeIdSyncPost({
      knowledge_id: knowledgeId
    })
  }

  async syncAllKnowledgeGraphs() {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).syncAllKnowledgeGraphsKnowledgeGraphSyncAllPost()
  }

  async getKnowledgeGraph(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getKnowledgeGraphKnowledgeGraphKnowledgeIdGet({
      knowledge_id: knowledgeId
    })
  }

  async deleteKnowledgeFromGraph(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).deleteKnowledgeFromGraphKnowledgeGraphKnowledgeIdDelete({
      knowledge_id: knowledgeId
    })
  }

  async getKnowledgeConcepts(knowledgeId: number) {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getKnowledgeConceptsKnowledgeGraphKnowledgeIdConceptsGet({
      knowledge_id: knowledgeId
    })
  }

  async getGraphSchema() {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).getGraphSchemaKnowledgeGraphSchemaGet()
  }

  // Health check
  async healthCheck() {
    if (!this.client) throw new Error('API client not initialized')
    return await (this.client as any).healthCheckHealthGet()
  }

  // Utility methods
  getAvailableEndpoints() {
    if (!this.client) return []
    return this.client.getAvailableEndpoints()
  }

  getEndpointDoc(methodName: string) {
    if (!this.client) return null
    return this.client.getEndpointDoc(methodName)
  }
}

// Export singleton instance
export const unifiedApiService = UnifiedApiService.getInstance()

// Export convenience methods
export const initializeApiService = (baseUrl?: string) => unifiedApiService.initialize(baseUrl)
export const getApiClient = () => unifiedApiService.getClient()
export const setApiAuthToken = (token: string) => unifiedApiService.setAuthToken(token)
export const clearApiAuth = () => unifiedApiService.clearAuth()