import React, { useMemo, useState, useCallback, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SvgDrawingStrategy } from './GraphCanvas/strategies/SvgDrawingStrategy'
import { Point, Line, Shape, Text, Offset } from '@/types/geometry'
import { InteractiveMathConfig } from '@/types/graph'
import { throttle } from 'lodash'

interface SvgGraphCanvasProps {
  width: number
  height: number
  drawingStrategy: SvgDrawingStrategy
  points: Point[]
  lines: Line[]
  shapes: Shape[]
  texts: Text[]
  config?: InteractiveMathConfig
  zoom?: number
  offset?: Offset
  onElementClick?: (type: string, index: number, data: any) => void
  isMobileDevice?: boolean
}

interface TooltipState {
  visible: boolean
  content: string
  x: number
  y: number
}

// Memoized shape component
interface ElementEventHandlers {
  onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void
  onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void
  onMouseLeave: () => void
  onClick: (index: number) => void
}

const ShapeElement = memo<
  {
    shape: Shape
    index: number
  } & ElementEventHandlers
>(({ shape, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      onMouseEnter(e, index)
    },
    [onMouseEnter, index]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGElement>) => {
      onTouchStart(e, index)
    },
    [onTouchStart, index]
  )

  const handleClick = useCallback(() => {
    onClick(index)
  }, [onClick, index])

  if (shape.type === 'rectangle' && shape.topLeft && shape.bottomRight) {
    return (
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{
          opacity: typeof shape.opacity === 'number' ? shape.opacity : 1,
        }}
        transition={{ duration: 0.2 }}
        x={shape.topLeft.x}
        y={shape.topLeft.y}
        width={shape.bottomRight.x - shape.topLeft.x}
        height={shape.bottomRight.y - shape.topLeft.y}
        fill={shape.fill || 'rgba(200, 200, 200, 0.5)'}
        stroke={shape.stroke || 'gray'}
        strokeWidth={shape.strokeWidth || 1}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        onMouseLeave={onMouseLeave}
        onClick={handleClick}
        onTouchEnd={e => {
          e.preventDefault()
          handleClick()
          onMouseLeave()
        }}
        style={{
          cursor: 'pointer',
          touchAction: 'none',
        }}
      />
    )
  }

  if (shape.type === 'circle' && shape.center && shape.radius) {
    return (
      <motion.circle
        initial={{ opacity: 0 }}
        animate={{
          opacity: typeof shape.opacity === 'number' ? shape.opacity : 1,
        }}
        transition={{ duration: 0.2 }}
        cx={shape.center.x}
        cy={shape.center.y}
        r={shape.radius}
        fill={shape.fill || 'rgba(200, 200, 200, 0.5)'}
        stroke={shape.stroke || 'gray'}
        strokeWidth={shape.strokeWidth || 1}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        onMouseLeave={onMouseLeave}
        onClick={handleClick}
        onTouchEnd={e => {
          e.preventDefault()
          handleClick()
          onMouseLeave()
        }}
        style={{
          cursor: 'pointer',
          touchAction: 'none',
        }}
      />
    )
  }

  return null
})

// Memoized line component
const LineElement = memo<
  {
    line: Line
    index: number
  } & ElementEventHandlers
>(({ line, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      onMouseEnter(e, index)
    },
    [onMouseEnter, index]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGElement>) => {
      onTouchStart(e, index)
    },
    [onTouchStart, index]
  )

  const handleClick = useCallback(() => {
    onClick(index)
  }, [onClick, index])

  return (
    <motion.line
      initial={{ opacity: 0 }}
      animate={{ opacity: typeof line.opacity === 'number' ? line.opacity : 1 }}
      transition={{ duration: 0.2 }}
      x1={line.start.x}
      y1={line.start.y}
      x2={line.end.x}
      y2={line.end.y}
      stroke={line.color || 'blue'}
      strokeWidth={line.strokeWidth || 2}
      vectorEffect='non-scaling-stroke'
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onTouchEnd={e => {
        e.preventDefault()
        handleClick()
        onMouseLeave()
      }}
      style={{
        cursor: 'pointer',
        touchAction: 'none',
      }}
    />
  )
})

