import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface AnimationStep {
  id: string
  description: string
  duration: number
  onStart?: () => void
  onComplete?: () => void
}

export interface AnimationState {
  isPlaying: boolean
  isPaused: boolean
  currentStepIndex: number
  progress: number
  totalDuration: number
  elapsedTime: number
}

export interface AnimationControls {
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  goToStep: (index: number) => void
  nextStep: () => void
  previousStep: () => void
  setSpeed: (speed: number) => void
  seek: (progress: number) => void
}

export interface UseAnimationControllerOptions {
  steps: AnimationStep[]
  autoPlay?: boolean
  defaultSpeed?: number
  loop?: boolean
  onComplete?: () => void
  onStepChange?: (index: number) => void
}

const DEFAULT_DURATION = 2000 // milliseconds

export function useAnimationController({
  steps,
  autoPlay = false,
  defaultSpeed = 1,
  loop = false,
  onComplete,
  onStepChange,
}: UseAnimationControllerOptions): [AnimationState, AnimationControls] {
  const [state, setState] = useState<AnimationState>({
    isPlaying: autoPlay,
    isPaused: false,
    currentStepIndex: 0,
    progress: 0,
    totalDuration: steps.reduce((acc, step) => acc + step.duration, 0),
    elapsedTime: 0,
  })

  const speedRef = useRef(defaultSpeed)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const stepStartTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return steps.reduce((acc, step) => acc + (step.duration || DEFAULT_DURATION), 0)
  }, [steps])

  // Get current step
  const currentStep = steps[state.currentStepIndex]

  // Animation loop using requestAnimationFrame
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp
      stepStartTimeRef.current = timestamp
    }

    const elapsedInStep = timestamp - stepStartTimeRef.current
    const stepDuration = (currentStep?.duration || DEFAULT_DURATION) / speedRef.current
    const stepProgress = Math.min(elapsedInStep / stepDuration, 1)

    // Calculate overall progress
    const previousStepsDuration = steps
      .slice(0, state.currentStepIndex)
      .reduce((acc, step) => acc + (step.duration || DEFAULT_DURATION), 0)
    const overallElapsed = previousStepsDuration + elapsedInStep
    const overallProgress = Math.min(overallElapsed / totalDuration, 1)

    setState(prev => ({
      ...prev,
      progress: overallProgress,
      elapsedTime: overallElapsed,
    }))

    // Check if current step is complete
    if (stepProgress >= 1) {
      // Call onComplete for current step
      currentStep?.onComplete?.()

      if (state.currentStepIndex < steps.length - 1) {
        // Move to next step
        const nextIndex = state.currentStepIndex + 1
        setState(prev => ({
          ...prev,
          currentStepIndex: nextIndex,
        }))
        onStepChange?.(nextIndex)
        stepStartTimeRef.current = timestamp
        steps[nextIndex]?.onStart?.()
      } else {
        // Animation complete
        if (loop) {
          // Restart from beginning
          setState(prev => ({
            ...prev,
            currentStepIndex: 0,
            progress: 0,
            elapsedTime: 0,
          }))
          onStepChange?.(0)
          startTimeRef.current = timestamp
          stepStartTimeRef.current = timestamp
          steps[0]?.onStart?.()
        } else {
          // Stop animation
          setState(prev => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
          }))
          onComplete?.()
        }
      }
    } else if (state.isPlaying && !state.isPaused) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }, [steps, currentStep, state.currentStepIndex, state.isPlaying, state.isPaused, totalDuration, onComplete, onStepChange, loop])

  // Start animation
  const play = useCallback(() => {
    if (steps.length === 0) return

    startTimeRef.current = 0
    stepStartTimeRef.current = performance.now()

    setState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
    }))

    steps[state.currentStepIndex]?.onStart?.()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [steps, state.currentStepIndex, animate])

  // Pause animation
  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: true,
    }))
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Resume animation
  const resume = useCallback(() => {
    if (!state.isPaused) return

    setState(prev => ({
      ...prev,
      isPaused: false,
    }))
    stepStartTimeRef.current = performance.now() - (state.progress * totalDuration)
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [state.isPaused, state.progress, totalDuration, animate])

  // Stop animation
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setState({
      isPlaying: false,
      isPaused: false,
      currentStepIndex: 0,
      progress: 0,
      totalDuration,
      elapsedTime: 0,
    })

    startTimeRef.current = 0
    stepStartTimeRef.current = 0
  }, [totalDuration])

  // Go to specific step
  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const previousStepsDuration = steps
      .slice(0, index)
      .reduce((acc, step) => acc + (step.duration || DEFAULT_DURATION), 0)

    setState(prev => ({
      ...prev,
      currentStepIndex: index,
      progress: previousStepsDuration / totalDuration,
      elapsedTime: previousStepsDuration,
    }))

    onStepChange?.(index)
    steps[index]?.onStart?.()
  }, [steps, totalDuration, onStepChange])

  // Go to next step
  const nextStep = useCallback(() => {
    const nextIndex = Math.min(state.currentStepIndex + 1, steps.length - 1)
    goToStep(nextIndex)
  }, [state.currentStepIndex, goToStep])

  // Go to previous step
  const previousStep = useCallback(() => {
    const prevIndex = Math.max(state.currentStepIndex - 1, 0)
    goToStep(prevIndex)
  }, [state.currentStepIndex, goToStep])

  // Set playback speed
  const setSpeed = useCallback((speed: number) => {
    speedRef.current = Math.max(0.25, Math.min(4, speed))
  }, [])

  // Seek to specific progress
  const seek = useCallback((progress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, progress))
    const targetTime = clampedProgress * totalDuration

    // Find which step contains this time
    let accumulatedDuration = 0
    let targetStepIndex = 0
    for (let i = 0; i < steps.length; i++) {
      const stepDuration = steps[i]?.duration || DEFAULT_DURATION
      if (accumulatedDuration + stepDuration >= targetTime) {
        targetStepIndex = i
        break
      }
      accumulatedDuration += stepDuration
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setState(prev => ({
      ...prev,
      progress: clampedProgress,
      elapsedTime: targetTime,
      currentStepIndex: targetStepIndex,
    }))

    onStepChange?.(targetStepIndex)
    steps[targetStepIndex]?.onStart?.()
  }, [steps, totalDuration, onStepChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Initial setup
  useEffect(() => {
    setState(prev => ({
      ...prev,
      totalDuration,
    }))
  }, [totalDuration])

  const controls: AnimationControls = {
    play,
    pause,
    resume,
    stop,
    goToStep,
    nextStep,
    previousStep,
    setSpeed,
    seek,
  }

  return [state, controls]
}
