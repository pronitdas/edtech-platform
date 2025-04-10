'use client';

import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

export interface Point {
  x: number;
  y: number;
}

export interface GraphCanvasProps {
  width: number;
  height: number;
  points: Point[];
  onPointsChange?: (points: Point[]) => void;
  zoom: number;
  offset: { x: number; y: number };
  onZoomChange?: (zoom: number) => void;
  onOffsetChange?: (offset: { x: number; y: number }) => void;
  mapPointToCanvas: (point: Point) => Point;
  mapCanvasToPoint: (point: Point) => Point;
  highlightSolution?: boolean;
  editMode?: boolean;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
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
  highlightSolution = false,
  editMode = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<p5>();
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const pointDraggingRef = useRef<number | null>(null);
  const scaleFactor = 40; // Scale factor for grid spacing

  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup previous sketch if it exists
    if (sketchRef.current) {
      sketchRef.current.remove();
    }

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(width, height);
      };

      p.draw = () => {
        p.background(30); // Dark background
        
        // Draw grid
        drawGrid(p);
        
        // Draw axes
        drawAxes(p);
        
        // Draw points and line
        drawPointsAndLine(p);
      };

      p.mousePressed = () => {
        if (p.mouseX < 0 || p.mouseX > width || p.mouseY < 0 || p.mouseY > height) {
          return;
        }

        // Check if clicking on a point
        const pointIndex = findPointUnderMouse(p);
        if (pointIndex !== null && editMode) {
          pointDraggingRef.current = pointIndex;
          return;
        }

        // Start canvas dragging
        isDraggingRef.current = true;
        dragStartRef.current = { x: p.mouseX, y: p.mouseY };
        offsetStartRef.current = { ...offset };
      };

      p.mouseDragged = () => {
        if (pointDraggingRef.current !== null && editMode) {
          // Drag point
          const canvasPos = { x: p.mouseX, y: p.mouseY };
          const worldPos = mapCanvasToPoint(canvasPos);
          
          if (onPointsChange) {
            const newPoints = [...points];
            newPoints[pointDraggingRef.current] = worldPos;
            onPointsChange(newPoints);
          }
          return;
        }

        if (isDraggingRef.current) {
          // Drag canvas view
          const dx = p.mouseX - dragStartRef.current.x;
          const dy = p.mouseY - dragStartRef.current.y;
          
          if (onOffsetChange) {
            onOffsetChange({
              x: offsetStartRef.current.x + dx,
              y: offsetStartRef.current.y + dy
            });
          }
        }
      };

      p.mouseReleased = () => {
        isDraggingRef.current = false;
        pointDraggingRef.current = null;
      };

      p.mouseWheel = (event: any) => {
        const zoomSensitivity = 0.1;
        const zoomChange = event.delta > 0 ? -zoomSensitivity : zoomSensitivity;
        const newZoom = Math.max(0.1, Math.min(5, zoom + zoomChange));
        
        if (onZoomChange) {
          onZoomChange(newZoom);
        }
        
        return false; // Prevent default scrolling
      };

      p.doubleClicked = () => {
        if (!editMode) return;
        
        // Add a point on double-click in edit mode
        if (points.length < 2) {
          const canvasPos = { x: p.mouseX, y: p.mouseY };
          const worldPos = mapCanvasToPoint(canvasPos);
          
          if (onPointsChange) {
            const newPoints = [...points, worldPos];
            onPointsChange(newPoints);
          }
        }
      };

      // Helper functions
      const drawGrid = (p: p5) => {
        p.stroke(60);
        p.strokeWeight(1);
        
        const effectiveScale = scaleFactor * zoom;
        const cx = width / 2 + offset.x;
        const cy = height / 2 + offset.y;
        
        // Calculate visible grid bounds
        const xMin = (0 - cx) / effectiveScale;
        const xMax = (width - cx) / effectiveScale;
        const yMin = (cy - height) / effectiveScale;
        const yMax = cy / effectiveScale;
        
        // Calculate nice step size based on zoom level
        const xRange = xMax - xMin;
        const xStep = niceNumber(xRange / 10, true);
        const startX = Math.floor(xMin / xStep) * xStep;
        
        // Draw vertical grid lines
        for (let x = startX; x <= xMax + xStep; x += xStep) {
          const xPos = cx + x * effectiveScale;
          p.line(xPos, 0, xPos, height);
        }
        
        // Draw horizontal grid lines
        const yRange = yMax - yMin;
        const yStep = niceNumber(yRange / 10, true);
        const startY = Math.floor(yMin / yStep) * yStep;
        
        for (let y = startY; y <= yMax + yStep; y += yStep) {
          const yPos = cy - y * effectiveScale;
          p.line(0, yPos, width, yPos);
        }
      };

      const drawAxes = (p: p5) => {
        p.stroke(200);
        p.strokeWeight(2);
        p.textSize(12);
        p.fill(200);
        
        const effectiveScale = scaleFactor * zoom;
        const cx = width / 2 + offset.x;
        const cy = height / 2 + offset.y;
        const arrowSize = 10;
        
        // X-axis
        p.line(0, cy, width, cy);
        p.triangle(width, cy, width - arrowSize, cy - arrowSize / 2, width - arrowSize, cy + arrowSize / 2);
        p.text("x", width - arrowSize - 5, cy - arrowSize);
        
        // Y-axis
        p.line(cx, 0, cx, height);
        p.triangle(cx, 0, cx - arrowSize / 2, arrowSize, cx + arrowSize / 2, arrowSize);
        p.text("y", cx + arrowSize, arrowSize + 5);
        
        // Calculate visible axis bounds
        const xMin = (0 - cx) / effectiveScale;
        const xMax = (width - cx) / effectiveScale;
        const yMin = (cy - height) / effectiveScale;
        const yMax = cy / effectiveScale;
        
        // Calculate nice step size based on zoom level
        const xRange = xMax - xMin;
        const xStep = niceNumber(xRange / 10, true);
        const startX = Math.floor(xMin / xStep) * xStep;
        
        // Draw x-axis labels
        p.textAlign(p.CENTER, p.CENTER);
        for (let x = startX; x <= xMax + xStep; x += xStep) {
          if (Math.abs(x) < 0.001) continue; // Skip zero
          const xPos = cx + x * effectiveScale;
          p.text(x.toFixed(1), xPos, cy + 15);
        }
        
        // Draw y-axis labels
        const yRange = yMax - yMin;
        const yStep = niceNumber(yRange / 10, true);
        const startY = Math.floor(yMin / yStep) * yStep;
        
        p.textAlign(p.RIGHT, p.CENTER);
        for (let y = startY; y <= yMax + yStep; y += yStep) {
          if (Math.abs(y) < 0.001) continue; // Skip zero
          const yPos = cy - y * effectiveScale;
          p.text(y.toFixed(1), cx - 5, yPos);
        }
      };

      const drawPointsAndLine = (p: p5) => {
        if (points.length === 0) return;
        
        // Draw the line connecting the points
        if (points.length >= 2) {
          highlightSolution ? p.stroke('yellow') : p.stroke('white');
          p.strokeWeight(2);
          
          // Connect all points with lines
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = mapPointToCanvas(points[i]);
            const p2 = mapPointToCanvas(points[i + 1]);
            p.line(p1.x, p1.y, p2.x, p2.y);
          }
        }
        
        // Draw the points
        p.fill(100, 255, 100);
        p.noStroke();
        
        points.forEach((point, index) => {
          const canvasPoint = mapPointToCanvas(point);
          p.circle(canvasPoint.x, canvasPoint.y, 10);
          
          // Add labels for points
          p.fill(255);
          p.textSize(14);
          p.textAlign(p.LEFT, p.BOTTOM);
          p.text(`(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`, canvasPoint.x + 5, canvasPoint.y - 5);
        });
      };

      const findPointUnderMouse = (p: p5): number | null => {
        for (let i = 0; i < points.length; i++) {
          const canvasPoint = mapPointToCanvas(points[i]);
          const distance = p.dist(p.mouseX, p.mouseY, canvasPoint.x, canvasPoint.y);
          if (distance < 10) {
            return i;
          }
        }
        return null;
      };
    };

    sketchRef.current = new p5(sketch, canvasRef.current);

    return () => {
      if (sketchRef.current) {
        sketchRef.current.remove();
      }
    };
  }, [
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
    editMode
  ]);

  return <div ref={canvasRef} className="w-full h-full" />;
};

// Helper function for creating nice axis intervals
function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction;
  
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  
  return niceFraction * Math.pow(10, exponent);
}

export default GraphCanvas; 