import { InteractiveContent } from '@/types/database';
import { OpenAIClient } from '@/services/openAi';

// Define state types
export type ToolMode = 'concept' | 'practice' | 'custom' | 'word';

// Tool mode type for all drawing tools
export type DrawingTool =
  | 'move'
  | 'solidLine'
  | 'dottedLine'
  | 'point'
  | 'text'
  | 'shape'
  | 'pan'
  | 'clear'
  | 'reset'
  | 'undo'
  | 'redo'
  | 'zoomIn'
  | 'zoomOut';

export interface SlopeDrawingProps {
  interactiveContent: InteractiveContent;
  userId?: string;
  knowledgeId?: string;
  language?: string;
  onUpdateProgress?: (progress: number) => void;
  openaiClient?: OpenAIClient;
}

// Extend the InteractiveContent type to include concept explanations with demo points
export interface ExtendedInteractiveContent extends InteractiveContent {
  conceptExplanations?: Concept[];
}

// Point interface
export interface Point {
  x: number;
  y: number;
}

// Line data interface
export interface LineData {
  slope: number | null;
  equation: string;
  intercept?: number;
  point1?: Point;
  point2?: Point;
}

// Concept interface
export interface Concept {
  id: string;
  title: string;
  content: string;
  formula?: string;
  demoPoints?: Point[];
  illustration?: string;
  examples?: ConceptExample[];
}

export interface ConceptExample {
  id: string;
  description: string;
  formula?: string;
}

// Problem related types
export interface Problem {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  solution: string | { slope: number; yIntercept: number };
  targetPoints?: Point[];
  startPoints?: Point[];
}

// Type for the useProblemGeneration hook's stats
export interface ProblemGenerationStats {
  correct: number;
  incorrect: number;
  attempted: number;
  streakCount: number;
  history: SolutionResult[];
  difficultyStats: {
    easy: { attempted: number; correct: number };
    medium: { attempted: number; correct: number };
    hard: { attempted: number; correct: number };
  };
}

export interface SolutionResult {
  problemId: string;
  isCorrect: boolean;
  timeSpent: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Stats for the UI display
export interface ProblemStats {
  totalAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTime: number;
  streak: number;
  currentLevel: 'easy' | 'medium' | 'hard';
}

// Animation types
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

// Graph management types
export interface Offset {
  x: number;
  y: number;
}

export interface GraphManagementState {
  points: Point[];
  zoom: number;
  offset: Offset;
  lineData?: LineData;
  canvasWidth: number;
  canvasHeight: number;
}

export interface GraphManagementActions {
  setPoints: (points: Point[]) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: Offset) => void;
  resetView: () => void;
  clearPoints: () => void;
  setPointsFromCoordinates: (coordinates: Point[]) => void;
  mapPointToCanvas: (point: Point) => { x: number; y: number };
  mapCanvasToPoint: (canvasPoint: { x: number; y: number }) => Point;
} 