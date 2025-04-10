'use client';

import { useState, useCallback, useMemo } from 'react';
import { Point } from '../components/GraphCanvas';

interface GraphConfig {
  initialZoom?: number;
  initialOffset?: { x: number; y: number };
  canvasWidth?: number;
  canvasHeight?: number;
  scaleFactor?: number;
}

export function useGraphManagement({
  initialZoom = 1,
  initialOffset = { x: 0, y: 0 },
  canvasWidth = 800,
  canvasHeight = 600,
  scaleFactor = 40,
}: GraphConfig = {}) {
  // State for graph view and points
  const [points, setPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(initialZoom);
  const [offset, setOffset] = useState(initialOffset);

  // Reset the view to center the points
  const resetView = useCallback(() => {
    if (points.length === 0) {
      setZoom(initialZoom);
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
    const newZoom = Math.min(zoomX, zoomY, 2); // Limit max zoom
    
    // Center the points in the canvas
    setZoom(newZoom);
    setOffset({
      x: -centerX * scaleFactor * newZoom,
      y: centerY * scaleFactor * newZoom,
    });
  }, [points, initialZoom, initialOffset, canvasWidth, canvasHeight, scaleFactor]);

  // Clear all points
  const clearPoints = useCallback(() => {
    setPoints([]);
  }, []);

  // Set points to specific coordinates
  const setPointsFromCoordinates = useCallback((coordinates: { x: number; y: number }[]) => {
    setPoints(coordinates.map(coord => ({ x: coord.x, y: coord.y })));
    
    // Automatically reset view when points are updated
    setTimeout(() => resetView(), 50);
  }, [resetView]);

  // Calculate slope between two points
  const calculateSlope = useCallback((p1: Point, p2: Point): number | null => {
    const dx = p2.x - p1.x;
    if (dx === 0) return null; // Undefined slope (vertical line)
    return (p2.y - p1.y) / dx;
  }, []);

  // Calculate y-intercept (b in y = mx + b)
  const calculateYIntercept = useCallback((p: Point, slope: number | null): number | null => {
    if (slope === null) return null; // Undefined for vertical lines
    return p.y - slope * p.x;
  }, []);

  // Generate equation string
  const generateEquation = useCallback((slope: number | null, yIntercept: number | null): string => {
    if (slope === null) return "x = " + points[0].x.toFixed(2); // Vertical line
    
    const m = slope.toFixed(2);
    const b = yIntercept || 0;
    
    if (b === 0) return `y = ${m}x`;
    if (b > 0) return `y = ${m}x + ${b.toFixed(2)}`;
    return `y = ${m}x - ${Math.abs(b).toFixed(2)}`;
  }, [points]);

  // Map functions between canvas and world coordinates
  const mapPointToCanvas = useCallback((point: Point): Point => {
    const effectiveScale = scaleFactor * zoom;
    const cx = canvasWidth / 2 + offset.x;
    const cy = canvasHeight / 2 + offset.y;
    
    return {
      x: cx + point.x * effectiveScale,
      y: cy - point.y * effectiveScale,
    };
  }, [zoom, offset, scaleFactor, canvasWidth, canvasHeight]);

  const mapCanvasToPoint = useCallback((canvasPoint: Point): Point => {
    const effectiveScale = scaleFactor * zoom;
    const cx = canvasWidth / 2 + offset.x;
    const cy = canvasHeight / 2 + offset.y;
    
    return {
      x: (canvasPoint.x - cx) / effectiveScale,
      y: (cy - canvasPoint.y) / effectiveScale,
    };
  }, [zoom, offset, scaleFactor, canvasWidth, canvasHeight]);

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
    setZoom,
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
    lineData,
    canvasWidth,
    canvasHeight,
  };
}

export default useGraphManagement; 