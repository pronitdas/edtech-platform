import React, { ReactNode } from 'react'
import { InteractionTrackerProvider } from './mockHooks'

// The actual mock implementation is in mockHooks.tsx
// Jest would normally handle this with jest.mock, but in Storybook
// we'll have our components use the mock hook directly

// Simple no-op provider component
export const MockInteractionTrackerProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  return <InteractionTrackerProvider>{children}</InteractionTrackerProvider>
}

// Add instructions on using this mock in README.md
// Users will need to update their imports to use our mock hook
