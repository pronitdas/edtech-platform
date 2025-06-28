import { useEffect, useCallback, useRef } from 'react'

interface PerformanceMetrics {
  renderTime: number
  interactionLatency: number
  memoryUsage: number
  fps: number
  canvasFrameTime: number
}

interface PerformanceMonitoringOptions {
  enableMetrics?: boolean
  reportInterval?: number
  maxMetricsHistory?: number
}

export function usePerformanceMonitoring(options: PerformanceMonitoringOptions = {}) {
  const {
    enableMetrics = true,
    reportInterval = 5000, // 5 seconds
    maxMetricsHistory = 20,
  } = options

  const metricsRef = useRef<PerformanceMetrics[]>([])
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const renderStartRef = useRef<number>()

  // Track component render performance
  const startRenderMeasurement = useCallback(() => {
    if (!enableMetrics) return
    renderStartRef.current = performance.now()
  }, [enableMetrics])

  const endRenderMeasurement = useCallback(() => {
    if (!enableMetrics || !renderStartRef.current) return
    
    const renderTime = performance.now() - renderStartRef.current
    
    // Only record if render time is significant
    if (renderTime > 1) {
      console.log(`Component render time: ${renderTime.toFixed(2)}ms`)
    }
  }, [enableMetrics])

  // Measure interaction latency
  const measureInteractionLatency = useCallback((startTime: number) => {
    if (!enableMetrics) return
    
    const latency = performance.now() - startTime
    if (latency > 16) { // More than one frame at 60fps
      console.warn(`High interaction latency: ${latency.toFixed(2)}ms`)
    }
    return latency
  }, [enableMetrics])

  // Monitor FPS
  useEffect(() => {
    if (!enableMetrics) return

    let animationId: number
    
    const measureFPS = () => {
      const now = performance.now()
      frameCountRef.current++
      
      if (now - lastTimeRef.current >= 1000) { // Every second
        const fps = frameCountRef.current
        frameCountRef.current = 0
        lastTimeRef.current = now
        
        if (fps < 50) {
          console.warn(`Low FPS detected: ${fps}`)
        }
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }
    
    animationId = requestAnimationFrame(measureFPS)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [enableMetrics])

  // Monitor memory usage
  const getMemoryUsage = useCallback(() => {
    if (!enableMetrics || !('memory' in performance)) return 0
    
    // @ts-ignore - Performance memory API
    const memory = (performance as any).memory
    const usedJSHeapSize = memory?.usedJSHeapSize || 0
    const totalJSHeapSize = memory?.totalJSHeapSize || 0
    
    const usagePercent = totalJSHeapSize > 0 ? (usedJSHeapSize / totalJSHeapSize) * 100 : 0
    
    if (usagePercent > 80) {
      console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`)
    }
    
    return usagePercent
  }, [enableMetrics])

  // Canvas performance optimization
  const optimizeCanvasPerformance = useCallback((canvas: HTMLCanvasElement) => {
    if (!enableMetrics || !canvas) return

    // Enable hardware acceleration
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Use hardware acceleration hints
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'medium'
      
      // Set pixel ratio for crisp rendering
      const pixelRatio = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * pixelRatio
      canvas.height = rect.height * pixelRatio
      ctx.scale(pixelRatio, pixelRatio)
      
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }
  }, [enableMetrics])

  // Throttle function for performance
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  }, [])

  // Debounce function for performance
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T => {
    let timeoutId: ReturnType<typeof setTimeout>
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }) as T
  }, [])

  // Performance report
  useEffect(() => {
    if (!enableMetrics) return

    const reportInterval_ = setInterval(() => {
      const memoryUsage = getMemoryUsage()
      
      console.group('📊 Performance Report')
      console.log(`Memory Usage: ${memoryUsage.toFixed(2)}%`)
      console.log(`FPS: ${frameCountRef.current}`)
      console.groupEnd()
    }, reportInterval)

    return () => clearInterval(reportInterval_)
  }, [enableMetrics, reportInterval, getMemoryUsage])

  // Lazy loading optimization
  const createLazyComponent = useCallback(<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFunc)
  }, [])

  // Image optimization
  const optimizeImage = useCallback((
    src: string,
    maxWidth: number = 800,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Calculate optimized dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = src
    })
  }, [])

  return {
    startRenderMeasurement,
    endRenderMeasurement,
    measureInteractionLatency,
    getMemoryUsage,
    optimizeCanvasPerformance,
    throttle,
    debounce,
    createLazyComponent,
    optimizeImage,
  }
}