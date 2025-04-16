'use client';

import React, { useState, useRef, useEffect } from 'react';
// Import from vite instead of next since this is a Vite project
// import dynamic from 'next/dynamic';
import { InteractiveContent } from '@/types/database';
import GraphCanvas from './components/GraphCanvas';
import { useGraphManagement } from './hooks/useGraphManagement';
import ConceptExplanation, { Concept } from './components/ConceptExplanation';
import PracticeProblem from './components/PracticeProblem';
import { useProblemGeneration } from './hooks/useProblemGeneration';
import CustomProblemSolver from './components/CustomProblemSolver';
import StatsDisplay from './components/StatsDisplay';
import WordProblem from './components/WordProblem';
import AnimatedSolution from './components/AnimatedSolution';
import { OpenAIClient } from '@/services/openAi';
import { useCognitiveLoad } from '@/hooks/useCognitiveLoad';
import { CognitiveLoadIndicator } from '@/components/CognitiveLoadIndicator';

// Temporarily comment out dynamic imports until components are created
// const GraphCanvas = dynamic(
//   () => import('./components/GraphCanvas'),
//   { ssr: false }
// );

// Temporarily comment out component imports until they are created
// import StatsDisplay from './components/StatsDisplay';
// import WordProblem from './components/WordProblem';
// import AnimatedSolution from './components/AnimatedSolution';

// Define state types
type ToolMode = 'concept' | 'practice' | 'custom' | 'word';

// Add tool mode type for all drawing tools
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
interface ExtendedInteractiveContent extends InteractiveContent {
  conceptExplanations?: Concept[];
}

