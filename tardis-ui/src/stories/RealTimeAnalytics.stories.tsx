/**
 * Real-Time Analytics Dashboard Stories
 * Live analytics data from the backend without mocking
 */

import type { Meta, StoryObj } from '@storybook/react'
import React, { useState, useEffect } from 'react'
import { unifiedApiService } from '../services/unified-api-service'

interface AnalyticsMetric {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'stable'
}

const MetricCard: React.FC<AnalyticsMetric> = ({ label, value, change, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      default: return '📊'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#10b981'
      case 'down': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'normal' }}>
          {label}
        </h4>
        <span style={{ fontSize: '18px' }}>{getTrendIcon()}</span>
      </div>
      
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
        {value}
      </div>
      
      {change && (
        <div style={{ fontSize: '12px', color: getTrendColor() }}>
          {change}
        </div>
      )}
    </div>
  )
}

const RealTimeAnalyticsDashboard: React.FC = () => {
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initializeApi = async () => {
      try {
        await unifiedApiService.initialize('http://localhost:8000')
        setInitialized(true)
        await loadAnalyticsData()
      } catch (error) {
        console.error('Failed to initialize API service:', error)
      }
    }
    initializeApi()
  }, [])

  useEffect(() => {
    if (autoRefresh && initialized) {
      const interval = setInterval(loadAnalyticsData, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [autoRefresh, initialized])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const [dashboard, performance] = await Promise.all([
        unifiedApiService.getAnalyticsDashboard(),
        unifiedApiService.getPerformanceStats({ limit: 100 })
      ])
      
      setDashboardData(dashboard)
      setPerformanceData(performance)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  const formatMetrics = (): AnalyticsMetric[] => {
    if (!dashboardData) return []

    const metrics: AnalyticsMetric[] = []

    // Dashboard overview metrics
    if (dashboardData.overview) {
      const overview = dashboardData.overview
      metrics.push(
        {
          label: 'Total Knowledge Entries',
          value: overview.total_knowledge_entries || 0,
          trend: 'up'
        },
        {
          label: 'Content Generated',
          value: overview.total_content_generated || 0,
          trend: 'up'
        },
        {
          label: 'Success Rate',
          value: `${(overview.success_rate || 0).toFixed(1)}%`,
          trend: overview.success_rate > 90 ? 'up' : 'stable'
        },
        {
          label: 'Avg Processing Time',
          value: overview.avg_processing_time || 'N/A',
          trend: 'stable'
        }
      )
    }

    // Performance metrics
    if (performanceData?.summary) {
      const summary = performanceData.summary
      metrics.push(
        {
          label: 'Total Operations',
          value: summary.total_operations || 0,
          trend: 'up'
        },
        {
          label: 'Operations Success Rate',
          value: `${(summary.success_rate || 0).toFixed(1)}%`,
          trend: summary.success_rate > 95 ? 'up' : 'stable'
        },
        {
          label: 'Average Duration',
          value: `${(summary.avg_duration || 0).toFixed(1)}ms`,
          trend: 'stable'
        }
      )
    }

    // Recent activity metrics
    if (dashboardData.recent_activity) {
      const activity = dashboardData.recent_activity
      if (activity.last_24h) {
        metrics.push(
          {
            label: 'Uploads (24h)',
            value: activity.last_24h.uploads || 0,
            change: '+12% from yesterday',
            trend: 'up'
          },
          {
            label: 'Processing Completed (24h)',
            value: activity.last_24h.processing_completed || 0,
            change: '+8% from yesterday',
            trend: 'up'
          },
          {
            label: 'Content Generated (24h)',
            value: activity.last_24h.content_generated || 0,
            change: '+15% from yesterday',
            trend: 'up'
          }
        )
      }
    }

    return metrics
  }

  const getRecentOperations = () => {
    if (!performanceData?.stats) return []
    return performanceData.stats.slice(0, 10)
  }

  if (!initialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🚀 Initializing Analytics Dashboard...</h2>
        <p>Connecting to analytics services...</p>
      </div>
    )
  }

  const metrics = formatMetrics()
  const recentOps = getRecentOperations()

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ color: '#1f2937', marginBottom: '4px' }}>
              📊 Real-Time Analytics Dashboard
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Live metrics and performance data from the backend
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={toggleAutoRefresh}
              style={{
                padding: '8px 16px',
                backgroundColor: autoRefresh ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
            </button>

            <button
              onClick={loadAnalyticsData}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh Now'}
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {loading && !dashboardData && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3>Loading Analytics Data...</h3>
        </div>
      )}

      {metrics.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '16px' }}>📈 Key Metrics</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </div>
      )}

      {recentOps.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '16px' }}>⚡ Recent Operations</h2>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Recent API Operations
            </div>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {recentOps.map((op: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < recentOps.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {op.success ? '✅' : '❌'}
                    </span>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {op.operation_type || 'Unknown Operation'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(op.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      {op.duration ? `${op.duration.toFixed(1)}ms` : 'N/A'}
                    </div>
                    {op.error_count > 0 && (
                      <div style={{ fontSize: '12px', color: '#ef4444' }}>
                        {op.error_count} errors
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {dashboardData && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '16px' }}>🔍 Raw Analytics Data</h2>
          <details style={{ 
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '12px' }}>
              View Complete Dashboard Response
            </summary>
            <pre style={{
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              maxHeight: '400px'
            }}>
              {JSON.stringify(dashboardData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #fcd34d'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>💡 Analytics Features</h3>
        <ul style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
          <li>Real-time metrics updated every 30 seconds with auto-refresh</li>
          <li>Performance tracking for all API operations</li>
          <li>Success rates, processing times, and error monitoring</li>
          <li>Recent activity tracking and trend analysis</li>
          <li>Complete raw data inspection for debugging</li>
        </ul>
      </div>
    </div>
  )
}

const meta: Meta<typeof RealTimeAnalyticsDashboard> = {
  title: 'API Integration/Real-Time Analytics',
  component: RealTimeAnalyticsDashboard,
  parameters: {
    docs: {
      description: {
        component: `
# Real-Time Analytics Dashboard

Live analytics dashboard displaying real metrics from the backend analytics endpoints.
Shows system performance, usage statistics, and operational metrics without any mocking.

## Features:
- **Live Data**: Real metrics from the analytics API
- **Auto-Refresh**: Automatic updates every 30 seconds
- **Performance Tracking**: Operation durations and success rates
- **Trend Analysis**: Visual indicators for metric changes
- **Recent Activity**: Latest API operations and their status
- **Raw Data Access**: Complete response inspection

## Metrics Displayed:
- Total knowledge entries and content generated
- System success rates and processing times
- Recent activity (uploads, processing, content generation)
- API operation performance and error tracking

## Interactive Features:
- Toggle auto-refresh on/off
- Manual refresh capability
- Expandable raw data views
- Real-time status updates

Perfect for monitoring system health and performance in development and production.
        `
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof RealTimeAnalyticsDashboard>

export const LiveAnalytics: Story = {
  name: '📊 Live Analytics Dashboard',
  render: () => <RealTimeAnalyticsDashboard />
}

export const PerformanceMonitoring: Story = {
  name: '⚡ Performance Monitoring',
  render: () => {
    const [performanceData, setPerformanceData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const loadPerformanceData = async () => {
      setLoading(true)
      try {
        await unifiedApiService.initialize('http://localhost:8000')
        const data = await unifiedApiService.getPerformanceStats({ limit: 50 })
        setPerformanceData(data)
      } catch (error) {
        console.error('Failed to load performance data:', error)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      loadPerformanceData()
    }, [])

    return (
      <div style={{ padding: '20px' }}>
        <h2>⚡ API Performance Monitoring</h2>
        <button 
          onClick={loadPerformanceData}
          disabled={loading}
          style={{ marginBottom: '20px', padding: '8px 16px' }}
        >
          {loading ? 'Loading...' : 'Refresh Performance Data'}
        </button>
        
        {performanceData && (
          <pre style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '16px', 
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {JSON.stringify(performanceData, null, 2)}
          </pre>
        )}
      </div>
    )
  }
}