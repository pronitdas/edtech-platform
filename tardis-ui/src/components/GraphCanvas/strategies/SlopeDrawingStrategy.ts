import p5 from 'p5'
import { DrawingStrategy, InteractiveElement } from '../../../types/graph'
import { Point, Line, Shape, Text } from '../../../types/geometry'
import { DrawingTool, Offset } from '../../interactive/slope/types'

interface SlopeDrawingStrategyConfig {
  points: Point[]
  customPoints: Point[]
  customLines: Line[]
  shapes: Shape[]
  texts: Text[]
  mapPointToCanvas: (point: Point) => { x: number; y: number }
  mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point
  zoom: number
  offset: Offset
  highlightSolution: boolean
  editMode: boolean
  drawingTool: DrawingTool
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: [number, number, number]
  size: number
}

export class SlopeDrawingStrategy implements DrawingStrategy {
  private points: Point[]
  private customPoints: Point[]
  private customLines: Line[]
  private shapes: Shape[]
  private texts: Text[]
  private mapPointToCanvas: (point: Point) => { x: number; y: number }
  private mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point
  private zoom: number
  private offset: Offset
  private highlightSolution: boolean
  private editMode: boolean
  private drawingTool: DrawingTool
  private particles: Particle[] = []
  private animationTime: number = 0

  constructor(config: SlopeDrawingStrategyConfig) {
    this.points = config.points
    this.customPoints = config.customPoints
    this.customLines = config.customLines
    this.shapes = config.shapes
    this.texts = config.texts
    this.mapPointToCanvas = config.mapPointToCanvas
    this.mapCanvasToPoint = config.mapCanvasToPoint
    this.zoom = config.zoom
    this.offset = config.offset
    this.highlightSolution = config.highlightSolution
    this.editMode = config.editMode
    this.drawingTool = config.drawingTool
  }

