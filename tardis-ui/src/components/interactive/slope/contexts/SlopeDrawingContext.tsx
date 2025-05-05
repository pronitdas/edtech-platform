import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  ToolMode, 
  DrawingTool, 
  Point, 
  Offset, 
  LineData,
  ExtendedInteractiveContent, 
  Concept, 
  Problem,
  ProblemStats,
  ProblemGenerationStats
} from '../types';
import { useGraphManagement } from '../hooks/useGraphManagement';
import { useProblemGeneration } from '../hooks/useProblemGeneration';
import { useCognitiveLoad } from '@/hooks/useCognitiveLoad';
import { OpenAIClient } from '@/services/openAi';

interface SlopeDrawingContextValue {
  // Mode state
  activeMode: ToolMode;
  setActiveMode: (mode: ToolMode) => void;
  
  // Graph management
  points: Point[];
  setPoints: (points: Point[]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  offset: Offset;
  setOffset: (offset: Offset) => void;
  resetView: () => void;
  clearPoints: () => void;
  setPointsFromCoordinates: (coordinates: Point[]) => void;
  mapPointToCanvas: (point: Point) => { x: number; y: number };
  mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point;
  lineData?: LineData;
  canvasWidth: number;
  canvasHeight: number;
  
  // Drawing tool state
  drawingTool: DrawingTool;
  setDrawingTool: (tool: DrawingTool) => void;
  
  // Concept mode
  concepts: Concept[];
  selectedConceptId: string | null;
  setSelectedConceptId: (id: string | null) => void;
  selectedConcept: Concept | undefined;
  
  // Practice problem mode
  problems: Problem[];
  currentProblemId: string | null;
  currentProblem: Problem | null;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean | null;
  showSolution: boolean;
  stats: ProblemGenerationStats;
  setCurrentProblemId: (id: string | null) => void;
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  generateProblem: () => void;
  checkSolution: (lineData: LineData) => boolean;
  toggleSolution: () => void;
  nextProblem: () => void;
  
  // Animation state
  showAnimation: boolean;
  setShowAnimation: (show: boolean) => void;
  animationSpeed: 'slow' | 'normal' | 'fast';
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  
  // Cognitive load
  cognitiveState: {
    loadLevel: 'low' | 'medium' | 'high';
    errorCount: number;
    hesitationSeconds: number;
    idleTimeSeconds: number;
  };
  recordError: () => void;
  recordHesitation: (seconds: number) => void;
  resetTracking: () => void;
  
  // Canvas dimensions
  dimensions: { width: number; height: number };
  setDimensions: (dimensions: { width: number; height: number }) => void;
  
  // Props passed to the SlopeDrawing component
  interactiveContent: ExtendedInteractiveContent;
  userId: string;
  knowledgeId: string;
  language: string;
  onUpdateProgress?: (progress: number) => void;
  openaiClient?: OpenAIClient;
  
  // Additional state
  undoStack: any[];
  redoStack: any[];
  setUndoStack: (stack: any[]) => void;
  setRedoStack: (stack: any[]) => void;
}

interface SlopeDrawingProviderProps {
  children: ReactNode;
  interactiveContent: ExtendedInteractiveContent;
  userId?: string;
  knowledgeId?: string;
  language?: string;
  onUpdateProgress?: (progress: number) => void;
  openaiClient?: OpenAIClient;
}

// Create the context with a default value
const SlopeDrawingContext = createContext<SlopeDrawingContextValue | undefined>(undefined);

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
  const [activeMode, setActiveMode] = useState<ToolMode>('concept');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('move');
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  
  // Cognitive load tracking
  const { cognitiveState, recordError, recordHesitation, resetTracking } = useCognitiveLoad(60);
  
  // Use our graph management hook
  const graphManagement = useGraphManagement({
    initialZoom: 1,
    initialOffset: { x: 0, y: 0 },
    canvasWidth: dimensions.width,
    canvasHeight: dimensions.height,
  });
  
