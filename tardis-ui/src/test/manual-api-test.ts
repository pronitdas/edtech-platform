/**
 * Manual API Test - Run in browser console or as script
 * Tests real API endpoints without mocking
 */

import { createApiClient } from '../services/dynamic-api-client'
import { unifiedApiService } from '../services/unified-api-service'

// Global test results
let testResults: any[] = []

async function testEndpoint(name: string, testFn: () => Promise<any>) {
  const startTime = Date.now()
  try {
    console.log(`🧪 Testing ${name}...`)
    const result = await testFn()
    const duration = Date.now() - startTime
    
    console.log(`✅ ${name} - ${duration}ms`, result)
    testResults.push({ 
      name, 
      success: true, 
      duration, 
      data: result 
    })
    return result
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ ${name} - ${duration}ms`, error.message)
    testResults.push({ 
      name, 
      success: false, 
      duration, 
      error: error.message 
    })
    throw error
  }
}

// Test 1: Initialize API client
export async function testApiInitialization() {
  return testEndpoint('API Client Initialization', async () => {
    await unifiedApiService.initialize('http://localhost:8000')
    return { initialized: true }
  })
}

// Test 2: Health check
export async function testHealthCheck() {
  return testEndpoint('Health Check', async () => {
    return await unifiedApiService.healthCheck()
  })
}

// Test 3: Get available endpoints
export async function testGetEndpoints() {
  return testEndpoint('Get Available Endpoints', async () => {
    const endpoints = unifiedApiService.getAvailableEndpoints()
    return { count: endpoints.length, endpoints: endpoints.slice(0, 5) }
  })
}

// Test 4: Analytics dashboard
export async function testAnalyticsDashboard() {
  return testEndpoint('Analytics Dashboard', async () => {
    return await unifiedApiService.getAnalyticsDashboard()
  })
}

// Test 5: Performance stats
export async function testPerformanceStats() {
  return testEndpoint('Performance Stats', async () => {
    return await unifiedApiService.getPerformanceStats({ limit: 5 })
  })
}

// Test 6: Knowledge graph schema
export async function testKnowledgeGraphSchema() {
  return testEndpoint('Knowledge Graph Schema', async () => {
    return await unifiedApiService.getGraphSchema()
  })
}

// Test 7: Upload knowledge file
export async function testFileUpload() {
  return testEndpoint('File Upload', async () => {
    // Create a test file
    const content = 'This is a test document for API integration testing. It contains sample educational content about mathematics and science.'
    const testFile = new File([content], 'test-api-integration.txt', {
      type: 'text/plain'
    })

    return await unifiedApiService.uploadKnowledgeFiles(
      [testFile],
      'API Integration Test Knowledge Base'
    )
  })
}

// Test 8: Get knowledge files
export async function testGetKnowledgeFiles(knowledgeId: number) {
  return testEndpoint(`Get Knowledge Files (${knowledgeId})`, async () => {
    return await unifiedApiService.getKnowledgeFiles(knowledgeId)
  })
}

// Test 9: Start processing
export async function testStartProcessing(knowledgeId: number) {
  return testEndpoint(`Start Processing (${knowledgeId})`, async () => {
    return await unifiedApiService.startProcessing(knowledgeId, {
      generateContent: true,
      contentTypes: ['notes', 'summary'],
      contentLanguage: 'English'
    })
  })
}

// Test 10: Get processing status
export async function testProcessingStatus(knowledgeId: number) {
  return testEndpoint(`Processing Status (${knowledgeId})`, async () => {
    return await unifiedApiService.getProcessingStatus(knowledgeId)
  })
}

// Test 11: Generate content
export async function testGenerateContent(knowledgeId: number) {
  return testEndpoint(`Generate Content (${knowledgeId})`, async () => {
    return await unifiedApiService.generateContent(knowledgeId, {
      types: ['notes', 'summary'],
      language: 'English'
    })
  })
}

// Test 12: Get chapter data
export async function testGetChapterData(knowledgeId: number) {
  return testEndpoint(`Get Chapter Data (${knowledgeId})`, async () => {
    return await unifiedApiService.getChapterData(knowledgeId, {
      language: 'English'
    })
  })
}

// Test 13: Content analytics
export async function testContentAnalytics(knowledgeId: number) {
  return testEndpoint(`Content Analytics (${knowledgeId})`, async () => {
    return await unifiedApiService.getContentAnalytics(knowledgeId)
  })
}

// Test 14: Sync knowledge graph
export async function testSyncKnowledgeGraph(knowledgeId: number) {
  return testEndpoint(`Sync Knowledge Graph (${knowledgeId})`, async () => {
    return await unifiedApiService.syncKnowledgeGraph(knowledgeId)
  })
}

// Test 15: Get knowledge graph
export async function testGetKnowledgeGraph(knowledgeId: number) {
  return testEndpoint(`Get Knowledge Graph (${knowledgeId})`, async () => {
    return await unifiedApiService.getKnowledgeGraph(knowledgeId)
  })
}

// Run complete test suite
export async function runCompleteTestSuite() {
  console.log('🚀 Starting Complete API Integration Test Suite')
  console.log('=' + '='.repeat(60))
  
  testResults = [] // Reset results
  let knowledgeId: number | null = null

  try {
    // Phase 1: Basic tests
    console.log('\n📋 Phase 1: Basic API Tests')
    await testApiInitialization()
    await testHealthCheck()
    await testGetEndpoints()
    await testAnalyticsDashboard()
    await testPerformanceStats()
    await testKnowledgeGraphSchema()

    // Phase 2: Knowledge workflow
    console.log('\n📚 Phase 2: Knowledge Management Workflow')
    const uploadResult = await testFileUpload()
    
    if (uploadResult?.knowledge_id) {
      knowledgeId = uploadResult.knowledge_id
      console.log(`📝 Using knowledge ID: ${knowledgeId}`)

      await testGetKnowledgeFiles(knowledgeId!)
      await testStartProcessing(knowledgeId!)
      
      // Wait for processing to start
      console.log('⏳ Waiting 3 seconds for processing to begin...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      await testProcessingStatus(knowledgeId!)
      
      // Try content generation and analytics
      try {
        await testGenerateContent(knowledgeId!)
        await testGetChapterData(knowledgeId!)
        await testContentAnalytics(knowledgeId!)
      } catch (error) {
        console.log('⚠️  Content operations may require processing to complete first')
      }

      // Phase 3: Knowledge graph
      console.log('\n🕸️ Phase 3: Knowledge Graph Operations')
      try {
        await testSyncKnowledgeGraph(knowledgeId!)
        await testGetKnowledgeGraph(knowledgeId!)
      } catch (error) {
        console.log('⚠️  Knowledge graph operations may require processing completion')
      }
    }

  } catch (error) {
    console.error('💥 Test suite error:', error)
  }

  // Print summary
  console.log('\n📊 Test Results Summary')
  console.log('=' + '='.repeat(60))
  
  const passed = testResults.filter(r => r.success).length
  const failed = testResults.filter(r => !r.success).length
  const totalTime = testResults.reduce((sum, r) => sum + r.duration, 0)

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Time: ${totalTime}ms`)
  console.log(`📈 Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults
      .filter(r => !r.success)
      .forEach(r => console.log(`   ${r.name}: ${r.error}`))
  }

  console.log('\n📋 All Results:')
  testResults.forEach(r => {
    const status = r.success ? '✅' : '❌'
    console.log(`   ${status} ${r.name} (${r.duration}ms)`)
  })

  return {
    summary: { passed, failed, totalTime, successRate: (passed / testResults.length) * 100 },
    results: testResults,
    knowledgeId
  }
}

// Expose functions globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).apiTests = {
    runCompleteTestSuite,
    testApiInitialization,
    testHealthCheck,
    testGetEndpoints,
    testAnalyticsDashboard,
    testPerformanceStats,
    testKnowledgeGraphSchema,
    testFileUpload,
    testGetKnowledgeFiles,
    testStartProcessing,
    testProcessingStatus,
    testGenerateContent,
    testGetChapterData,
    testContentAnalytics,
    testSyncKnowledgeGraph,
    testGetKnowledgeGraph
  }
  
  console.log('🧪 API Tests loaded! Run apiTests.runCompleteTestSuite() to start')
}