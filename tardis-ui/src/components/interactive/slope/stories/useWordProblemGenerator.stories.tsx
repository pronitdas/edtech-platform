import type { Meta, StoryObj } from '@storybook/react'
import { useWordProblemGenerator } from '../hooks/useWordProblemGenerator'

const meta = {
  title: 'Slope/Hooks/useWordProblemGenerator',
  component: () => {
    const hook = useWordProblemGenerator({
      openaiClient: undefined, // Will use template-based generation
      language: 'en',
      defaultDifficulty: 'medium',
    })

    return (
      <div style={{ width: '400px', padding: '16px', background: '#1f2937', borderRadius: '8px', color: 'white' }}>
        <h2 style={{ marginBottom: '16px' }}>useWordProblemGenerator Hook Demo</h2>

        {/* Difficulty Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Difficulty:</label>
          <select
            value={hook.difficulty}
            onChange={e => hook.setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          >
            <option value='easy'>Easy</option>
            <option value='medium'>Medium</option>
            <option value='hard'>Hard</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => hook.generateProblem()}
          disabled={hook.isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: hook.isLoading ? '#4b5563' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: hook.isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          {hook.isLoading ? 'Generating...' : 'Generate New Problem'}
        </button>

        {/* Error */}
        {hook.error && (
          <div style={{ padding: '12px', background: '#7f1d1d', borderRadius: '4px', marginBottom: '16px' }}>
            {hook.error}
          </div>
        )}

        {/* Current Problem */}
        {hook.currentProblem && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>Question:</h3>
            <p style={{ marginBottom: '8px' }}>{hook.currentProblem.question}</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>{hook.currentProblem.context}</p>

            {hook.currentProblem.hints && hook.currentProblem.hints.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ color: '#a78bfa', fontSize: '14px' }}>Hint:</p>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>{hook.currentProblem.hints[0]}</p>
              </div>
            )}

            {/* Visualization */}
            {hook.currentProblem.visualization && (
              <div
                style={{ marginTop: '12px' }}
                dangerouslySetInnerHTML={{ __html: hook.currentProblem.visualization.svg }}
              />
            )}
          </div>
        )}

        {/* History */}
        {hook.history.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '8px' }}>History ({hook.history.length}):</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {hook.history.slice(0, 3).map((entry, i) => (
                <li
                  key={entry.id}
                  style={{
                    padding: '8px',
                    background: entry.isCorrect ? '#065f46' : '#7f1d1d',
                    borderRadius: '4px',
                    marginBottom: '4px',
                  }}
                >
                  {entry.isCorrect ? '✓' : '✗'} {entry.problem.question.slice(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clear History */}
        {hook.history.length > 0 && (
          <button
            onClick={hook.clearHistory}
            style={{
              width: '100%',
              padding: '8px',
              background: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginTop: '16px',
            }}
          >
            Clear History
          </button>
        )}
      </div>
    )
  },
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAI: Story = {
  decorators: [
    Story => {
      const hook = useWordProblemGenerator({
        openaiClient: {
          chatCompletion: async (messages, _model, _maxTokens) => {
            return JSON.stringify({
              question: 'AI-generated: A farmer wants to build a fence that goes up a hill with slope 0.75. If the hill rises 15 feet over a horizontal distance of 20 feet, what is the slope?',
              context: 'This farming scenario involves calculating slope for a fence on uneven terrain.',
              hints: [
                'Slope is rise over run',
                'Rise = 15 feet, Run = 20 feet',
              ],
              expectedSlope: 0.75,
              expectedIntercept: null,
              solution: 'slope = 15/20 = 0.75',
              explanation: 'The fence will have a gentle slope of 0.75, suitable for the terrain.',
            })
          },
        },
        language: 'en',
        defaultDifficulty: 'medium',
      })

      return (
        <div style={{ width: '400px', padding: '16px', background: '#1f2937', borderRadius: '8px', color: 'white' }}>
          <h2 style={{ marginBottom: '16px' }}>useWordProblemGenerator with AI</h2>
          <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
            This demo uses a mock AI client to generate dynamic word problems.
          </p>
          <button
            onClick={() => hook.generateProblem()}
            disabled={hook.isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: hook.isLoading ? '#4b5563' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: hook.isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {hook.isLoading ? 'Generating...' : 'Generate AI Problem'}
          </button>
          {hook.currentProblem && (
            <div style={{ marginTop: '16px' }}>
              <p>{hook.currentProblem.question}</p>
            </div>
          )}
        </div>
      )
    },
  ],
}

export const WithHistory: Story = {
  decorators: [
    Story => {
      const hook = useWordProblemGenerator({
        language: 'en',
        defaultDifficulty: 'easy',
        maxHistorySize: 5,
      })

      // Pre-populate with some history
      React.useEffect(() => {
        // Generate a few problems to populate history
        hook.generateProblem()
      }, [])

      return <Story />
    },
  ],
}

import React from 'react'
