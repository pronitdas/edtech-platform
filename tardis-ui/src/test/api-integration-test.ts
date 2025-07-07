/**
 * API Integration Test Suite
 * Tests all API endpoints with real backend (no mocking)
 */

import { createApiClient, DynamicApiClient } from '../services/dynamic-api-client'
import { unifiedApiService } from '../services/unified-api-service'

interface TestResult {
  endpoint: string
  method: string
  success: boolean
  data?: any
  error?: string
  duration: number
}

export class ApiIntegrationTester {
  private client: DynamicApiClient | null = null
  private results: TestResult[] = []

  async initialize(): Promise<void> {
    console.log('🚀 Initializing API Integration Tests...')
    try {
      this.client = await createApiClient('http://localhost:8000')
      await unifiedApiService.initialize('http://localhost:8000')
      console.log('✅ API client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize API client:', error)
      throw error
    }
  }

  private async testEndpoint(
    name: string,
    method: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now()
    let result: TestResult

    try {
      console.log(`Testing ${method} ${name}...`)
      const data = await testFn()
      const duration = Date.now() - startTime

      result = {
        endpoint: name,
        method,
        success: true,
        data,
        duration
      }
      console.log(`✅ ${method} ${name} - ${duration}ms`)
    } catch (error: any) {
      const duration = Date.now() - startTime
      result = {
        endpoint: name,
        method,
        success: false,
        error: error.message,
        duration
      }
      console.log(`❌ ${method} ${name} - ${error.message} (${duration}ms)`)
    }

    this.results.push(result)
    return result
  }

  // Test 1: Health Check
  async testHealthCheck(): Promise<TestResult> {
    return this.testEndpoint('health', 'GET', async () => {
      return await unifiedApiService.healthCheck()
    })
  }

  // Test 2: Get Available Endpoints
  async testGetEndpoints(): Promise<TestResult> {
    return this.testEndpoint('endpoints', 'GET', async () => {
      return unifiedApiService.getAvailableEndpoints()
    })
  }

  // Test 3: Analytics Dashboard
  async testAnalyticsDashboard(): Promise<TestResult> {
    return this.testEndpoint('analytics/dashboard', 'GET', async () => {
      return await unifiedApiService.getAnalyticsDashboard()
    })
  }

  // Test 4: Performance Stats
  async testPerformanceStats(): Promise<TestResult> {
    return this.testEndpoint('analytics/performance', 'GET', async () => {
      return await unifiedApiService.getPerformanceStats({
        limit: 10
      })
    })
  }

  // Test 5: Knowledge Graph Schema
  async testKnowledgeGraphSchema(): Promise<TestResult> {
    return this.testEndpoint('knowledge-graph/schema', 'GET', async () => {
      return await unifiedApiService.getGraphSchema()
    })
  }

  // Test 6: Upload Knowledge Files (with real file)
  async testUploadKnowledgeFiles(): Promise<TestResult> {
    return this.testEndpoint('upload-knowledge-file', 'POST', async () => {
      // Create a test PDF file
      const testContent = 'This is a test PDF content for integration testing.'
      const testFile = new File([testContent], 'test-integration.pdf', {
        type: 'application/pdf'
      })

      return await unifiedApiService.uploadKnowledgeFiles(
        [testFile],
        'Integration Test Knowledge Base'
      )
    })
  }

