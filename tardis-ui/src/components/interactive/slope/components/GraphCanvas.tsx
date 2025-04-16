'use client';

import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { DrawingTool } from '../SlopeDrawing';

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
  drawingTool: DrawingTool;
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
  drawingTool,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<p5>();
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const pointDraggingRef = useRef<number | null>(null);
  const scaleFactor = 40; // Scale factor for grid spacing
  const zoomAnimationRef = useRef<number>(0);
  const isZoomingRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // State for all drawable items and undo/redo
  const [customPoints, setCustomPoints] = useState<Point[]>([]);
  const [customLines, setCustomLines] = useState<{ start: Point; end: Point; style: 'solid' | 'dotted' }[]>([]);
  const [shapes, setShapes] = useState<any[]>([]); // To be typed
  const [texts, setTexts] = useState<any[]>([]); // To be typed
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Tool mode handling
  useEffect(() => {
    // Clear selection when tool changes
    setSelectedItem(null);
  }, [drawingTool]);

  // Update canvas size when props change
  useEffect(() => {
    setCanvasSize({ width, height });
    
    // Resize the p5 canvas if it exists
    if (sketchRef.current) {
      sketchRef.current.resizeCanvas(width, height);
    }
  }, [width, height]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup previous sketch if it exists
    if (sketchRef.current) {
      sketchRef.current.remove();
    }

    const sketch = (p: p5) => {
      p.disableFriendlyErrors = true; // Disable friendly errors for performance
      
      p.setup = () => {
        const canvas = p.createCanvas(canvasSize.width, canvasSize.height, p.P2D); // Use P2D renderer for better performance
        canvas.style('display', 'block');
        canvas.style('width', '100%');
        canvas.style('height', '100%');
        canvas.parent(canvasRef.current!);
        
        // Enable pixel density 1 to prevent blurriness on high DPI displays
        p.pixelDensity(1);
        
        // Prevent default touch and scroll behavior
        canvas.touchStarted(() => false);
        canvas.touchMoved(() => false);
        canvas.touchEnded(() => false);
        
        // Prevent default browser scroll behavior but don't interfere with mouseWheel handler
        p.canvas.addEventListener('wheel', (e) => {
          e.preventDefault();
        }, { passive: false });
      };

      p.draw = () => {
        // Clear the canvas with a solid background without using p.clear()
        p.background(30); // Dark background
        
        // Enable smooth drawing
        p.smooth();
        
        // Draw grid
        drawGrid(p);
        
        // Draw axes
        drawAxes(p);
        
        // Draw points and line
        drawPointsAndLine(p);

        // Draw custom items
        drawCustomItems(p);

        // Draw zoom animation feedback
        if (isZoomingRef.current) {
          drawZoomFeedback(p);
        }
      };

      p.mousePressed = () => {
        if (p.mouseX < 0 || p.mouseX > canvasSize.width || p.mouseY < 0 || p.mouseY > canvasSize.height) {
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

        // Call handleMousePressed
        handleMousePressed(p);
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
          return false; // Prevent default
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
          return false; // Prevent default
        }
        
        return true;
      };

      p.mouseReleased = () => {
        isDraggingRef.current = false;
        pointDraggingRef.current = null;
      };

      p.mouseWheel = (event: any) => {
        // Don't process wheel events outside canvas
        if (p.mouseX < 0 || p.mouseX > canvasSize.width || 
            p.mouseY < 0 || p.mouseY > canvasSize.height) {
          return false;
        }

        const zoomSensitivity = 0.05; // Reduced sensitivity for smoother zooming
        const zoomChange = event.delta > 0 ? -zoomSensitivity : zoomSensitivity;
        const newZoom = Math.max(0.1, Math.min(5, zoom + zoomChange));
        
        if (onZoomChange && newZoom !== zoom) {
          // Get mouse position in world coordinates before zoom
          const mousePos = { x: p.mouseX, y: p.mouseY };
          const worldPosBeforeZoom = mapCanvasToPoint(mousePos);
          
          // Apply new zoom
          onZoomChange(newZoom);
          
          // Calculate how offset should change to zoom toward cursor
          if (onOffsetChange && newZoom !== zoom) {
            // Calculate new offset to maintain the world position under the mouse
            const effectiveScaleAfter = scaleFactor * newZoom;
            const cx = canvasSize.width / 2;
            const cy = canvasSize.height / 2;
            
            const worldX = (mousePos.x - cx - offset.x) / effectiveScaleAfter;
            const worldY = (cy - mousePos.y + offset.y) / effectiveScaleAfter;
            
            // Calculate needed offset adjustment
            const dx = (worldPosBeforeZoom.x - worldX) * effectiveScaleAfter;
            const dy = (worldY - worldPosBeforeZoom.y) * effectiveScaleAfter;
            
            onOffsetChange({
              x: offset.x + dx,
              y: offset.y + dy
            });
            
            // Show zoom feedback
            isZoomingRef.current = true;
            zoomAnimationRef.current = 1.0;
            
            // Set timeout to fade out zoom feedback
            setTimeout(() => {
              isZoomingRef.current = false;
            }, 300);
          }
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
        
        return false; // Prevent default behavior
      };

      // Handler for window resize
      p.windowResized = () => {
        if (canvasRef.current) {
          const parentWidth = canvasRef.current.clientWidth;
          const parentHeight = canvasRef.current.clientHeight;
          
          if (parentWidth > 0 && parentHeight > 0) {
            p.resizeCanvas(parentWidth, parentHeight);
            setCanvasSize({ width: parentWidth, height: parentHeight });
          }
        }
      };

      // Helper functions
      const drawGrid = (p: p5) => {
        p.stroke(60);
        p.strokeWeight(1);
        
        const effectiveScale = scaleFactor * zoom;
        const cx = canvasSize.width / 2;
        const cy = canvasSize.height / 2;
        
        // Calculate visible grid bounds
        const xMin = Math.floor((0 - cx - offset.x) / effectiveScale);
        const xMax = Math.ceil((canvasSize.width - cx - offset.x) / effectiveScale);
        const yMin = Math.floor((cy - canvasSize.height + offset.y) / effectiveScale);
        const yMax = Math.ceil((cy + offset.y) / effectiveScale);
        
        // Calculate nice step size based on zoom level
        const xRange = xMax - xMin;
        const xStep = Math.max(1, Math.floor(xRange / 20)); // Ensure minimum step of 1
        const startX = Math.floor(xMin / xStep) * xStep;
        
        // Draw vertical grid lines
        for (let x = startX; x <= xMax; x += xStep) {
          const mappedPoint = mapPointToCanvas({x, y: 0});
          if (mappedPoint.x >= 0 && mappedPoint.x <= canvasSize.width) {
            p.line(mappedPoint.x, 0, mappedPoint.x, canvasSize.height);
          }
        }
        
        // Draw horizontal grid lines
        const yRange = yMax - yMin;
        const yStep = Math.max(1, Math.floor(yRange / 20)); // Ensure minimum step of 1
        const startY = Math.floor(yMin / yStep) * yStep;
        
        for (let y = startY; y <= yMax; y += yStep) {
          const mappedPoint = mapPointToCanvas({x: 0, y});
          if (mappedPoint.y >= 0 && mappedPoint.y <= canvasSize.height) {
            p.line(0, mappedPoint.y, canvasSize.width, mappedPoint.y);
          }
        }
      };

      const drawAxes = (p: p5) => {
        p.stroke(200);
        p.strokeWeight(2);
        p.textSize(12);
        p.fill(200);
        
        // Draw x and y axes
        const origin = mapPointToCanvas({x: 0, y: 0});
        
        // X-axis
        p.line(0, origin.y, canvasSize.width, origin.y);
        if (origin.y >= 0 && origin.y <= canvasSize.height) {
          const arrowSize = 10;
          p.triangle(canvasSize.width, origin.y, 
                    canvasSize.width - arrowSize, origin.y - arrowSize / 2, 
                    canvasSize.width - arrowSize, origin.y + arrowSize / 2);
          p.text("x", canvasSize.width - arrowSize - 5, origin.y - arrowSize);
        }
        
        // Y-axis
        p.line(origin.x, 0, origin.x, canvasSize.height);
        if (origin.x >= 0 && origin.x <= canvasSize.width) {
          const arrowSize = 10;
          p.triangle(origin.x, 0, 
                    origin.x - arrowSize / 2, arrowSize, 
                    origin.x + arrowSize / 2, arrowSize);
          p.text("y", origin.x + arrowSize, arrowSize + 5);
        }
        
        // Calculate visible axis bounds and step size
        const effectiveScale = scaleFactor * zoom;
        const xMin = Math.floor((0 - canvasSize.width/2 - offset.x) / effectiveScale);
        const xMax = Math.ceil((canvasSize.width - canvasSize.width/2 - offset.x) / effectiveScale);
        const yMin = Math.floor((canvasSize.height/2 - canvasSize.height + offset.y) / effectiveScale);
        const yMax = Math.ceil((canvasSize.height/2 + offset.y) / effectiveScale);
        
        // Calculate nice step size based on zoom level
        const xRange = xMax - xMin;
        const xStep = Math.max(1, Math.floor(xRange / 10)); // Ensure minimum step of 1
        const startX = Math.floor(xMin / xStep) * xStep;
        
        // Draw x-axis labels and tick marks
        p.textAlign(p.CENTER, p.CENTER);
        for (let x = startX; x <= xMax; x += xStep) {
          if (Math.abs(x) < 0.001) continue; // Skip zero
          const mappedPoint = mapPointToCanvas({x, y: 0});
          
          if (mappedPoint.x >= 0 && mappedPoint.x <= canvasSize.width) {
            // Tick marks
            p.stroke(200);
            p.strokeWeight(1);
            p.line(mappedPoint.x, origin.y - 5, mappedPoint.x, origin.y + 5);
            
            // Labels
            p.fill(200);
            p.noStroke();
            p.text(x.toString(), mappedPoint.x, origin.y + 15);
          }
        }
        
        // Draw y-axis labels and tick marks
        const yRange = yMax - yMin;
        const yStep = Math.max(1, Math.floor(yRange / 10)); // Ensure minimum step of 1
        const startY = Math.floor(yMin / yStep) * yStep;
        
        p.textAlign(p.RIGHT, p.CENTER);
        for (let y = startY; y <= yMax; y += yStep) {
          if (Math.abs(y) < 0.001) continue; // Skip zero
          const mappedPoint = mapPointToCanvas({x: 0, y});
          
          if (mappedPoint.y >= 0 && mappedPoint.y <= canvasSize.height) {
            // Tick marks
            p.stroke(200);
            p.strokeWeight(1);
            p.line(origin.x - 5, mappedPoint.y, origin.x + 5, mappedPoint.y);
            
            // Labels
            p.fill(200);
            p.noStroke();
            p.text(y.toString(), origin.x - 10, mappedPoint.y);
          }
        }
        
        // Label origin
        if (origin.x >= 0 && origin.x <= canvasSize.width && 
            origin.y >= 0 && origin.y <= canvasSize.height) {
          p.fill(200);
          p.noStroke();
          p.textAlign(p.RIGHT, p.TOP);
          p.text("0", origin.x - 5, origin.y + 5);
        }
      };

      const drawZoomFeedback = (p: p5) => {
        // Reduce animation value over time
        zoomAnimationRef.current -= 0.05;
        
        if (zoomAnimationRef.current <= 0) {
          zoomAnimationRef.current = 0;
          isZoomingRef.current = false;
          return;
        }
        
        // Draw zoom indicator at mouse position
        const size = 40 * zoomAnimationRef.current;
        p.noFill();
        p.stroke(100, 200, 255, Math.round(zoomAnimationRef.current * 255));
        p.strokeWeight(2);
        p.circle(p.mouseX, p.mouseY, size);
      };

      const drawPointsAndLine = (p: p5) => {
        if (points.length === 0) return;
        
        // Draw the line connecting the points
        if (points.length >= 2) {
          // Draw the main line
          p.stroke(highlightSolution ? 'yellow' : 'white');
          p.strokeWeight(2);
          
          const p1 = mapPointToCanvas(points[0]);
          const p2 = mapPointToCanvas(points[1]);
          
          // Only draw if at least one point is visible
          if ((p1.x >= 0 && p1.x <= canvasSize.width && p1.y >= 0 && p1.y <= canvasSize.height) ||
              (p2.x >= 0 && p2.x <= canvasSize.width && p2.y >= 0 && p2.y <= canvasSize.height)) {
            p.line(p1.x, p1.y, p2.x, p2.y);
            
            // Draw rise and run lines
            // Rise (vertical line) - in red
            p.stroke(255, 100, 100);
            p.strokeWeight(2);
            p.line(p1.x, p1.y, p1.x, p2.y);
            
            // Label for rise
            const riseValue = (points[1].y - points[0].y).toFixed(1);
            p.fill(255, 100, 100);
            p.noStroke();
            p.textAlign(p.RIGHT, p.CENTER);
            const riseLabel = `Δy = ${riseValue}`;
            const riseLabelX = p1.x - 10;
            const riseLabelY = (p1.y + p2.y) / 2;
            
            // Only draw rise label if it's visible
            if (riseLabelX >= 0 && riseLabelX <= canvasSize.width &&
                riseLabelY >= 0 && riseLabelY <= canvasSize.height) {
              p.text(riseLabel, riseLabelX, riseLabelY);
            }
            
            // Run (horizontal line) - in blue
            p.stroke(100, 100, 255);
            p.strokeWeight(2);
            p.line(p1.x, p2.y, p2.x, p2.y);
            
            // Label for run
            const runValue = (points[1].x - points[0].x).toFixed(1);
            p.fill(100, 100, 255);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            const runLabel = `Δx = ${runValue}`;
            const runLabelX = (p1.x + p2.x) / 2;
            const runLabelY = p2.y + 10;
            
            // Only draw run label if it's visible
            if (runLabelX >= 0 && runLabelX <= canvasSize.width &&
                runLabelY >= 0 && runLabelY <= canvasSize.height) {
              p.text(runLabel, runLabelX, runLabelY);
            }
            
            // Draw slope value
            if (Math.abs(points[1].x - points[0].x) > 0.001) {
              const slope = (points[1].y - points[0].y) / (points[1].x - points[0].x);
              const slopeLabel = `slope = ${slope.toFixed(2)}`;
              const slopeLabelX = (p1.x + p2.x) / 2;
              const slopeLabelY = (p1.y + p2.y) / 2 - 20;
              
              // Only draw slope label if it's visible
              if (slopeLabelX >= 0 && slopeLabelX <= canvasSize.width &&
                  slopeLabelY >= 0 && slopeLabelY <= canvasSize.height) {
                p.fill(255);
                p.noStroke();
                p.textAlign(p.CENTER, p.BOTTOM);
                p.text(slopeLabel, slopeLabelX, slopeLabelY);
              }
            }
          }
        }
        
        // Draw the points
        points.forEach((point, index) => {
          const canvasPoint = mapPointToCanvas(point);
          
          // Only draw points if they're visible
          if (canvasPoint.x >= 0 && canvasPoint.x <= canvasSize.width &&
              canvasPoint.y >= 0 && canvasPoint.y <= canvasSize.height) {
            // Point circle
            p.fill(100, 255, 100);
            p.noStroke();
            p.circle(canvasPoint.x, canvasPoint.y, 10);
            
            // Point label
            p.fill(255);
            p.textSize(14);
            p.textAlign(p.LEFT, p.BOTTOM);
            const label = `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`;
            p.text(label, canvasPoint.x + 10, canvasPoint.y - 5);
          }
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

      // --- Drawing logic for all custom items ---
      const drawCustomItems = (p: p5) => {
        // Draw custom points
        customPoints.forEach((pt, idx) => {
          const canvasPt = mapPointToCanvas(pt);
          p.fill(selectedItem?.type === 'point' && selectedItem?.index === idx ? 'yellow' : 'orange');
          p.noStroke();
          p.circle(canvasPt.x, canvasPt.y, 10);
          p.fill(255);
          p.textSize(12);
          p.textAlign(p.LEFT, p.BOTTOM);
          p.text(`(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`, canvasPt.x + 10, canvasPt.y - 5);
        });
        // Draw custom lines
        customLines.forEach((line, idx) => {
          const start = mapPointToCanvas(line.start);
          const end = mapPointToCanvas(line.end);
          p.stroke(selectedItem?.type === 'line' && selectedItem?.index === idx ? 'yellow' : 'cyan');
          p.strokeWeight(2);
          if (line.style === 'dotted') {
            const dash = 8, gap = 8;
            const distTotal = p.dist(start.x, start.y, end.x, end.y);
            const steps = Math.floor(distTotal / (dash + gap));
            for (let i = 0; i < steps; i++) {
              const t1 = i / steps, t2 = (i + 0.5) / steps;
              const x1 = p.lerp(start.x, end.x, t1), y1 = p.lerp(start.y, end.y, t1);
              const x2 = p.lerp(start.x, end.x, t2), y2 = p.lerp(start.y, end.y, t2);
              p.line(x1, y1, x2, y2);
            }
          } else {
            p.line(start.x, start.y, end.x, end.y);
          }
        });
        // Draw shapes (rectangles for now)
        shapes.forEach((sh, idx) => {
          const center = mapPointToCanvas(sh.center);
          const w = sh.width * scaleFactor * zoom;
          const h = sh.height * scaleFactor * zoom;
          p.stroke(selectedItem?.type === 'shape' && selectedItem?.index === idx ? 'yellow' : 'lime');
          p.strokeWeight(2);
          p.fill(sh.fill || 'rgba(0,255,0,0.2)');
          p.rectMode(p.CENTER);
          p.rect(center.x, center.y, w, h);
        });
        // Draw texts
        texts.forEach((txt, idx) => {
          const pos = mapPointToCanvas(txt.pos);
          p.noStroke();
          p.fill(selectedItem?.type === 'text' && selectedItem?.index === idx ? 'yellow' : 'white');
          p.textSize(txt.size || 16);
          p.textAlign(p.LEFT, p.TOP);
          p.text(txt.content, pos.x, pos.y);
        });
      };

      // --- Mouse event handlers ---
      let dragStart = null;
      let dragItem = null;
      let lineStart = null;
      let shapeStart = null;

      const handleMousePressed = (p: p5) => {
        const mouseWorld = mapCanvasToPoint({ x: p.mouseX, y: p.mouseY });
        switch (drawingTool) {
          case 'move': {
            // Try to select a point
            for (let i = 0; i < customPoints.length; i++) {
              const pt = mapPointToCanvas(customPoints[i]);
              if (p.dist(p.mouseX, p.mouseY, pt.x, pt.y) < 12) {
                setSelectedItem({ type: 'point', index: i });
                dragStart = { ...customPoints[i] };
                dragItem = { type: 'point', index: i };
                return;
              }
            }
            // Try to select a line endpoint
            for (let i = 0; i < customLines.length; i++) {
              const s = mapPointToCanvas(customLines[i].start);
              const e = mapPointToCanvas(customLines[i].end);
              if (p.dist(p.mouseX, p.mouseY, s.x, s.y) < 10) {
                setSelectedItem({ type: 'line', index: i, endpoint: 'start' });
                dragStart = { ...customLines[i].start };
                dragItem = { type: 'line', index: i, endpoint: 'start' };
                return;
              }
              if (p.dist(p.mouseX, p.mouseY, e.x, e.y) < 10) {
                setSelectedItem({ type: 'line', index: i, endpoint: 'end' });
                dragStart = { ...customLines[i].end };
                dragItem = { type: 'line', index: i, endpoint: 'end' };
                return;
              }
            }
            // Try to select a shape
            for (let i = 0; i < shapes.length; i++) {
              const sh = shapes[i];
              const c = mapPointToCanvas(sh.center);
              const w = sh.width * scaleFactor * zoom;
              const h = sh.height * scaleFactor * zoom;
              if (
                p.mouseX > c.x - w / 2 && p.mouseX < c.x + w / 2 &&
                p.mouseY > c.y - h / 2 && p.mouseY < c.y + h / 2
              ) {
          case 'move':
            // TODO: Select and start dragging item
            break;
          case 'solidLine':
          case 'dottedLine':
            // TODO: Start drawing a line
            break;
          case 'point':
            // TODO: Add a point
            break;
          case 'text':
            // TODO: Add text (prompt for content)
            break;
          case 'shape':
            // TODO: Start drawing a shape
            break;
          case 'pan':
            // TODO: Start panning
            break;
          case 'zoomIn':
            // TODO: Zoom in at cursor
            break;
          case 'zoomOut':
            // TODO: Zoom out at cursor
            break;
          case 'undo':
            // TODO: Undo
            break;
          case 'redo':
            // TODO: Redo
            break;
          case 'clear':
            // TODO: Clear all custom items
            break;
          case 'reset':
            // TODO: Reset all to initial state
            break;
          default:
            break;
        }
      };

      // --- Drawing logic (scaffold) ---
      const drawCustomItems = (p: p5) => {
        // TODO: Draw customPoints, customLines, shapes, texts
      };
    };

    sketchRef.current = new p5(sketch, canvasRef.current);

    return () => {
      if (sketchRef.current) {
        sketchRef.current.remove();
      }
    };
  }, [
    canvasSize.width, 
    canvasSize.height, 
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
    drawingTool
  ]);

  return (
    <div 
      ref={canvasRef} 
      className="w-full h-full touch-none select-none bg-gray-900" 
      style={{ 
        overflow: 'hidden',
        touchAction: 'none', // Prevent browser touch actions
        position: 'relative', // Ensure proper stacking context
        isolation: 'isolate', // Create stacking context
        willChange: 'transform', // Optimize for animations
        WebkitTapHighlightColor: 'transparent' // Remove tap highlight on mobile
      }}
    />
  );
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