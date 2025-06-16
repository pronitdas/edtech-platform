import type { Meta, StoryObj } from '@storybook/react'
import DrawingToolbar from '../components/DrawingToolbar'

const meta = {
  title: 'Slope/DrawingToolbar',
  component: DrawingToolbar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DrawingToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    drawingTool: 'move',
    setDrawingTool: tool => console.log('Selected tool:', tool),
  },
}

export const WithSelectedTool: Story = {
  args: {
    drawingTool: 'solidLine',
    setDrawingTool: tool => console.log('Selected tool:', tool),
  },
}
