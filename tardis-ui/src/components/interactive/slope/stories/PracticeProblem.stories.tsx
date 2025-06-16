import type { Meta, StoryObj } from '@storybook/react'
import PracticeProblem from '../components/PracticeProblem'
import { Problem, ProblemGenerationStats } from '../types'

const meta = {
  title: 'Slope/PracticeProblem',
  component: PracticeProblem,
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
          background: '#1a1a1a',
          padding: '1rem',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PracticeProblem>

export default meta
type Story = StoryObj<typeof meta>

const sampleProblems: Problem[] = [
  {
    id: 'prob-1',
    question: 'Draw a line with slope = 2',
    difficulty: 'easy',
    hints: [
      'Try starting at the origin (0,0)',
      'Remember: slope is rise over run',
    ],
    solution: { slope: 2, yIntercept: 0 },
    targetPoints: [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: 'prob-2',
    question: 'Draw a line with slope = -1 passing through point (2,3)',
    difficulty: 'medium',
    hints: [
      'Start at the given point (2,3)',
      'For slope -1, when x increases by 1, y decreases by 1',
    ],
    solution: { slope: -1, yIntercept: 5 },
    targetPoints: [
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ],
  },
]

const sampleStats = {
  correct: 3,
  incorrect: 1,
  attempted: 4,
  streakCount: 2,
  history: ['correct', 'incorrect', 'correct', 'correct'] as (
    | 'correct'
    | 'incorrect'
  )[],
  difficultyStats: {
    easy: { attempted: 2, correct: 2 },
    medium: { attempted: 2, correct: 1 },
    hard: { attempted: 0, correct: 0 },
  },
}

const sampleLineData = {
  slope: 2,
  yIntercept: 0,
  equation: 'y = 2x',
  point1: { x: 0, y: 0 },
  point2: { x: 1, y: 2 },
  rise: 2,
  run: 1,
}

export const Default: Story = {
  args: {
    problems: sampleProblems,
    currentProblemId: 'prob-1',
    difficulty: 'easy',
    setDifficulty: difficulty => console.log('Set difficulty:', difficulty),
    onSelectProblem: id => console.log('Selected problem:', id),
    onGenerateNewProblem: () => console.log('Generate new problem'),
    lineData: sampleLineData,
    onSubmitAnswer: () => console.log('Submit answer'),
    isCorrect: null,
    showSolution: false,
    onToggleSolution: () => console.log('Toggle solution'),
    onNextProblem: () => console.log('Next problem'),
    stats: sampleStats,
    onHintRequest: () => console.log('Hint requested'),
  },
}

export const WithIncorrectAttempt: Story = {
  args: {
    ...Default.args,
    isCorrect: false,
    lineData: {
      ...sampleLineData,
      slope: 1.5,
      equation: 'y = 1.5x',
      point2: { x: 2, y: 3 },
      rise: 3,
      run: 2,
    },
  },
}

export const WithCorrectSolution: Story = {
  args: {
    ...Default.args,
    isCorrect: true,
    showSolution: true,
  },
}

export const MediumDifficulty: Story = {
  args: {
    ...Default.args,
    currentProblemId: 'prob-2',
    difficulty: 'medium',
    lineData: {
      slope: -1,
      yIntercept: 5,
      equation: 'y = -x + 5',
      point1: { x: 2, y: 3 },
      point2: { x: 3, y: 2 },
      rise: -1,
      run: 1,
    },
  },
}
