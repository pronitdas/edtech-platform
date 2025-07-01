import { apiClient as mainApiClient } from '@/services/api'
import { apiClient } from '@/services/api-client'
import React, { useEffect, useState } from 'react'

interface SandboxModeToggleProps {
  className?: string
}

export const SandboxModeToggle: React.FC<SandboxModeToggleProps> = ({
  className = '',
}) => {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Check initial sandbox mode state
    setIsEnabled(apiClient.isSandboxMode())
  }, [])

  const toggleSandboxMode = () => {
    const newState = !isEnabled
    setIsEnabled(newState)

    // Update both API clients
    apiClient.setSandboxMode(newState)
    mainApiClient.setSandboxMode(newState)

    // Show notification
    console.log(`[SANDBOX] Mode ${newState ? 'enabled' : 'disabled'}`)

    // Optional: Show a toast notification
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sandbox-mode-changed', {
        detail: { enabled: newState },
      })
      window.dispatchEvent(event)
    }
  }

  // Only show in development mode
  if (
    import.meta.env.MODE === 'production' &&
    !import.meta.env.VITE_SHOW_SANDBOX_TOGGLE
  ) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className='text-sm text-gray-600'>Sandbox Mode:</span>
      <button
        onClick={toggleSandboxMode}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-300 hover:bg-gray-400'
        } `}
        aria-label={`Toggle sandbox mode ${isEnabled ? 'off' : 'on'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'} `}
        />
      </button>
      <span
        className={`text-xs font-medium ${
          isEnabled ? 'text-green-600' : 'text-gray-500'
        }`}
      >
        {isEnabled ? 'ON' : 'OFF'}
      </span>
      {isEnabled && (
        <span className='text-xs font-medium text-orange-600'>(Mock Data)</span>
      )}
    </div>
  )
}

export default SandboxModeToggle
