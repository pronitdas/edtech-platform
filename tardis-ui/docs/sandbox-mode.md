# Sandbox Mode Documentation

## Overview

Sandbox mode is a development feature that allows the application to return mock responses instead of making real API calls. This is useful for:

- **Development**: When the backend is not available or under development
- **Testing**: For consistent test data and scenarios
- **Demos**: For showcasing features without requiring a live backend
- **Offline Development**: When working without internet connectivity

## Configuration

### Environment Variable

Add to your `.env` file:

```bash
# Enable sandbox mode
VITE_SANDBOX_MODE=true

# Optional: Show sandbox toggle in production
VITE_SHOW_SANDBOX_TOGGLE=true
```

### Runtime Toggle

You can also toggle sandbox mode at runtime using:

```typescript
import { apiClient } from '@/services/api-client'

// Enable sandbox mode
apiClient.setSandboxMode(true)

// Disable sandbox mode
apiClient.setSandboxMode(false)

// Check if sandbox mode is enabled
const isEnabled = apiClient.isSandboxMode()
```

## Usage

### Using the Hook

```typescript
import { useSandboxMode } from '@/hooks/useSandboxMode'

function MyComponent() {
  const { isEnabled, toggle, enable, disable } = useSandboxMode()

  return (
    <div>
      <p>Sandbox mode: {isEnabled ? 'ON' : 'OFF'}</p>
      <button onClick={toggle}>Toggle Sandbox Mode</button>
    </div>
  )
}
```

### Using the Toggle Component

```typescript
import SandboxModeToggle from '@/components/SandboxModeToggle'

function DeveloperPanel() {
  return (
    <div>
      <h3>Developer Tools</h3>
      <SandboxModeToggle className="mb-4" />
    </div>
  )
}
```

## Mock Responses

The sandbox mode includes predefined mock responses for common endpoints:

### Authentication
- `POST /v2/auth/login` - Returns mock user with token
- `POST /v2/auth/register` - Returns new mock user with token
- `POST /v2/auth/logout` - Returns success response
- `GET /v2/auth/profile` - Returns mock user profile
- `PUT /v2/auth/profile` - Returns updated mock profile

### Knowledge Management
- `GET /v2/knowledge` - Returns list of mock knowledge bases
- `GET /v2/knowledge/{id}` - Returns specific mock knowledge base
- `POST /v2/knowledge` - Returns success response for new knowledge base
- `DELETE /v2/knowledge/{id}` - Returns success response

### Chapters
- `GET /v2/chapters/{knowledgeId}` - Returns mock chapters
- `PUT /v2/chapters/{knowledgeId}/{chapterId}` - Returns updated mock chapter

## Adding Custom Mock Responses

To add custom mock responses, edit the `mockResponses` object in:
- `/src/services/api-client.ts`
- `/src/services/api.ts`

```typescript
const mockResponses = {
  // Exact endpoint match
  'GET:/v2/my-endpoint': {
    data: 'mock response'
  },
  
  // Dynamic endpoint with regex pattern
  'GET:/v2/users/([^/]+)': {
    id: 'user_123',
    name: 'Mock User'
  }
}
```

## Features

### Network Delay Simulation
Sandbox mode simulates realistic network delays (100-500ms) to mimic real API behavior.

### WebSocket Mocking
WebSocket connections return mock objects that log send operations without establishing real connections.

### Logging
All sandbox API calls are logged to the console with the `[SANDBOX]` prefix for easy debugging.

### Fallback Responses
Unknown endpoints return a default success response with a warning logged to the console.

## Development Tips

1. **Enable sandbox mode during development** when the backend is not available
2. **Use the toggle component** in your developer tools or settings panel
3. **Check console logs** for sandbox activity and warnings
4. **Add custom mock responses** for new endpoints you're developing
5. **Test both modes** to ensure your app works with real and mock data

## Production Considerations

- Sandbox mode is automatically disabled in production unless `VITE_SHOW_SANDBOX_TOGGLE=true`
- The toggle component is hidden in production by default
- Environment variables should be set appropriately for each environment

## Troubleshooting

### Sandbox mode not working
1. Check that `VITE_SANDBOX_MODE=true` in your `.env` file
2. Verify the mock response exists for your endpoint
3. Check console for `[SANDBOX]` logs

### Missing mock responses
1. Add the endpoint to the `mockResponses` object
2. Use regex patterns for dynamic endpoints
3. Check the console for "No mock response found" warnings

### Toggle not visible
1. Ensure you're in development mode or `VITE_SHOW_SANDBOX_TOGGLE=true`
2. Import and use the `SandboxModeToggle` component
3. Check that the component is not hidden by CSS

## API Reference

### apiClient.setSandboxMode(enabled: boolean)
Enables or disables sandbox mode.

### apiClient.isSandboxMode(): boolean
Returns the current sandbox mode state.

### useSandboxMode() Hook
Returns an object with:
- `isEnabled: boolean` - Current state
- `toggle: () => void` - Toggle function
- `enable: () => void` - Enable function  
- `disable: () => void` - Disable function

### SandboxModeToggle Component
Props:
- `className?: string` - Additional CSS classes
