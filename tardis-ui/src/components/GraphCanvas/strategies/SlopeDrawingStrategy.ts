import p5 from 'p5';
import { DrawingStrategy, InteractiveElement } from '../../../types/graph';
import { Point, Line, Shape, Text } from '../../../types/geometry';
import { DrawingTool, Offset } from '../../interactive/slope/types';

interface SlopeDrawingStrategyConfig {
    points: Point[];
    customPoints: Point[];
    customLines: Line[];
    shapes: Shape[];
    texts: Text[];
    mapPointToCanvas: (point: Point) => { x: number; y: number };
    mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point;
    zoom: number;
    offset: Offset;
    highlightSolution: boolean;
    editMode: boolean;
    drawingTool: DrawingTool;
}

export class SlopeDrawingStrategy implements DrawingStrategy {
    private points: Point[];
    private customPoints: Point[];
    private customLines: Line[];
    private shapes: Shape[];
    private texts: Text[];
    private mapPointToCanvas: (point: Point) => { x: number; y: number };
    private mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point;
    private zoom: number;
    private offset: Offset;
    private highlightSolution: boolean;
    private editMode: boolean;
    private drawingTool: DrawingTool;

    constructor(config: SlopeDrawingStrategyConfig) {
        this.points = config.points;
        this.customPoints = config.customPoints;
        this.customLines = config.customLines;
        this.shapes = config.shapes;
        this.texts = config.texts;
        this.mapPointToCanvas = config.mapPointToCanvas;
        this.mapCanvasToPoint = config.mapCanvasToPoint;
        this.zoom = config.zoom;
        this.offset = config.offset;
        this.highlightSolution = config.highlightSolution;
        this.editMode = config.editMode;
        this.drawingTool = config.drawingTool;
    }

    drawOnCanvas(p: p5): void {
        // Adapted drawing logic from tardis-ui/src/components/interactive/slope/components/GraphCanvas.tsx (lines 130-141)
        // Helper functions are included or adapted here.

        const drawGrid = (p: p5) => {
            p.stroke(200);
            p.strokeWeight(0.5);
            const gridSize = 50 * this.zoom; // Adjust grid size based on zoom

            // Draw vertical lines
            for (let x = this.offset.x % gridSize; x < p.width; x += gridSize) {
                p.line(x, 0, x, p.height);
            }
            for (let x = this.offset.x % gridSize - gridSize; x > 0; x -= gridSize) {
                p.line(x, 0, x, p.height);
            }

            // Draw horizontal lines
            for (let y = this.offset.y % gridSize; y < p.height; y += gridSize) {
                p.line(0, y, p.width, y);
            }
            for (let y = this.offset.y % gridSize - gridSize; y > 0; y -= gridSize) {
                p.line(0, y, p.width, y);
            }
        };

        const drawAxes = (p: p5) => {
            p.stroke(0);
            p.strokeWeight(1);

            // Calculate axis positions based on offset
            const xAxisY = p.height - this.offset.y;
            const yAxisX = this.offset.x;

            // Draw X-axis
            p.line(0, xAxisY, p.width, xAxisY);

            // Draw Y-axis
            p.line(yAxisX, 0, yAxisX, p.height);

            // Draw axis labels (optional, could be added here)
        };

        const drawPointsAndLine = (p: p5) => {
            if (this.points.length > 0) {
                p.stroke(0, 0, 255); // Blue color for the line
                p.strokeWeight(2);
                p.noFill();

                p.beginShape();
                this.points.forEach(point => {
                    const canvasPoint = this.mapPointToCanvas(point);
                    p.vertex(canvasPoint.x, canvasPoint.y);
                });
                p.endShape();

                // Draw points
                p.fill(255, 0, 0); // Red color for points
                p.noStroke();
                this.points.forEach(point => {
                    const canvasPoint = this.mapPointToCanvas(point);
                    p.ellipse(canvasPoint.x, canvasPoint.y, 8, 8); // Draw a circle for each point
                });
            }
        };

        const drawCustomItems = (p: p5) => {
            // Draw custom points
            p.fill(0, 255, 0); // Green color for custom points
            p.noStroke();
            this.customPoints.forEach(point => {
                const canvasPoint = this.mapPointToCanvas(point);
                p.ellipse(canvasPoint.x, canvasPoint.y, 10, 10);
            });

            // Draw custom lines
            p.stroke(255, 165, 0); // Orange color for custom lines
            p.strokeWeight(2);
            this.customLines.forEach(line => {
                const start = this.mapPointToCanvas(line.start);
                const end = this.mapPointToCanvas(line.end);
                p.line(start.x, start.y, end.x, end.y);
            });

            // Draw shapes (basic example: rectangles)
            p.fill(128, 0, 128, 100); // Purple with transparency
            p.noStroke();
            this.shapes.forEach(shape => {
                if (shape.type === 'rectangle') {
                    const topLeft = this.mapPointToCanvas(shape.topLeft);
                    const bottomRight = this.mapPointToCanvas(shape.bottomRight);
                    p.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
                }
                // Add other shape types as needed
            });

            // Draw texts
            p.fill(0); // Black color for text
            p.textSize(16);
            this.texts.forEach(textItem => {
                const canvasPoint = this.mapPointToCanvas(textItem.position);
                p.text(textItem.text, canvasPoint.x, canvasPoint.y);
            });
        };


        // Main drawing logic
        drawGrid(p);
        drawAxes(p);
        drawPointsAndLine(p);
        drawCustomItems(p);

        // Add logic for highlightSolution, editMode, drawingTool if needed for visual feedback
        // For example, drawing a temporary line while in 'solidLine' drawingTool mode
    }

