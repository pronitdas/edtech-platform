/**
 * API Integration Stories for Storybook
 * Real API testing without mocking - shows live backend interaction
 */

import type { Meta, StoryObj } from '@storybook/react'
import React, { useState, useEffect } from 'react'
import { unifiedApiService } from '../services/unified-api-service'

// API Test Component
const ApiTestComponent: React.FC<{ 
  title: string
  description: string
  testFunction: () => Promise<any>
  dependencies?: string[]
}> = ({ title, description, testFunction, dependencies }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)

  const runTest = async () => {
    setStatus('loading')
    setError(null)
    const startTime = Date.now()

    try {
      const response = await testFunction()
      setResult(response)
      setStatus('success')
      setDuration(Date.now() - startTime)
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
      setDuration(Date.now() - startTime)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '⚪'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return '#fbbf24'
      case 'success': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '16px', 
      margin: '8px 0',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>
          {getStatusIcon()} {title}
        </h3>
        <button 
          onClick={runTest}
          disabled={status === 'loading'}
          style={{
            padding: '8px 16px',
            backgroundColor: status === 'loading' ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer'
          }}
        >
          {status === 'loading' ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      <p style={{ color: '#6b7280', margin: '0 0 12px 0', fontSize: '14px' }}>
        {description}
      </p>

      {dependencies && dependencies.length > 0 && (
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
          <strong>Dependencies:</strong> {dependencies.join(', ')}
        </div>
      )}

      {status !== 'idle' && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ffffff', 
          border: `1px solid ${getStatusColor()}`, 
          borderRadius: '4px',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
              {status.toUpperCase()}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {duration}ms
            </span>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <details style={{ fontSize: '12px' }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280', marginBottom: '8px' }}>
                View Response Data
              </summary>
              <pre style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '8px', 
                borderRadius: '4px', 
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '11px'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// Main API Integration Dashboard
const ApiIntegrationDashboard: React.FC = () => {
  const [initialized, setInitialized] = useState(false)
  const [knowledgeId, setKnowledgeId] = useState<number | null>(null)

  useEffect(() => {
    const initializeApi = async () => {
      try {
        await unifiedApiService.initialize('http://localhost:8000')
        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize API service:', error)
      }
    }
    initializeApi()
  }, [])

  if (!initialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🚀 Initializing API Connection...</h2>
        <p>Connecting to http://localhost:8000</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '8px' }}>🧪 Live API Integration Testing</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Real-time testing of backend APIs without mocking. Tests run against http://localhost:8000
      </p>

      <div style={{ marginBottom: '32px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Prerequisites</h3>
        <ul style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
          <li>Backend server must be running on http://localhost:8000</li>
          <li>Some tests depend on successful completion of previous tests</li>
          <li>Knowledge-specific tests require a valid knowledge ID from upload</li>
        </ul>
      </div>

      <h2 style={{ color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
        📋 Basic API Tests
      </h2>

      <ApiTestComponent
        title="Health Check"
        description="Verify backend server is running and responsive"
        testFunction={() => unifiedApiService.healthCheck()}
      />

      <ApiTestComponent
        title="Available Endpoints"
        description="Get list of all dynamically generated API endpoints"
        testFunction={() => Promise.resolve({ 
          count: unifiedApiService.getAvailableEndpoints().length,
          endpoints: unifiedApiService.getAvailableEndpoints().slice(0, 10)
        })}
      />

      <ApiTestComponent
        title="Analytics Dashboard"
        description="Fetch system analytics and performance overview"
        testFunction={() => unifiedApiService.getAnalyticsDashboard()}
      />

      <ApiTestComponent
        title="Performance Statistics"
        description="Get system performance metrics and operational stats"
        testFunction={() => unifiedApiService.getPerformanceStats({ limit: 10 })}
      />

      <h2 style={{ 
        color: '#1f2937', 
        borderBottom: '2px solid #e5e7eb', 
        paddingBottom: '8px',
        marginTop: '32px' 
      }}>
        📚 Knowledge Management Workflow
      </h2>

      <ApiTestComponent
        title="Upload Knowledge File"
        description="Upload a test file and create new knowledge entry"
        testFunction={async () => {
          const testContent = `
# Test Educational Content

This is a sample educational document for API testing.

## Introduction to Mathematics

Mathematics is the study of numbers, shapes, and patterns.

### Key Concepts:
- Numbers and operations
- Algebra and equations  
- Geometry and measurement
- Statistics and probability

## Learning Objectives

By the end of this lesson, students will be able to:
1. Understand basic mathematical concepts
2. Apply problem-solving strategies
3. Analyze mathematical relationships

This content is designed for testing the knowledge processing pipeline.
          `.trim()

          const testFile = new File([testContent], 'test-educational-content.md', {
            type: 'text/markdown'
          })

          const result = await unifiedApiService.uploadKnowledgeFiles(
            [testFile],
            'Storybook API Test - Educational Content'
          )

          // Store knowledge ID for subsequent tests
          if (result?.knowledge_id) {
            setKnowledgeId(result.knowledge_id)
          }

          return result
        }}
      />

      {knowledgeId && (
        <>
          <ApiTestComponent
            title={`Get Knowledge Files (ID: ${knowledgeId})`}
            description="Retrieve metadata for uploaded files in the knowledge entry"
            testFunction={() => unifiedApiService.getKnowledgeFiles(knowledgeId)}
            dependencies={['Upload Knowledge File']}
          />

          <ApiTestComponent
            title={`Start Processing (ID: ${knowledgeId})`}
            description="Begin content processing and generation workflow"
            testFunction={() => unifiedApiService.startProcessing(knowledgeId, {
              generateContent: true,
              contentTypes: ['notes', 'summary', 'quiz'],
              contentLanguage: 'English'
            })}
            dependencies={['Upload Knowledge File']}
          />

          <ApiTestComponent
            title={`Processing Status (ID: ${knowledgeId})`}
            description="Check current status of content processing"
            testFunction={() => unifiedApiService.getProcessingStatus(knowledgeId)}
            dependencies={['Start Processing']}
          />

          <h2 style={{ 
            color: '#1f2937', 
            borderBottom: '2px solid #e5e7eb', 
            paddingBottom: '8px',
            marginTop: '32px' 
          }}>
            🎯 Content Generation & Analysis
          </h2>

          <ApiTestComponent
            title={`Generate Content (ID: ${knowledgeId})`}
            description="Generate educational content (notes, summaries, etc.)"
            testFunction={() => unifiedApiService.generateContent(knowledgeId, {
              types: ['notes', 'summary'],
              language: 'English'
            })}
            dependencies={['Start Processing']}
          />

          <ApiTestComponent
            title={`Get Chapter Data (ID: ${knowledgeId})`}
            description="Retrieve processed chapter data and generated content"
            testFunction={() => unifiedApiService.getChapterData(knowledgeId, {
              language: 'English'
            })}
            dependencies={['Generate Content']}
          />

          <h2 style={{ 
            color: '#1f2937', 
            borderBottom: '2px solid #e5e7eb', 
            paddingBottom: '8px',
            marginTop: '32px' 
          }}>
            📊 Analytics & Knowledge Graph
          </h2>

          <ApiTestComponent
            title={`Content Analytics (ID: ${knowledgeId})`}
            description="Get content generation analytics for this knowledge entry"
            testFunction={() => unifiedApiService.getContentAnalytics(knowledgeId)}
            dependencies={['Generate Content']}
          />

          <ApiTestComponent
            title={`Sync Knowledge Graph (ID: ${knowledgeId})`}
            description="Synchronize knowledge entry to Neo4j graph database"
            testFunction={() => unifiedApiService.syncKnowledgeGraph(knowledgeId)}
            dependencies={['Generate Content']}
          />

          <ApiTestComponent
            title={`Get Knowledge Graph (ID: ${knowledgeId})`}
            description="Retrieve knowledge graph structure and relationships"
            testFunction={() => unifiedApiService.getKnowledgeGraph(knowledgeId)}
            dependencies={['Sync Knowledge Graph']}
          />
        </>
      )}

      <div style={{ 
        marginTop: '32px', 
        padding: '16px', 
        backgroundColor: '#ecfdf5', 
        borderRadius: '8px',
        border: '1px solid #d1fae5' 
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#065f46' }}>💡 Usage Tips</h3>
        <ul style={{ margin: 0, color: '#065f46', fontSize: '14px' }}>
          <li>Run tests in order - some depend on previous test results</li>
          <li>Knowledge ID is automatically captured from upload for subsequent tests</li>
          <li>Check browser console for detailed logs and debugging info</li>
          <li>Processing operations may take time - status will update in real-time</li>
        </ul>
      </div>
    </div>
  )
}

const meta: Meta<typeof ApiIntegrationDashboard> = {
  title: 'API Integration/Live Backend Testing',
  component: ApiIntegrationDashboard,
  parameters: {
    docs: {
      description: {
        component: `
# Live API Integration Testing

This story provides real-time testing of all backend API endpoints without any mocking. 
It connects directly to the running backend server and demonstrates the complete workflow 
from file upload to content generation and analytics.

## Features:
- Real API calls to http://localhost:8000
- Interactive test execution with live results
- Dependency tracking between related tests
- Response data inspection
- Performance timing measurement

## Prerequisites:
- Backend server must be running on localhost:8000
- All API endpoints should be available
- Database connections should be active

## Test Categories:
1. **Basic Tests**: Health, endpoints, analytics
2. **Knowledge Management**: Upload, processing, status
3. **Content Generation**: AI-powered content creation
4. **Analytics**: Performance metrics and insights
5. **Knowledge Graph**: Neo4j integration testing

Use this for integration testing, debugging, and demonstrating the complete API workflow.
        `
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof ApiIntegrationDashboard>

export const LiveApiTesting: Story = {
  name: '🧪 Live API Integration Tests',
  render: () => <ApiIntegrationDashboard />
}

export const HealthCheckOnly: Story = {
  name: '🩺 Health Check Test',
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2>Quick Health Check</h2>
      <ApiTestComponent
        title="Backend Health Check"
        description="Simple connectivity test to verify backend is running"
        testFunction={() => unifiedApiService.healthCheck()}
      />
    </div>
  )
}