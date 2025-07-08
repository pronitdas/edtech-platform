import p5 from 'p5'
import { Point } from './geometry'

/**
 * Represents an interactive element found at a specific point
 */
export interface InteractiveElement {
  type: string
  index: number
  data: any
}

/**
 * Defines the interface for a drawing strategy used by the GraphCanvas.
 * Different implementations of this interface will handle the specific
 * drawing logic for different graph types or modes.
 */
export interface DrawingStrategy {
  /**
   * Draws the content onto the provided p5 canvas instance.
   * @param p The p5 instance to draw on.
   */
  drawOnCanvas(p: p5): void

  /**
   * Finds an interactive element at the given point.
   * @param point The point to check in graph coordinates
   * @returns The element found at the point, or null if none found
   */
  findElementAtPoint(point: Point): InteractiveElement | null

  /**
   * Handles canvas click interactions for drawing tools.
   * @param canvasPoint The point clicked in canvas coordinates
   * @returns True if the click was handled, false otherwise
   */
  handleCanvasClick?(canvasPoint: { x: number; y: number }): boolean

  /**
   * Updates the strategy configuration with new values.
   * @param config Partial configuration to update
   */
  updateConfig?(config: any): void

  /**
   * Enables or disables mobile-specific optimizations.
   * @param enabled Whether mobile mode should be enabled
   */
  setMobileMode?(enabled: boolean): void

  /**
   * Get the touch interaction sensitivity.
   * Default implementation returns a standard hit testing distance.
   */
  getTouchSensitivity?(): number
}

export interface InteractiveMathConfig {
  equation: string
  xRange: [number, number]
  yRange: [number, number]
  stepSize: number
}
