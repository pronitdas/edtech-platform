import React, { useRef, useEffect } from 'react'
import { useSlopeDrawing } from '../contexts/SlopeDrawingContext'
import GraphCanvas from '../../../../components/GraphCanvas'
import ConceptExplanation from './ConceptExplanation'
import PracticeProblem from './PracticeProblem'
import CustomProblemSolver from './CustomProblemSolver'
import WordProblem from './WordProblem'
import AnimatedSolution from './AnimatedSolution'
import StatsDisplay from './StatsDisplay'
import ModeSelector from './ModeSelector'
import DrawingToolbar from './DrawingToolbar'
import BottomControls from './BottomControls'

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
    customPoints,
    customLines,
    shapes,
    texts,
    selectedItem,
    setSelectedItem,
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,

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
    generateProblem,
    checkSolution,
    toggleSolution,
    nextProblem,
    changeDifficulty, // Destructure changeDifficulty

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
  } = useSlopeDrawing()

  // Reference to the container div (for sizing calculations)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update canvas dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (!containerRef.current) return

      const canvas = containerRef.current.querySelector('.canvas-container')
      if (canvas) {
        setDimensions({
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        })
      }
    }

    // Initial size
    updateDimensions()

    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [setDimensions])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for certain keys to avoid interference
      if (
        [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          event.key
        )
      ) {
        event.preventDefault()
      }

      // Handle tool selection shortcuts
      switch (event.key.toLowerCase()) {
        case 'p': // Point tool
          setDrawingTool('point')
          break
        case 'l': // Line tool (assuming solid line)
          setDrawingTool('solidLine')
          break
        case 'e': // Erase tool (assuming clear)
          setDrawingTool('clear')
          break
        // Existing shortcuts
        case 'r':
          setDrawingTool('reset')
          break
        case 'm':
          setDrawingTool('move')
          break
        case 's':
          setDrawingTool('solidLine')
          break
        case 't':
          setDrawingTool('text')
          break
        case 'c':
          setDrawingTool('clear')
          break
        case 'a': // 'a' for pan, as 'p' is for point
          setDrawingTool('pan')
          break
        case '+':
          setDrawingTool('zoomIn')
          break
        case '-':
          setDrawingTool('zoomOut')
          break
      }

      // Handle Undo/Redo shortcuts (Ctrl+Z/Cmd+Z, Ctrl+Y/Cmd+Y)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        setDrawingTool('undo')
        event.preventDefault() // Prevent browser undo
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        setDrawingTool('redo')
        event.preventDefault() // Prevent browser redo
      }

      // Handle Clear canvas shortcut (Delete or Backspace)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        setDrawingTool('clear')
        event.preventDefault() // Prevent browser back navigation
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setDrawingTool]) // Depend on setDrawingTool to ensure the latest function is used

  // Handle submitting an answer for practice problems
  const handleSubmitAnswer = () => {
    if (lineData) {
      const isCorrect = checkSolution(lineData)
      if (!isCorrect) {
        recordError()
      }
    }
  }

  // Handle hint usage for practice problems
  const handleHintRequest = () => {
    recordHesitation(30) // Assume using a hint indicates 30 seconds of hesitation
  }

  // Handle solution reveal
  const handleSolutionReveal = () => {
    recordHesitation(60) // Assume revealing solution indicates 60 seconds of hesitation
  }

  return (
    <div
      ref={containerRef}
      className='flex h-full w-full flex-col overflow-hidden'
    >
      {/* Tool mode selector */}
      <ModeSelector
        activeMode={activeMode}
        onModeChange={setActiveMode}
        cognitiveState={cognitiveState}
        onReset={resetTracking}
      />

      {/* Main content area with sidebar */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar - Drawing Tools */}
        <DrawingToolbar
          drawingTool={drawingTool}
          setDrawingTool={setDrawingTool}
        />

        {/* Main Graph/Canvas Area */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Graph Canvas */}
          <div
            className='canvas-container relative flex-1 overflow-hidden bg-gray-900'
            style={{ minHeight: '60vh' }}
          >
            <GraphCanvas
              drawingMode='slope'
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
              editMode={
                activeMode !== 'concept' || !selectedConcept?.demoPoints
              }
              highlightSolution={
                activeMode === 'practice' && isCorrect === true
              }
              drawingTool={drawingTool}
              onDrawingToolChange={setDrawingTool}
              customPoints={customPoints}
              customLines={customLines}
              shapes={shapes}
              texts={texts}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              undoStack={undoStack}
              setUndoStack={setUndoStack}
              redoStack={redoStack}
              setRedoStack={setRedoStack}
              slopeConfig={{
                equation: lineData?.equation || '',
                xRange: [-10, 10], // Assuming default range
                yRange: [-10, 10], // Assuming default range
                stepSize: 0.1, // Assuming default step size
              }}
            />
          </div>

          {/* Animated Solution */}
          {showAnimation && lineData && (
            <div className='h-48 overflow-hidden border-t border-gray-700'>
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
        <div className='w-96 flex-shrink-0 overflow-y-auto border-l border-gray-700'>
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
                setDifficulty={changeDifficulty} // Pass changeDifficulty
                onSelectProblem={problemId => {
                  // Logic to select problem - might need to be added to context or here
                  console.log('Select problem:', problemId)
                }}
                onGenerateNewProblem={generateProblem}
                lineData={lineData}
                onSubmitAnswer={handleSubmitAnswer}
                isCorrect={isCorrect}
                showSolution={showSolution}
                onToggleSolution={handleSolutionReveal}
                onNextProblem={nextProblem}
                stats={stats}
                onHintRequest={handleHintRequest}
              />
            </>
          )}

          {/* Custom Problem Solver Mode */}
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
              difficulty={difficulty} // Pass difficulty to word problem generator
            />
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <BottomControls
        lineData={lineData}
        resetView={resetView}
        clearPoints={clearPoints}
        onShowAnimation={() => setShowAnimation(true)} // Pass setShowAnimation to trigger animation
      />
    </div>
  )
}

export default SlopeDrawingLayout
