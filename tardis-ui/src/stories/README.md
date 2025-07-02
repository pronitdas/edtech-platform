# Storybook Utilities

This directory contains utility components and helpers for use in Storybook stories.

## InteractionTracker Mock

The InteractionTracker mock provides a complete mock implementation of the `InteractionTrackerProvider` and `useInteractionTracker` hook used in the application.

### Automatic Mock Resolution

**✅ All stories automatically have access to the InteractionTracker context!**

The Storybook configuration includes a Vite alias that automatically redirects all imports of `@/contexts/InteractionTrackerContext` to use the mock implementation (`InteractionTrackerContextMock.tsx`). This means:

- No individual story decorators needed
- No manual provider wrapping required
- All components using `useInteractionTracker` work out of the box

### Available Mock Files

- `InteractionTrackerContextMock.tsx` - Complete mock implementation used by the alias
- `mockHooks.tsx` - Original mock implementation (legacy)

### Manual Usage (Usually Not Needed)

Since the alias handles everything automatically, you typically don't need to manually add providers. However, if you need custom mock behavior for a specific story, you can still use individual decorators:

```tsx
import { InteractionTrackerProvider } from "../stories/InteractionTrackerContextMock"

// In your story decorator
export const yourStory: Story = {
  decorators: [
    Story => (
      <InteractionTrackerProvider>
        <Story />
      </InteractionTrackerProvider>
    ),
  ],
  // ...other story properties
}

// Or in your Meta configuration
const meta: Meta<typeof YourComponent> = {
  decorators: [
    Story => (
      <InteractionTrackerProvider>
        <Story />
      </InteractionTrackerProvider>
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

This should no longer happen since the Vite alias automatically redirects to the mock. If you still see this error, check that:

1. The alias for `@/contexts/InteractionTrackerContext` is properly configured in `.storybook/main.ts`
2. The `InteractionTrackerContextMock.tsx` file exists and exports the correct functions
3. Try restarting Storybook to clear any cached imports

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
