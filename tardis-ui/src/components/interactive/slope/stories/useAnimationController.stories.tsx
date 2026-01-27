import type { Meta, StoryObj } from '@storybook/react'
import { useAnimationController, AnimationStep } from '../hooks/useAnimationController'

const meta = {
  title: 'Slope/Hooks/useAnimationController',
  component: () => {
    const [state, controls] = useAnimationController({
      steps: [
        { id: '1', description: 'Start with the first point (0, 0).', duration: 2000 },
        { id: '2', description: 'Add the second point (4, 8).', duration: 2000 },
        { id: '3', description: 'Calculate the rise: 8 - 0 = 8', duration: 2000 },
        { id: '4', description: 'Calculate the run: 4 - 0 = 4', duration: 2000 },
        { id: '5', description: 'Calculate the slope: 8/4 = 2', duration: 2000 },
        { id: '6', description: 'The equation is: y = 2x', duration: 2000 },
      ],
      autoPlay: false,
      loop: false,
    })

    return (
      <div style={{ width: '400px', padding: '16px', background: '#1f2937', borderRadius: '8px', color: 'white' }}>
        <h2 style={{ marginBottom: '16px' }}>useAnimationController Hook Demo</h2>

        {/* Progress */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Progress</span>
            <span>{(state.progress * 100).toFixed(0)}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px' }}>
            <div
              style={{
                width: `${state.progress * 100}%`,
                height: '100%',
                background: '#3b82f6',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Step {state.currentStepIndex + 1} of 6
          </p>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  background: i < state.currentStepIndex
                    ? '#3b82f6'
                    : i === state.currentStepIndex
                      ? '#60a5fa'
                      : '#374151',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={controls.stop}
            style={{ flex: 1, padding: '8px', background: '#4b5563', border: 'none', borderRadius: '4px', color: 'white' }}
          >
            ⏹ Stop
          </button>
          <button
            onClick={state.isPlaying && !state.isPaused ? controls.pause : controls.play}
            style={{ flex: 1, padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '4px', color: 'white' }}
          >
            {state.isPlaying && !state.isPaused ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={controls.previousStep}
            style={{ flex: 1, padding: '8px', background: '#4b5563', border: 'none', borderRadius: '4px', color: 'white' }}
          >
            ⏮ Prev
          </button>
          <button
            onClick={controls.nextStep}
            style={{ flex: 1, padding: '8px', background: '#4b5563', border: 'none', borderRadius: '4px', color: 'white' }}
          >
            Next ⏭
          </button>
        </div>

        {/* Speed control */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Speed:</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['0.5x', '1x', '2x'].map(speed => {
              const speedValue = parseFloat(speed)
              return (
                <button
                  key={speed}
                  onClick={() => controls.setSpeed(speedValue)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                  }}
                >
                  {speed}
                </button>
              )
            })}
          </div>
        </div>

        {/* Seek */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Seek:</label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={state.progress}
            onChange={e => controls.seek(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
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

export const AutoPlay: Story = {
  decorators: [
    Story => {
      const steps: AnimationStep[] = [
        { id: '1', description: 'Start at origin (0, 0).', duration: 1500 },
        { id: '2', description: 'Add point (4, 8).', duration: 1500 },
        { id: '3', description: 'Rise = 8, Run = 4', duration: 1500 },
        { id: '4', description: 'Slope = 8/4 = 2', duration: 1500 },
        { id: '5', description: 'Equation: y = 2x', duration: 1500 },
      ]

      const [state, controls] = useAnimationController({
        steps,
        autoPlay: true,
        defaultSpeed: 1,
        loop: true,
      })

      return (
        <div style={{ width: '400px', padding: '16px', background: '#1f2937', borderRadius: '8px', color: 'white' }}>
          <h2 style={{ marginBottom: '8px' }}>AutoPlay with Loop</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
            Animation plays automatically and loops forever.
          </p>

          {/* Progress */}
          <div style={{ marginBottom: '16px' }}>
            display: 'flex', justifyContent: 'space-between', marginBottom: '4px', <div style={{ fontSize: '14px' }}>
              <span>Step {state.currentStepIndex + 1}/{steps.length}</span>
              <span>{(state.progress * 100).toFixed(0)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#374151', borderRadius: '3px' }}>
              <div
                style={{
                  width: `${state.progress * 100}%`,
                  height: '100%',
                  background: '#22c55e',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          {/* Current step description */}
          <div
            style={{
              padding: '16px',
              background: '#111827',
              borderRadius: '8px',
              marginBottom: '16px',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <p>{steps[state.currentStepIndex]?.description || 'Complete!'}</p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={controls.stop}
              style={{ flex: 1, padding: '8px', background: '#4b5563', border: 'none', borderRadius: '4px', color: 'white' }}
            >
              Stop
            </button>
            <button
              onClick={controls.pause}
              style={{ flex: 1, padding: '8px', background: '#eab308', border: 'none', borderRadius: '4px', color: 'black' }}
            >
              Pause
            </button>
          </div>
        </div>
      )
    },
  ],
}

import React from 'react'