  // Destructure graph management for easier access
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
  } = graphManagement;
  
  // Use the problem generation hook
  const problemGeneration = useProblemGeneration({
    predefinedProblems: interactiveContent.problems 
      ? interactiveContent.problems.map(p => {
          // Parse the data field safely if it exists
          let targetPoints: { x: number; y: number }[] = [];
          let startPoints: { x: number; y: number }[] = [];
          
          if (p.data && typeof p.data === 'object') {
            // Try to extract target points if they exist
            if ('targetPoints' in p.data && Array.isArray(p.data.targetPoints)) {
              targetPoints = p.data.targetPoints.filter(pt => 
                pt && typeof pt === 'object' && 'x' in pt && 'y' in pt
              ) as { x: number; y: number }[];
            }
            
            // Try to extract start points if they exist
            if ('startPoints' in p.data && Array.isArray(p.data.startPoints)) {
              startPoints = p.data.startPoints.filter(pt => 
                pt && typeof pt === 'object' && 'x' in pt && 'y' in pt
              ) as { x: number; y: number }[];
            }
          }
          
          return {
            id: p.id,
            question: p.question,
            difficulty: p.difficulty || 'medium',
            hints: p.hints || ["Try using the slope formula: (y₂-y₁)/(x₂-x₁)"],
            solution: p.solution,
            targetPoints,
            startPoints
          };
        })
      : []
  });
  
  // Destructure problem generation for easier access
  const {
    problems,
    currentProblemId,
    currentProblem,
    difficulty,
    isCorrect,
    showSolution,
    stats,
    setCurrentProblemId,
    setDifficulty,
    generateProblem,
    checkSolution,
    toggleSolution,
    nextProblem
  } = problemGeneration;

  // Default concept examples if none provided
  const defaultConcepts: Concept[] = [
    {
      id: 'positive',
      title: 'Positive Slope',
      content: 'A line that rises from left to right has a positive slope. As x increases, y increases. This means the rate of change is positive.',
      formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} > 0$$',
      demoPoints: [{ x: -2, y: -1 }, { x: 2, y: 3 }],
      illustration: 'https://via.placeholder.com/300?text=Positive+Slope',
      examples: [
        {
          id: 'positive-1',
          description: 'For points $(1, 1)$ and $(3, 5)$, the slope is:',
          formula: '$$m = \\frac{5 - 1}{3 - 1} = \\frac{4}{2} = 2$$'
        },
        {
          id: 'positive-2',
          description: 'A line with equation $y = 2x + 3$ has a slope of $m = 2$, which is positive.'
        }
      ]
    },
    {
      id: 'negative',
      title: 'Negative Slope',
      content: 'A line that falls from left to right has a negative slope. As x increases, y decreases. This indicates an inverse relationship between variables.',
      formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} < 0$$',
      demoPoints: [{ x: -2, y: 3 }, { x: 2, y: -1 }],
      illustration: 'https://via.placeholder.com/300?text=Negative+Slope',
      examples: [
        {
          id: 'negative-1',
          description: 'For points $(2, 4)$ and $(6, 1)$, the slope is:',
          formula: '$$m = \\frac{1 - 4}{6 - 2} = \\frac{-3}{4} = -0.75$$'
        },
        {
          id: 'negative-2',
          description: 'A line with equation $y = -3x + 2$ has a slope of $m = -3$, which is negative.'
        }
      ]
    },
    {
      id: 'zero',
      title: 'Zero Slope',
      content: 'A horizontal line has a zero slope. As x increases, y remains constant, meaning there is no vertical change.',
      formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{0}{x_2 - x_1} = 0$$',
      demoPoints: [{ x: -3, y: 2 }, { x: 3, y: 2 }],
      illustration: 'https://via.placeholder.com/300?text=Zero+Slope',
      examples: [
        {
          id: 'zero-1',
          description: 'For points $(1, 3)$ and $(5, 3)$, the slope is:',
          formula: '$$m = \\frac{3 - 3}{5 - 1} = \\frac{0}{4} = 0$$'
        },
        {
          id: 'zero-2',
          description: 'A line with equation $y = 4$ has a slope of $m = 0$, making it a horizontal line.'
        }
      ]
    },
    {
      id: 'undefined',
      title: 'Undefined Slope',
      content: 'A vertical line has an undefined slope. For these lines, x remains constant while y can take any value, resulting in division by zero when calculating slope.',
      formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{y_2 - y_1}{0} = \\text{undefined}$$',
      demoPoints: [{ x: 2, y: -3 }, { x: 2, y: 3 }],
      illustration: 'https://via.placeholder.com/300?text=Undefined+Slope',
      examples: [
        {
          id: 'undefined-1',
          description: 'For points $(4, 1)$ and $(4, 7)$, the slope is:',
          formula: '$$m = \\frac{7 - 1}{4 - 4} = \\frac{6}{0} = \\text{undefined}$$'
        },
        {
          id: 'undefined-2',
          description: 'A line with equation $x = 3$ has an undefined slope, making it a vertical line.'
        }
      ]
    },
    {
      id: 'applications',
      title: 'Real-World Applications',
      content: 'Slope has many real-world applications in fields like economics, physics, and engineering. It can represent rates of change such as velocity, economic growth, or the steepness of a hill.',
      demoPoints: [{ x: -3, y: -2 }, { x: 3, y: 4 }],
      examples: [
        {
          id: 'app-1',
          description: 'In economics, the slope of a demand curve represents price elasticity, showing how quantity demanded changes with price.',
          formula: '$$\\text{Elasticity} = \\frac{\\%\\Delta\\text{Quantity}}{\\%\\Delta\\text{Price}}$$'
        },
        {
          id: 'app-2',
          description: 'In physics, the slope of a position-time graph represents velocity, while the slope of a velocity-time graph represents acceleration.',
          formula: '$$v = \\frac{\\Delta x}{\\Delta t}, \\quad a = \\frac{\\Delta v}{\\Delta t}$$'
        }
      ]
    }
  ];

  // Use concepts from content or default to our sample concepts
  const concepts = interactiveContent.conceptExplanations?.length 
    ? interactiveContent.conceptExplanations 
    : defaultConcepts;
  
  // Get the selected concept data
  const selectedConcept = concepts.find(
    concept => concept.id === selectedConceptId
  );
  
  // Track if initial points have been set to avoid double-initialization
  const hasInitialized = React.useRef(false);

  // Initialize with default points once when the component mounts
  useEffect(() => {
    if (!hasInitialized.current && points.length === 0) {
      setPointsFromCoordinates([
        { x: -4, y: -7 },
        { x: 2, y: 5 }
      ]);
      hasInitialized.current = true;
    }
  }, [points.length, setPointsFromCoordinates]);
  
  // Reset view whenever points change
  useEffect(() => {
    if (points.length > 0) {
      const timer = setTimeout(() => {
        resetView();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [points, resetView]);
  
  // Effect to generate initial problem or select first concept
  useEffect(() => {
    if (activeMode === 'practice' && !currentProblemId) {
      generateProblem();
    } else if (activeMode === 'concept' && concepts.length && !selectedConceptId) {
      setSelectedConceptId(concepts[0].id);
    }
  }, [activeMode, currentProblemId, generateProblem, concepts, selectedConceptId]);
  
  // Effect to handle mode changes, clear points, and reset view
  useEffect(() => {
    if (activeMode === 'practice' && currentProblem) {
      clearPoints();
      if (currentProblem.targetPoints && currentProblem.targetPoints.length > 0) {
        if (currentProblem.startPoints && currentProblem.startPoints.length > 0) {
          setPointsFromCoordinates(currentProblem.startPoints);
        }
      }
    } else if (activeMode === 'concept' && selectedConceptId) {
      const concept = concepts.find(c => c.id === selectedConceptId);
      if (concept?.demoPoints && concept.demoPoints.length > 0) {
        setPointsFromCoordinates(concept.demoPoints);
      } else {
        setPointsFromCoordinates([{ x: -4, y: -7 }, { x: 2, y: 5 }]);
      }
    }
    // Reset hasInitialized when mode/concept changes
    hasInitialized.current = true;
  }, [activeMode, currentProblem, selectedConceptId, clearPoints, setPointsFromCoordinates, concepts]);
  
  // Effect to update graph view when concept changes
  useEffect(() => {
    if (activeMode === 'concept' && selectedConceptId) {
      // For concept mode, get demo points from selected concept
      const concept = concepts.find(c => c.id === selectedConceptId);
      if (concept?.demoPoints && concept.demoPoints.length > 0) {
        setPointsFromCoordinates(concept.demoPoints);
      } else {
        // Default demo points if none specified for the concept
        setPointsFromCoordinates([{ x: -4, y: -7 }, { x: 2, y: 5 }]);
      }
    }
  }, [activeMode, selectedConceptId, setPointsFromCoordinates, concepts]);
  
  // Reset cognitive tracking when changing modes
  useEffect(() => {
    resetTracking();
  }, [activeMode, resetTracking]);
  
  const value: SlopeDrawingContextValue = {
    // Mode state
    activeMode,
    setActiveMode,
    
    // Graph management
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
    
    // Drawing tool state
    drawingTool,
    setDrawingTool,
    
    // Concept mode
    concepts,
    selectedConceptId,
    setSelectedConceptId,
    selectedConcept,
    
    // Practice problem mode
    problems,
    currentProblemId,
    currentProblem,
    difficulty,
    isCorrect,
    showSolution,
    stats,
    setCurrentProblemId,
    setDifficulty,
    generateProblem,
    checkSolution,
    toggleSolution,
    nextProblem,
    
    // Animation state
    showAnimation,
    setShowAnimation,
    animationSpeed,
    setAnimationSpeed,
    
    // Cognitive load
    cognitiveState,
    recordError,
    recordHesitation,
    resetTracking,
    
    // Canvas dimensions
    dimensions,
    setDimensions,
    
    // Props passed to the SlopeDrawing component
    interactiveContent,
    userId,
    knowledgeId,
    language,
    onUpdateProgress,
    openaiClient,
    
    // Additional state
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
  };
  
  return (
    <SlopeDrawingContext.Provider value={value}>
      {children}
    </SlopeDrawingContext.Provider>
  );
};

// Hook for using the SlopeDrawing context
export const useSlopeDrawing = () => {
  const context = useContext(SlopeDrawingContext);
  
  if (context === undefined) {
    throw new Error('useSlopeDrawing must be used within a SlopeDrawingProvider');
  }
  
  return context;
}; 