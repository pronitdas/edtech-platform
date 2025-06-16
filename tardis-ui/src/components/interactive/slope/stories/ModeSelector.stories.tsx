import type { Meta, StoryObj } from '@storybook/react'
import ModeSelector from '../components/ModeSelector'

const meta = {
  title: 'Slope/ModeSelector',
  component: ModeSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModeSelector>

export default meta
type Story = StoryObj<typeof meta>

const defaultCognitiveState = {
  loadLevel: 'low' as const,
  errorCount: 0,
  hesitationSeconds: 0,
  idleTimeSeconds: 0,
}

export const Default: Story = {
  args: {
    activeMode: 'concept',
    onModeChange: mode => console.log('Mode changed:', mode),
    cognitiveState: defaultCognitiveState,
    onReset: () => console.log('Reset cognitive state'),
  },
}

export const PracticeMode: Story = {
  args: {
    activeMode: 'practice',
    onModeChange: mode => console.log('Mode changed:', mode),
    cognitiveState: {
      ...defaultCognitiveState,
      loadLevel: 'medium',
      errorCount: 2,
      hesitationSeconds: 30,
    },
    onReset: () => console.log('Reset cognitive state'),
  },
}

export const HighCognitiveLoad: Story = {
  args: {
    activeMode: 'word',
    onModeChange: mode => console.log('Mode changed:', mode),
    cognitiveState: {
      loadLevel: 'high',
      errorCount: 5,
      hesitationSeconds: 120,
      idleTimeSeconds: 60,
    },
    onReset: () => console.log('Reset cognitive state'),
  },
}
