import React, { useMemo } from 'react'

/**
 * GraphCanvas Performance Optimizations (WP-108)
 *
 * SVG Mode Improvements:
 * - Memoized sub-components (ShapeElement, LineElement, etc.) to prevent unnecessary re-renders
 * - Throttled tooltip updates to reduce state updates
 * - Removed complex animations for large datasets
 * - Cached rendered content in SvgDrawingStrategy
 * - Efficient string operations using array joins
 *
 * P5.js Mode Improvements:
 * - Throttled mouse event handlers (move, drag)
 * - Debounced click detection to prevent double triggers
 * - Optimized zoom/pan calculations
 * - RequestAnimationFrame for smoother rendering
 * - Better event cleanup and memory management
 * - Cached point transformations
 *
 * General Improvements:
 * - Stricter TypeScript types
 * - Better separation of concerns
 * - Optimized rendering paths for both modes
 * - Improved performance with large datasets
 */
import p5 from 'p5'
import { Point, Offset, Line, Shape, Text } from '@/types/geometry'
import { DrawingStrategy, InteractiveMathConfig } from '@/types/graph'
import { DrawingTool } from '@/components/interactive/slope/types'
import CoreGraphCanvas from './GraphCanvas/CoreGraphCanvas'
import { GenericDrawingStrategy } from './GraphCanvas/strategies/GenericDrawingStrategy'
import { SlopeDrawingStrategy } from './GraphCanvas/strategies/SlopeDrawingStrategy'
import SvgGraphCanvas from './SvgGraphCanvas'
import {
  SvgDrawingStrategy,
  BasicSvgDrawingStrategy,
} from './GraphCanvas/strategies/SvgDrawingStrategy'

// Define common props for all graph canvas variants
interface GraphCanvasCommonProps {
  width: number
  height: number
  zoom: number
  offset: Offset
  onZoomChange: (zoom: number) => void
  onOffsetChange: (offset: Offset) => void
  mapPointToCanvas: (point: Point) => Point
  mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point
  onElementClick?: (type: string, index: number, data: any) => void
}

// Define props for P5 generic drawing mode
interface P5GenericProps extends GraphCanvasCommonProps {
  renderingMode?: 'p5'
  drawingMode: 'generic'
  p5Setup: (p: p5) => void
  p5Drawing: (p: p5) => void
}

// Define props for P5 slope drawing mode
interface P5SlopeProps extends GraphCanvasCommonProps {
  renderingMode?: 'p5'
  drawingMode: 'slope'
  slopeConfig: InteractiveMathConfig
  points: Point[]
  onPointsChange: (points: Point[]) => void
  highlightSolution: boolean
  editMode: boolean
  drawingTool: DrawingTool
  onDrawingToolChange: (tool: DrawingTool) => void
  customPoints: Point[]
  customLines: Line[]
  shapes: Shape[]
  texts: Text[]
  selectedItem: string | null
  setSelectedItem: (id: string | null) => void
  undoStack: any[]
  setUndoStack: (stack: any[]) => void
  redoStack: any[]
  setRedoStack: (stack: any[]) => void
}

// Define props for SVG rendering mode
interface SvgProps extends GraphCanvasCommonProps {
  renderingMode: 'svg'
  points: Point[]
  lines: Line[]
  shapes: Shape[]
  texts: Text[]
}

// Combine all possible prop types
type GraphCanvasProps = P5GenericProps | P5SlopeProps | SvgProps

type P5Props = P5GenericProps | P5SlopeProps

const GraphCanvas: React.FC<GraphCanvasProps> = props => {
  // Type guards
  const isSvgProps = (p: GraphCanvasProps): p is SvgProps =>
    p.renderingMode === 'svg'

  const isP5Props = (p: GraphCanvasProps): p is P5Props =>
    p.renderingMode !== 'svg'

  const {
    width,
    height,
    zoom,
    offset,
    onZoomChange,
    onOffsetChange,
    mapPointToCanvas,
    mapCanvasToPoint,
    renderingMode = 'p5',
    onElementClick,
  } = props

  const svgDrawingStrategy = useMemo(() => new BasicSvgDrawingStrategy(), [])

  const p5DrawingStrategy = useMemo<DrawingStrategy | null>(() => {
    if (!isP5Props(props)) return null

    const commonProps = {
      width,
      height,
      zoom,
      offset,
      mapPointToCanvas,
      mapCanvasToPoint,
    }

    if (props.drawingMode === 'generic') {
      return new GenericDrawingStrategy({
        ...commonProps,
        drawingMode: 'generic',
        p5Setup: props.p5Setup,
        p5Drawing: props.p5Drawing,
      })
    } else {
      return new SlopeDrawingStrategy({
        points: props.points,
        customPoints: props.customPoints,
        customLines: props.customLines,
        shapes: props.shapes,
        texts: props.texts,
        mapPointToCanvas: commonProps.mapPointToCanvas,
        mapCanvasToPoint: commonProps.mapCanvasToPoint,
        zoom: commonProps.zoom,
        offset: commonProps.offset,
        highlightSolution: props.highlightSolution,
        editMode: props.editMode,
        drawingTool: props.drawingTool,
        onPointsChange: props.onPointsChange,
        onCustomPointsChange: (points) => {
          // Update custom points if needed - for now just log
          console.log('Custom points changed:', points)
        },
        onCustomLinesChange: (lines) => {
          // Update custom lines if needed - for now just log
          console.log('Custom lines changed:', lines)
        },
      })
    }
  }, [props, width, height, zoom, offset, mapPointToCanvas, mapCanvasToPoint])

  if (isSvgProps(props)) {
    const { points, lines, shapes, texts } = props
    return (
      <SvgGraphCanvas
        width={width}
        height={height}
        drawingStrategy={svgDrawingStrategy}
        points={points}
        lines={lines}
        shapes={shapes}
        texts={texts}
        {...(onElementClick && { onElementClick })}
      />
    )
  } else {
    if (!p5DrawingStrategy) {
      return <div>Error: Drawing strategy not available</div>
    }

    // Update strategy configuration when props change
    if (isP5Props(props) && props.drawingMode === 'slope' && p5DrawingStrategy.updateConfig) {
      p5DrawingStrategy.updateConfig({
        points: props.points,
        customPoints: props.customPoints,
        customLines: props.customLines,
        shapes: props.shapes,
        texts: props.texts,
        zoom,
        offset,
        drawingTool: props.drawingTool,
        editMode: props.editMode,
        highlightSolution: props.highlightSolution,
      })
    }

    return (
      <CoreGraphCanvas
        width={width}
        height={height}
        zoom={zoom}
        offset={offset}
        onZoomChange={onZoomChange}
        onOffsetChange={onOffsetChange}
        mapPointToCanvas={mapPointToCanvas}
        mapCanvasToPoint={mapCanvasToPoint}
        drawingStrategy={p5DrawingStrategy}
        {...(onElementClick && { onElementClick })}
      />
    )
  }
}

export default GraphCanvas
