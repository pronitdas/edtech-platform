import { apiClient as mainApiClient } from '@/services/api'
import { apiClient } from '@/services/api-client'
import { useEffect, useState } from 'react'

interface UseSandboxModeReturn {
  isEnabled: boolean
  toggle: () => void
  enable: () => void
  disable: () => void
}

export const useSandboxMode = (): UseSandboxModeReturn => {
  const [isEnabled, setIsEnabled] = useState(() => {
    return apiClient.isSandboxMode()
  })

  useEffect(() => {
    // Listen for sandbox mode changes from other components
    const handleSandboxModeChange = (event: CustomEvent) => {
      setIsEnabled(event.detail.enabled)
    }

    window.addEventListener(
      'sandbox-mode-changed',
      handleSandboxModeChange as EventListener
    )

    return () => {
      window.removeEventListener(
        'sandbox-mode-changed',
        handleSandboxModeChange as EventListener
      )
    }
  }, [])

  const updateSandboxMode = (enabled: boolean) => {
    setIsEnabled(enabled)

    // Update both API clients
    apiClient.setSandboxMode(enabled)
    mainApiClient.setSandboxMode(enabled)

    // Dispatch event for other components
    const event = new CustomEvent('sandbox-mode-changed', {
      detail: { enabled },
    })
    window.dispatchEvent(event)

    console.log(`[SANDBOX] Mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  const toggle = () => {
    updateSandboxMode(!isEnabled)
  }

  const enable = () => {
    updateSandboxMode(true)
  }

  const disable = () => {
    updateSandboxMode(false)
  }

  return {
    isEnabled,
    toggle,
    enable,
    disable,
  }
}

export default useSandboxMode
