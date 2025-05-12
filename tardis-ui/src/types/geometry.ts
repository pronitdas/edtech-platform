export interface Point {
    x: number;
    y: number;
}

export interface Offset {
    x: number;
    y: number;
}

export interface CustomShape {
    points: Point[];
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
}

export interface LineData {
    slope: number | null;
    yIntercept: number | null;
    equation: string;
    point1: { x: number; y: number };
    point2: { x: number; y: number };
    rise: number;
    run: number;
}

export interface Line {
    start: Point;
    end: Point;
}

export interface Shape {
    type: 'rectangle'; // Add other types as needed
    topLeft: Point;
    bottomRight: Point;
    // Add other properties like color, stroke, etc. if needed
}

export interface Text {
    text: string;
    position: Point;
    // Add other properties like font, size, color, etc. if needed
}