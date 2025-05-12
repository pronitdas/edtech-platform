import p5 from 'p5';

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
    drawOnCanvas(p: p5): void;
}

export interface InteractiveMathConfig {
    equation: string;
    xRange: [number, number];
    yRange: [number, number];
    stepSize: number;
}