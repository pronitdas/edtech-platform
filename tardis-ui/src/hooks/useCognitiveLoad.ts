// Helper function for debouncing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

import { useState, useEffect, useCallback } from 'react'

interface CognitiveLoadState {
  loadLevel: 'low' | 'medium' | 'high'
  errorCount: number
  hesitationSeconds: number
  idleTimeSeconds: number
  lastActivityTimestamp: number
  recentKeydownTimestamps: number[] // Timestamps of recent keydown events
  recentClickTimestamps: number[] // Timestamps of recent click events
}

export function useCognitiveLoad(idleThresholdSeconds: number = 60) {
  const [cognitiveState, setCognitiveState] = useState<CognitiveLoadState>({
    loadLevel: 'low',
    errorCount: 0,
    hesitationSeconds: 0,
    idleTimeSeconds: 0,
    lastActivityTimestamp: Date.now(),
    recentKeydownTimestamps: [],
    recentClickTimestamps: [],
  })

  // Track errors
  const recordError = useCallback(() => {
    setCognitiveState(prev => {
      const newErrorCount = prev.errorCount + 1
      return {
        ...prev,
        errorCount: newErrorCount,
        lastActivityTimestamp: Date.now(),
      }
    })
  }, [])

  // Track hesitation (time spent on a single problem)
  const recordHesitation = useCallback((seconds: number) => {
    setCognitiveState(prev => {
      const newHesitationSeconds = prev.hesitationSeconds + seconds
      return {
        ...prev,
        hesitationSeconds: newHesitationSeconds,
        lastActivityTimestamp: Date.now(),
      }
    })
  }, [])

  // Reset tracking for new session or task
  const resetTracking = useCallback(() => {
    setCognitiveState({
      loadLevel: 'low',
      errorCount: 0,
      hesitationSeconds: 0,
      idleTimeSeconds: 0,
      lastActivityTimestamp: Date.now(),
      recentKeydownTimestamps: [],
      recentClickTimestamps: [],
    })
  }, [])

  // Debounced handler for frequent activity types (mousemove, scroll)
  const debouncedActivityHandler = useCallback(
    debounce((event: Event) => {
      const now = Date.now()
      setCognitiveState(prev => ({
        ...prev,
        lastActivityTimestamp: now,
      }))
    }, 100),
    []
  ) // Debounce by 100ms, memoize the debounced function

  // Track user activity to detect idle time
  useEffect(() => {
    // Handler for less frequent activity types (keydown, click)
    const activityHandler = (event: Event) => {
      const now = Date.now()
      setCognitiveState(prev => {
        const newState = {
          ...prev,
          lastActivityTimestamp: now,
        }

        // Add timestamp based on event type and keep only recent ones (e.g., last 10 seconds)
        const interactionWindow = 10000 // 10 seconds in milliseconds

        if (event.type === 'keydown') {
          const newTimestamps = [...prev.recentKeydownTimestamps, now].filter(
            timestamp => now - timestamp < interactionWindow // Corrected filtering logic
          )
          newState.recentKeydownTimestamps = newTimestamps
        } else if (event.type === 'click') {
          const newTimestamps = [...prev.recentClickTimestamps, now].filter(
            timestamp => now - timestamp < interactionWindow // Corrected filtering logic
          )
          newState.recentClickTimestamps = newTimestamps
        }

        return newState
      })
    }

    // Update idle time counter
    const idleInterval = setInterval(() => {
      setCognitiveState(prev => {
        const currentIdleTime = Math.floor(
          (Date.now() - prev.lastActivityTimestamp) / 1000
        )

        // Only update if idle time has changed significantly
        if (Math.abs(currentIdleTime - prev.idleTimeSeconds) < 5) {
          return prev
        }

        return {
          ...prev,
          idleTimeSeconds: currentIdleTime,
        }
      })
    }, 5000) // Check every 5 seconds

    // Track various user activities
    window.addEventListener('mousemove', debouncedActivityHandler)
    window.addEventListener('keydown', activityHandler)
    window.addEventListener('click', activityHandler)
    window.addEventListener('scroll', debouncedActivityHandler)

    return () => {
      clearInterval(idleInterval)
      window.removeEventListener('mousemove', debouncedActivityHandler)
      window.removeEventListener('keydown', activityHandler)
      window.removeEventListener('click', activityHandler)
      window.removeEventListener('scroll', debouncedActivityHandler)
    }
    // Effect to centralize load level calculation
    useEffect(() => {
      setCognitiveState(prev => {
        const {
          errorCount,
          hesitationSeconds,
          idleTimeSeconds,
          recentKeydownTimestamps,
          recentClickTimestamps,
        } = prev

        let newLoadLevel: CognitiveLoadState['loadLevel'] = 'low'

        // Calculate interaction speed (interactions per second)
        const now = Date.now()
        const interactionWindow = 10000 // 10 seconds in milliseconds
        const keydownSpeed =
          recentKeydownTimestamps.filter(
            timestamp => now - timestamp < interactionWindow
          ).length /
          (interactionWindow / 1000)
        const clickSpeed =
          recentClickTimestamps.filter(
            timestamp => now - timestamp < interactionWindow
          ).length /
          (interactionWindow / 1000)
        const totalInteractionSpeed = keydownSpeed + clickSpeed

        // Determine load level based on combined metrics
        if (errorCount > 6 || hesitationSeconds > 90 || idleTimeSeconds > 75) {
          newLoadLevel = 'high'
        } else if (
          errorCount > 3 ||
          hesitationSeconds > 45 ||
          idleTimeSeconds > 45
        ) {
          newLoadLevel = 'medium'
        }

        // Adjust load level based on interaction speed, with fallback for passive consumption
        const isPassiveConsumption =
          totalInteractionSpeed < 0.5 &&
          idleTimeSeconds <= 75 && // Not excessively idle
          errorCount <= 1 && // Low errors
          hesitationSeconds <= 15 // Low hesitation

        if (isPassiveConsumption) {
          // Low interaction speed, but other signals suggest passive consumption, not struggle
          if (newLoadLevel !== 'low') {
            newLoadLevel = 'low' // Default to low load for passive consumption
          }
        } else if (totalInteractionSpeed < 0.5 && newLoadLevel !== 'high') {
          // Very low interaction speed, and not passive consumption - likely struggle or disengagement
          newLoadLevel = 'medium' // Suggests potential struggle or disengagement
        } else if (totalInteractionSpeed > 2 && newLoadLevel === 'medium') {
          // High interaction speed suggests ease or rapid progress
          newLoadLevel = 'low'
        } else if (totalInteractionSpeed > 3 && newLoadLevel === 'high') {
          // Very high speed might slightly reduce perceived high load
          newLoadLevel = 'medium'
        }

        // Only update if the load level has actually changed
        if (newLoadLevel !== prev.loadLevel) {
          return {
            ...prev,
            loadLevel: newLoadLevel,
          }
        }

        return prev // No change needed
      })
    }, [
      cognitiveState.errorCount,
      cognitiveState.hesitationSeconds,
      cognitiveState.idleTimeSeconds,
      cognitiveState.recentKeydownTimestamps.length,
      cognitiveState.recentClickTimestamps.length,
    ]) // Depend on metrics that influence load level
  }, [idleThresholdSeconds, debouncedActivityHandler]) // Added debouncedActivityHandler to dependency array

  return {
    cognitiveState,
    recordError,
    recordHesitation,
    resetTracking,
  }
}
