import { useCallback } from 'react'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'

// Types for the roleplay analytics
interface RoleplayStudent {
  name: string
  personality: string
}

interface RoleplayScenario {
  id: string
  title: string
  difficulty: string
  estimatedDuration: number
  students: RoleplayStudent[]
}

interface RoleplayEvaluation {
  criteriaId: string
  criteriaName: string
  score: number
  maxScore: number
  feedback: string
}

// Roleplay analytics hook
export const useRoleplayAnalytics = (knowledgeId: string, moduleId: string) => {
  const tracker = useInteractionTracker()

  // Start tracking a roleplay session
  const trackRoleplayStart = useCallback(
    (scenario: RoleplayScenario) => {
      tracker.trackRoleplayStart({
        knowledgeId,
        moduleId,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        difficulty: scenario.difficulty,
        estimatedDuration: scenario.estimatedDuration,
        studentProfiles: scenario.students.map(student => ({
          name: student.name,
          personality: student.personality,
        })),
      })
    },
    [tracker, knowledgeId, moduleId]
  )

  // Track a teacher's response to a student
  const trackTeacherResponse = useCallback(
    (
      scenarioId: string,
      studentName: string,
      studentPersonality: string,
      question: string,
      response: string,
      step: number,
      responseTime: number,
      feedback?: string
    ) => {
      tracker.trackRoleplayResponse({
        knowledgeId,
        moduleId,
        scenarioId,
        step,
        studentName,
        studentPersonality,
        question,
        response,
        responseTime,
        feedbackProvided: feedback || undefined,
      })
    },
    [tracker, knowledgeId, moduleId]
  )

  // Track completion of a roleplay scenario
  const trackRoleplayComplete = useCallback(
    (
      scenarioId: string,
      totalSteps: number,
      completedSteps: number,
      totalScore: number,
      maxPossibleScore: number,
      durationSeconds: number,
      evaluations: RoleplayEvaluation[]
    ) => {
      tracker.trackRoleplayComplete({
        knowledgeId,
        moduleId,
        scenarioId,
        totalSteps,
        completedSteps,
        totalScore,
        maxPossibleScore,
        durationSeconds,
        evaluations,
      })
    },
    [tracker, knowledgeId, moduleId]
  )

  // Utility function to time responses
  const createResponseTimer = useCallback(() => {
    const startTime = Date.now()
    return () => Date.now() - startTime
  }, [])

  // Return the public API
  return {
    trackRoleplayStart,
    trackTeacherResponse,
    trackRoleplayComplete,
    createResponseTimer,
  }
}

export default useRoleplayAnalytics
