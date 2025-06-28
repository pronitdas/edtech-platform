import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { Concept } from '@/types/learning'
import { Point, Offset, LineData, Line } from '@/types/geometry' // Imported Line
import {
  ExtendedInteractiveContent,
  ProblemStats,
  ProblemGenerationStats,
  SolutionResult,
  LearningContext, // Import LearningContext
  ToolMode, // Import ToolMode
  DrawingTool, // Import DrawingTool
  ProblemHistoryEntry,
} from '../types'
import { Problem } from '@/types/interactive'
import { useGraphManagement } from '../hooks/useGraphManagement'
import { useProblemGeneration } from '../hooks/useProblemGeneration'
import { useCognitiveLoad } from '@/hooks/useCognitiveLoad'
import { OpenAIClient } from '@/services/openAi'

interface SlopeDrawingContextValue {
  // Mode state
  activeMode: ToolMode
  setActiveMode: (mode: ToolMode) => void

  // Graph management
  points: Point[]
  setPoints: (points: Point[]) => void
  zoom: number
  setZoom: (zoom: number) => void
  offset: Offset
  setOffset: (offset: Offset) => void
  resetView: () => void
  clearPoints: () => void
  setPointsFromCoordinates: (coordinates: Point[]) => void
  mapPointToCanvas: (point: Point) => { x: number; y: number }
  mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point
  lineData?: LineData
  canvasWidth: number
  canvasHeight: number
  customPoints: Point[] // Added missing prop
  customLines: Line[] // Added missing prop
  shapes: any[] // Added missing prop (using any for now, refine later if needed)
  texts: any[] // Added missing prop (using any for now, refine later if needed)
  selectedItem: string | null // Added missing prop
  setSelectedItem: (id: string | null) => void // Added missing prop
  undoStack: any[]
  setUndoStack: (stack: any[]) => void
  redoStack: any[]
  setRedoStack: (stack: any[]) => void

  // Drawing tool state
  drawingTool: DrawingTool
  setDrawingTool: (tool: DrawingTool) => void

  // Concept mode
  concepts: Concept[]
  selectedConceptId: string | null
  setSelectedConceptId: (id: string | null) => void
  selectedConcept: Concept | undefined

  // Practice problem mode
  problems: Problem[]
  currentProblemId: string | null
  currentProblem: Problem | null
  difficulty: 'easy' | 'medium' | 'hard'
  isCorrect: boolean | null
  showSolution: boolean
  stats: ProblemGenerationStats // Stats are now managed in the provider
  setStats: React.Dispatch<React.SetStateAction<ProblemGenerationStats>> // Add setStats to context value
  generateProblem: () => void
  checkSolution: (lineData: LineData) => boolean
  toggleSolution: () => void
  nextProblem: () => void
  changeDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void // Add changeDifficulty

  // Animation state
  showAnimation: boolean
  setShowAnimation: (show: boolean) => void
  animationSpeed: 'slow' | 'normal' | 'fast'
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void

  // Cognitive load
  cognitiveState: {
    loadLevel: 'low' | 'medium' | 'high'
    errorCount: number
    hesitationSeconds: number
    idleTimeSeconds: number
  }
  recordError: () => void
  recordHesitation: (seconds: number) => void
  resetTracking: () => void

  // Canvas dimensions
  dimensions: { width: number; height: number }
  setDimensions: (dimensions: { width: number; height: number }) => void

  // Props passed to the SlopeDrawing component
  interactiveContent: ExtendedInteractiveContent
  userId: string
  knowledgeId: string
  language: string
  onUpdateProgress?: (progress: number) => void
  openaiClient?: OpenAIClient

  // Problem history
  problemHistory: ProblemHistoryEntry[]
}

interface SlopeDrawingProviderProps {
  children: ReactNode
  interactiveContent: ExtendedInteractiveContent
  userId?: string
  knowledgeId?: string
  language?: string
  onUpdateProgress?: (progress: number) => void
  openaiClient?: OpenAIClient
}

// Create the context with a default value
const SlopeDrawingContext = createContext<SlopeDrawingContextValue | undefined>(
  undefined
)

