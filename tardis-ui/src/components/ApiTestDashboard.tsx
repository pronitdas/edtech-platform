/**
 * API Test Dashboard Component
 * Standalone component for testing APIs without Storybook dependency
 */

import React, { useState, useEffect } from 'react'
import { unifiedApiService } from '../services/unified-api-service'

interface TestResult {
  name: string
  status: 'idle' | 'running' | 'success' | 'error'
  duration?: number
  result?: any
  error?: string
}

const ApiTestDashboard: React.FC = () => {
  const [initialized, setInitialized] = useState(false)
  const [knowledgeId, setKnowledgeId] = useState<number | null>(null)
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Health Check', status: 'idle' },
    { name: 'Get Endpoints', status: 'idle' },
    { name: 'Analytics Dashboard', status: 'idle' },
    { name: 'Performance Stats', status: 'idle' },
    { name: 'Upload Knowledge File', status: 'idle' },
    { name: 'Get Knowledge Files', status: 'idle' },
    { name: 'Start Processing', status: 'idle' },
    { name: 'Processing Status', status: 'idle' },
    { name: 'Generate Content', status: 'idle' },
    { name: 'Get Chapter Data', status: 'idle' },
    { name: 'Content Analytics', status: 'idle' },
    { name: 'Sync Knowledge Graph', status: 'idle' },
    { name: 'Get Knowledge Graph', status: 'idle' }
  ])

  useEffect(() => {
    const init = async () => {
      try {
        await unifiedApiService.initialize('http://localhost:8000')
        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize:', error)
      }
    }
    init()
  }, [])

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ))
  }

  const runTest = async (testName: string) => {
    const startTime = Date.now()
    updateTest(testName, { status: 'running' })

    try {
      let result: any

      switch (testName) {
        case 'Health Check':
          result = await unifiedApiService.healthCheck()
          break

        case 'Get Endpoints':
          result = { 
            count: unifiedApiService.getAvailableEndpoints().length,
            endpoints: unifiedApiService.getAvailableEndpoints().slice(0, 5)
          }
          break

        case 'Analytics Dashboard':
          result = await unifiedApiService.getAnalyticsDashboard()
          break

        case 'Performance Stats':
          result = await unifiedApiService.getPerformanceStats({ limit: 10 })
          break

        case 'Upload Knowledge File':
          const content = `# Test Educational Content

This is a comprehensive test document for API integration testing.

## Mathematics Fundamentals

### Algebra Basics
Understanding variables, equations, and mathematical relationships.

Key concepts:
- Variables and constants
- Linear equations
- Quadratic formulas
- Function notation

### Calculus Introduction
The study of continuous change and motion.

Topics covered:
- Limits and continuity
- Derivatives and rates of change
- Integration techniques
- Applications in physics

## Learning Objectives
1. Master basic algebraic operations
2. Understand calculus fundamentals
3. Apply mathematical concepts to real problems
4. Develop problem-solving strategies

This content is designed for comprehensive testing of the knowledge processing system.`

          const testFile = new File([content], 'test-mathematics.md', { type: 'text/markdown' })
          result = await unifiedApiService.uploadKnowledgeFiles([testFile], 'API Test - Mathematics Course')
          
          if (result?.knowledge_id) {
            setKnowledgeId(result.knowledge_id)
          }
          break

        case 'Get Knowledge Files':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getKnowledgeFiles(knowledgeId)
          break

        case 'Start Processing':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.startProcessing(knowledgeId, {
            generateContent: true,
            contentTypes: ['notes', 'summary', 'quiz'],
            contentLanguage: 'English'
          })
          break

        case 'Processing Status':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getProcessingStatus(knowledgeId)
          break

        case 'Generate Content':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.generateContent(knowledgeId, {
            types: ['notes', 'summary'],
            language: 'English'
          })
          break

        case 'Get Chapter Data':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getChapterData(knowledgeId, { language: 'English' })
          break

        case 'Content Analytics':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getContentAnalytics(knowledgeId)
          break

        case 'Sync Knowledge Graph':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.syncKnowledgeGraph(knowledgeId)
          break

        case 'Get Knowledge Graph':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getKnowledgeGraph(knowledgeId)
          break

        default:
          throw new Error(`Unknown test: ${testName}`)
      }

      const duration = Date.now() - startTime
      updateTest(testName, { status: 'success', result, duration })

    } catch (error: any) {
      const duration = Date.now() - startTime
      updateTest(testName, { status: 'error', error: error.message, duration })
    }
  }

  const runAllTests = async () => {
    for (const test of tests) {
      if (test.status !== 'idle') continue
      await runTest(test.name)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const resetTests = () => {
    const resetTestsList: TestResult[] = tests.map(test => ({
      name: test.name,
      status: 'idle' as const
      // Don't set optional properties - they'll be undefined by default
    }))
    setTests(resetTestsList)
    setKnowledgeId(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '⚪'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#fbbf24'
      case 'success': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (!initialized) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <h2 style={{ color: '#1f2937', marginBottom: '8px' }}>Initializing API Client...</h2>
        <p style={{ color: '#6b7280' }}>Connecting to http://localhost:8000</p>
      </div>
    )
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const runningCount = tests.filter(t => t.status === 'running').length

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧪 Live API Integration Tests
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Real-time testing of backend APIs at http://localhost:8000
        </p>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          onClick={runAllTests}
          disabled={runningCount > 0}
          style={{
            padding: '12px 24px',
            backgroundColor: runningCount > 0 ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: runningCount > 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          {runningCount > 0 ? '🔄 Running Tests...' : '🚀 Run All Tests'}
        </button>

        <button
          onClick={resetTests}
          disabled={runningCount > 0}
          style={{
            padding: '12px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: runningCount > 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Reset
        </button>

        {knowledgeId && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #d1fae5',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong style={{ color: '#065f46' }}>Knowledge ID:</strong>
            <span style={{ color: '#047857', fontFamily: 'monospace', marginLeft: '4px' }}>
              {knowledgeId}
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{successCount}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Passed</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{errorCount}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Failed</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>{runningCount}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Running</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6b7280' }}>{tests.length}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
        </div>
      </div>

      {/* Test List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {tests.map((test, index) => (
          <div
            key={test.name}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#ffffff'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px'
              }}>
                {getStatusIcon(test.status)} {test.name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {test.duration && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {test.duration}ms
                  </span>
                )}
                <button
                  onClick={() => runTest(test.name)}
                  disabled={test.status === 'running' || runningCount > 0}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: test.status === 'running' || runningCount > 0 ? '#9ca3af' : '#f3f4f6',
                    color: test.status === 'running' || runningCount > 0 ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: test.status === 'running' || runningCount > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Run
                </button>
              </div>
            </div>

            {test.status !== 'idle' && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                border: `1px solid ${getStatusColor(test.status)}`,
                borderRadius: '4px'
              }}>
                <div style={{ 
                  color: getStatusColor(test.status), 
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginBottom: test.error || test.result ? '8px' : '0'
                }}>
                  {test.status.toUpperCase()}
                </div>

                {test.error && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    padding: '8px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}>
                    <strong>Error:</strong> {test.error}
                  </div>
                )}

                {test.result && (
                  <details style={{ fontSize: '12px' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      color: '#6b7280', 
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}>
                      View Response Data
                    </summary>
                    <pre style={{
                      backgroundColor: '#f3f4f6',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      fontSize: '11px',
                      margin: 0
                    }}>
                      {JSON.stringify(test.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}>💡 Testing Tips</h3>
        <ul style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
          <li>Tests run sequentially - some depend on previous results</li>
          <li>Knowledge ID is captured from upload for subsequent tests</li>
          <li>Check browser console for detailed API request/response logs</li>
          <li>Backend must be running on http://localhost:8000</li>
        </ul>
      </div>
    </div>
  )
}

export default ApiTestDashboard