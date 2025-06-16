import { MotionValue } from 'framer-motion'

export interface Point {
  x: number
  y: number
}

export interface Offset {
  x: number
  y: number
}

export interface LineData {
  point1: Point
  point2: Point
  slope: number
  yIntercept: number
  equation: string
  rise: number
  run: number
}

export interface Line {
  start: Point
  end: Point
  strokeWidth?: number
  color?: string
  opacity?: number | MotionValue<number>
  animationDelay?: number
}

export interface Shape {
  type: 'rectangle' | 'circle'
  topLeft?: Point
  bottomRight?: Point
  center?: Point
  radius?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number | MotionValue<number>
  animationDelay?: number
}

export interface Text {
  text: string
  position: Point
  fontSize?: string
  fontFamily?: string
  color?: string
  opacity?: number | MotionValue<number>
  animationDelay?: number
}
