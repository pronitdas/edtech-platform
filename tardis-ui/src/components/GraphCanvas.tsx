import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import { Point, Offset, CustomShape } from '@/types/geometry';



interface GraphCanvasProps {
    drawingMode: 'generic' | 'interactiveMath';
    p5Setup: (p: p5) => void;
    p5Drawing: (p: p5) => void;
    interactiveMathConfig: {
        equation: string;
        xRange: [number, number];
        yRange: [number, number];
        stepSize: number;
    };
    width: number;
    height: number;
    points: Point[];
    onPointsChange: (points: Point[]) => void;
    zoom: number;
    offset: Offset;
    onZoomChange: (zoom: number) => void;
    onOffsetChange: (offset: Offset) => void;
    mapPointToCanvas: (point: Point) => Point;
    mapCanvasToPoint: (point: Point) => Point;
    highlightSolution: boolean;
    editMode: boolean;
    drawingTool: any;
    onDrawingToolChange: (tool: any) => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
    drawingMode,
    p5Setup,
    p5Drawing,
    interactiveMathConfig,
    width,
    height,
    points,
    onPointsChange,
    zoom,
    offset,
    onZoomChange,
    onOffsetChange,
    mapPointToCanvas,
    mapCanvasToPoint,
    highlightSolution,
    editMode,
    drawingTool,
    onDrawingToolChange,
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let p5Instance: p5;

        if (canvasRef.current) {
            const sketch = (p: p5) => {
                p.setup = () => {
                    p.createCanvas(width, height);
                    if (drawingMode === 'generic') {
                        p5Setup(p);
                    }
                };

                p.draw = () => {
                    if (drawingMode === 'generic') {
                        p5Drawing(p);
                    } else if (drawingMode === 'interactiveMath') {
                        const { equation, xRange, yRange, stepSize } = interactiveMathConfig;

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
                };
            };

            p5Instance = new p5(sketch, canvasRef.current);
        }

        return () => {
            if (p5Instance) {
                p5Instance.remove();
            }
        };
    }, [drawingMode, p5Setup, p5Drawing, width, height]);

    return <div ref={canvasRef} style={{ width: width, height: height }} />;
};

export default GraphCanvas;