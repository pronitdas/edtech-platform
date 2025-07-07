import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  MessageSquare,
  RefreshCw,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { OpenAIService } from '@/services/openAi'
import { RoleplayService } from '@/services/RoleplayService'
import { EvaluationService } from '@/services/EvaluationService'
import { analyticsService } from '@/services/analytics-service'
import { voiceService } from '@/services/voice-service'
import BlackboardDisplay from '@/components/BlackboardDisplay'
import StudentCard from '@/components/StudentCard'

interface TeacherPersona {
  name: string
  description: string
  icon: string
}

interface RoleplayScenario {
  title: string
  context: string
  roles: TeacherPersona[]
  maxSteps?: number
}

interface RoleplayComponentProps {
  scenarios: RoleplayScenario[]
  onRegenerate?: () => void
  isGenerating?: boolean
  openaiApiKey: string
  userId: string
  language: string
}

interface RoleplayState {
  studentInput: string
  responses: { type: 'student' | 'teacher'; content: string }[]
  currentStep: number
  isLoading: boolean
  sessionId: string | null
  isListening: boolean
  isSpeaking: boolean
}

const MAX_ROLEPLAY_STEPS = 5

const RoleplayComponent: React.FC<RoleplayComponentProps> = ({
  scenarios,
  onRegenerate,
  isGenerating = false,
  openaiApiKey,
  userId,
  language,
}) => {
  console.log(
    'RoleplayComponent received scenarios:',
    scenarios,
    'Language:',
    language
  )

  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [activeTeacherPersona, setActiveTeacherPersona] = useState<
    string | null
  >(null)
  const [isViewingScenarios, setIsViewingScenarios] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const getInitialRoleplayState = (): RoleplayState => ({
    studentInput: '',
    responses: [],
    currentStep: 0,
    isLoading: false,
    sessionId: null,
    isListening: false,
    isSpeaking: false,
  })

  const [roleplayState, setRoleplayState] = useState<RoleplayState>(
    getInitialRoleplayState()
  )

  const openaiClient = useMemo(
    () => new OpenAIService(openaiApiKey),
    [openaiApiKey]
  )
  const roleplayService = useMemo(
    () => new RoleplayService(openaiClient),
    [openaiClient]
  )

  const activeScenario = scenarios[activeScenarioIndex]
  const maxSteps = activeScenario?.maxSteps ?? MAX_ROLEPLAY_STEPS

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roleplayState.responses])

  useEffect(() => {
    console.log('Resetting Roleplay state due to prop change...')
    setRoleplayState(getInitialRoleplayState())
    setActiveTeacherPersona(null)
    setIsViewingScenarios(true)
  }, [openaiApiKey, activeScenarioIndex, language, scenarios])

  const nextScenario = () => {
    if (activeScenarioIndex < scenarios.length - 1) {
      setActiveScenarioIndex(activeScenarioIndex + 1)
    }
  }

  const prevScenario = () => {
    if (activeScenarioIndex > 0) {
      setActiveScenarioIndex(activeScenarioIndex - 1)
    }
  }

  const selectTeacherPersona = async (personaName: string) => {
    setRoleplayState(getInitialRoleplayState())
    setActiveTeacherPersona(personaName)
    setIsViewingScenarios(false)

    const selectedPersona = activeScenario?.roles.find(
      p => p.name === personaName
    )
    if (selectedPersona) {
      setRoleplayState(prevState => ({
        ...prevState,
        responses: [
          {
            type: 'teacher',
            content: `Hello! I am ${selectedPersona.name}. ${selectedPersona.description} How can I help you with the scenario: '${activeScenario?.title}'?`,
          },
        ],
      }))
    }

    if (userId && activeScenario) {
      try {
        const session = await analyticsService.startUserSession(userId)
        if (session && session.id) {
          setRoleplayState(prevState => ({
            ...prevState,
            sessionId: session.id,
          }))
          console.log('Analytics session started:', session.id)

          await analyticsService.trackEvent({
            event_type: 'roleplay_start',
            content_id: activeScenario.title,
            userId,
            eventType: 'roleplay_start',
            contentId: activeScenario.title,
            timestamp: Date.now(),
            sessionId: session.id,
            scenarioTitle: activeScenario.title,
            selectedTeacherPersona: personaName,
            interactionType: 'scenario_selection',
          })
        } else {
          console.warn('Failed to start analytics session or retrieve ID.')
        }
      } catch (error) {
        console.error('Error starting analytics session:', error)
      }
    }
  }

  const backToScenarios = async () => {
    if (roleplayState.sessionId) {
      console.log(
        'Ending analytics session due to backing out:',
        roleplayState.sessionId
      )
      await analyticsService.endUserSession(roleplayState.sessionId)
    }
    setIsViewingScenarios(true)
    setActiveTeacherPersona(null)
    setRoleplayState(getInitialRoleplayState())
  }

  const getSelectedTeacherPersona = (): TeacherPersona | null => {
    if (!activeScenario || !activeTeacherPersona) return null
    const scenarioFromProp = scenarios[activeScenarioIndex]
    if (!scenarioFromProp || !Array.isArray(scenarioFromProp.roles)) return null
    return (
      scenarioFromProp.roles.find(p => p.name === activeTeacherPersona) || null
    )
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRoleplayState(prevState => ({
      ...prevState,
      studentInput: event.target.value,
    }))
  }

  const isValidInput = (input: string): boolean => {
    return input.trim().length > 0
  }

  const handleStudentSubmit = async () => {
    const selectedPersona = getSelectedTeacherPersona()
    if (
      !isValidInput(roleplayState.studentInput) ||
      roleplayState.isLoading ||
      !selectedPersona ||
      !activeScenario ||
      !language
    ) {
      console.warn(
        'Submission blocked: Invalid input, loading, no persona, no session, no scenario, or no language.'
      )
      return
    }

    const currentInput = roleplayState.studentInput
    const step = roleplayState.currentStep
    const currentSessionId = roleplayState.sessionId

    setRoleplayState(prevState => ({
      ...prevState,
      isLoading: true,
      studentInput: '',
      responses: [
        ...prevState.responses,
        { type: 'student', content: currentInput },
      ],
    }))

    try {
      const teacherResponse = await roleplayService.getTeacherResponse(
        currentInput,
        selectedPersona.name,
        activeScenario.context,
        language
      )

      const nextStep = step + 1
      const isComplete = nextStep >= maxSteps

      await analyticsService.trackEvent({
        event_type: 'roleplay_student_response',
        content_id: activeScenario.title,
        userId,
        eventType: 'roleplay_student_response',
        contentId: activeScenario.title,
        timestamp: Date.now(),
        sessionId: currentSessionId || '',
        step: nextStep,
        teacherPersona: selectedPersona.name,
        studentResponse: currentInput,
        teacherResponse: teacherResponse,
        language: language,
        interactionType: 'student_response',
      })

      if (isComplete) {
        console.log('Roleplay Complete.')
        await analyticsService.trackEvent({
          event_type: 'roleplay_complete',
          content_id: activeScenario.title,
          userId,
          eventType: 'roleplay_complete',
          contentId: activeScenario.title,
          timestamp: Date.now(),
          sessionId: currentSessionId || '',
          totalSteps: nextStep,
          language: language,
          interactionType: 'completion',
        })

        console.log('Ending analytics session on completion:', currentSessionId)
        if (currentSessionId) {
          await analyticsService.endUserSession(currentSessionId)
        }
      }

      setRoleplayState(prevState => ({
        ...prevState,
        responses: [
          ...prevState.responses,
          { type: 'teacher', content: teacherResponse },
        ],
        currentStep: nextStep,
        isLoading: false,
        sessionId: isComplete ? null : prevState.sessionId,
      }))
    } catch (error) {
      console.error(
        'Error during student submission/teacher response flow:',
        error
      )
      if (currentSessionId) {
        console.warn('Ending analytics session due to error:', currentSessionId)
        await analyticsService.endUserSession(currentSessionId)
      }
      setRoleplayState(prevState => ({
        ...prevState,
        sessionId: null,
        isLoading: false,
        responses: [
          ...prevState.responses,
          {
            type: 'teacher',
            content:
              'Sorry, I encountered an error generating my response. Please try again.',
          },
        ],
      }))
    }
  }

  const renderScenarioView = () => {
    if (!scenarios || scenarios.length === 0) {
      console.warn('Render blocked: scenarios prop is empty or undefined.')
      return (
        <div className='p-4 text-center text-gray-400'>
          No scenarios available.
        </div>
      )
    }

    if (activeScenarioIndex < 0 || activeScenarioIndex >= scenarios.length) {
      console.error(
        `Render blocked: Invalid activeScenarioIndex (${activeScenarioIndex}) for scenarios length (${scenarios.length}).`
      )
      return (
        <div className='p-4 text-center text-gray-400'>
          Error loading scenario index.
        </div>
      )
    }

    const currentScenario = scenarios[activeScenarioIndex]

    if (!currentScenario || !Array.isArray(currentScenario.roles)) {
      console.warn(
        `Render blocked: Scenario data or roles array missing for index ${activeScenarioIndex}. Scenario data:`,
        currentScenario
      )
      return (
        <div className='p-4 text-center text-gray-400'>
          Loading scenario details...
        </div>
      )
    }

    if (currentScenario.roles.length === 0) {
      console.warn(
        `Render blocked: Scenario roles array is empty for index ${activeScenarioIndex}.`
      )
      return (
        <div className='p-4 text-center text-gray-400'>
          No teacher personas defined for this scenario.
        </div>
      )
    }

    return (
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4'>
          <h2 className='text-xl font-semibold text-white'>
            Roleplay Scenarios
          </h2>
          <div className='flex items-center gap-2'>
            <button
              onClick={prevScenario}
              disabled={activeScenarioIndex === 0}
              className='rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Previous scenario'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <span className='text-sm text-gray-400'>
              {activeScenarioIndex + 1} of {scenarios.length}
            </span>
            <button
              onClick={nextScenario}
              disabled={activeScenarioIndex === scenarios.length - 1}
              className='rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Next scenario'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>
        </div>

        <div className='flex-grow overflow-auto p-4'>
          <div className='mb-6'>
            <h3 className='mb-2 text-xl font-semibold text-indigo-400'>
              {currentScenario.title}
            </h3>
            <p className='mb-4 text-gray-300'>{currentScenario.context}</p>

            <div className='mt-6'>
              <h4 className='mb-3 flex items-center gap-2 text-lg font-medium'>
                <Users className='h-5 w-5 text-indigo-400' />
                <span>Select AI Teacher Persona</span>
              </h4>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {currentScenario.roles.map(persona => (
                  <StudentCard
                    key={persona.name}
                    role={persona}
                    onClick={selectTeacherPersona}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {onRegenerate && (
          <div className='border-t border-gray-700 bg-gray-800 p-4'>
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className='flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isGenerating ? (
                <>
                  <RefreshCw className='h-4 w-4 animate-spin' />
                  <span>Generating New Scenarios...</span>
                </>
              ) : (
                <>
                  <RefreshCw className='h-4 w-4' />
                  <span>Generate New Scenarios</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderTeacherIcon = (icon: string) => {
    const isEmoji = /\p{Emoji}/u.test(icon)
    if (isEmoji) {
      return (
        <span className='text-xl' role='img'>
          {icon}
        </span>
      )
    } else {
      return <User className='h-5 w-5 text-indigo-300' />
    }
  }

  const renderInteractionView = () => {
    const selectedPersona = getSelectedTeacherPersona()
    if (!selectedPersona || !activeScenario) return null

    const currentTeacherMessage =
      roleplayState.responses.length > 0
        ? roleplayState.responses[roleplayState.responses.length - 1]?.type ===
          'teacher'
          ? roleplayState.responses[roleplayState.responses.length - 1]?.content
          : 'Waiting for your input...'
        : ''

    const progressText =
      roleplayState.currentStep >= maxSteps
        ? 'Roleplay Complete'
        : `Interaction: ${roleplayState.currentStep + 1} / ${maxSteps}`

    const isComplete = roleplayState.currentStep >= maxSteps

    return (
      <div className='flex h-full flex-col bg-gray-900'>
        <div className='flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={backToScenarios}
              className='rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-white'
              aria-label='Back to scenarios'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center rounded-full bg-gray-700 p-1.5'>
                {renderTeacherIcon(selectedPersona.icon)}
              </div>
              <h2 className='text-lg font-semibold text-white'>
                Teacher: {selectedPersona.name}
              </h2>
            </div>
          </div>
          <span className='text-sm font-medium text-indigo-400'>
            {progressText}
          </span>
        </div>

        <div className='flex-grow space-y-4 overflow-y-auto p-4'>
          <BlackboardDisplay
            title={`Scenario: ${activeScenario.title}`}
            {...(currentTeacherMessage && {
              currentQuestion: currentTeacherMessage,
            })}
          />

          <div className='space-y-4'>
            {roleplayState.responses.map((msg, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 ${msg.type === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'teacher' && (
                  <div className='mb-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700'>
                    {renderTeacherIcon(selectedPersona.icon)}
                  </div>
                )}
                <div
                  className={`max-w-md rounded-lg p-3 sm:max-w-lg ${msg.type === 'student' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {roleplayState.isLoading && (
            <div className='flex items-center justify-center py-2'>
              <RefreshCw className='h-5 w-5 animate-spin text-indigo-400' />
              <span className='ml-2 text-indigo-400'>
                Teacher is thinking...
              </span>
            </div>
          )}
        </div>

        {!isComplete && (
          <div className='border-t border-gray-700 bg-gray-800 p-4'>
            <div className='flex items-center gap-2'>
              <textarea
                rows={2}
                value={roleplayState.studentInput}
                onChange={handleInputChange}
                placeholder='Your response or question...'
                className='flex-grow resize-none rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50'
                disabled={roleplayState.isLoading}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleStudentSubmit()
                  }
                }}
              />
              <button
                onClick={handleStudentSubmit}
                disabled={
                  !isValidInput(roleplayState.studentInput) ||
                  roleplayState.isLoading
                }
                className='rounded-md bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
                aria-label='Send response'
              >
                {roleplayState.isLoading ? (
                  <RefreshCw className='h-5 w-5 animate-spin' />
                ) : (
                  <Send className='h-5 w-5' />
                )}
              </button>
            </div>
          </div>
        )}
        {isComplete && (
          <div className='border-t border-gray-700 bg-gray-800 p-4 text-center text-gray-400'>
            Roleplay finished.
            <button
              onClick={backToScenarios}
              className='ml-4 text-indigo-400 hover:underline'
            >
              Select New Scenario
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-lg bg-gray-900 shadow-lg'>
      {isViewingScenarios ? renderScenarioView() : renderInteractionView()}
    </div>
  )
}

export default RoleplayComponent
