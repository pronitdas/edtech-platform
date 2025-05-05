import type { Meta, StoryObj } from '@storybook/react';
import GraphCanvas from '../components/GraphCanvas';

const meta = {
  title: 'Slope/GraphCanvas',
  component: GraphCanvas,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '600px', height: '400px', background: '#1a1a1a' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GraphCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper function to simulate point mapping
const mockMapPointToCanvas = (point: { x: number; y: number }) => ({
  x: (point.x + 10) * 30,
  y: (10 - point.y) * 30,
});

const mockMapCanvasToPoint = (point: { x: number; y: number }) => ({
  x: point.x / 30 - 10,
  y: 10 - point.y / 30,
});

// Base props that all stories will extend
const baseProps = {
  width: 600,
  height: 400,
  zoom: 1,
  offset: { x: 0, y: 0 },
  onZoomChange: (zoom: number) => console.log('Zoom changed:', zoom),
  onOffsetChange: (offset: { x: number; y: number }) => console.log('Offset changed:', offset),
  mapPointToCanvas: mockMapPointToCanvas,
  mapCanvasToPoint: mockMapCanvasToPoint,
  editMode: true,
  drawingTool: 'move' as const,
  onDrawingToolChange: (tool: string) => console.log('Tool changed:', tool),
};

export const EmptyGraph: Story = {
  args: {
    ...baseProps,
    points: [],
    onPointsChange: (points) => console.log('Points changed:', points),
  },
};

export const WithPoints: Story = {
  args: {
    ...baseProps,
    points: [
      { x: -2, y: 1 },
      { x: 2, y: 5 },
    ],
    onPointsChange: (points) => console.log('Points changed:', points),
  },
};

export const WithZoomAndPan: Story = {
  args: {
    ...baseProps,
    points: [
      { x: -2, y: 1 },
      { x: 2, y: 5 },
    ],
    zoom: 1.5,
    offset: { x: 50, y: -30 },
    onPointsChange: (points) => console.log('Points changed:', points),
  },
};

export const ReadOnlyMode: Story = {
  args: {
    ...baseProps,
    points: [
      { x: -2, y: 1 },
      { x: 2, y: 5 },
    ],
    editMode: false,
    onPointsChange: (points) => console.log('Points changed:', points),
  },
};

export const HighlightedSolution: Story = {
  args: {
    ...baseProps,
    points: [
      { x: -2, y: -2 },
      { x: 2, y: 2 },
    ],
    highlightSolution: true,
    onPointsChange: (points) => console.log('Points changed:', points),
  },
};

export const DrawingMode: Story = {
  args: {
    ...baseProps,
    points: [],
    drawingTool: 'solidLine',
    onPointsChange: (points) => console.log('Points changed:', points),
  },
};

export const MultiplePoints: Story = {
  args: {
    ...baseProps,
    points: [
      { x: -4, y: -2 },
      { x: -2, y: 1 },
      { x: 0, y: 0 },
      { x: 2, y: 3 },
      { x: 4, y: 2 },
    ],
    onPointsChange: (points) => console.log('Points changed:', points),
  },
}; 