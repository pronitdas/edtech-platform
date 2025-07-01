export interface Point {
  x: number
  y: number
}

export interface Line {
  start: Point
  end: Point
  color?: string
  strokeWidth?: number
  opacity?: number
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
  opacity?: number
}

export interface Text {
  text: string
  position: Point
  color?: string
  fontSize?: string
  fontFamily?: string
  opacity?: number
}

export interface InteractiveMathConfig {
  equation: string
  xRange: [number, number]
  yRange: [number, number]
  stepSize: number
}

export interface GraphNode {
  id?: string
  labels: string[]
  properties: { [key: string]: any }
}

export interface GraphRelationship {
  id?: string
  start_node_id: string
  end_node_id: string
  type: string
  properties?: { [key: string]: any }
}

export interface GraphQueryResult {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  summary?: { [key: string]: any }
}
