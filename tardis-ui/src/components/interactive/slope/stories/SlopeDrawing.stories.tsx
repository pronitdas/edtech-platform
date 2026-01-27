import type { Meta, StoryObj } from '@storybook/react'
import SlopeDrawing from '../SlopeDrawing'

const meta = {
  title: 'Slope/SlopeDrawing',
  component: SlopeDrawing,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SlopeDrawing>

export default meta
type Story = StoryObj<typeof meta>

const sampleInteractiveContent = {
  id: 'sample-content',
  title: 'Understanding Slope',
  description:
    'Learn about different types of slopes and how to calculate them.',
  type: 'slope-drawing',
  data: {
    conceptExplanations: [
      {
        id: 'positive',
        title: 'Positive Slope',
        content: 'A line that rises from left to right has a positive slope.',
        formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} > 0$$',
        demoPoints: [
          { x: -2, y: -1 },
          { x: 2, y: 3 },
        ],
      },
      {
        id: 'negative',
        title: 'Negative Slope',
        content: 'A line that falls from left to right has a negative slope.',
        formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} < 0$$',
        demoPoints: [
          { x: -2, y: 3 },
          { x: 2, y: -1 },
        ],
      },
    ],
    problems: [
      {
        id: 'prob-1',
        question: 'Draw a line with slope = 2',
        difficulty: 'easy',
        solution: { slope: 2, yIntercept: 0 },
        hints: ['Try starting at the origin (0,0)'],
      },
      {
        id: 'prob-2',
        question: 'Draw a line with slope = -1',
        difficulty: 'medium',
        solution: { slope: -1, yIntercept: 0 },
        hints: ['Think about what negative slope means'],
      },
    ],
  },
}

export const Default: Story = {
  args: {
    interactiveContent: sampleInteractiveContent,
    userId: 'user-123',
    knowledgeId: 'knowledge-456',
    language: 'en',
    onUpdateProgress: progress => console.log('Progress updated:', progress),
  },
}

export const WithOpenAI: Story = {
  args: {
    interactiveContent: sampleInteractiveContent,
    userId: 'user-123',
    knowledgeId: 'knowledge-456',
    language: 'en',
    onUpdateProgress: progress => console.log('Progress updated:', progress),
    openaiClient: {
      generateResponse: async prompt => {
        console.log('OpenAI prompt:', prompt)
        return 'Sample OpenAI response'
      },
      chatCompletion: async () => {
        return 'Sample OpenAI response'
      },
    },
  },
}
