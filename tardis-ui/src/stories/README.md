# Storybook Utilities

This directory contains utility components and helpers for use in Storybook stories.

## MockInteractionTrackerProvider

The `MockInteractionTrackerProvider` is a mock implementation of the `InteractionTrackerProvider` used in the application. It provides a mock context that satisfies the requirements of components that use the `useInteractionTracker` hook.

### Usage

If your component uses the `useInteractionTracker` hook, you'll need to wrap it with the `MockInteractionTrackerProvider` in your Storybook stories:

```tsx
import { MockInteractionTrackerProvider } from "../stories/MockInteractionTrackerProvider"

// In your story decorator
export const yourStory: Story = {
  decorators: [
    Story => (
      <MockInteractionTrackerProvider>
        <Story />
      </MockInteractionTrackerProvider>
    ),
  ],
  // ...other story properties
}

// Or in your Meta configuration
const meta: Meta<typeof YourComponent> = {
  decorators: [
    Story => (
      <MockInteractionTrackerProvider>
        <Story />
      </MockInteractionTrackerProvider>
    ),
  ],
  // ...other meta properties
}
```

### Error Handling

If you see an error like:

```
Error: useInteractionTracker must be used within an InteractionTrackerProvider
```

It means your component is using the `useInteractionTracker` hook but isn't wrapped with a provider. Add the `MockInteractionTrackerProvider` to your story as shown above.

### Customizing the Mock

If you need to customize the behavior of the mock tracker, you can modify the `mockTrackerContext` object in `MockInteractionTrackerProvider.tsx`.

For example, if you need to capture calls to a specific tracking function, you can access the `calls` array on the mock function:

```tsx
import {
  MockInteractionTrackerProvider,
  mockTrackerContext,
} from "../stories/MockInteractionTrackerProvider"

// After your story runs
console.log(mockTrackerContext.trackContentView.calls) // Access the recorded calls
```
