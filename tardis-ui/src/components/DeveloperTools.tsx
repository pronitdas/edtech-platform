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
  if (
    import.meta.env.MODE === 'production' &&
    !import.meta.env.VITE_SHOW_SANDBOX_TOGGLE
  ) {
    return null
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 rounded-lg border border-gray-300 bg-white p-4 shadow-lg'>
      <h3 className='mb-2 text-sm font-semibold text-gray-700'>
        Developer Tools
      </h3>

      <div className='space-y-2'>
        <SandboxModeToggle />

        {isEnabled && (
          <div className='rounded bg-orange-50 p-2 text-xs text-orange-600'>
            ⚠️ Using mock data - no real API calls are being made
          </div>
        )}

        <div className='text-xs text-gray-500'>
          Environment: {import.meta.env.MODE}
        </div>
      </div>
    </div>
  )
}

export default DeveloperTools
