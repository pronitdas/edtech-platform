import p5 from 'p5'
import {
  DrawingStrategy,
  InteractiveMathConfig,
  InteractiveElement,
} from '../../../types/graph'
import { Point } from '@/types/geometry'

interface GenericDrawingStrategyConfig {
  p5Setup?: (p: p5) => void
  p5Drawing?: (p: p5) => void
  interactiveMathConfig?: InteractiveMathConfig
  drawingMode: 'generic' | 'interactiveMath'
}

export class GenericDrawingStrategy implements DrawingStrategy {
  private p5Setup?: (p: p5) => void
  private p5Drawing?: (p: p5) => void
  private interactiveMathConfig?: InteractiveMathConfig
  private drawingMode: 'generic' | 'interactiveMath'

  constructor(config: GenericDrawingStrategyConfig) {
    if (config.p5Setup !== undefined) {
      this.p5Setup = config.p5Setup
    }
    if (config.p5Drawing !== undefined) {
      this.p5Drawing = config.p5Drawing
    }
    if (config.interactiveMathConfig !== undefined) {
      this.interactiveMathConfig = config.interactiveMathConfig
    }
    this.drawingMode = config.drawingMode
  }

  drawOnCanvas(p: p5): void {
    if (this.drawingMode === 'generic' && this.p5Drawing) {
      this.p5Drawing(p)
    } else if (
      this.drawingMode === 'interactiveMath' &&
      this.interactiveMathConfig
    ) {
      const { equation, xRange, yRange, stepSize } = this.interactiveMathConfig
      const width = p.width
      const height = p.height

      // Function to safely evaluate mathematical expressions
      const evaluateEquation = (x: number) => {
        try {
          // Safe mathematical expression evaluator - replaces dangerous eval()
          const safeEquation = equation
            .replace(/\bx\b/g, x.toString())
            .replace(/[^0-9+\-*/().\s]/g, '') // Remove any non-mathematical characters
          
          // Use Function constructor for safer evaluation (still allows math expressions)
          const result = new Function('return ' + safeEquation)()
          
          if (typeof result === 'number' && isFinite(result)) {
            return result
          }
          return null
        } catch (error) {
          console.error('Error evaluating equation:', error)
          return null
        }
      }

      // Map x and y values to canvas coordinates
      const mapToCanvasX = (x: number) =>
        p.map(x, xRange[0], xRange[1], 0, width)
      const mapToCanvasY = (y: number) =>
        p.map(y, yRange[0], yRange[1], height, 0)

      // Draw the graph
      p.beginShape()
      for (let x = xRange[0]; x <= xRange[1]; x += stepSize) {
        const y = evaluateEquation(x)
        if (y !== null) {
          const canvasX = mapToCanvasX(x)
          const canvasY = mapToCanvasY(y)
          p.vertex(canvasX, canvasY)
        }
      }
      p.endShape()
    }
  }

  findElementAtPoint(point: Point): InteractiveElement | null {
    if (this.drawingMode === 'interactiveMath' && this.interactiveMathConfig) {
      const { equation, xRange, yRange, stepSize } = this.interactiveMathConfig

      // Check if point is near the graph line
      const evaluateEquation = (x: number) => {
        try {
          return eval(equation)
        } catch (error) {
          return null
        }
      }

      // Calculate y value for the given x coordinate
      const yAtPoint = evaluateEquation(point.x)

      if (yAtPoint !== null) {
        // Check if point is within threshold distance of the line
        const threshold = 0.1 // Adjust this value based on desired sensitivity
        if (Math.abs(yAtPoint - point.y) <= threshold) {
          return {
            type: 'graph-point',
            index: 0,
            data: { x: point.x, y: yAtPoint, equation },
          }
        }
      }
    }

    // For generic mode, we don't have interactive elements by default
    return null
  }
}
