/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="es2022" />
import { useState, useCallback } from 'react'
import { OpenAIClient } from '@/services/openAi'

export interface WordProblemTemplate {
  id: string
  category: 'construction' | 'travel' | 'business' | 'sports' | 'nature'
  difficulty: 'easy' | 'medium' | 'hard'
  template: string
  variables: {
    name: string
    min: number
    max: number
    unit: string
  }[]
}

export interface GeneratedWordProblem {
  question: string
  context: string
  hints: string[]
  expectedSlope: number | null
  expectedIntercept: number | null
  solution: string
  explanation: string
  category: WordProblemTemplate['category']
  difficulty: WordProblemTemplate['difficulty']
  visualization?: {
    svg: string
    alt: string
  }
}

export interface WordProblemHistory {
  id: string
  problem: GeneratedWordProblem
  userAnswer: {
    slope: number | null
    intercept: number | null
    points: { x: number; y: number }[]
  }
  isCorrect: boolean | null
  timestamp: number
}

interface UseWordProblemGeneratorOptions {
  openaiClient?: OpenAIClient
  language?: string
  defaultDifficulty?: 'easy' | 'medium' | 'hard'
  maxHistorySize?: number
}

interface UseWordProblemGeneratorReturn {
  // State
  currentProblem: GeneratedWordProblem | null
  isLoading: boolean
  error: string | null
  history: WordProblemHistory[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: WordProblemTemplate['category'] | 'all'

  // Actions
  generateProblem: (difficulty?: 'easy' | 'medium' | 'hard', category?: WordProblemTemplate['category']) => Promise<void>
  checkAnswer: (userSlope: number | null, userIntercept: number | null, points: { x: number; y: number }[]) => Promise<{
    isCorrect: boolean
    feedback: string
  }>
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void
  setCategory: (category: WordProblemTemplate['category'] | 'all') => void
  clearHistory: () => void
  getProblemFromTemplate: (template: WordProblemTemplate) => GeneratedWordProblem
}

// Word problem templates for offline generation
const WORD_PROBLEM_TEMPLATES: WordProblemTemplate[] = [
  {
    id: 'ramp-construction',
    category: 'construction',
    difficulty: 'easy',
    template: 'A construction crew is building a wheelchair ramp. The ramp rises {{rise}} inches over a horizontal distance of {{run}} inches. What is the slope of the ramp?',
    variables: [
      { name: 'rise', min: 4, max: 12, unit: 'inches' },
      { name: 'run', min: 24, max: 72, unit: 'inches' },
    ],
  },
  {
    id: 'road-trip',
    category: 'travel',
    difficulty: 'easy',
    template: 'During a road trip, a car traveled {{rise}} miles while gaining {{run}} miles in altitude. What is the rate of elevation change per mile driven?',
    variables: [
      { name: 'rise', min: 500, max: 3000, unit: 'miles' },
      { name: 'run', min: 100, max: 500, unit: 'miles' },
    ],
  },
  {
    id: 'business-growth',
    category: 'business',
    difficulty: 'medium',
    template: 'A startup company\'s revenue increased by ${{rise}} over {{run}} quarters. What is the average quarterly growth rate?',
    variables: [
      { name: 'rise', min: 10000, max: 100000, unit: 'dollars' },
      { name: 'run', min: 2, max: 8, unit: 'quarters' },
    ],
  },
  {
    id: 'sports-training',
    category: 'sports',
    difficulty: 'medium',
    template: 'An athlete increased their running distance by {{rise}} meters over {{run}} weeks of training. What is the weekly improvement rate?',
    variables: [
      { name: 'rise', min: 500, max: 5000, unit: 'meters' },
      { name: 'run', min: 4, max: 12, unit: 'weeks' },
    ],
  },
  {
    id: 'hiking-trail',
    category: 'nature',
    difficulty: 'hard',
    template: 'A hiking trail has an elevation gain of {{rise1}} feet over the first {{run1}} miles, then continues with an additional {{rise2}} feet gain over {{run2}} miles. What is the overall average slope of the trail?',
    variables: [
      { name: 'rise1', min: 200, max: 1000, unit: 'feet' },
      { name: 'run1', min: 1, max: 5, unit: 'miles' },
      { name: 'rise2', min: 100, max: 800, unit: 'feet' },
      { name: 'run2', min: 1, max: 5, unit: 'miles' },
    ],
  },
]

export function useWordProblemGenerator({
  openaiClient,
  language = 'en',
  defaultDifficulty = 'medium',
  maxHistorySize = 20,
}: UseWordProblemGeneratorOptions = {}): UseWordProblemGeneratorReturn {
  const [currentProblem, setCurrentProblem] = useState<GeneratedWordProblem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<WordProblemHistory[]>([])
  const [difficulty, setDifficultyState] = useState<'easy' | 'medium' | 'hard'>(defaultDifficulty)
  const [category, setCategoryState] = useState<WordProblemTemplate['category'] | 'all'>('all')

  const setDifficulty = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficultyState(newDifficulty)
  }, [])

  const setCategory = useCallback((newCategory: WordProblemTemplate['category'] | 'all') => {
    setCategoryState(newCategory)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  // Generate SVG visualization for a problem
  const generateSVGVisualization = useCallback((problem: GeneratedWordProblem): { svg: string; alt: string } => {
    const slope = problem.expectedSlope
    if (slope === null) {
      return {
        svg: '<svg viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle">No visualization</text></svg>',
        alt: 'No visualization available',
      }
    }

    // Create a simple coordinate system with a line
    const x1 = 10
    const y1 = 80
    const x2 = 80
    const y2 = 80 - slope * 10 // Scale slope for visualization

    // Clamp y2 to stay within bounds
    const clampedY2 = Math.max(10, Math.min(90, y2))

    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="90" x2="90" y2="90" stroke="#666" stroke-width="1"/>
      <line x1="10" y1="90" x2="10" y2="10" stroke="#666" stroke-width="1"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${clampedY2}" stroke="#3b82f6" stroke-width="3"/>
      <circle cx="${x1}" cy="${y1}" r="3" fill="#22c55e"/>
      <circle cx="${x2}" cy="${clampedY2}" r="3" fill="#ef4444"/>
      <text x="50" y="97" text-anchor="middle" font-size="8" fill="#666">x</text>
      <text x="5" y="50" text-anchor="middle" font-size="8" fill="#666" transform="rotate(-90 5 50)">y</text>
    </svg>`

    return {
      svg,
      alt: `Graph showing a line with slope ${slope.toFixed(2)} passing through two points`,
    }
  }, [])

  // Generate a problem from template without AI
  const getProblemFromTemplate = useCallback((template: WordProblemTemplate): GeneratedWordProblem => {
    const variables: Record<string, number> = {}
    template.variables.forEach(v => {
      variables[v.name] = Math.floor(Math.random() * (v.max - v.min + 1)) + v.min
    })

    let question = template.template
    Object.entries(variables).forEach(([name, value]) => {
      question = question.replace(new RegExp(`{{${name}}}`, 'g'), String(value))
    })

    // Calculate expected values
    const hasRise = template.variables.some(v => v.name === 'rise')
    const hasRun = template.variables.some(v => v.name === 'run')
    const rise = hasRise
      ? (variables.rise ?? 0)
      : (variables.rise1 ?? 0) + (variables.rise2 ?? 0)
    const run = hasRun
      ? (variables.run ?? 1)
      : (variables.run1 ?? 1) + (variables.run2 ?? 0)
    const expectedSlope = run !== 0 ? rise / run : null

    const problem: GeneratedWordProblem = {
      question,
      context: `This ${template.category} scenario involves calculating slope.`,
      hints: [
        'Remember: slope = rise / run',
        `Rise is the vertical change (${rise} ${template.variables.find(v => v.name === 'rise')?.unit || ''})`,
        `Run is the horizontal change (${run} ${template.variables.find(v => v.name === 'run')?.unit || ''})`,
      ],
      expectedSlope,
      expectedIntercept: null,
      solution: `slope = rise / run = ${rise} / ${run} = ${expectedSlope?.toFixed(2) || 'undefined'}`,
      explanation: `This ${template.category} scenario demonstrates that for every unit of ${template.variables.find(v => v.name === 'run')?.unit || 'unit'} horizontally, the value changes by ${expectedSlope?.toFixed(2) || 'undefined'} units vertically.`,
      category: template.category,
      difficulty: template.difficulty,
      visualization: generateSVGVisualization({
        question,
        context: '',
        hints: [],
        expectedSlope,
        expectedIntercept: null,
        solution: '',
        explanation: '',
        category: template.category,
        difficulty: template.difficulty,
      }),
    }

    return problem
  }, [generateSVGVisualization])

  // Generate a new word problem
  const generateProblem = useCallback(async (
    targetDifficulty?: 'easy' | 'medium' | 'hard',
    targetCategory?: WordProblemTemplate['category']
  ): Promise<void> => {
    const selectedDifficulty = targetDifficulty || difficulty
    const selectedCategory = targetCategory || category
    const selectedLanguage = language

    setIsLoading(true)
    setError(null)

    try {
      // Filter templates by difficulty and category
      let templates = WORD_PROBLEM_TEMPLATES

      if (selectedCategory !== 'all') {
        templates = templates.filter(t => t.category === selectedCategory)
      }

      // If no templates match, use all templates
      if (templates.length === 0) {
        templates = WORD_PROBLEM_TEMPLATES
      }

      // If AI client is available, use it for more dynamic problems
      if (openaiClient) {
        const prompt = `Generate a real-world ${selectedCategory !== 'all' ? selectedCategory : ''} slope word problem at ${selectedDifficulty} difficulty level.
        
Return a JSON object with:
- question: The word problem text (practical, real-world scenario)
- context: Brief explanation of the real-world context
- hints: Array of 2-3 helpful hints
- expectedSlope: The correct slope value (numeric)
- expectedIntercept: The y-intercept or null if not applicable
- solution: Step-by-step solution
- explanation: Real-world interpretation

Make it engaging and appropriate for ${selectedDifficulty} level. Language should be ${selectedLanguage}.`

        const result = await openaiClient.chatCompletion(
          [
            {
              role: 'system',
              content: 'You are a math teacher creating engaging slope problems. Return only valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          'gpt-4o-mini',
          800
        )

        try {
          const problemData = JSON.parse(result)
          const visualization = generateSVGVisualization(problemData)

          const problem: GeneratedWordProblem = {
            ...problemData,
            category: selectedCategory !== 'all' ? selectedCategory : 'construction',
            difficulty: selectedDifficulty,
            visualization,
          }

          setCurrentProblem(problem)
        } catch (e) {
          // Fallback to template-based generation
          const template =
            templates[Math.floor(Math.random() * templates.length)] ??
            WORD_PROBLEM_TEMPLATES[0]
          if (!template) {
            throw new Error('No word problem templates available')
          }
          const problem = getProblemFromTemplate(template)
          setCurrentProblem(problem)
        }
      } else {
        // Use template-based generation
        const template =
          templates[Math.floor(Math.random() * templates.length)] ??
          WORD_PROBLEM_TEMPLATES[0]
        if (!template) {
          throw new Error('No word problem templates available')
        }
        const problem = getProblemFromTemplate(template)
        setCurrentProblem(problem)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate problem')
    } finally {
      setIsLoading(false)
    }
  }, [openaiClient, difficulty, category, getProblemFromTemplate, generateSVGVisualization])

  // Check user's answer
  const checkAnswer = useCallback(async (
    userSlope: number | null,
    userIntercept: number | null,
    points: { x: number; y: number }[]
  ): Promise<{ isCorrect: boolean; feedback: string }> => {
    if (!currentProblem) {
      return { isCorrect: false, feedback: 'No problem loaded.' }
    }

    const isCorrect = currentProblem.expectedSlope !== null &&
      userSlope !== null &&
      Math.abs(userSlope - currentProblem.expectedSlope) < 0.05

    // Calculate tolerance based on difficulty
    const tolerance = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.05 : 0.02
    const normalizedDifference = currentProblem.expectedSlope !== null && userSlope !== null
      ? Math.abs(userSlope - currentProblem.expectedSlope)
      : 1

    let feedback: string
    if (isCorrect) {
      feedback = 'Correct! You found the right slope. ' + currentProblem.explanation
    } else if (normalizedDifference < tolerance * 2) {
      feedback = `Close! Your answer (${userSlope?.toFixed(2) || 'N/A'}) is very close to the correct slope (${currentProblem.expectedSlope?.toFixed(2)}). Check your calculations.`
    } else {
      feedback = `Not quite. The correct slope is ${currentProblem.expectedSlope?.toFixed(2)}. ${currentProblem.hints[0] || ''}`
    }

    // Add to history
    const historyEntry: WordProblemHistory = {
      id: crypto.randomUUID(),
      problem: currentProblem,
      userAnswer: {
        slope: userSlope,
        intercept: userIntercept,
        points,
      },
      isCorrect,
      timestamp: Date.now(),
    }

    setHistory((prev: WordProblemHistory[]) => {
      const newHistory = [historyEntry, ...prev]
      return newHistory.slice(0, maxHistorySize)
    })

    return { isCorrect, feedback }
  }, [currentProblem, difficulty, maxHistorySize])

  return {
    currentProblem,
    isLoading,
    error,
    history,
    difficulty,
    category,
    generateProblem,
    checkAnswer,
    setDifficulty,
    setCategory,
    clearHistory,
    getProblemFromTemplate,
  }
}
