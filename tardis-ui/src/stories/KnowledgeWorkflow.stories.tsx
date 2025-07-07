/**
 * Knowledge Management Workflow Stories
 * Demonstrates complete knowledge processing pipeline with real API calls
 */

import type { Meta, StoryObj } from '@storybook/react'
import React, { useState, useEffect } from 'react'
import { unifiedApiService } from '../services/unified-api-service'

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
  error?: string
  duration?: number
}

const KnowledgeWorkflowDemo: React.FC = () => {
  const [initialized, setInitialized] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [knowledgeId, setKnowledgeId] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'upload',
      title: 'Upload Knowledge File',
      description: 'Upload educational content files to create a knowledge base',
      status: 'pending'
    },
    {
      id: 'verify',
      title: 'Verify Upload',
      description: 'Confirm files were uploaded and knowledge entry was created',
      status: 'pending'
    },
    {
      id: 'process',
      title: 'Start Processing',
      description: 'Begin AI processing to extract content and generate structure',
      status: 'pending'
    },
    {
      id: 'monitor',
      title: 'Monitor Processing',
      description: 'Track processing status and wait for completion',
      status: 'pending'
    },
    {
      id: 'generate',
      title: 'Generate Content',
      description: 'Create educational materials (notes, summaries, quizzes)',
      status: 'pending'
    },
    {
      id: 'retrieve',
      title: 'Retrieve Chapters',
      description: 'Get processed chapter data and generated content',
      status: 'pending'
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Check content generation analytics and metrics',
      status: 'pending'
    },
    {
      id: 'graph',
      title: 'Knowledge Graph',
      description: 'Sync to knowledge graph and view relationships',
      status: 'pending'
    }
  ])

  useEffect(() => {
    const initializeApi = async () => {
      try {
        await unifiedApiService.initialize('http://localhost:8000')
        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize API service:', error)
      }
    }
    initializeApi()
  }, [])

  const updateStep = (stepIndex: number, updates: Partial<WorkflowStep>) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, ...updates } : step
    ))
  }

  const runWorkflowStep = async (stepIndex: number): Promise<any> => {
    const step = steps[stepIndex]
    const startTime = Date.now()

    updateStep(stepIndex, { status: 'running' })

    try {
      let result: any

      switch (step.id) {
        case 'upload':
          result = await uploadKnowledgeFile()
          if (result?.knowledge_id) {
            setKnowledgeId(result.knowledge_id)
          }
          break

        case 'verify':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getKnowledgeFiles(knowledgeId)
          break

        case 'process':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.startProcessing(knowledgeId, {
            generateContent: true,
            contentTypes: ['notes', 'summary', 'quiz'],
            contentLanguage: 'English'
          })
          break

        case 'monitor':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await monitorProcessing(knowledgeId)
          break

        case 'generate':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.generateContent(knowledgeId, {
            types: ['notes', 'summary', 'quiz'],
            language: 'English'
          })
          break

        case 'retrieve':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getChapterData(knowledgeId, {
            language: 'English'
          })
          break

        case 'analytics':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          result = await unifiedApiService.getContentAnalytics(knowledgeId)
          break

        case 'graph':
          if (!knowledgeId) throw new Error('No knowledge ID available')
          await unifiedApiService.syncKnowledgeGraph(knowledgeId)
          result = await unifiedApiService.getKnowledgeGraph(knowledgeId)
          break

        default:
          throw new Error(`Unknown step: ${step.id}`)
      }

      const duration = Date.now() - startTime
      updateStep(stepIndex, { 
        status: 'completed', 
        result, 
        duration,
        error: undefined 
      })

      return result

    } catch (error: any) {
      const duration = Date.now() - startTime
      updateStep(stepIndex, { 
        status: 'error', 
        error: error.message, 
        duration 
      })
      throw error
    }
  }

  const uploadKnowledgeFile = async () => {
    const sampleContent = `
# Advanced Mathematics Course

## Course Overview
This comprehensive course covers advanced mathematical concepts for undergraduate students.

## Chapter 1: Calculus Fundamentals

### 1.1 Limits and Continuity
Understanding the concept of limits is crucial for calculus. A limit describes the behavior of a function as it approaches a particular point.

**Key Concepts:**
- Definition of a limit
- One-sided limits
- Infinite limits
- Continuity at a point

**Example Problem:**
Find the limit of f(x) = (x² - 4)/(x - 2) as x approaches 2.

**Solution:**
Using algebraic manipulation:
f(x) = (x² - 4)/(x - 2) = (x + 2)(x - 2)/(x - 2) = x + 2

Therefore, lim(x→2) f(x) = 2 + 2 = 4

### 1.2 Derivatives
The derivative represents the rate of change of a function at any given point.

**Applications:**
- Finding slopes of tangent lines
- Optimization problems
- Related rates
- Motion analysis

## Chapter 2: Integration Techniques

### 2.1 Basic Integration
Integration is the reverse process of differentiation.

**Fundamental Rules:**
- Power rule: ∫x^n dx = x^(n+1)/(n+1) + C
- Sum rule: ∫[f(x) + g(x)]dx = ∫f(x)dx + ∫g(x)dx
- Constant multiple: ∫k·f(x)dx = k·∫f(x)dx

### 2.2 Advanced Techniques
- Integration by parts
- Substitution method
- Partial fractions
- Trigonometric substitution

## Chapter 3: Differential Equations

### 3.1 First-Order Equations
Solving equations involving derivatives and their applications.

**Types:**
- Separable equations
- Linear equations
- Exact equations
- Bernoulli equations

**Real-world Applications:**
- Population growth models
- Radioactive decay
- Newton's cooling law
- Economic models

## Learning Objectives

By completing this course, students will:
1. Master fundamental calculus concepts
2. Apply integration techniques to solve complex problems
3. Understand and solve differential equations
4. Analyze mathematical models of real-world phenomena
5. Develop problem-solving strategies for advanced mathematics

## Assessment Methods
- Weekly problem sets (30%)
- Midterm examination (25%)
- Final examination (35%)
- Class participation (10%)

## Prerequisites
- College Algebra
- Trigonometry
- Pre-Calculus

This course provides the foundation for advanced mathematics and engineering studies.
    `.trim()

    const testFile = new File([sampleContent], 'advanced-mathematics-course.md', {
      type: 'text/markdown'
    })

    return await unifiedApiService.uploadKnowledgeFiles(
      [testFile],
      'Storybook Demo - Advanced Mathematics Course'
    )
  }

  const monitorProcessing = async (knowledgeId: number) => {
    // Check status multiple times to show progression
    const checks = []
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const status = await unifiedApiService.getProcessingStatus(knowledgeId)
      checks.push(status)
    }
    return { checks, final_status: checks[checks.length - 1] }
  }

  const runCompleteWorkflow = async () => {
    if (isRunning) return

    setIsRunning(true)
    setCurrentStep(0)

    // Reset all steps
    setSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending', 
      result: undefined, 
      error: undefined, 
      duration: undefined 
    })))

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        await runWorkflowStep(i)
        
        // Small delay between steps for visual effect
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error('Workflow failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const runSingleStep = async (stepIndex: number) => {
    if (isRunning) return
    setIsRunning(true)
    try {
      await runWorkflowStep(stepIndex)
    } finally {
      setIsRunning(false)
    }
  }

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'running': return '⏳'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '⚪'
    }
  }

  const getStepColor = (step: WorkflowStep) => {
    switch (step.status) {
      case 'running': return '#fbbf24'
      case 'completed': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  if (!initialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🚀 Initializing Knowledge Management System...</h2>
        <p>Connecting to backend services...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '8px' }}>
          📚 Knowledge Management Workflow
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Complete end-to-end demonstration of the knowledge processing pipeline
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={runCompleteWorkflow}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              backgroundColor: isRunning ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isRunning ? '🔄 Running Workflow...' : '🚀 Run Complete Workflow'}
          </button>

          {knowledgeId && (
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: '#ecfdf5', 
              borderRadius: '6px',
              border: '1px solid #d1fae5'
            }}>
              <strong style={{ color: '#065f46' }}>Knowledge ID:</strong> 
              <span style={{ color: '#047857', fontFamily: 'monospace' }}> {knowledgeId}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {steps.map((step, index) => (
          <div 
            key={step.id}
            style={{
              border: `2px solid ${index === currentStep && isRunning ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: index === currentStep && isRunning ? '#eff6ff' : '#ffffff',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>
                {getStepIcon(step)} {step.title}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {step.duration && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {step.duration}ms
                  </span>
                )}
                <button
                  onClick={() => runSingleStep(index)}
                  disabled={isRunning}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: isRunning ? '#9ca3af' : '#f3f4f6',
                    color: isRunning ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: isRunning ? 'not-allowed' : 'pointer'
                  }}
                >
                  Run Step
                </button>
              </div>
            </div>

            <p style={{ color: '#6b7280', margin: '0 0 12px 0', fontSize: '14px' }}>
              {step.description}
            </p>

            {step.status !== 'pending' && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                border: `1px solid ${getStepColor(step)}`,
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: step.error || step.result ? '8px' : '0'
                }}>
                  <span style={{ color: getStepColor(step), fontWeight: 'bold' }}>
                    {step.status.toUpperCase()}
                  </span>
                </div>

                {step.error && (
                  <div style={{ 
                    color: '#ef4444', 
                    fontSize: '14px', 
                    marginBottom: '8px',
                    padding: '8px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '4px'
                  }}>
                    <strong>Error:</strong> {step.error}
                  </div>
                )}

                {step.result && (
                  <details style={{ fontSize: '12px' }}>
                    <summary style={{ cursor: 'pointer', color: '#6b7280', marginBottom: '8px' }}>
                      View Step Results
                    </summary>
                    <pre style={{
                      backgroundColor: '#f3f4f6',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '150px',
                      fontSize: '11px'
                    }}>
                      {JSON.stringify(step.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '32px', 
        padding: '16px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}>📋 Workflow Overview</h3>
        <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
          <p><strong>Total Steps:</strong> {steps.length}</p>
          <p><strong>Completed:</strong> {steps.filter(s => s.status === 'completed').length}</p>
          <p><strong>Failed:</strong> {steps.filter(s => s.status === 'error').length}</p>
          <p><strong>Current Step:</strong> {currentStep + 1} - {steps[currentStep]?.title}</p>
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof KnowledgeWorkflowDemo> = {
  title: 'API Integration/Knowledge Workflow',
  component: KnowledgeWorkflowDemo,
  parameters: {
    docs: {
      description: {
        component: `
# Knowledge Management Workflow Demo

This story demonstrates the complete knowledge management pipeline from file upload 
to content generation and analytics. Each step is executed in sequence with real API calls.

## Workflow Steps:

1. **Upload**: Create knowledge entry with educational content
2. **Verify**: Confirm upload success and file metadata
3. **Process**: Start AI processing pipeline
4. **Monitor**: Track processing status over time
5. **Generate**: Create educational materials (notes, summaries, quizzes)
6. **Retrieve**: Get processed chapter data
7. **Analytics**: View content generation metrics
8. **Graph**: Sync to knowledge graph database

## Features:
- Step-by-step execution with visual progress
- Individual step testing capability
- Real-time status updates and error handling
- Complete result inspection for each step
- Knowledge ID tracking across workflow

Perfect for demonstrating the full capabilities of the knowledge management system.
        `
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof KnowledgeWorkflowDemo>

export const CompleteWorkflow: Story = {
  name: '📚 Complete Knowledge Workflow',
  render: () => <KnowledgeWorkflowDemo />
}