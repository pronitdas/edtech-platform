import React, { useRef, useEffect } from 'react';
import { useSlopeDrawing } from '../contexts/SlopeDrawingContext';
import GraphCanvas from './GraphCanvas';
import ConceptExplanation from './ConceptExplanation';
import PracticeProblem from './PracticeProblem';
import CustomProblemSolver from './CustomProblemSolver';
import WordProblem from './WordProblem';
import AnimatedSolution from './AnimatedSolution';
import StatsDisplay from './StatsDisplay';
import ModeSelector from './ModeSelector';
import DrawingToolbar from './DrawingToolbar';
import BottomControls from './BottomControls';

/**
 * The main layout component for SlopeDrawing
 * This component uses the SlopeDrawingContext to access state and actions
 */
const SlopeDrawingLayout: React.FC = () => {
  const {
    // Mode state
    activeMode,
    setActiveMode,

    // Graph management
    points,
    setPoints,
    zoom,
    offset,
    setZoom,
    setOffset,
    resetView,
    clearPoints,
    setPointsFromCoordinates,
    mapPointToCanvas,
    mapCanvasToPoint,
    lineData,

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
    language,
    openaiClient,
  } = useSlopeDrawing();

  // Reference to the container div (for sizing calculations)
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [setDimensions]);

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

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col overflow-hidden">
      {/* Tool mode selector */}
      <ModeSelector
        activeMode={activeMode}
        onModeChange={setActiveMode}
        cognitiveState={cognitiveState}
        onReset={resetTracking}
      />

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Drawing Tools */}
        <DrawingToolbar
          drawingTool={drawingTool}
          setDrawingTool={setDrawingTool}
        />

        {/* Main Graph/Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Graph Canvas */}
          <div className="flex-1 canvas-container relative overflow-hidden bg-gray-900" style={{ minHeight: '60vh' }}>
            <GraphCanvas
              drawingMode="interactiveMath"
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
              interactiveMathConfig={{
                equation: 'x', // TODO: Replace with actual equation from context
                xRange: [-10, 10], // TODO: Replace with actual xRange from context
                yRange: [-10, 10], // TODO: Replace with actual yRange from context
                stepSize: 0.1,
              }}
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
              onSelectConcept={setSelectedConceptId}
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
      <BottomControls
        lineData={lineData}
        resetView={resetView}
        clearPoints={clearPoints}
        onShowAnimation={() => setShowAnimation(true)}
      />
    </div>
  );
};

export default SlopeDrawingLayout; 