// Memoized point component
const PointElement = memo<{
  point: Point
  index: number
  onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void
  onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void
  onMouseLeave: () => void
  onClick: (index: number) => void
}>(({ point, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      onMouseEnter(e, index)
    },
    [onMouseEnter, index]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGElement>) => {
      onTouchStart(e, index)
    },
    [onTouchStart, index]
  )

  const handleClick = useCallback(() => {
    onClick(index)
  }, [onClick, index])

  return (
    <motion.circle
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      cx={point.x}
      cy={point.y}
      r={5}
      fill='red'
      stroke='white'
      strokeWidth={1}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={e => {
        e.preventDefault()
        handleClick()
        onMouseLeave()
      }}
      style={{
        cursor: 'pointer',
        touchAction: 'none',
      }}
    />
  )
})

// Memoized text component
const TextElement = memo<{
  text: Text
  index: number
  onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => void
  onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => void
  onMouseLeave: () => void
  onClick: (index: number) => void
}>(({ text, index, onMouseEnter, onTouchStart, onMouseLeave, onClick }) => {
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      onMouseEnter(e, index)
    },
    [onMouseEnter, index]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGElement>) => {
      onTouchStart(e, index)
    },
    [onTouchStart, index]
  )

  const handleClick = useCallback(() => {
    onClick(index)
  }, [onClick, index])

  return (
    <motion.text
      initial={{ opacity: 0 }}
      animate={{ opacity: typeof text.opacity === 'number' ? text.opacity : 1 }}
      transition={{ duration: 0.2 }}
      x={text.position.x}
      y={text.position.y}
      fill={text.color || 'black'}
      fontFamily={text.fontFamily || 'Arial'}
      fontSize={text.fontSize || '14px'}
      textAnchor='middle'
      dominantBaseline='middle'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={e => {
        e.preventDefault()
        handleClick()
        onMouseLeave()
      }}
      style={{
        cursor: 'pointer',
        touchAction: 'none',
      }}
    >
      {text.text}
    </motion.text>
  )
})

const handleTouch = (
  e: React.TouchEvent<SVGElement>,
  rect: DOMRect
): { x: number; y: number } => {
  const touch = e.touches[0]
  if (!touch) return { x: 0, y: 0 }

  const isMobile = window.matchMedia('(max-width: 768px)').matches
  return {
    x: touch.clientX,
    y: touch.clientY - (isMobile ? 60 : 40),
  }
}

const handleMouse = (rect: DOMRect): { x: number; y: number } => {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const scaleFactor = isMobile ? 1.5 : 1
  return {
    x: rect.left + (rect.width * scaleFactor) / 2,
    y: rect.top - (isMobile ? 44 : 0),
  }
}

