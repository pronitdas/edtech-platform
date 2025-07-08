'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Point } from '../../../../types/geometry'

interface GraphConfig {
  initialZoom?: number
  initialOffset?: { x: number; y: number }
  canvasWidth?: number
  canvasHeight?: number
  scaleFactor?: number
  minZoom?: number
  maxZoom?: number
}

export function useGraphManagement({
  initialZoom = 1,
  initialOffset = { x: 0, y: 0 },
  canvasWidth = 800,
  canvasHeight = 600,
  scaleFactor = 40,
  minZoom = 0.1,
  maxZoom = 5,
}: GraphConfig = {}) {
  // State for graph view and points
  const [points, setPoints] = useState<Point[]>([])
  const [zoom, setZoom] = useState(initialZoom)
  const [offset, setOffset] = useState(initialOffset)
  
  // Animation state
  const animationRef = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Apply zoom limits
  const setZoomWithLimits = useCallback(
    (newZoom: number) => {
      setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)))
    },
    [minZoom, maxZoom]
  )

  // Smooth transition utility with easing
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  // Animated zoom function
  const setZoomAnimated = useCallback(
    (targetZoom: number, duration: number = 400) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom))
      const startZoom = zoom
      const startTime = performance.now()

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      setIsAnimating(true)

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeInOutCubic(progress)
        
        const currentZoom = startZoom + (clampedZoom - startZoom) * easedProgress
        setZoom(currentZoom)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          animationRef.current = null
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [zoom, minZoom, maxZoom]
  )

  // Animated offset function
  const setOffsetAnimated = useCallback(
    (targetOffset: { x: number; y: number }, duration: number = 400) => {
      const startOffset = offset
      const startTime = performance.now()

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      setIsAnimating(true)

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeInOutCubic(progress)
        
        const currentOffset = {
          x: startOffset.x + (targetOffset.x - startOffset.x) * easedProgress,
          y: startOffset.y + (targetOffset.y - startOffset.y) * easedProgress,
        }
        setOffset(currentOffset)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          animationRef.current = null
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [offset]
  )

  // Combined animated zoom and pan function
  const animateToView = useCallback(
    (targetZoom: number, targetOffset: { x: number; y: number }, duration: number = 600) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom))
      
      // Capture current values at the start of animation
      const startZoom = zoom
      const startOffset = offset
      const startTime = performance.now()

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      setIsAnimating(true)

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeInOutCubic(progress)
        
        const currentZoom = startZoom + (clampedZoom - startZoom) * easedProgress
        const currentOffset = {
          x: startOffset.x + (targetOffset.x - startOffset.x) * easedProgress,
          y: startOffset.y + (targetOffset.y - startOffset.y) * easedProgress,
        }
        
        setZoom(currentZoom)
        setOffset(currentOffset)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          animationRef.current = null
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [minZoom, maxZoom] // Remove zoom and offset from dependencies to break circular dependency
  )

  // Reset the view to center the points (with smooth animation)
  const resetView = useCallback(() => {
    if (points.length === 0) {
      animateToView(initialZoom, initialOffset, 500)
      return
    }

    // Find the center of the points
    let sumX = 0,
      sumY = 0
    points.forEach(point => {
      sumX += point.x
      sumY += point.y
    })
    const centerX = sumX / points.length
    const centerY = sumY / points.length

    // Find the range of points
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity
    points.forEach(point => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })

    // Calculate zoom level to fit points
    const rangeX = Math.max(1, maxX - minX)
    const rangeY = Math.max(1, maxY - minY)
    const margin = 1.5 // Extra margin around points

    const zoomX = canvasWidth / scaleFactor / (rangeX * margin)
    const zoomY = canvasHeight / scaleFactor / (rangeY * margin)
    const newZoom = Math.min(zoomX, zoomY, maxZoom) // Limit max zoom

    // Center the points in the canvas with smooth animation
    const targetOffset = {
      x: -centerX * scaleFactor * newZoom,
      y: centerY * scaleFactor * newZoom,
    }
    
    animateToView(newZoom, targetOffset, 600)
  }, [
    points,
    initialZoom,
    initialOffset,
    canvasWidth,
    canvasHeight,
    scaleFactor,
    maxZoom,
    animateToView,
  ])

  // Clear all points
  const clearPoints = useCallback(() => {
    setPoints([])
  }, [])

  // Set points to specific coordinates
  const setPointsFromCoordinates = useCallback(
    (coordinates: { x: number; y: number }[]) => {
      setPoints(coordinates.map(coord => ({ x: coord.x, y: coord.y })))

      // Don't automatically reset view to avoid infinite update loops
      // The component should handle this with useEffect
    },
    []
  )

  // Calculate slope between two points
  const calculateSlope = useCallback((p1: Point, p2: Point): number | null => {
    const dx = p2.x - p1.x
    if (Math.abs(dx) < 0.0001) return null // Undefined slope (vertical line)
    return (p2.y - p1.y) / dx
  }, [])

  // Calculate y-intercept (b in y = mx + b)
  const calculateYIntercept = useCallback(
    (p: Point, slope: number | null): number | null => {
      if (slope === null) return null // Undefined for vertical lines
      return p.y - slope * p.x
    },
    []
  )

  // Generate equation string
  const generateEquation = useCallback(
    (slope: number | null, yIntercept: number | null): string => {
      if (slope === null) {
        if (points.length > 0 && points[0]) {
          return 'x = ' + points[0].x.toFixed(2) // Vertical line
        }
        return '' // No equation available
      }

      const m = slope.toFixed(2)
      const b = yIntercept || 0

      if (Math.abs(b) < 0.01) return `y = ${m}x`
      if (b > 0) return `y = ${m}x + ${b.toFixed(2)}`
      return `y = ${m}x - ${Math.abs(b).toFixed(2)}`
    },
    [points]
  )

  // Map functions between canvas and world coordinates
  const mapPointToCanvas = useCallback(
    (worldPoint: Point): Point => {
      const effectiveScale = scaleFactor * zoom
      const cx = canvasWidth / 2
      const cy = canvasHeight / 2

      return {
        x: worldPoint.x * effectiveScale + cx + offset.x,
        y: cy - worldPoint.y * effectiveScale + offset.y,
      }
    },
    [zoom, offset, scaleFactor, canvasWidth, canvasHeight]
  )

  const mapCanvasToPoint = useCallback(
    (canvasPoint: Point): Point => {
      const effectiveScale = scaleFactor * zoom
      const cx = canvasWidth / 2
      const cy = canvasHeight / 2

      return {
        x: (canvasPoint.x - cx - offset.x) / effectiveScale,
        y: (cy - canvasPoint.y + offset.y) / effectiveScale,
      }
    },
    [zoom, offset, scaleFactor, canvasWidth, canvasHeight]
  )

  // Zoom to a specific point on the canvas
  const zoomToPoint = useCallback(
    (canvasPoint: Point, newZoom: number) => {
      // Get world coordinates of the point before zoom
      const worldPoint = mapCanvasToPoint(canvasPoint)

      // Apply new zoom
      const limitedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))

      // Calculate new offset to keep the point under the mouse
      const effectiveScaleAfter = scaleFactor * limitedZoom
      const cx = canvasWidth / 2
      const cy = canvasHeight / 2

      const newOffsetX =
        -(worldPoint.x * effectiveScaleAfter) + (canvasPoint.x - cx)
      const newOffsetY =
        worldPoint.y * effectiveScaleAfter + (canvasPoint.y - cy)

      setZoom(limitedZoom)
      setOffset({ x: newOffsetX, y: newOffsetY })
    },
    [mapCanvasToPoint, minZoom, maxZoom, scaleFactor, canvasWidth, canvasHeight]
  )

  // Pan the view by a delta amount
  const panView = useCallback((deltaX: number, deltaY: number) => {
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))
  }, [])

  // Calculate line data if two points exist
  const lineData = useMemo(() => {
    if (points.length < 2) return null

    const p1 = points[0]
    const p2 = points[1]

    if (!p1 || !p2) return null

    const slope = calculateSlope(p1, p2)
    const yIntercept = calculateYIntercept(p1, slope)
    const equation = generateEquation(slope, yIntercept)

    return {
      slope,
      yIntercept,
      equation,
      point1: p1,
      point2: p2,
      rise: p2.y - p1.y,
      run: p2.x - p1.x,
    }
  }, [points, calculateSlope, calculateYIntercept, generateEquation])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    points,
    setPoints,
    zoom,
    setZoom: setZoomWithLimits,
    offset,
    setOffset,
    resetView,
    clearPoints,
    setPointsFromCoordinates,
    calculateSlope,
    calculateYIntercept,
    generateEquation,
    mapPointToCanvas,
    mapCanvasToPoint,
    zoomToPoint,
    panView,
    lineData,
    canvasWidth,
    canvasHeight,
    // Animation functions
    setZoomAnimated,
    setOffsetAnimated,
    animateToView,
    isAnimating,
  }
}

export default useGraphManagement
