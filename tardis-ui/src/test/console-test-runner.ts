/**
 * Console Test Runner for Browser
 * Run API integration tests directly in the browser console
 */

// Import our test functions
import { runCompleteTestSuite } from './manual-api-test'

// Make test functions available globally
declare global {
  interface Window {
    runApiTests: () => Promise<void>
    testResults: any[]
  }
}

// Console test runner
window.runApiTests = async () => {
  console.clear()
  console.log('🚀 Starting API Integration Tests')
  console.log('Backend: http://localhost:8000')
  console.log('Time:', new Date().toISOString())
  console.log('=' + '='.repeat(60))

  try {
    const results = await runCompleteTestSuite()
    window.testResults = results.results
    
    console.log('\n🎉 Test Suite Complete!')
    console.log('Results available in window.testResults')
    
    return results
  } catch (error) {
    console.error('💥 Test suite failed:', error)
    throw error
  }
}

// Auto-run message
console.log('🧪 API Test Runner Loaded!')
console.log('Run: window.runApiTests() to start testing')
console.log('Backend must be running on http://localhost:8000')

export { runCompleteTestSuite }