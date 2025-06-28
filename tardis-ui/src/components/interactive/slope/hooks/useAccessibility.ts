import { useEffect, useCallback, useState } from 'react'

interface AccessibilityState {
  isMobile: boolean
  hasHapticFeedback: boolean
  prefersReducedMotion: boolean
  highContrast: boolean
  screenReaderActive: boolean
  fontSize: 'small' | 'medium' | 'large'
}

interface AccessibilityActions {
  announceToScreenReader: (message: string) => void
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy') => void
  focusElement: (elementId: string) => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  toggleHighContrast: () => void
}

export function useAccessibility(): AccessibilityState & AccessibilityActions {
  const [state, setState] = useState<AccessibilityState>({
    isMobile: false,
    hasHapticFeedback: false,
    prefersReducedMotion: false,
    highContrast: false,
    screenReaderActive: false,
    fontSize: 'medium',
  })

  // Initialize accessibility state
  useEffect(() => {
    const checkAccessibilityFeatures = () => {
      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      (window.innerWidth <= 768)

      // Check for haptic feedback support
      const hasHapticFeedback = 'vibrate' in navigator || 
                               'hapticEngineSupported' in window ||
                               'webkitHapticEngineSupported' in window

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Check for high contrast preference
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches ||
                          localStorage.getItem('high-contrast') === 'true'

      // Detect screen reader
      const screenReaderActive = document.body.getAttribute('aria-hidden') === 'false' ||
                                navigator.userAgent.includes('NVDA') ||
                                navigator.userAgent.includes('JAWS')

      // Get font size preference
      const fontSize = (localStorage.getItem('font-size') as 'small' | 'medium' | 'large') || 'medium'

      setState({
        isMobile,
        hasHapticFeedback,
        prefersReducedMotion,
        highContrast,
        screenReaderActive,
        fontSize,
      })
    }

    checkAccessibilityFeatures()

    // Listen for media query changes
    const mediaQueryLists = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(max-width: 768px)'),
    ]

    const handleMediaQueryChange = () => checkAccessibilityFeatures()
    
    mediaQueryLists.forEach(mql => {
      mql.addEventListener('change', handleMediaQueryChange)
    })

    return () => {
      mediaQueryLists.forEach(mql => {
        mql.removeEventListener('change', handleMediaQueryChange)
      })
    }
  }, [])

  // Announce message to screen readers
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (!state.hasHapticFeedback) return

    try {
      // Try modern Haptics API first
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [50],
          heavy: [100],
        }
        navigator.vibrate(patterns[type])
      }

      // Try WebKit Haptic Engine
      if ('webkitHapticEngineSupported' in window) {
        const hapticTypes = {
          light: 'impactLight',
          medium: 'impactMedium', 
          heavy: 'impactHeavy',
        }
        // @ts-ignore - WebKit haptic API
        window.TapticEngine?.impact(hapticTypes[type])
      }
    } catch (error) {
      console.warn('Haptic feedback not supported:', error)
    }
  }, [state.hasHapticFeedback])

  // Focus element by ID
  const focusElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  // Set font size
  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setState(prev => ({ ...prev, fontSize: size }))
    localStorage.setItem('font-size', size)
    
    // Apply font size to document
    const root = document.documentElement
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
    }
    root.style.fontSize = fontSizes[size]
    
    announceToScreenReader(`Font size changed to ${size}`)
  }, [announceToScreenReader])

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    const newHighContrast = !state.highContrast
    setState(prev => ({ ...prev, highContrast: newHighContrast }))
    localStorage.setItem('high-contrast', newHighContrast.toString())
    
    // Apply high contrast styles
    if (newHighContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
    
    announceToScreenReader(`High contrast ${newHighContrast ? 'enabled' : 'disabled'}`)
  }, [state.highContrast, announceToScreenReader])

  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip navigation if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Tab':
          // Enhanced tab navigation
          if (!event.shiftKey) {
            // Forward tab - ensure focus is visible
            setTimeout(() => {
              const focusedElement = document.activeElement as HTMLElement
              if (focusedElement) {
                focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }, 10)
          }
          break

        case 'Enter':
        case ' ':
          // Activate focused element
          const activeElement = document.activeElement as HTMLElement
          if (activeElement && activeElement.click) {
            event.preventDefault()
            activeElement.click()
            triggerHapticFeedback('light')
          }
          break

        case 'Escape':
          // Close modals, reset focus
          const modals = document.querySelectorAll('[role="dialog"]')
          if (modals.length > 0) {
            event.preventDefault()
            const lastModal = modals[modals.length - 1] as HTMLElement
            const closeButton = lastModal.querySelector('[aria-label*="close"]') as HTMLElement
            if (closeButton) {
              closeButton.click()
            }
          }
          break

        case '?':
          // Show keyboard shortcuts help
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            announceToScreenReader('Keyboard shortcuts: Tab to navigate, Enter or Space to activate, Escape to close, Arrow keys to move between options')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [triggerHapticFeedback, announceToScreenReader])

  // Add focus indicators for keyboard navigation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      /* Enhanced focus indicators */
      *:focus-visible {
        outline: 2px solid #00ffff !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(0, 255, 255, 0.3) !important;
      }

      /* High contrast mode styles */
      body.high-contrast {
        filter: contrast(150%) brightness(120%);
      }

      body.high-contrast * {
        border-color: #ffffff !important;
      }

      /* Font size adjustments */
      .font-small { font-size: 0.875rem !important; }
      .font-medium { font-size: 1rem !important; }
      .font-large { font-size: 1.125rem !important; }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Mobile touch targets */
      @media (max-width: 768px) {
        button, [role="button"], input, select, textarea {
          min-height: 44px !important;
          min-width: 44px !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])

  return {
    ...state,
    announceToScreenReader,
    triggerHapticFeedback,
    focusElement,
    setFontSize,
    toggleHighContrast,
  }
}