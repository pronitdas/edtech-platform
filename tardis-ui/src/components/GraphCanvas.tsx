import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

/**
 * GraphCanvas Component
 *
 * This component provides a canvas for rendering p5.js sketches.
 * It accepts a sketch function and optional width and height props
 * to control the canvas dimensions.
 *
 * @param {Object} props - The component props.
 * @param {function} props.sketch - A p5.js sketch function that defines the drawing logic.
 * @param {number} [props.width=600] - The width of the canvas.
 * @param {number} [props.height=400] - The height of the canvas.
 *
 * @example
 * // Basic usage with a simple sketch
 * const mySketch = (p: p5) => {
 *   p.setup = () => {
 *     p.createCanvas(400, 200);
 *   };
 *   p.draw = () => {
 *     p.background(220);
 *     p.ellipse(50, 50, 80, 80);
 *   };
 * };
 *
 * <GraphCanvas sketch={mySketch} width={400} height={200} />
 */
interface GraphCanvasProps {
    sketch: (p: p5) => void;
    width?: number;
    height?: number;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ sketch, width = 600, height = 400 }) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let p5Instance: p5;

        if (canvasRef.current) {
            p5Instance = new p5(sketch, canvasRef.current);
        }

        return () => {
            if (p5Instance) {
                p5Instance.remove();
            }
        };
    }, [sketch]);

    return <div ref={canvasRef} style={{ width: width, height: height }} />;
};

export default GraphCanvas;