  drawOnCanvas(p: p5): void {
    // Adapted drawing logic from tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx (lines 130-141)
    // Helper functions are included or adapted here.

    const drawGrid = (p: p5) => {
      p.stroke(220, 220, 220)
      p.strokeWeight(0.5)

      // Grid spacing in world coordinates (1 unit)
      const gridSpacing = 1

      // Find the visible world coordinate range
      const topLeft = this.mapCanvasToPoint({ x: 0, y: 0 })
      const bottomRight = this.mapCanvasToPoint({ x: p.width, y: p.height })

      // Draw vertical grid lines
      const minX = Math.floor(topLeft.x / gridSpacing) * gridSpacing
      const maxX = Math.ceil(bottomRight.x / gridSpacing) * gridSpacing

      for (let x = minX; x <= maxX; x += gridSpacing) {
        const startCanvas = this.mapPointToCanvas({ x, y: topLeft.y })
        const endCanvas = this.mapPointToCanvas({ x, y: bottomRight.y })
        if (startCanvas.x >= 0 && startCanvas.x <= p.width) {
          p.line(startCanvas.x, 0, endCanvas.x, p.height)
        }
      }

      // Draw horizontal grid lines
      const minY = Math.floor(bottomRight.y / gridSpacing) * gridSpacing
      const maxY = Math.ceil(topLeft.y / gridSpacing) * gridSpacing

      for (let y = minY; y <= maxY; y += gridSpacing) {
        const startCanvas = this.mapPointToCanvas({ x: topLeft.x, y })
        const endCanvas = this.mapPointToCanvas({ x: bottomRight.x, y })
        if (startCanvas.y >= 0 && startCanvas.y <= p.height) {
          p.line(0, startCanvas.y, p.width, endCanvas.y)
        }
      }
    }

    const drawAxes = (p: p5) => {
      p.stroke(0)
      p.strokeWeight(2)

      // Calculate axis positions - axes should go through origin (0,0) in world coordinates
      const origin = this.mapPointToCanvas({ x: 0, y: 0 })

      // Draw X-axis (horizontal line through origin)
      if (origin.y >= 0 && origin.y <= p.height) {
        p.line(0, origin.y, p.width, origin.y)
      }

      // Draw Y-axis (vertical line through origin)
      if (origin.x >= 0 && origin.x <= p.width) {
        p.line(origin.x, 0, origin.x, p.height)
      }

      // Draw axis labels and tick marks
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(10)
      p.fill(100)

      // X-axis labels
      if (origin.y >= 10 && origin.y <= p.height - 10) {
        for (let x = -10; x <= 10; x++) {
          if (x === 0) continue // Skip origin
          const canvasPoint = this.mapPointToCanvas({ x, y: 0 })
          if (canvasPoint.x >= 0 && canvasPoint.x <= p.width) {
            p.text(x.toString(), canvasPoint.x, canvasPoint.y + 15)
            // Tick mark
            p.stroke(0)
            p.line(
              canvasPoint.x,
              canvasPoint.y - 3,
              canvasPoint.x,
              canvasPoint.y + 3
            )
          }
        }
      }

      // Y-axis labels
      if (origin.x >= 10 && origin.x <= p.width - 10) {
        for (let y = -10; y <= 10; y++) {
          if (y === 0) continue // Skip origin
          const canvasPoint = this.mapPointToCanvas({ x: 0, y })
          if (canvasPoint.y >= 0 && canvasPoint.y <= p.height) {
            p.text(y.toString(), canvasPoint.x - 15, canvasPoint.y)
            // Tick mark
            p.stroke(0)
            p.line(
              canvasPoint.x - 3,
              canvasPoint.y,
              canvasPoint.x + 3,
              canvasPoint.y
            )
          }
        }
      }
    }

    const drawPointsAndLine = (p: p5) => {
      if (this.points.length > 0) {
        // Animated line with gradient effect
        p.strokeWeight(3)
        p.noFill()

        if (this.points.length >= 2 && this.points[0] && this.points[1]) {
          // Draw gradient line
          const point1 = this.mapPointToCanvas(this.points[0])
          const point2 = this.mapPointToCanvas(this.points[1])

          // Create gradient effect manually
          for (let i = 0; i < 100; i++) {
            const t = i / 99
            const x = p.lerp(point1.x, point2.x, t)
            const y = p.lerp(point1.y, point2.y, t)

            // Animate color transition
            const hue = (this.animationTime * 0.5 + t * 60) % 360
            p.colorMode(p.HSB, 360, 100, 100)
            p.stroke(hue, 80, 90, 0.8)
            p.strokeWeight(3 + Math.sin(this.animationTime * 0.02 + t * 10) * 1)

            if (i > 0) {
              const prevT = (i - 1) / 99
              const prevX = p.lerp(point1.x, point2.x, prevT)
              const prevY = p.lerp(point1.y, point2.y, prevT)
              p.line(prevX, prevY, x, y)
            }
          }
          p.colorMode(p.RGB, 255)
        }

        // Draw animated points with glow effect
        this.points.forEach((point, index) => {
          const canvasPoint = this.mapPointToCanvas(point)
          const pulseSize =
            12 + Math.sin(this.animationTime * 0.05 + index * 2) * 4

          // Outer glow
          p.fill(100, 200, 255, 50)
          p.noStroke()
          p.ellipse(canvasPoint.x, canvasPoint.y, pulseSize * 2, pulseSize * 2)

          // Main point
          p.fill(255, 100, 100)
          p.stroke(255, 255, 255)
          p.strokeWeight(2)
          p.ellipse(canvasPoint.x, canvasPoint.y, pulseSize, pulseSize)

          // Create particles around active points
          if (Math.random() < 0.1) {
            this.createParticle(canvasPoint.x, canvasPoint.y, [100, 200, 255])
          }
        })
      }
    }

    const drawCustomItems = (p: p5) => {
      // Draw custom points
      p.fill(0, 255, 0) // Green color for custom points
      p.noStroke()
      this.customPoints.forEach(point => {
        const canvasPoint = this.mapPointToCanvas(point)
        p.ellipse(canvasPoint.x, canvasPoint.y, 10, 10)
      })

      // Draw custom lines
      p.stroke(255, 165, 0) // Orange color for custom lines
      p.strokeWeight(2)
      this.customLines.forEach(line => {
        const start = this.mapPointToCanvas(line.start)
        const end = this.mapPointToCanvas(line.end)
        p.line(start.x, start.y, end.x, end.y)
      })

      // Draw shapes (basic example: rectangles)
      p.fill(128, 0, 128, 100) // Purple with transparency
      p.noStroke()
      this.shapes.forEach(shape => {
        if (shape.type === 'rectangle' && shape.topLeft && shape.bottomRight) {
          const topLeft = this.mapPointToCanvas(shape.topLeft)
          const bottomRight = this.mapPointToCanvas(shape.bottomRight)
          p.rect(
            topLeft.x,
            topLeft.y,
            bottomRight.x - topLeft.x,
            bottomRight.y - topLeft.y
          )
        }
        // Add other shape types as needed
      })

      // Draw texts
      p.fill(0) // Black color for text
      p.textSize(16)
      this.texts.forEach(textItem => {
        const canvasPoint = this.mapPointToCanvas(textItem.position)
        p.text(textItem.text, canvasPoint.x, canvasPoint.y)
      })
    }

    // Update animation time
    this.animationTime++

    // Update and draw particles
    this.updateParticles(p)

    // Main drawing logic with enhanced effects
    drawGrid(p)
    drawAxes(p)
    drawPointsAndLine(p)
    drawCustomItems(p)

    // Draw particles
    this.drawParticles(p)

    // Add tool-specific visual feedback
    this.drawToolFeedback(p)
  }

