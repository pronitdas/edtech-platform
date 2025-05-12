import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import { DrawingStrategy } from '../../types/graph';

interface CoreGraphCanvasProps {
    width: number;
    height: number;
    zoom: number;
    offset: { x: number; y: number };
    onZoomChange: (zoom: number) => void;
    onOffsetChange: (offset: { x: number; y: number }) => void;
    mapPointToCanvas: (point: { x: number; y: number }) => { x: number; y: number };
    mapCanvasToPoint: (point: { x: number; y: number }) => { x: number; y: number };
    drawingStrategy: DrawingStrategy;
}

const CoreGraphCanvas: React.FC<CoreGraphCanvasProps> = ({
    width,
    height,
    zoom,
    offset,
    onZoomChange,
    onOffsetChange,
    mapPointToCanvas,
    mapCanvasToPoint,
    drawingStrategy,
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const p5Instance = useRef<p5 | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const sketch = (p: p5) => {
                let isDragging = false;
                let prevMouseX = 0;
                let prevMouseY = 0;

                p.setup = () => {
                    const canvas = p.createCanvas(width, height);
                    canvas.parent(canvasRef.current!);
                    p.pixelDensity(window.devicePixelRatio);
                    // Prevent default touch and scroll behavior
                    canvas.elt.addEventListener('touchstart', (e: TouchEvent) => e.preventDefault());
                    canvas.elt.addEventListener('wheel', (e: WheelEvent) => e.preventDefault());
                };

                p.draw = () => {
                    p.background(255); // Clear background
                    p.translate(offset.x, offset.y);
                    p.scale(zoom);

                    // Call the drawing strategy
                    drawingStrategy.drawOnCanvas(p);
                };

                p.windowResized = () => {
                    p.resizeCanvas(width, height);
                };

                p.mousePressed = () => {
                    isDragging = true;
                    prevMouseX = p.mouseX;
                    prevMouseY = p.mouseY;
                };

                p.mouseReleased = () => {
                    isDragging = false;
                };

                p.mouseDragged = () => {
                    if (isDragging) {
                        const dx = p.mouseX - prevMouseX;
                        const dy = p.mouseY - prevMouseY;
                        onOffsetChange({ x: offset.x + dx, y: offset.y + dy });
                        prevMouseX = p.mouseX;
                        prevMouseY = p.mouseY;
                    }
                };

                p.mouseWheel = (event: any) => {
                    const factor = event.delta > 0 ? 0.9 : 1.1;
                    const newZoom = Math.max(0.1, zoom * factor);

                    // Adjust offset to zoom towards the mouse cursor
                    const mousePointBeforeZoom = mapCanvasToPoint({ x: p.mouseX, y: p.mouseY });
                    const mousePointAfterZoom = mapCanvasToPoint({ x: p.mouseX, y: p.mouseY }); // This will use the new zoom implicitly via mapCanvasToPoint

                    const newOffsetX = offset.x - (mousePointAfterZoom.x - mousePointBeforeZoom.x) * newZoom;
                    const newOffsetY = offset.y - (mousePointAfterZoom.y - mousePointBeforeZoom.y) * newZoom;

                    onZoomChange(newZoom);
                    onOffsetChange({ x: newOffsetX, y: newOffsetY });
                };
            };

            p5Instance.current = new p5(sketch);
        }

        return () => {
            p5Instance.current?.remove();
        };
    }, [width, height, zoom, offset, onZoomChange, onOffsetChange, mapCanvasToPoint, drawingStrategy]); // Re-run effect if these props change

    // Handle resizing when width/height props change
    useEffect(() => {
        if (p5Instance.current) {
            p5Instance.current.resizeCanvas(width, height);
        }
    }, [width, height]);

    return <div ref={canvasRef} style={{ width, height, overflow: 'hidden' }} />;
};

export default CoreGraphCanvas;