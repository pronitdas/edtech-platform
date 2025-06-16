import type { Meta, StoryObj } from '@storybook/react'
import BottomControls from '../components/BottomControls'

const meta = {
  title: 'Slope/BottomControls',
  component: BottomControls,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BottomControls>

export default meta
type Story = StoryObj<typeof meta>

export const NoLineData: Story = {
  args: {
    resetView: () => console.log('Reset view'),
    clearPoints: () => console.log('Clear points'),
    onShowAnimation: () => console.log('Show animation'),
  },
}

export const WithLineData: Story = {
  args: {
    lineData: {
      slope: 2,
      equation: 'y = 2x + 3',
      intercept: 3,
      point1: { x: 0, y: 3 },
      point2: { x: 2, y: 7 },
    },
    resetView: () => console.log('Reset view'),
    clearPoints: () => console.log('Clear points'),
    onShowAnimation: () => console.log('Show animation'),
  },
}

export const UndefinedSlope: Story = {
  args: {
    lineData: {
      slope: null,
      equation: 'x = 2',
      point1: { x: 2, y: -1 },
      point2: { x: 2, y: 3 },
    },
    resetView: () => console.log('Reset view'),
    clearPoints: () => console.log('Clear points'),
    onShowAnimation: () => console.log('Show animation'),
  },
}
