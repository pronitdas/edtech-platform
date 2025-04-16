'use client';

import { useState, useCallback, useMemo } from 'react';
import { Point } from '../components/GraphCanvas';

interface GraphConfig {
  initialZoom?: number;
  initialOffset?: { x: number; y: number };
  canvasWidth?: number;
  canvasHeight?: number;
  scaleFactor?: number;
  minZoom?: number;
  maxZoom?: number;
}

export function useGraphManagement({
  initialZoom = 1,
  initialOffset = { x: 0, y: 0 },
  canvasWidth = 800,
  canvasHeight = 600,
  scaleFactor = 40,
  minZoom = 0.1,
  maxZoom = 5
}: GraphConfig = {}) {
  // State for graph view and points
  const [points, setPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(initialZoom);
  const [offset, setOffset] = useState(initialOffset);

  // Apply zoom limits
  const setZoomWithLimits = useCallback((newZoom: number) => {
    setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)));
  }, [minZoom, maxZoom]);

  // Reset the view to center the points
  const resetView = useCallback(() => {
    if (points.length === 0) {
      setZoomWithLimits(initialZoom);
      setOffset(initialOffset);
      return;
    }

    // Find the center of the points
    let sumX = 0, sumY = 0;
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    // Find the range of points
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    // Calculate zoom level to fit points
    const rangeX = Math.max(1, maxX - minX);
    const rangeY = Math.max(1, maxY - minY);
    const margin = 1.5; // Extra margin around points
    
    const zoomX = (canvasWidth / scaleFactor) / (rangeX * margin);
    const zoomY = (canvasHeight / scaleFactor) / (rangeY * margin);
    const newZoom = Math.min(zoomX, zoomY, maxZoom); // Limit max zoom
    
    // Center the points in the canvas
    setZoomWithLimits(newZoom);
    setOffset({
      x: -centerX * scaleFactor * newZoom + canvasWidth / 2,
      y: centerY * scaleFactor * newZoom + canvasHeight / 2
    });
  }, [points, initialZoom, initialOffset, canvasWidth, canvasHeight, scaleFactor, setZoomWithLimits, maxZoom]);

  // Clear all points
  const clearPoints = useCallback(() => {
    setPoints([]);
  }, []);

  // Set points to specific coordinates
  const setPointsFromCoordinates = useCallback((coordinates: { x: number; y: number }[]) => {
    setPoints(coordinates.map(coord => ({ x: coord.x, y: coord.y })));
    
    // Don't automatically reset view to avoid infinite update loops
    // The component should handle this with useEffect
  }, []);

  // Calculate slope between two points
  const calculateSlope = useCallback((p1: Point, p2: Point): number | null => {
    const dx = p2.x - p1.x;
    if (Math.abs(dx) < 0.0001) return null; // Undefined slope (vertical line)
    return (p2.y - p1.y) / dx;
  }, []);

  // Calculate y-intercept (b in y = mx + b)
  const calculateYIntercept = useCallback((p: Point, slope: number | null): number | null => {
    if (slope === null) return null; // Undefined for vertical lines
    return p.y - slope * p.x;
  }, []);

  // Generate equation string
  const generateEquation = useCallback((slope: number | null, yIntercept: number | null): string => {
    if (slope === null) {
      if (points.length > 0) {
        return "x = " + points[0].x.toFixed(2); // Vertical line
      }
      return ""; // No equation available
    }
    
    const m = slope.toFixed(2);
    const b = yIntercept || 0;
    
    if (Math.abs(b) < 0.01) return `y = ${m}x`;
    if (b > 0) return `y = ${m}x + ${b.toFixed(2)}`;
    return `y = ${m}x - ${Math.abs(b).toFixed(2)}`;
  }, [points]);

  // Map functions between canvas and world coordinates
  const mapPointToCanvas = useCallback((worldPoint: Point): Point => {
    const effectiveScale = scaleFactor * zoom;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    
    return {
      x: worldPoint.x * effectiveScale + cx + offset.x,
      y: cy - worldPoint.y * effectiveScale + offset.y
    };
  }, [zoom, offset, scaleFactor, canvasWidth, canvasHeight]);

  const mapCanvasToPoint = useCallback((canvasPoint: Point): Point => {
    const effectiveScale = scaleFactor * zoom;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    
    return {
      x: (canvasPoint.x - cx - offset.x) / effectiveScale,
      y: (cy - canvasPoint.y + offset.y) / effectiveScale
    };
  }, [zoom, offset, scaleFactor, canvasWidth, canvasHeight]);

  // Zoom to a specific point on the canvas
  const zoomToPoint = useCallback((canvasPoint: Point, newZoom: number) => {
    // Get world coordinates of the point before zoom
    const worldPoint = mapCanvasToPoint(canvasPoint);
    
    // Apply new zoom
    const limitedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    
    // Calculate new offset to keep the point under the mouse
    const effectiveScaleAfter = scaleFactor * limitedZoom;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    
    const newOffsetX = -(worldPoint.x * effectiveScaleAfter) + (canvasPoint.x - cx);
    const newOffsetY = (worldPoint.y * effectiveScaleAfter) + (canvasPoint.y - cy);
    
    setZoom(limitedZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [mapCanvasToPoint, minZoom, maxZoom, scaleFactor, canvasWidth, canvasHeight]);

  // Pan the view by a delta amount
  const panView = useCallback((deltaX: number, deltaY: number) => {
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
  }, []);

  // Calculate line data if two points exist
  const lineData = useMemo(() => {
    if (points.length < 2) return null;
    
    const p1 = points[0];
    const p2 = points[1];
    const slope = calculateSlope(p1, p2);
    const yIntercept = calculateYIntercept(p1, slope);
    const equation = generateEquation(slope, yIntercept);
    
    return {
      slope,
      yIntercept,
      equation,
      point1: p1,
      point2: p2,
      rise: p2.y - p1.y,
      run: p2.x - p1.x,
    };
  }, [points, calculateSlope, calculateYIntercept, generateEquation]);

  return {
    points,
    setPoints,
    zoom,
    setZoom: setZoomWithLimits,
    offset,
    setOffset,
    resetView,
    clearPoints,
    setPointsFromCoordinates,
    calculateSlope,
    calculateYIntercept,
    generateEquation,
    mapPointToCanvas,
    mapCanvasToPoint,
    zoomToPoint,
    panView,
    lineData,
    canvasWidth,
    canvasHeight,
  };
}

export default useGraphManagement; 