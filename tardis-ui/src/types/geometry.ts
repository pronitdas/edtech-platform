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