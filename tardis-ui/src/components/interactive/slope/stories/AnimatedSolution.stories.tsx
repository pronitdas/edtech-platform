import type { Meta, StoryObj } from '@storybook/react'
import AnimatedSolution from '../components/AnimatedSolution'

const meta = {
  title: 'Slope/AnimatedSolution',
  component: AnimatedSolution,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div
        style={{
          width: '400px',
          height: '300px',
          background: '#1f2937',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnimatedSolution>

export default meta
type Story = StoryObj<typeof meta>

const samplePoints = [
  { x: 0, y: 0 },
  { x: 4, y: 8 },
]

const sampleLineData = {
  slope: 2,
  equation: 'y = 2x',
}

export const Default: Story = {
  args: {
    points: samplePoints,
    slope: sampleLineData.slope,
    equation: sampleLineData.equation,
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'normal',
  },
}

export const AutoPlay: Story = {
  args: {
    points: samplePoints,
    slope: sampleLineData.slope,
    equation: sampleLineData.equation,
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: true,
    speed: 'normal',
  },
}

export const SlowSpeed: Story = {
  args: {
    points: samplePoints,
    slope: sampleLineData.slope,
    equation: sampleLineData.equation,
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'slow',
  },
}

export const FastSpeed: Story = {
  args: {
    points: samplePoints,
    slope: sampleLineData.slope,
    equation: sampleLineData.equation,
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'fast',
  },
}

export const NegativeSlope: Story = {
  args: {
    points: [
      { x: 0, y: 8 },
      { x: 4, y: 0 },
    ],
    slope: -2,
    equation: 'y = -2x + 8',
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'normal',
  },
}

export const ZeroSlope: Story = {
  args: {
    points: [
      { x: 0, y: 4 },
      { x: 6, y: 4 },
    ],
    slope: 0,
    equation: 'y = 4',
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'normal',
  },
}

export const UndefinedSlope: Story = {
  args: {
    points: [
      { x: 2, y: 0 },
      { x: 2, y: 6 },
    ],
    slope: null,
    equation: 'x = 2',
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'normal',
  },
}

export const NoPoints: Story = {
  args: {
    points: [],
    slope: null,
    equation: '',
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'normal',
  },
}

export const WithSpeedChange: Story = {
  args: {
    points: samplePoints,
    slope: sampleLineData.slope,
    equation: sampleLineData.equation,
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    onSpeedChange: speed => console.log('Speed changed:', speed),
    autoPlay: false,
    speed: 'normal',
  },
}

export const InMiddle: Story = {
  args: {
    points: samplePoints,
    slope: sampleLineData.slope,
    equation: sampleLineData.equation,
    onPointsChange: points => console.log('Points changed:', points),
    onComplete: () => console.log('Animation complete'),
    autoPlay: false,
    speed: 'normal',
  },
  // Note: In a real scenario, you'd need to use play() to set internal state
  // This is a visual placeholder showing the component in a populated state
}
