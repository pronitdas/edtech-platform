import SandboxModeToggle from '@/components/SandboxModeToggle'
import { useSandboxMode } from '@/hooks/useSandboxMode'
import React from 'react'

/**
 * Example component showing how to integrate sandbox mode
 * This could be added to a developer panel, settings page, or header
 */
export const DeveloperTools: React.FC = () => {
  const { isEnabled } = useSandboxMode()

  // Only show in development or when explicitly enabled
  if (import.meta.env.MODE === 'production' && !import.meta.env.VITE_SHOW_SANDBOX_TOGGLE) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Developer Tools</h3>

      <div className="space-y-2">
        <SandboxModeToggle />

        {isEnabled && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Using mock data - no real API calls are being made
          </div>
        )}

        <div className="text-xs text-gray-500">
          Environment: {import.meta.env.MODE}
        </div>
      </div>
    </div>
  )
}

export default DeveloperTools