const SvgGraphCanvas: React.FC<SvgGraphCanvasProps> = ({
  width,
  height,
  drawingStrategy,
  points,
  lines,
  shapes,
  texts,
  config,
  zoom = 1,
  offset = { x: 0, y: 0 },
  onElementClick,
}) => {
  // Using useRef to avoid unnecessary re-renders of tooltip state
  const tooltipRef = useRef<TooltipState>({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  })
  const [tooltipState, setTooltipState] = useState<TooltipState>(
    tooltipRef.current
  )

  const isMobile = useMemo(
    () => window.matchMedia('(max-width: 768px)').matches,
    []
  )

  // Tooltip updates with throttling
  const updateTooltip = useCallback(
    throttle((newState: TooltipState) => {
      tooltipRef.current = newState
      setTooltipState(newState)
    }, 50),
    []
  )

  const handleMouseLeave = useCallback(() => {
    updateTooltip({ ...tooltipRef.current, visible: false })
  }, [updateTooltip])

  const createHandlers = (type: string): ElementEventHandlers => ({
    onMouseEnter: (e: React.MouseEvent<SVGElement>, index: number) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = handleMouse(rect)
      updateTooltip({
        visible: true,
        content: `${type} ${index + 1}`,
        x: pos.x,
        y: pos.y,
      })
    },
    onTouchStart: (e: React.TouchEvent<SVGElement>, index: number) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = handleTouch(e, rect)
      updateTooltip({
        visible: true,
        content: `${type} ${index + 1}`,
        x: pos.x,
        y: pos.y,
      })
    },
    onMouseLeave: handleMouseLeave,
    onClick: (index: number) =>
      onElementClick?.(type.toLowerCase(), index, shapes[index]),
  })

  // Memoized handlers for each element type
  const shapeHandlers = useMemo(() => createHandlers('Shape'), [])
  const lineHandlers = useMemo(() => createHandlers('Line'), [])
  const pointHandlers = useMemo(() => createHandlers('Point'), [])
  const textHandlers = useMemo(() => createHandlers('Text'), [])

  // Handler for mouse tooltips
  const handleElementMouse = useCallback(
    (e: React.MouseEvent<SVGElement>, type: string, idx: number): void => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = handleMouse(rect)
      updateTooltip({
        visible: true,
        content: `${type} ${idx + 1}`,
        x: pos.x,
        y: pos.y,
      })
    },
    [updateTooltip]
  )

  // Handler for touch tooltips
  const handleElementTouch = useCallback(
    (e: React.TouchEvent<SVGElement>, type: string, idx: number): void => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = handleTouch(e, rect)
      updateTooltip({
        visible: true,
        content: `${type} ${idx + 1}`,
        x: pos.x,
        y: pos.y,
      })
    },
    [updateTooltip]
  )

  // Create viewBox to center the content
  const viewBox = useMemo(() => {
    const centerX = width / 2
    const centerY = height / 2
    return `${-centerX} ${-centerY} ${width} ${height}`
  }, [width, height])

  const svgContent = useMemo(() => {
    return drawingStrategy.renderSvg({
      points,
      lines,
      shapes,
      texts,
      ...(config && { config }),
      ...(zoom !== undefined && { zoom }),
      ...(offset !== undefined && { offset }),
    })
  }, [drawingStrategy, points, lines, shapes, texts, config, zoom, offset])

  // Mobile-optimized styles
  const styles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      background: 'white',
    }

    if (isMobile) {
      return {
        ...baseStyles,
        '--touch-target-size': '44px',
        '--tooltip-offset': '20px',
        strokeWidth: '3px',
      } as React.CSSProperties
    }

    return baseStyles
  }, [isMobile])

  // Handler for touch event tooltips
  const handleTooltipTouch = useCallback(
    (e: React.TouchEvent<SVGElement>, type: string, idx: number, data: any) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = handleTouch(e, rect)
      updateTooltip({
        visible: true,
        content: `${type} ${idx + 1}`,
        x: pos.x,
        y: pos.y,
      })
    },
    [updateTooltip]
  )

  // Handler for mouse event tooltips
  const handleTooltipMouse = useCallback(
    (e: React.MouseEvent<SVGElement>, type: string, idx: number) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = handleMouse(rect)
      updateTooltip({
        visible: true,
        content: `${type} ${idx + 1}`,
        x: pos.x,
        y: pos.y,
      })
    },
    [updateTooltip]
  )

  const renderContent = () => (
    <>
      {shapes.map((shape, index) => (
        <ShapeElement
          key={`shape-${index}`}
          shape={shape}
          index={index}
          onMouseEnter={e => shapeHandlers.onMouseEnter(e, index)}
          onTouchStart={e => shapeHandlers.onTouchStart(e, index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => onElementClick?.('shape', index, shape)}
        />
      ))}

      {lines.map((line, index) => (
        <LineElement
          key={`line-${index}`}
          line={line}
          index={index}
          onMouseEnter={e => lineHandlers.onMouseEnter(e, index)}
          onTouchStart={e => lineHandlers.onTouchStart(e, index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => onElementClick?.('line', index, line)}
        />
      ))}

      {points.map((point, index) => (
        <PointElement
          key={`point-${index}`}
          point={point}
          index={index}
          onMouseEnter={e => pointHandlers.onMouseEnter(e, index)}
          onTouchStart={e => pointHandlers.onTouchStart(e, index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => onElementClick?.('point', index, point)}
        />
      ))}

      {texts.map((text, index) => (
        <TextElement
          key={`text-${index}`}
          text={text}
          index={index}
          onMouseEnter={e => textHandlers.onMouseEnter(e, index)}
          onTouchStart={e => textHandlers.onTouchStart(e, index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => onElementClick?.('text', index, text)}
        />
      ))}
    </>
  )

  // Render main SVG component
  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={styles as any}
      preserveAspectRatio='xMidYMid meet'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onTouchStart={e => e.preventDefault()}
    >
      <motion.g transform={`translate(${width / 2},${height / 2})`}>
        <motion.g transform={`translate(${width / 2},${height / 2})`}>
          {renderContent()}
        </motion.g>
      </motion.g>

      <AnimatePresence>
        {tooltipState.visible && (
          <motion.foreignObject
            x={tooltipState.x - 50}
            y={tooltipState.y - 30}
            width='100'
            height='30'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {tooltipState.content}
            </div>
          </motion.foreignObject>
        )}
      </AnimatePresence>
    </motion.svg>
  )
}

export default SvgGraphCanvas
