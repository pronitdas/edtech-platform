import { useEffect } from 'react'
import { analyticsService } from '@/services/analytics-service'

interface PerformanceEntry {
  name: string
  startTime: number
  duration?: number
  value?: number
  rating?: string
}

const getMetricRating = (entry: PerformanceEntry): string => {
  const { name, value = 0, duration = 0 } = entry
  
  switch (name) {
    case 'largest-contentful-paint':
      if (value <= 2500) return 'good'
      if (value <= 4000) return 'needs-improvement'
      return 'poor'
    
    case 'first-input-delay':
      if (value <= 100) return 'good'
      if (value <= 300) return 'needs-improvement'
      return 'poor'
    
    case 'cumulative-layout-shift':
      if (value <= 0.1) return 'good'
      if (value <= 0.25) return 'needs-improvement'
      return 'poor'
    
    case 'first-contentful-paint':
      if (value <= 1800) return 'good'
      if (value <= 3000) return 'needs-improvement'
      return 'poor'
    
    case 'time-to-interactive':
      if (value <= 3800) return 'good'
      if (value <= 7300) return 'needs-improvement'
      return 'poor'
    
    default:
      return 'unknown'
  }
}

const usePerformanceTracking = (pageName?: string) => {
  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart
        const firstPaint = timing.responseEnd - timing.requestStart

        analyticsService.trackEvent({
          event_type: 'page_performance',
          data: {
            page: pageName || window.location.pathname,
            loadTime,
            domContentLoaded,
            firstPaint,
            timestamp: Date.now()
          }
        })
      }
    }

    // Track Core Web Vitals
    const trackWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            analyticsService.trackEvent({
              event_type: 'web_vital',
              data: {
                metric: 'largest-contentful-paint',
                value: entry.startTime,
                rating: getMetricRating({
                  name: 'largest-contentful-paint',
                  startTime: entry.startTime,
                  value: entry.startTime
                }),
                page: pageName || window.location.pathname
              }
            })
          })
        })

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            analyticsService.trackEvent({
              event_type: 'web_vital',
              data: {
                metric: 'first-input-delay',
                value: entry.processingStart - entry.startTime,
                rating: getMetricRating({
                  name: 'first-input-delay',
                  startTime: entry.startTime,
                  value: entry.processingStart - entry.startTime
                }),
                page: pageName || window.location.pathname
              }
            })
          })
        })

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          
          analyticsService.trackEvent({
            event_type: 'web_vital',
            data: {
              metric: 'cumulative-layout-shift',
              value: clsValue,
              rating: getMetricRating({
                name: 'cumulative-layout-shift',
                startTime: 0,
                value: clsValue
              }),
              page: pageName || window.location.pathname
            }
          })
        })

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
          fidObserver.observe({ entryTypes: ['first-input'] })
          clsObserver.observe({ entryTypes: ['layout-shift'] })
        } catch (error) {
          console.warn('Performance observer not supported:', error)
        }

        return () => {
          lcpObserver.disconnect()
          fidObserver.disconnect()
          clsObserver.disconnect()
        }
      }
      return undefined
    }

    // Track memory usage
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        analyticsService.trackEvent({
          event_type: 'memory_usage',
          data: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            page: pageName || window.location.pathname
          }
        })
      }
    }

    // Track page visibility changes
    const trackVisibilityChanges = () => {
      const handleVisibilityChange = () => {
        analyticsService.trackEvent({
          event_type: 'visibility_change',
          data: {
            hidden: document.hidden,
            page: pageName || window.location.pathname,
            timestamp: Date.now()
          }
        })
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }

    // Initialize tracking
    const timeoutId = setTimeout(() => {
      trackPageLoad()
      trackMemoryUsage()
    }, 100)

    const cleanup1 = trackWebVitals()
    const cleanup2 = trackVisibilityChanges()

    return () => {
      clearTimeout(timeoutId)
      if (cleanup1) cleanup1()
      if (cleanup2) cleanup2()
    }
  }, [pageName])

  // Return utility functions
  const trackCustomMetric = (metricName: string, value: number, context?: Record<string, any>) => {
    analyticsService.trackEvent({
      event_type: 'custom_performance_metric',
      data: {
        metric: metricName,
        value,
        page: pageName || window.location.pathname,
        ...context
      }
    })
  }

  const trackComponentRender = (componentName: string, renderTime: number) => {
    analyticsService.trackEvent({
      event_type: 'component_performance',
      data: {
        component: componentName,
        renderTime,
        page: pageName || window.location.pathname
      }
    })
  }

  return {
    trackCustomMetric,
    trackComponentRender
  }
}

export default usePerformanceTracking