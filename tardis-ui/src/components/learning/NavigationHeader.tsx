import React from 'react'
import { ChevronLeft, Menu, Home } from 'lucide-react'

interface LanguageSelectorProps {
  language: string
  onChange: (lang: string) => void
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onChange }) => (
  <select
    value={language}
    onChange={e => onChange(e.target.value)}
    className='rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white sm:px-3 sm:py-1'
  >
    <option value='English'>English</option>
    <option value='Hindi'>Hindi</option>
    <option value='Vietnamese'>Vietnamese</option>
    <option value='Bengali'>Bengali</option>
    <option value='Marathi'>Marathi</option>
  </select>
)

interface NavigationHeaderProps {
  currentView: string
  language: string
  onLanguageChange: (lang: string) => void
  onBack?: () => void
  onNavigateToDashboard?: () => void
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentView,
  language,
  onLanguageChange,
  onBack,
  onNavigateToDashboard,
  onToggleSidebar,
  showSidebarToggle = false
}) => {
  if (currentView === 'dashboard') {
    return null
  }

  return (
    <>
      {/* Regular navigation bar */}
      {currentView !== 'knowledge_selection' && (
        <div className='flex items-center justify-between border-b border-gray-700 bg-gray-800 p-2 text-white sm:p-3'>
          <div className='flex items-center gap-2'>
            {/* Mobile sidebar toggle */}
            {showSidebarToggle && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className='rounded bg-gray-700 p-1.5 text-white md:hidden'
              >
                <Menu className='h-5 w-5' />
              </button>
            )}

            {onBack && (
              <button
                onClick={onBack}
                className='flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1 text-sm transition-colors hover:bg-blue-600 sm:text-base'
              >
                <ChevronLeft className='h-4 w-4' />
                <span>Back</span>
              </button>
            )}
          </div>
          <LanguageSelector language={language} onChange={onLanguageChange} />
        </div>
      )}

      {/* Knowledge selection navigation bar */}
      {currentView === 'knowledge_selection' && (
        <div className='flex items-center justify-between border-b border-gray-700 bg-gray-800 p-2 text-white sm:p-3'>
          <div className='flex items-center gap-2'>
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className='flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1 text-sm transition-colors hover:bg-blue-600 sm:text-base'
              >
                <Home className='h-4 w-4' />
                <span>Dashboard</span>
              </button>
            )}
          </div>
          <LanguageSelector language={language} onChange={onLanguageChange} />
        </div>
      )}
    </>
  )
}

export default NavigationHeader