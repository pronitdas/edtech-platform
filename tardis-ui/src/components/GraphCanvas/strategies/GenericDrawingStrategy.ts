import p5 from 'p5';
import { DrawingStrategy, InteractiveMathConfig } from '../../../types/graph'; // Assuming DrawingStrategy and InteractiveMathConfig are defined here

interface GenericDrawingStrategyConfig {
    p5Setup?: (p: p5) => void;
    p5Drawing?: (p: p5) => void;
    interactiveMathConfig?: InteractiveMathConfig;
    drawingMode: 'generic' | 'interactiveMath';
}

export class GenericDrawingStrategy implements DrawingStrategy {
    private p5Setup?: (p: p5) => void;
    private p5Drawing?: (p: p5) => void;
    private interactiveMathConfig?: InteractiveMathConfig;
    private drawingMode: 'generic' | 'interactiveMath';

    constructor(config: GenericDrawingStrategyConfig) {
        this.p5Setup = config.p5Setup;
        this.p5Drawing = config.p5Drawing;
        this.interactiveMathConfig = config.interactiveMathConfig;
        this.drawingMode = config.drawingMode;
    }

    drawOnCanvas(p: p5): void {
        if (this.drawingMode === 'generic' && this.p5Drawing) {
            this.p5Drawing(p);
        } else if (this.drawingMode === 'interactiveMath' && this.interactiveMathConfig) {
            const { equation, xRange, yRange, stepSize } = this.interactiveMathConfig;
            const width = p.width;
            const height = p.height;

            // Function to evaluate the equation
            const evaluateEquation = (x: number) => {
                try {
                    // Use eval() to evaluate the equation (be cautious with user input!)
                    // TODO: Sanitize user input to prevent security vulnerabilities before using eval()
                    const y = eval(equation);
                    return y;
                } catch (error) {
                    console.error('Error evaluating equation:', error);
                    return null;
                }
            };

            // Map x and y values to canvas coordinates
            const mapToCanvasX = (x: number) => p.map(x, xRange[0], xRange[1], 0, width);
            const mapToCanvasY = (y: number) => p.map(y, yRange[0], yRange[1], height, 0);

            // Draw the graph
            p.beginShape();
            for (let x = xRange[0]; x <= xRange[1]; x += stepSize) {
                const y = evaluateEquation(x);
                if (y !== null) {
                    const canvasX = mapToCanvasX(x);
                    const canvasY = mapToCanvasY(y);
                    p.vertex(canvasX, canvasY);
                }
            }
            p.endShape();
        }
    }
}