// Provider component
export const SlopeDrawingProvider: React.FC<SlopeDrawingProviderProps> = ({
  children,
  interactiveContent,
  userId = 'anonymous',
  knowledgeId = '',
  language = 'en',
  onUpdateProgress,
  openaiClient,
}) => {
  // Component state
  const [activeMode, setActiveMode] = useState<ToolMode>('concept')
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(() => {
    // Initialize with first concept if available
    return interactiveContent.concepts && interactiveContent.concepts.length > 0 
      ? interactiveContent.concepts[0].id 
      : null
  })
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('move')
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState<
    'slow' | 'normal' | 'fast'
  >('normal')
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [customPoints, setCustomPoints] = useState<Point[]>([]) // Added missing state
  const [customLines, setCustomLines] = useState<Line[]>([]) // Added missing state
  const [shapes, setShapes] = useState<any[]>([]) // Added missing state
  const [texts, setTexts] = useState<any[]>([]) // Added missing state
  const [selectedItem, setSelectedItem] = useState<string | null>(null) // Added missing state
  const [problemHistory, setProblemHistory] = useState<ProblemHistoryEntry[]>(
    []
  ) // State for problem history

  // Cognitive load tracking
  const { cognitiveState, recordError, recordHesitation, resetTracking } =
    useCognitiveLoad(60)

  const {
    points,
    setPoints,
    zoom,
    setZoom,
    offset,
    setOffset,
    resetView,
    clearPoints,
    setPointsFromCoordinates,
    mapPointToCanvas,
    mapCanvasToPoint,
    lineData,
    canvasWidth,
    canvasHeight,
  } = useGraphManagement()

  // Manage stats state in the provider
  const [stats, setStats] = useState<ProblemGenerationStats>({
    correct: 0,
    incorrect: 0,
    attempted: 0,
    streakCount: 0,
    history: [],
    difficultyStats: {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
    },
  })

  const {
    problems,
    currentProblemId,
    currentProblem,
    difficulty,
    isCorrect,
    showSolution,
    generateProblem,
    checkSolution,
    toggleSolution,
    nextProblem,
    changeDifficulty, // Destructure changeDifficulty
  } = useProblemGeneration({
    predefinedProblems: interactiveContent.problems
      ? interactiveContent.problems.map(p => {
          // Ensure solution is not undefined
          const solution = p.solution === undefined ? '' : p.solution
          const targetPoints =
            p.targetPoints === undefined ? [] : p.targetPoints
          const startPoints = p.startPoints === undefined ? [] : p.startPoints
          return {
            id: p.id,
            question: p.question,
            difficulty: p.difficulty || 'medium',
            hints: p.hints || ['Try using the slope formula: (y₂-y₁)/(x₂-x₁)'],
            solution: solution,
            targetPoints: targetPoints,
            startPoints: startPoints,
          }
        })
      : [],
    learningContext: {
      // Pass learning context
      topic: 'slope', // Hardcoded topic for now
      stats: stats, // Pass stats from provider state
    },
    setStats: setStats, // Pass setStats to the hook
    setProblemHistory: setProblemHistory, // Pass setProblemHistory to the hook
  })

  // Get the selected concept
  const selectedConcept = React.useMemo(() => {
    if (!selectedConceptId) return undefined
    return interactiveContent.concepts?.find(c => c.id === selectedConceptId)
  }, [selectedConceptId, interactiveContent])

  // Initialize points when concept changes to ensure preloaded content is visible
  React.useEffect(() => {
    if (selectedConcept && selectedConcept.demoPoints && selectedConcept.demoPoints.length > 0) {
      // Set points from the selected concept's demo points
      setPointsFromCoordinates(selectedConcept.demoPoints)
    }
  }, [selectedConcept, setPointsFromCoordinates])

  const contextValue: SlopeDrawingContextValue = {
    activeMode,
    setActiveMode,
    points,
    setPoints,
    zoom,
    setZoom,
    offset,
    setOffset,
    resetView,
    clearPoints,
    setPointsFromCoordinates,
    mapPointToCanvas,
    mapCanvasToPoint,
    lineData,
    canvasWidth,
    canvasHeight,
    customPoints, // Added missing prop
    customLines, // Added missing prop
    shapes, // Added missing prop
    texts, // Added missing prop
    selectedItem, // Added missing prop
    setSelectedItem, // Added missing prop
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    drawingTool,
    setDrawingTool,
    concepts: interactiveContent.concepts || [],
    selectedConceptId,
    setSelectedConceptId,
    selectedConcept,
    problems,
    currentProblemId,
    currentProblem,
    difficulty,
    isCorrect,
    showSolution,
    stats, // Use stats from provider state
    setStats, // Provide setStats in context
    generateProblem,
    checkSolution: (lineData: any) => false, // TODO: Implement proper checkSolution
    toggleSolution,
    nextProblem,
    changeDifficulty, // Provide changeDifficulty in context
    showAnimation,
    setShowAnimation,
    animationSpeed,
    setAnimationSpeed,
    cognitiveState,
    recordError,
    recordHesitation,
    resetTracking,
    dimensions,
    setDimensions,
    interactiveContent,
    userId,
    knowledgeId,
    language,
    onUpdateProgress,
    openaiClient,
    problemHistory, // Add problemHistory to context value
  }

  return (
    <SlopeDrawingContext.Provider value={contextValue}>
      {children}
    </SlopeDrawingContext.Provider>
  )
}

export const useSlopeDrawing = () => {
  const context = useContext(SlopeDrawingContext)
  if (context === undefined) {
    throw new Error(
      'useSlopeDrawing must be used within a SlopeDrawingProvider'
    )
  }
  return context
}
