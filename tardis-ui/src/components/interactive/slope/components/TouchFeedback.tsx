import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAccessibility } from '../hooks/useAccessibility'

interface TouchPoint {
  id: number
  x: number
  y: number
  startTime: number
  active: boolean
}

interface TouchFeedbackProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onTouch?: (point: { x: number; y: number }) => void
  onTouchMove?: (point: { x: number; y: number }) => void
  onTouchEnd?: (point: { x: number; y: number }) => void
}

/**
 * TouchFeedback component provides enhanced visual and haptic feedback
 * for touch interactions on mobile devices
 */
const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  className = '',
  disabled = false,
  onTouch,
  onTouchMove,
  onTouchEnd,
}) => {
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { isMobile, triggerHapticFeedback, prefersReducedMotion } = useAccessibility()
  
  // Generate unique touch point ID
  const generateTouchId = useRef(0)

  // Clean up expired touch points
  useEffect(() => {
    const cleanup = setInterval(() => {
      setTouchPoints(prev => 
        prev.filter(point => Date.now() - point.startTime < 1000)
      )
    }, 100)

    return () => clearInterval(cleanup)
  }, [])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Create visual feedback for each touch point
    const newTouchPoints: TouchPoint[] = []
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      if (!touch) continue
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      newTouchPoints.push({
        id: generateTouchId.current++,
        x,
        y,
        startTime: Date.now(),
        active: true,
      })

      // Trigger haptic feedback for touch start
      if (isMobile) {
        triggerHapticFeedback('light')
      }

      // Call onTouch callback
      if (onTouch) {
        onTouch({ x, y })
      }
    }

    setTouchPoints(prev => [...prev.filter(p => !p.active), ...newTouchPoints])
  }, [disabled, isMobile, triggerHapticFeedback, onTouch])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Update active touch points
    setTouchPoints(prev => 
      prev.map(point => {
        if (!point.active) return point
        
        // Find corresponding touch
        for (let i = 0; i < event.touches.length; i++) {
          const touch = event.touches[i]
          if (!touch) continue
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top
          
          // Update the most recent active point (simplified logic)
          if (i === 0) {
            if (onTouchMove) {
              onTouchMove({ x, y })
            }
            return { ...point, x, y }
          }
        }
        
        return point
      })
    )
  }, [disabled, onTouchMove])

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled) return

    // Mark touch points as inactive
    setTouchPoints(prev => 
      prev.map(point => ({ ...point, active: false }))
    )

    // Trigger haptic feedback for touch end
    if (isMobile) {
      triggerHapticFeedback('light')
    }

    // Call onTouchEnd callback with last known position
    const lastActivePoint = touchPoints.find(p => p.active)
    if (onTouchEnd && lastActivePoint) {
      onTouchEnd({ x: lastActivePoint.x, y: lastActivePoint.y })
    }
  }, [disabled, isMobile, triggerHapticFeedback, onTouchEnd, touchPoints])

  return (
    <div
      ref={containerRef}
      className={`relative touch-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
      
      {/* Touch feedback visualizations */}
      {isMobile && !prefersReducedMotion && touchPoints.map((point) => {
        const age = Date.now() - point.startTime
        const opacity = Math.max(0, 1 - (age / 1000))
        const scale = point.active ? 1 : 1 + (age / 500)
        
        return (
          <div
            key={point.id}
            className="pointer-events-none absolute z-50"
            style={{
              left: point.x - 20,
              top: point.y - 20,
              opacity,
              transform: `scale(${scale})`,
              transition: point.active ? 'none' : 'all 0.3s ease-out',
            }}
          >
            {/* Outer ripple effect */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 animate-ping" />
            
            {/* Inner touch point */}
            <div 
              className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-lg"
              style={{
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
              }}
            />
            
            {/* Center dot */}
            <div className="absolute inset-3 rounded-full bg-white/90" />
          </div>
        )
      })}
      
      {/* Touch instruction overlay for mobile */}
      {isMobile && touchPoints.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
          <div className="rounded-lg bg-black/50 px-4 py-2 text-center text-sm text-white backdrop-blur-sm">
            <div className="mb-1">👆 Touch to interact</div>
            <div className="text-xs text-gray-300">Drag to move • Pinch to zoom</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TouchFeedback