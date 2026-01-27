// Mocks for Slope Drawing Storybook stories
import { OpenAIClient } from '@/services/openAI'

// Mock OpenAI client for storybook
export const createMockOpenAIClient = (): OpenAIClient => ({
  chatCompletion: async (messages, _model, _maxTokens) => {
    // Simulate different responses based on the prompt
    const lastMessage = messages[messages.length - 1]?.content || ''

    if (lastMessage.includes('Generate a real-world')) {
      return JSON.stringify({
        question: 'A construction crew is building a wheelchair ramp that rises 6 inches over a horizontal distance of 24 inches. What is the slope of the ramp?',
        context: 'This construction scenario involves calculating the slope for a wheelchair ramp.',
        hints: [
          'Remember: slope = rise / run',
          'Rise is the vertical change (6 inches)',
          'Run is the horizontal change (24 inches)',
        ],
        expectedSlope: 0.25,
        expectedIntercept: null,
        solution: 'slope = rise / run = 6 / 24 = 0.25',
        explanation: 'The ramp has a gentle slope of 0.25, which means for every 4 inches of horizontal distance, the ramp rises 1 inch.',
      })
    }

    if (lastMessage.includes('Word Problem')) {
      return JSON.stringify({
        question: 'Your solution analysis',
        feedback: 'Correct! You found the right slope.',
      })
    }

    return JSON.stringify({
      question: 'Sample question',
      context: 'Sample context',
      hints: ['Hint 1', 'Hint 2'],
      expectedSlope: 2,
      expectedIntercept: 0,
      solution: 'Solution steps...',
      explanation: 'Explanation...',
    })
  },
})

// Sample data for storybook
export const samplePoints = [
  { x: 0, y: 0 },
  { x: 4, y: 8 },
]

export const sampleLineData = {
  slope: 2,
  yIntercept: 0,
  equation: 'y = 2x',
  point1: { x: 0, y: 0 },
  point2: { x: 4, y: 8 },
  rise: 8,
  run: 4,
}

export const sampleInteractiveContent = {
  id: 'sample-content',
  title: 'Understanding Slope',
  description: 'Learn about different types of slopes and how to calculate them.',
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

export const sampleWordProblem = {
  question: 'A construction crew is building a wheelchair ramp that rises 6 inches over a horizontal distance of 24 inches. What is the slope of the ramp?',
  context: 'This construction scenario involves calculating the slope for a wheelchair ramp.',
  hints: [
    'Remember: slope = rise / run',
    'Rise is the vertical change (6 inches)',
    'Run is the horizontal change (24 inches)',
  ],
  expectedSlope: 0.25,
  expectedIntercept: null,
  solution: 'slope = rise / run = 6 / 24 = 0.25',
  explanation: 'The ramp has a gentle slope of 0.25, which means for every 4 inches of horizontal distance, the ramp rises 1 inch.',
}

export const sampleAnimationSteps = [
  { id: '1', description: 'Start with the first point (0, 0).', duration: 2000 },
  { id: '2', description: 'Add the second point (4, 8).', duration: 2000 },
  { id: '3', description: 'Calculate the rise (change in y): 8 - 0 = 8', duration: 2000 },
  { id: '4', description: 'Calculate the run (change in x): 4 - 0 = 4', duration: 2000 },
  { id: '5', description: 'Calculate the slope: 8/4 = 2', duration: 2000 },
  { id: '6', description: 'The equation of the line is: y = 2x', duration: 2000 },
]

export const sampleStats = {
  correct: 3,
  incorrect: 1,
  attempted: 4,
  streakCount: 2,
  history: ['correct', 'incorrect', 'correct', 'correct'] as ('correct' | 'incorrect')[],
  difficultyStats: {
    easy: { attempted: 2, correct: 2 },
    medium: { attempted: 2, correct: 1 },
    hard: { attempted: 0, correct: 0 },
  },
}