  findElementAtPoint(point: Point): InteractiveElement | null {
    const hitTestDistance = 10 // Distance in pixels for hit testing

    // Convert point to canvas coordinates for hit testing
    const targetPoint = this.mapPointToCanvas(point)

    // Check custom points first
    for (let i = 0; i < this.customPoints.length; i++) {
      const customPoint = this.customPoints[i]
      if (!customPoint) continue
      const canvasPoint = this.mapPointToCanvas(customPoint)
      const distance = Math.sqrt(
        Math.pow(canvasPoint.x - targetPoint.x, 2) +
          Math.pow(canvasPoint.y - targetPoint.y, 2)
      )
      if (distance <= hitTestDistance) {
        return {
          type: 'custom-point',
          index: i,
          data: customPoint,
        }
      }
    }

    // Check main points
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i]
      if (!point) continue
      const canvasPoint = this.mapPointToCanvas(point)
      const distance = Math.sqrt(
        Math.pow(canvasPoint.x - targetPoint.x, 2) +
          Math.pow(canvasPoint.y - targetPoint.y, 2)
      )
      if (distance <= hitTestDistance) {
        return {
          type: 'point',
          index: i,
          data: this.points[i],
        }
      }
    }

    // Check lines (check if point is near line segment)
    for (let i = 0; i < this.customLines.length; i++) {
      const line = this.customLines[i]
      if (!line || !line.start || !line.end) continue
      const start = this.mapPointToCanvas(line.start)
      const end = this.mapPointToCanvas(line.end)

      // Distance from point to line segment
      const distance = this.pointToLineDistance(targetPoint, start, end)

      if (distance <= hitTestDistance) {
        return {
          type: 'line',
          index: i,
          data: line,
        }
      }
    }

    // Check shapes
    for (let i = 0; i < this.shapes.length; i++) {
      const shape = this.shapes[i]
      if (!shape) continue
      if (shape.type === 'rectangle' && shape.topLeft && shape.bottomRight) {
        const topLeft = this.mapPointToCanvas(shape.topLeft)
        const bottomRight = this.mapPointToCanvas(shape.bottomRight)

        if (
          targetPoint.x >= topLeft.x &&
          targetPoint.x <= bottomRight.x &&
          targetPoint.y >= topLeft.y &&
          targetPoint.y <= bottomRight.y
        ) {
          return {
            type: 'shape',
            index: i,
            data: shape,
          }
        }
      }
    }

    // Check texts
    for (let i = 0; i < this.texts.length; i++) {
      const textItem = this.texts[i]
      if (!textItem || !textItem.position) continue
      const textPoint = this.mapPointToCanvas(textItem.position)
      const distance = Math.sqrt(
        Math.pow(textPoint.x - targetPoint.x, 2) +
          Math.pow(textPoint.y - targetPoint.y, 2)
      )
      if (distance <= hitTestDistance * 2) {
        // Larger hit area for text
        return {
          type: 'text',
          index: i,
          data: textItem,
        }
      }
    }

    return null
  }

  private pointToLineDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  private createParticle(
    x: number,
    y: number,
    color: [number, number, number]
  ) {
    const particle: Particle = {
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 60,
      maxLife: 60,
      color,
      size: Math.random() * 3 + 1,
    }
    this.particles.push(particle)
  }

  private updateParticles(p: p5) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      if (!particle) continue
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--
      particle.vy += 0.1 // gravity

      if (particle.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private drawParticles(p: p5) {
    p.noStroke()
    this.particles.forEach(particle => {
      const alpha = (particle.life / particle.maxLife) * 255
      p.fill(particle.color[0], particle.color[1], particle.color[2], alpha)
      p.ellipse(particle.x, particle.y, particle.size, particle.size)
    })
  }

  private drawToolFeedback(p: p5) {
    // Add visual feedback based on current drawing tool
    switch (this.drawingTool) {
      case 'point':
        // Show crosshair cursor effect
        p.stroke(255, 255, 0, 150)
        p.strokeWeight(1)
        const mousePos = { x: p.mouseX, y: p.mouseY }
        p.line(mousePos.x - 10, mousePos.y, mousePos.x + 10, mousePos.y)
        p.line(mousePos.x, mousePos.y - 10, mousePos.x, mousePos.y + 10)
        break
      case 'solidLine':
        // Show line preview
        p.stroke(255, 255, 0, 100)
        p.strokeWeight(2)
        break
      case 'text':
        // Show text placement indicator
        p.fill(255, 255, 0, 100)
        p.noStroke()
        p.rect(p.mouseX - 2, p.mouseY - 10, 4, 20)
        break
    }
  }
}