const SlopeDrawing: React.FC<SlopeDrawingProps> = ({
  interactiveContent,
  userId = 'anonymous',
  knowledgeId = '',
  language = 'en',
  onUpdateProgress,
  openaiClient,
}) => {
  // Cast to our extended type
  const extendedContent = interactiveContent as ExtendedInteractiveContent;
  
  // Component state
  const [activeMode, setActiveMode] = useState<ToolMode>('concept');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  
  // Reference to the container div (for sizing calculations)
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Cognitive load tracking
  const { cognitiveState, recordError, recordHesitation, resetTracking } = useCognitiveLoad(60);
  
  // Use our graph management hook
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
  } = useGraphManagement({
    initialZoom: 1,
    initialOffset: { x: 0, y: 0 },
    canvasWidth: dimensions.width,
    canvasHeight: dimensions.height,
  });

  // Track if initial points have been set to avoid double-initialization
  const hasInitialized = useRef(false);

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
  
  // Use the problem generation hook
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
  } = useProblemGeneration({
    predefinedProblems: extendedContent.problems 
      ? extendedContent.problems.map(p => {
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

  // Animation state
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Update canvas dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const canvas = containerRef.current.querySelector('.canvas-container');
      if (canvas) {
        setDimensions({
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        });
      }
    };

    // Initial size
    updateDimensions();

    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Effect to generate initial problem or select first concept
  useEffect(() => {
    if (activeMode === 'practice' && !currentProblemId) {
      generateProblem();
    } else if (activeMode === 'concept' && extendedContent.conceptExplanations?.length && !selectedConceptId) {
      setSelectedConceptId(extendedContent.conceptExplanations[0].id);
    }
  }, [activeMode, currentProblemId, generateProblem, extendedContent.conceptExplanations, selectedConceptId]);

  // Handle mode changes
  const handleModeChange = (mode: ToolMode) => {
    // Change the mode
    setActiveMode(mode);
  };

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
      const concept = extendedContent.conceptExplanations?.find(c => c.id === selectedConceptId);
      if (concept?.demoPoints && concept.demoPoints.length > 0) {
        setPointsFromCoordinates(concept.demoPoints);
      } else {
        setPointsFromCoordinates([{ x: -4, y: -7 }, { x: 2, y: 5 }]);
      }
    }
    // Reset hasInitialized when mode/concept changes
    hasInitialized.current = true;
  }, [activeMode, currentProblem, selectedConceptId, clearPoints, setPointsFromCoordinates, extendedContent.conceptExplanations]);

  // Handle concept selection
  const handleConceptSelect = (conceptId: string) => {
    setSelectedConceptId(conceptId);
  };

  // Effect to update graph view when concept changes
  useEffect(() => {
    if (activeMode === 'concept' && selectedConceptId) {
      // For concept mode, get demo points from selected concept
      const concept = extendedContent.conceptExplanations?.find(c => c.id === selectedConceptId);
      if (concept?.demoPoints && concept.demoPoints.length > 0) {
        setPointsFromCoordinates(concept.demoPoints);
      } else {
        // Default demo points if none specified for the concept
        setPointsFromCoordinates([{ x: -4, y: -7 }, { x: 2, y: 5 }]);
      }
    }
  }, [activeMode, selectedConceptId, setPointsFromCoordinates, extendedContent.conceptExplanations]);

  // Handle submitting an answer for practice problems
  const handleSubmitAnswer = () => {
    if (lineData) {
      const isCorrect = checkSolution(lineData);
      if (!isCorrect) {
        recordError();
      }
    }
  };

  // Handle hint usage for practice problems
  const handleHintRequest = () => {
    recordHesitation(30); // Assume using a hint indicates 30 seconds of hesitation
  };

  // Handle solution reveal
  const handleSolutionReveal = () => {
    recordHesitation(60); // Assume revealing solution indicates 60 seconds of hesitation
  };

  // Reset cognitive tracking when changing modes
  useEffect(() => {
    resetTracking();
  }, [activeMode, resetTracking]);

  // Get the selected concept data
  const selectedConcept = extendedContent.conceptExplanations?.find(
    concept => concept.id === selectedConceptId
  );

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
  const concepts = extendedContent.conceptExplanations?.length 
    ? extendedContent.conceptExplanations 
    : defaultConcepts;

  // Add tool mode type for all drawing tools
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('move');

  // Undo/redo stack placeholder (to be implemented)
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col overflow-hidden">
      {/* Tool mode selector */}
      <div className="bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => handleModeChange('concept')}
            className={`px-3 py-1 rounded ${
              activeMode === 'concept' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Concept
          </button>
          <button
            onClick={() => handleModeChange('practice')}
            className={`px-3 py-1 rounded ${
              activeMode === 'practice' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`px-3 py-1 rounded ${
              activeMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => handleModeChange('word')}
            className={`px-3 py-1 rounded ${
              activeMode === 'word' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Word Problem
          </button>
        </div>
        
        {/* Cognitive Load Indicator */}
        <CognitiveLoadIndicator 
          loadLevel={cognitiveState.loadLevel}
          errorCount={cognitiveState.errorCount}
          hesitationSeconds={cognitiveState.hesitationSeconds}
          idleTimeSeconds={cognitiveState.idleTimeSeconds}
          onReset={resetTracking}
          className="ml-2"
        />
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Drawing Tools */}
        <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-2">
          <button title="Reset" onClick={() => setDrawingTool('reset')} className={`tool-btn ${drawingTool==='reset'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>⟲</button>
          <button title="Undo" onClick={() => setDrawingTool('undo')} className={`tool-btn ${drawingTool==='undo'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>↶</button>
          <button title="Redo" onClick={() => setDrawingTool('redo')} className={`tool-btn ${drawingTool==='redo'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>↷</button>
          <button title="Move" onClick={() => setDrawingTool('move')} className={`tool-btn ${drawingTool==='move'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>✥</button>
          <button title="Draw Solid Line" onClick={() => setDrawingTool('solidLine')} className={`tool-btn ${drawingTool==='solidLine'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>━</button>
          <button title="Draw Dotted Line" onClick={() => setDrawingTool('dottedLine')} className={`tool-btn ${drawingTool==='dottedLine'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>⋯</button>
          <button title="Add Point" onClick={() => setDrawingTool('point')} className={`tool-btn ${drawingTool==='point'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>●</button>
          <button title="Add Text" onClick={() => setDrawingTool('text')} className={`tool-btn ${drawingTool==='text'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>𝒯</button>
          <button title="Add Shape" onClick={() => setDrawingTool('shape')} className={`tool-btn ${drawingTool==='shape'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>⬒</button>
          <button title="Clear" onClick={() => setDrawingTool('clear')} className={`tool-btn ${drawingTool==='clear'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>🗑</button>
          <button title="Pan" onClick={() => setDrawingTool('pan')} className={`tool-btn ${drawingTool==='pan'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>✋</button>
          <button title="Zoom In" onClick={() => setDrawingTool('zoomIn')} className={`tool-btn ${drawingTool==='zoomIn'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>＋</button>
          <button title="Zoom Out" onClick={() => setDrawingTool('zoomOut')} className={`tool-btn ${drawingTool==='zoomOut'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>－</button>
        </div>
        
        {/* Main Graph/Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Graph Canvas */}
          <div className="flex-1 canvas-container relative overflow-hidden bg-gray-900" style={{ minHeight: '60vh' }}>
            <GraphCanvas
              width={dimensions.width}
              height={dimensions.height}
              points={points}
              onPointsChange={setPoints}
              zoom={zoom}
              offset={offset}
              onZoomChange={setZoom}
              onOffsetChange={setOffset}
              mapPointToCanvas={mapPointToCanvas}
              mapCanvasToPoint={mapCanvasToPoint}
              editMode={activeMode !== 'concept' || !selectedConcept?.demoPoints}
              highlightSolution={activeMode === 'practice' && isCorrect === true}
              drawingTool={drawingTool}
              onDrawingToolChange={setDrawingTool}
            />
          </div>

          {/* Animated Solution */}
          {showAnimation && lineData && (
            <div className="h-48 border-t border-gray-700 overflow-hidden">
              <AnimatedSolution
                points={points}
                slope={lineData.slope}
                equation={lineData.equation}
                onPointsChange={setPoints}
                autoPlay={true}
                speed={animationSpeed}
                onSpeedChange={setAnimationSpeed}
                onComplete={() => setShowAnimation(false)}
              />
            </div>
          )}
        </div>
        
        {/* Right Panel (mode specific) - Fixed width with scrolling */}
        <div className="w-96 overflow-y-auto border-l border-gray-700 flex-shrink-0">
          {/* Concept Explanation Mode */}
          {activeMode === 'concept' && (
            <ConceptExplanation
              concepts={concepts}
              selectedConceptId={selectedConceptId}
              onSelectConcept={handleConceptSelect}
              lineData={lineData}
            />
          )}
          
          {/* Practice Problem Mode */}
          {activeMode === 'practice' && (
            <>
              <PracticeProblem
                problems={problems}
                currentProblemId={currentProblemId}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                onSelectProblem={setCurrentProblemId}
                onGenerateNewProblem={generateProblem}
                lineData={lineData}
                onSubmitAnswer={handleSubmitAnswer}
                isCorrect={isCorrect}
                showSolution={showSolution}
                onToggleSolution={() => {
                  toggleSolution();
                  handleSolutionReveal();
                }}
                onNextProblem={nextProblem}
                stats={stats}
                onHintRequest={handleHintRequest}
              />
              <div className="mt-4">
                <StatsDisplay stats={stats} showDetails={true} />
              </div>
            </>
          )}
          
          {/* Custom Problem Mode */}
          {activeMode === 'custom' && (
            <CustomProblemSolver
              lineData={lineData}
              onPointsChange={setPointsFromCoordinates}
              openaiClient={openaiClient}
              language={language}
            />
          )}
          
          {/* Word Problem Mode */}
          {activeMode === 'word' && (
            <WordProblem
              lineData={lineData}
              onPointsChange={setPointsFromCoordinates}
              openaiClient={openaiClient}
              language={language}
              difficulty={difficulty}
            />
          )}
        </div>
      </div>
      
      {/* Bottom Controls Area */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={resetView}
            className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600"
          >
            Reset View
          </button>
          <button
            onClick={clearPoints}
            className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600"
          >
            Clear Points
          </button>
          {lineData && (
            <button
              onClick={() => setShowAnimation(true)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Show Steps
            </button>
          )}
        </div>
        
        {lineData && (
          <div className="text-gray-400 text-sm">
            {lineData.equation} | Slope: {lineData.slope !== null ? lineData.slope.toFixed(2) : 'Undefined'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlopeDrawing; 