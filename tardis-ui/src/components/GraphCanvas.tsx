import React, { useMemo } from 'react';
import p5 from 'p5';
import { Point, Offset, CustomShape, Line, Shape, Text } from '@/types/geometry';
import { DrawingStrategy, InteractiveMathConfig } from '@/types/graph';
import { DrawingTool } from '@/components/interactive/slope/types';
import CoreGraphCanvas from './GraphCanvas/CoreGraphCanvas';
import { GenericDrawingStrategy } from './GraphCanvas/strategies/GenericDrawingStrategy';
import { SlopeDrawingStrategy } from './GraphCanvas/strategies/SlopeDrawingStrategy';

// Define props specific to GenericDrawingStrategy
interface GenericDrawingProps {
    drawingMode: 'generic';
    p5Setup: (p: p5) => void;
    p5Drawing: (p: p5) => void;
    // Add other generic specific props if any
}

// Define props specific to SlopeDrawingStrategy
interface SlopeDrawingProps {
    drawingMode: 'slope';
    slopeConfig: InteractiveMathConfig; // Used by GraphCanvas to select strategy
    points: Point[];
    onPointsChange: (points: Point[]) => void; // Still needed in GraphCanvasProps
    highlightSolution: boolean;
    editMode: boolean;
    drawingTool: DrawingTool;
    onDrawingToolChange: (tool: DrawingTool) => void; // Still needed in GraphCanvasProps
    customPoints: Point[];
    customLines: Line[]; // Assuming lines are defined by two points
    shapes: Shape[];
    texts: Text[];
    selectedItem: string | null; // Still needed in GraphCanvasProps
    setSelectedItem: (id: string | null) => void; // Still needed in GraphCanvasProps
    undoStack: any[]; // Still needed in GraphCanvasProps
    setUndoStack: (stack: any[]) => void; // Still needed in GraphCanvasProps
    redoStack: any[]; // Still needed in GraphCanvasProps
    setRedoStack: (stack: any[]) => void; // Still needed in GraphCanvasProps
}

// Define common props for CoreGraphCanvas
interface CoreGraphCanvasCommonProps {
    width: number;
    height: number;
    zoom: number;
    offset: Offset;
    onZoomChange: (zoom: number) => void;
    onOffsetChange: (offset: Offset) => void;
    mapPointToCanvas: (point: Point) => Point;
    mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point;
}

// Combine all props into a single type for GraphCanvas
type GraphCanvasProps = CoreGraphCanvasCommonProps & (GenericDrawingProps | SlopeDrawingProps);

const GraphCanvas: React.FC<GraphCanvasProps> = (props) => {
    const {
        drawingMode,
        width,
        height,
        zoom,
        offset,
        onZoomChange,
        onOffsetChange,
        mapPointToCanvas,
        mapCanvasToPoint,
        ...strategyProps // Collect strategy-specific props
    } = props;

    const drawingStrategy = useMemo<DrawingStrategy | null>(() => {
        const commonProps = {
            width,
            height,
            zoom,
            offset,
            mapPointToCanvas,
            mapCanvasToPoint,
        };

        if (drawingMode === 'generic') {
            const genericProps = strategyProps as GenericDrawingProps;
            return new GenericDrawingStrategy({
                ...commonProps,
                drawingMode: 'generic', // Added drawingMode
                p5Setup: genericProps.p5Setup,
                p5Drawing: genericProps.p5Drawing,
            });
        } else if (drawingMode === 'slope') {
            const slopeProps = strategyProps as SlopeDrawingProps;
            return new SlopeDrawingStrategy({
                points: slopeProps.points,
                customPoints: slopeProps.customPoints,
                customLines: slopeProps.customLines,
                shapes: slopeProps.shapes,
                texts: slopeProps.texts,
                mapPointToCanvas: commonProps.mapPointToCanvas, // Use commonProps
                mapCanvasToPoint: commonProps.mapCanvasToPoint, // Use commonProps
                zoom: commonProps.zoom, // Use commonProps
                offset: commonProps.offset, // Use commonProps
                highlightSolution: slopeProps.highlightSolution,
                editMode: slopeProps.editMode,
                drawingTool: slopeProps.drawingTool,
            });
        }
        return null; // Should not happen if drawingMode is one of the specified types
    }, [
        drawingMode,
        width,
        height,
        zoom,
        offset,
        mapPointToCanvas,
        mapCanvasToPoint,
        // Include all strategy-specific props in the dependency array
        (strategyProps as GenericDrawingProps).p5Setup,
        (strategyProps as GenericDrawingProps).p5Drawing,
        (strategyProps as SlopeDrawingProps).slopeConfig, // Keep in dependency array as it's a prop
        (strategyProps as SlopeDrawingProps).points,
        (strategyProps as SlopeDrawingProps).onPointsChange,
        (strategyProps as SlopeDrawingProps).highlightSolution,
        (strategyProps as SlopeDrawingProps).editMode,
        (strategyProps as SlopeDrawingProps).drawingTool,
        (strategyProps as SlopeDrawingProps).onDrawingToolChange,
        (strategyProps as SlopeDrawingProps).customPoints,
        (strategyProps as SlopeDrawingProps).customLines,
        (strategyProps as SlopeDrawingProps).shapes,
        (strategyProps as SlopeDrawingProps).texts,
        (strategyProps as SlopeDrawingProps).selectedItem,
        (strategyProps as SlopeDrawingProps).setSelectedItem,
        (strategyProps as SlopeDrawingProps).undoStack,
        (strategyProps as SlopeDrawingProps).setUndoStack,
        (strategyProps as SlopeDrawingProps).redoStack,
        (strategyProps as SlopeDrawingProps).setRedoStack,
    ]);

    if (!drawingStrategy) {
        return <div>Error: Invalid drawing mode</div>; // Or handle error appropriately
    }

    return (
        <CoreGraphCanvas
            width={width}
            height={height}
            zoom={zoom}
            offset={offset}
            onZoomChange={onZoomChange}
            onOffsetChange={onOffsetChange}
            mapPointToCanvas={mapPointToCanvas}
            mapCanvasToPoint={mapCanvasToPoint}
            drawingStrategy={drawingStrategy}
        />
    );
};

export default GraphCanvas;