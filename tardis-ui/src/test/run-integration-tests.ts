#!/usr/bin/env node

/**
 * Integration Test Runner
 * Run this script to test all API endpoints with the real backend
 */

import { runApiIntegrationTests } from './api-integration-test'

async function main() {
  console.log('🚀 Starting API Integration Tests')
  console.log('Backend URL: http://localhost:8000')
  console.log('Time:', new Date().toISOString())
  console.log('='.repeat(60))

  try {
    const results = await runApiIntegrationTests()
    
    // Write results to file
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `integration-test-results-${timestamp}.json`
    const filepath = path.join(process.cwd(), 'test-results', filename)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    
    // Write results
    const summary = {
      timestamp: new Date().toISOString(),
      backend_url: 'http://localhost:8000',
      total_tests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      success_rate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`,
      total_duration: `${results.reduce((sum, r) => sum + r.duration, 0)}ms`,
      results: results
    }
    
    await fs.writeFile(filepath, JSON.stringify(summary, null, 2))
    console.log(`\n📝 Results saved to: ${filepath}`)
    
    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success)
    process.exit(hasFailures ? 1 : 0)
    
  } catch (error) {
    console.error('💥 Integration tests failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as runIntegrationTests }