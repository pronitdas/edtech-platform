import React, { useRef, useEffect, useCallback } from 'react'
import p5 from 'p5'
import { DrawingStrategy } from '../../types/graph'
import { Point } from '@/types/geometry'
import { throttle, debounce } from 'lodash'

interface CoreGraphCanvasProps {
  width: number
  height: number
  zoom: number
  offset: { x: number; y: number }
  onZoomChange: (zoom: number) => void
  onOffsetChange: (offset: { x: number; y: number }) => void
  mapPointToCanvas: (point: { x: number; y: number }) => {
    x: number
    y: number
  }
  mapCanvasToPoint: (point: { x: number; y: number }) => {
    x: number
    y: number
  }
  drawingStrategy: DrawingStrategy
  onElementClick?: (type: string, index: number, data: any) => void
  isMobileDevice?: boolean
}

interface HoveredElement {
  type: string
  index: number
  data: any
}

const CoreGraphCanvas: React.FC<CoreGraphCanvasProps> = ({
  width,
  height,
  zoom,
  offset,
  onZoomChange,
  onOffsetChange,
  mapPointToCanvas,
  mapCanvasToPoint,
  drawingStrategy,
  onElementClick,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<p5 | null>(null)
  const hoveredElementRef = useRef<HoveredElement | null>(null)

  // Throttled handlers
  const throttledMouseMove = useCallback(
    throttle(
      (
        p: p5,
        checkInteractions: (x: number, y: number) => HoveredElement | null
      ) => {
        checkInteractions(p.mouseX, p.mouseY)
      },
      16
    ),
    []
  )

  const throttledDrag = useCallback(
    throttle((p: p5, prevMouseX: number, prevMouseY: number) => {
      const dx = p.mouseX - prevMouseX
      const dy = p.mouseY - prevMouseY
      onOffsetChange({ x: offset.x + dx, y: offset.y + dy })
    }, 16),
    [offset, onOffsetChange]
  )

  const throttledWheel = useCallback(
    throttle((p: p5, event: WheelEvent) => {
      // Normalize wheel delta across browsers
      const delta = event.deltaY || event.detail || 0
      const factor = delta > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, zoom * factor)

      const mousePointBeforeZoom = mapCanvasToPoint({
        x: p.mouseX,
        y: p.mouseY,
      })
      const mousePointAfterZoom = {
        x: (p.mouseX - offset.x) / newZoom,
        y: (p.mouseY - offset.y) / newZoom,
      }

      const newOffsetX =
        offset.x - (mousePointAfterZoom.x - mousePointBeforeZoom.x) * newZoom
      const newOffsetY =
        offset.y - (mousePointAfterZoom.y - mousePointBeforeZoom.y) * newZoom

      onZoomChange(newZoom)
      onOffsetChange({ x: newOffsetX, y: newOffsetY })
    }, 16),
    [zoom, offset, onZoomChange, onOffsetChange, mapCanvasToPoint]
  )

  // Debounced click handler
  const debouncedClick = useCallback(
    debounce((element: HoveredElement | null) => {
      if (element && onElementClick) {
        onElementClick(element.type, element.index, element.data)
      }
    }, 200),
    [onElementClick]
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const sketch = (p: p5) => {
      let isDragging = false
      let prevMouseX = 0
      let prevMouseY = 0
      let animationFrameId: number
      let lastTouchDistance = 0
      let isMultiTouch = false
      const touchSensitivity = drawingStrategy.getTouchSensitivity?.() || 20

      // Helper function to get normalized touch coordinates
      const getPointFromTouch = (touch: Touch): { x: number; y: number } => {
        const rect = p.canvas.elt.getBoundingClientRect()
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        }
      }

      // Handler for pinch-to-zoom gestures
      const handleTouchZoom = (event: TouchEvent): void => {
        if (event.touches.length === 2) {
          const touch1 = getPointFromTouch(event.touches[0])
          const touch2 = getPointFromTouch(event.touches[1])

          const currentDistance = Math.hypot(
            touch2.x - touch1.x,
            touch2.y - touch1.y
          )

          if (lastTouchDistance > 0) {
            const factor = currentDistance > lastTouchDistance ? 1.1 : 0.9
            const newZoom = Math.max(0.1, Math.min(10, zoom * factor))

            // Calculate center point between touches
            const centerX = (touch1.x + touch2.x) / 2
            const centerY = (touch1.y + touch2.y) / 2

            const centerPointBeforeZoom = mapCanvasToPoint({
              x: centerX,
              y: centerY,
            })
            const centerPointAfterZoom = {
              x: (centerX - offset.x) / newZoom,
              y: (centerY - offset.y) / newZoom,
            }

            const newOffsetX =
              offset.x -
              (centerPointAfterZoom.x - centerPointBeforeZoom.x) * newZoom
            const newOffsetY =
              offset.y -
              (centerPointAfterZoom.y - centerPointBeforeZoom.y) * newZoom

            onZoomChange(newZoom)
            onOffsetChange({ x: newOffsetX, y: newOffsetY })
          }

          lastTouchDistance = currentDistance
          isMultiTouch = true
        }
      }

      // Touch interaction error handler
      const handleTouchError = (e: Error): void => {
        console.error('Touch interaction error:', e)
        isDragging = false
        isMultiTouch = false
        lastTouchDistance = 0
      }

      const checkInteractions = (
        x: number,
        y: number
      ): HoveredElement | null => {
        const mousePoint = mapCanvasToPoint({ x, y })
        const found = drawingStrategy.findElementAtPoint(mousePoint)

        if (found !== hoveredElementRef.current) {
          hoveredElementRef.current = found
          p.cursor(found ? 'pointer' : 'default')
        }

        return found
      }

      p.setup = () => {
        const canvas = p.createCanvas(width, height)
        canvas.parent(canvasRef.current!)
        p.pixelDensity(window.devicePixelRatio)

        const canvasElement = canvas.elt
        canvasElement.addEventListener('wheel', (e: WheelEvent) =>
          e.preventDefault()
        )

        // Touch event handlers
        canvasElement.addEventListener('touchstart', (e: TouchEvent) => {
          e.preventDefault()
          const touch = getPointFromTouch(e.touches[0])
          prevMouseX = touch.x
          prevMouseY = touch.y

          if (e.touches.length === 1) {
            const element = checkInteractions(touch.x, touch.y)
            if (element) {
              debouncedClick(element)
              return
            }
            isDragging = true
          } else if (e.touches.length === 2) {
            lastTouchDistance = 0
          }
        })

        canvasElement.addEventListener('touchmove', (e: TouchEvent) => {
          e.preventDefault()

          if (e.touches.length === 2) {
            handleTouchZoom(e)
          } else if (e.touches.length === 1 && isDragging && !isMultiTouch) {
            const touch = getPointFromTouch(e.touches[0])
            throttledDrag(p, prevMouseX, prevMouseY)
            prevMouseX = touch.x
            prevMouseY = touch.y
          }
        })

        canvasElement.addEventListener('touchend', (e: TouchEvent) => {
          e.preventDefault()
          isDragging = false
          isMultiTouch = false
          lastTouchDistance = 0
          debouncedClick.flush()
        })

        // Increase hit areas for touch on mobile
        if (window.matchMedia('(max-width: 768px)').matches) {
          p.strokeWeight(3) // Thicker lines
          drawingStrategy.setMobileMode(true)
        }
      }

      p.draw = () => {
        p.background(255)
        p.translate(offset.x, offset.y)
        p.scale(zoom)
        drawingStrategy.drawOnCanvas(p)
      }

      p.mouseMoved = () => {
        throttledMouseMove(p, checkInteractions)
      }

      p.mousePressed = () => {
        const element = checkInteractions(p.mouseX, p.mouseY)
        if (element) {
          debouncedClick(element)
          return
        }
        isDragging = true
        prevMouseX = p.mouseX
        prevMouseY = p.mouseY
      }

      p.mouseReleased = () => {
        isDragging = false
        debouncedClick.flush()
      }

      p.mouseDragged = () => {
        if (isDragging) {
          throttledDrag(p, prevMouseX, prevMouseY)
          prevMouseX = p.mouseX
          prevMouseY = p.mouseY
        }
      }

      p.mouseWheel = (event: any) => {
        // p5.js wheel event is actually a custom object
        throttledWheel(p, {
          deltaY: event.delta,
          detail: event.delta,
          preventDefault: () => event.preventDefault(),
        } as WheelEvent)
      }

      const animate = () => {
        p.redraw()
        animationFrameId = requestAnimationFrame(animate)
      }

      animate()

      p.windowResized = () => {
        p.resizeCanvas(width, height)
      }

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }

    p5Instance.current = new p5(sketch)

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [
    width,
    height,
    zoom,
    offset,
    onZoomChange,
    onOffsetChange,
    mapCanvasToPoint,
    drawingStrategy,
    throttledMouseMove,
    throttledDrag,
    throttledWheel,
    debouncedClick,
  ])

  // Debounced resize handler
  useEffect(() => {
    const handleResize = debounce(() => {
      if (p5Instance.current) {
        p5Instance.current.resizeCanvas(width, height)
      }
    }, 100)

    handleResize()
    return () => handleResize.cancel()
  }, [width, height])

  return <div ref={canvasRef} style={{ width, height, overflow: 'hidden' }} />
}

export default CoreGraphCanvas