    findElementAtPoint(point: Point): InteractiveElement | null {
        const hitTestDistance = 10; // Distance in pixels for hit testing

        // Convert point to canvas coordinates for hit testing
        const targetPoint = this.mapPointToCanvas(point);

        // Check custom points first
        for (let i = 0; i < this.customPoints.length; i++) {
            const canvasPoint = this.mapPointToCanvas(this.customPoints[i]);
            const distance = Math.sqrt(
                Math.pow(canvasPoint.x - targetPoint.x, 2) +
                Math.pow(canvasPoint.y - targetPoint.y, 2)
            );
            if (distance <= hitTestDistance) {
                return {
                    type: 'custom-point',
                    index: i,
                    data: this.customPoints[i]
                };
            }
        }

        // Check main points
        for (let i = 0; i < this.points.length; i++) {
            const canvasPoint = this.mapPointToCanvas(this.points[i]);
            const distance = Math.sqrt(
                Math.pow(canvasPoint.x - targetPoint.x, 2) +
                Math.pow(canvasPoint.y - targetPoint.y, 2)
            );
            if (distance <= hitTestDistance) {
                return {
                    type: 'point',
                    index: i,
                    data: this.points[i]
                };
            }
        }

        // Check lines (check if point is near line segment)
        for (let i = 0; i < this.customLines.length; i++) {
            const line = this.customLines[i];
            const start = this.mapPointToCanvas(line.start);
            const end = this.mapPointToCanvas(line.end);

            // Distance from point to line segment
            const distance = this.pointToLineDistance(
                targetPoint,
                start,
                end
            );

            if (distance <= hitTestDistance) {
                return {
                    type: 'line',
                    index: i,
                    data: line
                };
            }
        }

        // Check shapes
        for (let i = 0; i < this.shapes.length; i++) {
            const shape = this.shapes[i];
            if (shape.type === 'rectangle' && shape.topLeft && shape.bottomRight) {
                const topLeft = this.mapPointToCanvas(shape.topLeft);
                const bottomRight = this.mapPointToCanvas(shape.bottomRight);

                if (targetPoint.x >= topLeft.x && targetPoint.x <= bottomRight.x &&
                    targetPoint.y >= topLeft.y && targetPoint.y <= bottomRight.y) {
                    return {
                        type: 'shape',
                        index: i,
                        data: shape
                    };
                }
            }
        }

        // Check texts
        for (let i = 0; i < this.texts.length; i++) {
            const textItem = this.texts[i];
            const textPoint = this.mapPointToCanvas(textItem.position);
            const distance = Math.sqrt(
                Math.pow(textPoint.x - targetPoint.x, 2) +
                Math.pow(textPoint.y - targetPoint.y, 2)
            );
            if (distance <= hitTestDistance * 2) { // Larger hit area for text
                return {
                    type: 'text',
                    index: i,
                    data: textItem
                };
            }
        }

        return null;
    }

    private pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }
}