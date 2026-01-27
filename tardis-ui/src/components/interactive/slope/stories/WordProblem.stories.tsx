import type { Meta, StoryObj } from '@storybook/react'
import WordProblem from '../components/WordProblem'
import { OpenAIClient } from '@/services/openAI'

const meta = {
  title: 'Slope/WordProblem',
  component: WordProblem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div
        style={{
          width: '400px',
          height: '600px',
          background: '#1f2937',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WordProblem>

export default meta
type Story = StoryObj<typeof meta>

// Mock OpenAI client for storybook
const createMockOpenAIClient = (): OpenAIClient => ({
  chatCompletion: async (messages, _model, _maxTokens) => {
    return JSON.stringify({
      question: 'A construction crew is building a wheelchair ramp that rises 6 inches over a horizontal distance of 24 inches. What is the slope of the ramp?',
      context: 'This construction scenario involves calculating the slope for a wheelchair ramp, ensuring accessibility standards are met.',
      hints: [
        'Remember: slope = rise / run',
        'Rise is the vertical change (6 inches)',
        'Run is the horizontal change (24 inches)',
      ],
      expectedSlope: 0.25,
      expectedIntercept: null,
      solution: 'slope = rise / run = 6 / 24 = 0.25',
      explanation: 'The ramp has a gentle slope of 0.25, which means for every 4 inches of horizontal distance, the ramp rises 1 inch. This meets accessibility guidelines for wheelchair ramps.',
    })
  },
})

// Sample line data for showing user's answer
const sampleLineData = {
  slope: 0.25,
  yIntercept: 0,
  equation: 'y = 0.25x',
  point1: { x: 0, y: 0 },
  point2: { x: 24, y: 6 },
  rise: 6,
  run: 24,
}

export const Default: Story = {
  args: {
    lineData: sampleLineData,
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'easy',
  },
}

export const Loading: Story = {
  args: {
    lineData: null,
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'easy',
  },
  decorators: [
    Story => {
      // Simulate loading state by overriding the component state
      return (
        <div
          style={{
            width: '400px',
            height: '600px',
            background: '#1f2937',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div className='flex h-full flex-col rounded-md bg-gray-800 p-4'>
            {/* Controls */}
            <div className='mb-4'>
              <button
                disabled
                className='w-full rounded-md px-4 py-2 text-white bg-gray-600 cursor-not-allowed'
              >
                Generating...
              </button>
            </div>
            {/* Loading skeleton */}
            <div className='flex flex-grow animate-pulse flex-col'>
              <div className='mb-4 rounded-md bg-gray-900 p-4'>
                <div className='h-4 bg-gray-700 rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-gray-700 rounded w-full mb-2'></div>
                <div className='h-3 bg-gray-700 rounded w-5/6'></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
  ],
}

export const WithGeneratedProblem: Story = {
  args: {
    lineData: sampleLineData,
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'medium',
  },
  play: async ({ canvasElement }) => {
    // Simulate a generated problem by directly setting state
    // In real storybook, this would require a more sophisticated approach
    const generateButton = canvasElement.querySelector('button')
    if (generateButton) {
      generateButton.click()
    }
  },
}

export const WithIncorrectAnswer: Story = {
  args: {
    lineData: {
      slope: 0.5,
      yIntercept: 0,
      equation: 'y = 0.5x',
      point1: { x: 0, y: 0 },
      point2: { x: 12, y: 6 },
      rise: 6,
      run: 12,
    },
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'easy',
  },
}

export const WithCorrectAnswer: Story = {
  args: {
    lineData: sampleLineData,
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'easy',
  },
}

export const NoAI: Story = {
  args: {
    lineData: sampleLineData,
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: undefined, // No AI client - will use template-based generation
    language: 'en',
    difficulty: 'easy',
  },
}

export const HardDifficulty: Story = {
  args: {
    lineData: {
      slope: 1.5,
      yIntercept: 2,
      equation: 'y = 1.5x + 2',
      point1: { x: 0, y: 2 },
      point2: { x: 4, y: 8 },
      rise: 6,
      run: 4,
    },
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'hard',
  },
}

export const NoPointsPlaced: Story = {
  args: {
    lineData: null,
    onPointsChange: points => console.log('Points changed:', points),
    openaiClient: createMockOpenAIClient(),
    language: 'en',
    difficulty: 'medium',
  },
}
