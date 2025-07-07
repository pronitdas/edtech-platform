/**
 * API Integration Stories for Storybook
 * Real API testing without mocking - shows live backend interaction
 */

import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import ApiTestDashboard from '../components/ApiTestDashboard'

const meta: Meta<typeof ApiTestDashboard> = {
  title: 'API Integration/Live Backend Testing',
  component: ApiTestDashboard,
  parameters: {
    layout: 'fullscreen',
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

Perfect for integration testing and demonstrating the complete API workflow.
        `
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof ApiTestDashboard>

export const LiveApiTesting: Story = {
  name: '🧪 Live API Integration Tests',
  render: () => <ApiTestDashboard />
}

export const HealthCheckOnly: Story = {
  name: '🩺 Quick Health Check',
  render: () => {
    const [result, setResult] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(false)

    const runHealthCheck = async () => {
      setLoading(true)
      try {
        const { unifiedApiService } = await import('../services/unified-api-service')
        await unifiedApiService.initialize('http://localhost:8000')
        const health = await unifiedApiService.healthCheck()
        setResult(health)
      } catch (error: any) {
        setResult({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    return (
      <div style={{ padding: '20px' }}>
        <h2>🩺 Backend Health Check</h2>
        <p>Quick connectivity test to verify backend is running at http://localhost:8000</p>
        
        <button 
          onClick={runHealthCheck}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? '🔄 Checking...' : '🚀 Run Health Check'}
        </button>
        
        {result && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: result.error ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '8px'
          }}>
            <h3 style={{ 
              color: result.error ? '#dc2626' : '#16a34a',
              marginTop: 0 
            }}>
              {result.error ? '❌ Health Check Failed' : '✅ Backend is Healthy'}
            </h3>
            <pre style={{ 
              backgroundColor: '#f9fafb', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }
}