  // Test 7: Process Knowledge (using uploaded knowledge)
  async testProcessKnowledge(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`process/${knowledgeId}`, 'GET', async () => {
      return await unifiedApiService.startProcessing(knowledgeId, {
        generateContent: true,
        contentTypes: ['notes', 'summary'],
        contentLanguage: 'English'
      })
    })
  }

  // Test 8: Get Processing Status
  async testProcessingStatus(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`process/${knowledgeId}/status`, 'GET', async () => {
      return await unifiedApiService.getProcessingStatus(knowledgeId)
    })
  }

  // Test 9: Get Knowledge Files
  async testGetKnowledgeFiles(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`knowledge/${knowledgeId}/files`, 'GET', async () => {
      return await unifiedApiService.getKnowledgeFiles(knowledgeId)
    })
  }

  // Test 10: Generate Content
  async testGenerateContent(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`generate-content/${knowledgeId}`, 'GET', async () => {
      return await unifiedApiService.generateContent(knowledgeId, {
        types: ['notes', 'summary'],
        language: 'English'
      })
    })
  }

  // Test 11: Get Chapter Data
  async testGetChapterData(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`chapters/${knowledgeId}`, 'GET', async () => {
      return await unifiedApiService.getChapterData(knowledgeId, {
        language: 'English'
      })
    })
  }

  // Test 12: Sync Knowledge Graph
  async testSyncKnowledgeGraph(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`knowledge-graph/${knowledgeId}/sync`, 'POST', async () => {
      return await unifiedApiService.syncKnowledgeGraph(knowledgeId)
    })
  }

  // Test 13: Get Knowledge Graph
  async testGetKnowledgeGraph(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`knowledge-graph/${knowledgeId}`, 'GET', async () => {
      return await unifiedApiService.getKnowledgeGraph(knowledgeId)
    })
  }

  // Test 14: Content Analytics
  async testContentAnalytics(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`analytics/content/${knowledgeId}`, 'GET', async () => {
      return await unifiedApiService.getContentAnalytics(knowledgeId)
    })
  }

  // Test 15: Engagement Metrics
  async testEngagementMetrics(knowledgeId: number): Promise<TestResult> {
    return this.testEndpoint(`analytics/engagement/${knowledgeId}`, 'GET', async () => {
      return await unifiedApiService.getEngagementMetrics(knowledgeId)
    })
  }

  // Run full test suite
  async runFullTestSuite(): Promise<TestResult[]> {
    console.log('🧪 Starting Full API Integration Test Suite')
    console.log('=' * 50)

    // Clear previous results
    this.results = []
    let knowledgeId: number | null = null

    try {
      // Phase 1: Basic connectivity tests
      console.log('\n📋 Phase 1: Basic Connectivity Tests')
      await this.testHealthCheck()
      await this.testGetEndpoints()
      await this.testAnalyticsDashboard()
      await this.testPerformanceStats()
      await this.testKnowledgeGraphSchema()

      // Phase 2: Knowledge management workflow
      console.log('\n📚 Phase 2: Knowledge Management Workflow')
      const uploadResult = await this.testUploadKnowledgeFiles()
      
      if (uploadResult.success && uploadResult.data?.knowledge_id) {
        knowledgeId = uploadResult.data.knowledge_id
        console.log(`📝 Using knowledge ID: ${knowledgeId} for subsequent tests`)

        await this.testGetKnowledgeFiles(knowledgeId)
        await this.testProcessKnowledge(knowledgeId)
        
        // Wait a bit for processing to start
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        await this.testProcessingStatus(knowledgeId)
        await this.testGenerateContent(knowledgeId)
        await this.testGetChapterData(knowledgeId)

        // Phase 3: Knowledge graph operations
        console.log('\n🕸️ Phase 3: Knowledge Graph Operations')
        await this.testSyncKnowledgeGraph(knowledgeId)
        await this.testGetKnowledgeGraph(knowledgeId)

        // Phase 4: Analytics and metrics
        console.log('\n📊 Phase 4: Analytics and Metrics')
        await this.testContentAnalytics(knowledgeId)
        await this.testEngagementMetrics(knowledgeId)
      } else {
        console.log('⚠️  Skipping knowledge-dependent tests due to upload failure')
      }

    } catch (error) {
      console.error('💥 Test suite failed:', error)
    }

    // Print summary
    this.printTestSummary()
    return this.results
  }

  // Print test summary
  private printTestSummary(): void {
    console.log('\n📊 Test Results Summary')
    console.log('=' * 50)

    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total Time: ${totalTime}ms`)
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   ${r.method} ${r.endpoint}: ${r.error}`)
        })
    }

    console.log('\n📋 Detailed Results:')
    this.results.forEach(r => {
      const status = r.success ? '✅' : '❌'
      console.log(`   ${status} ${r.method} ${r.endpoint} (${r.duration}ms)`)
    })
  }

  // Get test results
  getResults(): TestResult[] {
    return this.results
  }

  // Export results to JSON
  exportResults(): string {
    return JSON.stringify({
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0)
      },
      results: this.results
    }, null, 2)
  }
}

// Export convenience function
export async function runApiIntegrationTests(): Promise<TestResult[]> {
  const tester = new ApiIntegrationTester()
  await tester.initialize()
  return await tester.runFullTestSuite()
}

// Helper function for individual endpoint testing
export async function testSingleEndpoint(
  endpointName: string,
  testFunction: () => Promise<any>
): Promise<TestResult> {
  const tester = new ApiIntegrationTester()
  await tester.initialize()
  return await tester.testEndpoint(endpointName, 'CUSTOM', testFunction)
}