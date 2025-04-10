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
    predefinedProblems: extendedContent.problems || []
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

  // Effect to clear points when switching to practice mode and set predefined points if available
  useEffect(() => {
    if (activeMode === 'practice' && currentProblem) {
      clearPoints();
      
      // If the problem has target points, we'll show them for demonstration
      if (currentProblem.targetPoints && currentProblem.targetPoints.length > 0) {
        // For some problems we might want to start with certain points
        if (currentProblem.startPoints && currentProblem.startPoints.length > 0) {
          setPointsFromCoordinates(currentProblem.startPoints);
        }
      }
    } else if (activeMode === 'concept' && selectedConceptId) {
      // For concept mode, get demo points from selected concept
      const concept = extendedContent.conceptExplanations?.find(c => c.id === selectedConceptId);
      if (concept?.demoPoints && concept.demoPoints.length > 0) {
        setPointsFromCoordinates(concept.demoPoints);
      } else {
        clearPoints();
      }
    }
  }, [activeMode, currentProblem, selectedConceptId, clearPoints, setPointsFromCoordinates, extendedContent.conceptExplanations]);

  // Handle tool mode changes
  const handleModeChange = (mode: ToolMode) => {
    setActiveMode(mode);
    resetView(); // Reset the graph view when changing modes
  };

  // Handle concept selection
  const handleConceptSelect = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    
    // Get demo points from the selected concept
    const concept = extendedContent.conceptExplanations?.find(c => c.id === conceptId);
    if (concept?.demoPoints && concept.demoPoints.length > 0) {
      setPointsFromCoordinates(concept.demoPoints);
    } else {
      clearPoints();
    }
  };

  // Handle submitting an answer for practice problems
  const handleSubmitAnswer = () => {
    if (lineData) {
      checkSolution(lineData);
    }
  };

  // Get the selected concept data
  const selectedConcept = extendedContent.conceptExplanations?.find(
    concept => concept.id === selectedConceptId
  );

  // Default concept examples if none provided
  const defaultConcepts: Concept[] = [
    {
      id: 'positive',
      title: 'Positive Slope',
      content: 'A line that rises from left to right has a positive slope. As x increases, y increases.',
      demoPoints: [{ x: -2, y: -1 }, { x: 2, y: 3 }],
      illustration: 'https://via.placeholder.com/300?text=Positive+Slope',
      examples: [
        {
          id: 'positive-1',
          description: 'For points (1, 1) and (3, 5), the slope is (5 - 1) / (3 - 1) = 4 / 2 = 2.'
        }
      ]
    },
    {
      id: 'negative',
      title: 'Negative Slope',
      content: 'A line that falls from left to right has a negative slope. As x increases, y decreases.',
      demoPoints: [{ x: -2, y: 3 }, { x: 2, y: -1 }],
      illustration: 'https://via.placeholder.com/300?text=Negative+Slope',
      examples: [
        {
          id: 'negative-1',
          description: 'For points (2, 4) and (6, 1), the slope is (1 - 4) / (6 - 2) = -3 / 4 = -0.75.'
        }
      ]
    }
  ];

  // Use concepts from content or default to our sample concepts
  const concepts = extendedContent.conceptExplanations?.length 
    ? extendedContent.conceptExplanations 
    : defaultConcepts;

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden"
    >
      {/* Tool Header & Mode Selector */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Slope Drawing Tool</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleModeChange('concept')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'concept' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Concept
          </button>
          <button
            onClick={() => handleModeChange('practice')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'practice' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => handleModeChange('word')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'word' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Word
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Panel - Graph and Animation */}
        <div className="flex-1 flex flex-col">
          {/* Graph Canvas */}
          <div className="flex-1 canvas-container">
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
            />
          </div>

          {/* Animated Solution */}
          {showAnimation && lineData && (
            <div className="h-48 border-t border-gray-700">
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
        
        {/* Right Panel (mode specific) */}
        <div className="w-96 overflow-y-auto overflow-x-hidden border-l border-gray-700">
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
                onToggleSolution={toggleSolution}
                onNextProblem={nextProblem}
                stats={stats}
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