import React, { useState } from 'react'
import type { Meta, StoryFn } from '@storybook/react'
import GraphCanvas from './GraphCanvas'
import { Point, Line, Shape, Text, Offset } from '@/types/geometry'
import { InteractionTrackerProvider } from '@/stories/InteractionTrackerContextMock'

export default {
  title: 'Components/GraphCanvas',
  component: GraphCanvas,
  decorators: [
    (Story: any) => (
      <InteractionTrackerProvider>
        <Story />
      </InteractionTrackerProvider>
    ),
  ],
} as Meta

const Template: StoryFn<any> = args => {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })

  const mapPointToCanvas = (point: Point): Point => ({
    x: point.x * 50 + 200, // Scale and center the points
    y: 200 - point.y * 50, // Flip Y axis and scale
  })

  const mapCanvasToPoint = (canvasPoint: { x: number; y: number }): Point => ({
    x: (canvasPoint.x - 200) / 50,
    y: (200 - canvasPoint.y) / 50,
  })

  return (
    <div style={{ border: '1px solid #ccc', padding: '8px' }}>
      <GraphCanvas
        {...args}
        zoom={zoom}
        offset={offset}
        onZoomChange={setZoom}
        onOffsetChange={setOffset}
        mapPointToCanvas={mapPointToCanvas}
        mapCanvasToPoint={mapCanvasToPoint}
      />
    </div>
  )
}

// SVG Example with interactive elements
export const InteractiveSvgExample = Template.bind({})
InteractiveSvgExample.args = {
  width: 400,
  height: 400,
  renderingMode: 'svg',
  points: [
    { x: -2, y: 1 },
    { x: 0, y: 0 },
    { x: 2, y: 2 },
  ],
  lines: [
    {
      start: { x: -2, y: -2 },
      end: { x: 2, y: 2 },
      color: 'blue',
      strokeWidth: 2,
    },
  ],
  shapes: [
    {
      type: 'rectangle',
      topLeft: { x: -1, y: -1 },
      bottomRight: { x: 1, y: 1 },
      fill: 'rgba(200, 200, 200, 0.5)',
    },
  ],
  texts: [
    {
      text: 'Click me!',
      position: { x: 0, y: 2 },
      fontSize: '14px',
    },
  ],
  onElementClick: (type: string, index: number, data: any) => {
    console.log('Clicked element:', { type, index, data })
    alert(`Clicked ${type} at index ${index}`)
  },
}

// P5 Example with slope drawing
export const InteractiveP5Example = Template.bind({})
InteractiveP5Example.args = {
  width: 400,
  height: 400,
  renderingMode: 'p5',
  drawingMode: 'slope',
  points: [
    { x: -1, y: -1 },
    { x: 1, y: 1 },
  ],
  customPoints: [{ x: 0, y: 0 }],
  customLines: [
    {
      start: { x: -2, y: 0 },
      end: { x: 2, y: 0 },
      color: 'red',
    },
  ],
  shapes: [
    {
      type: 'rectangle',
      topLeft: { x: -0.5, y: -0.5 },
      bottomRight: { x: 0.5, y: 0.5 },
      fill: 'rgba(100, 200, 100, 0.3)',
    },
  ],
  texts: [
    {
      text: 'Origin',
      position: { x: 0, y: -0.2 },
    },
  ],
  onElementClick: (type: string, index: number, data: any) => {
    console.log('Clicked element:', { type, index, data })
    alert(`Clicked ${type} at index ${index}`)
  },
  editMode: true,
  drawingTool: 'point',
  highlightSolution: false,
}
