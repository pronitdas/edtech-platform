import { Point, Line, Shape, Text, Offset } from '@/types/geometry'
import { InteractiveMathConfig } from '@/types/graph'

// Define an interface for SVG drawing strategies
export interface SvgDrawingStrategy {
  renderSvg(data: {
    points: Point[]
    lines: Line[]
    shapes: Shape[]
    texts: Text[]
    config?: InteractiveMathConfig
    zoom?: number
    offset?: Offset
  }): string
}

// Optimized SVG drawing strategy with caching and batching
export class BasicSvgDrawingStrategy implements SvgDrawingStrategy {
  private lastTransformedData: {
    points: Point[]
    shapes: Shape[]
    lines: Line[]
    texts: Text[]
    zoom: number
    offset: Offset
  } | null = null

  private lastSvgContent: string = ''

  private transformPoint(
    point: Point,
    zoom: number = 1,
    offset: Offset = { x: 0, y: 0 }
  ): Point {
    return {
      x: point.x * zoom + offset.x,
      y: point.y * zoom + offset.y,
    }
  }

  // Check if transformation data has changed
  private hasDataChanged(newData: {
    points: Point[]
    shapes: Shape[]
    lines: Line[]
    texts: Text[]
    zoom: number
    offset: Offset
  }): boolean {
    if (!this.lastTransformedData) return true

    const { points, shapes, lines, texts, zoom, offset } = newData
    const last = this.lastTransformedData

    return (
      zoom !== last.zoom ||
      offset.x !== last.offset.x ||
      offset.y !== last.offset.y ||
      points.length !== last.points.length ||
      shapes.length !== last.shapes.length ||
      lines.length !== last.lines.length ||
      texts.length !== last.texts.length ||
      JSON.stringify([points, shapes, lines, texts]) !==
        JSON.stringify([last.points, last.shapes, last.lines, last.texts])
    )
  }

  // Transform all elements in a batch
  private transformElements(data: {
    points: Point[]
    shapes: Shape[]
    lines: Line[]
    texts: Text[]
    zoom: number
    offset: Offset
  }) {
    const { zoom, offset } = data

    return {
      transformedPoints: data.points.map(point =>
        this.transformPoint(point, zoom, offset)
      ),
      transformedShapes: data.shapes.map(shape => ({
        ...shape,
        topLeft: shape.topLeft
          ? this.transformPoint(shape.topLeft, zoom, offset)
          : undefined,
        bottomRight: shape.bottomRight
          ? this.transformPoint(shape.bottomRight, zoom, offset)
          : undefined,
        center: shape.center
          ? this.transformPoint(shape.center, zoom, offset)
          : undefined,
      })),
      transformedLines: data.lines.map(line => ({
        ...line,
        start: this.transformPoint(line.start, zoom, offset),
        end: this.transformPoint(line.end, zoom, offset),
      })),
      transformedTexts: data.texts.map(text => ({
        ...text,
        position: this.transformPoint(text.position, zoom, offset),
      })),
    }
  }

  renderSvg(data: {
    points: Point[]
    lines: Line[]
    shapes: Shape[]
    texts: Text[]
    config?: InteractiveMathConfig
    zoom?: number
    offset?: Offset
  }): string {
    const zoom = data.zoom || 1
    const offset = data.offset || { x: 0, y: 0 }
    const transformData = {
      points: data.points,
      shapes: data.shapes,
      lines: data.lines,
      texts: data.texts,
      zoom,
      offset,
    }

    // Check if we can use cached content
    if (!this.hasDataChanged(transformData)) {
      return this.lastSvgContent
    }

    // Transform all elements in a batch
    const {
      transformedPoints,
      transformedShapes,
      transformedLines,
      transformedTexts,
    } = this.transformElements(transformData)

    // Build SVG content using array joins instead of string concatenation
    const elements: string[] = []

    // Add shapes (background layer)
    transformedShapes.forEach(shape => {
      if (shape.type === 'rectangle' && shape.topLeft && shape.bottomRight) {
        const width = shape.bottomRight.x - shape.topLeft.x
        const height = shape.bottomRight.y - shape.topLeft.y
        elements.push(
          `<rect x="${shape.topLeft.x}" y="${shape.topLeft.y}" ` +
            `width="${width}" height="${height}" ` +
            `fill="${shape.fill || 'rgba(200, 200, 200, 0.5)'}" ` +
            `stroke="${shape.stroke || 'gray'}" ` +
            `stroke-width="${shape.strokeWidth || 1}"/>`
        )
      } else if (shape.type === 'circle' && shape.center && shape.radius) {
        elements.push(
          `<circle cx="${shape.center.x}" cy="${shape.center.y}" ` +
            `r="${shape.radius}" ` +
            `fill="${shape.fill || 'rgba(200, 200, 200, 0.5)'}" ` +
            `stroke="${shape.stroke || 'gray'}" ` +
            `stroke-width="${shape.strokeWidth || 1}"/>`
        )
      }
    })

    // Add lines
    transformedLines.forEach(line => {
      elements.push(
        `<line x1="${line.start.x}" y1="${line.start.y}" ` +
          `x2="${line.end.x}" y2="${line.end.y}" ` +
          `stroke="${line.color || 'blue'}" ` +
          `stroke-width="${line.strokeWidth || 2}" ` +
          `vector-effect="non-scaling-stroke"/>`
      )
    })

    // Add points
    transformedPoints.forEach(point => {
      elements.push(
        `<circle cx="${point.x}" cy="${point.y}" ` +
          `r="5" fill="red" stroke="white" stroke-width="1"/>`
      )
    })

    // Add texts (top layer)
    transformedTexts.forEach(text => {
      elements.push(
        `<text x="${text.position.x}" y="${text.position.y}" ` +
          `fill="${text.color || 'black'}" ` +
          `font-family="${text.fontFamily || 'Arial'}" ` +
          `font-size="${text.fontSize || '14px'}" ` +
          `text-anchor="middle" dominant-baseline="middle">` +
          `${text.text}</text>`
      )
    })

    // Cache transformed data and SVG content
    this.lastTransformedData = transformData
    this.lastSvgContent = elements.join('')

    return this.lastSvgContent
  }
}
