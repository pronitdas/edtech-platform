import React, { useRef, useEffect, useState } from 'react'
import { useSlopeDrawing } from '../contexts/SlopeDrawingContext'
import { useAccessibility } from '../hooks/useAccessibility'
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
import AITutor from './AITutor'
import GameificationPanel from './GameificationPanel'
import { ChevronLeft, ChevronRight, Settings, Volume2 } from 'lucide-react'

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

  // Right panel state
  const [rightPanelTab, setRightPanelTab] = useState<
    'content' | 'ai' | 'gamification' | 'accessibility'
  >('content')
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  // Accessibility features
  const {
    isMobile,
    hasHapticFeedback,
    prefersReducedMotion,
    highContrast,
    screenReaderActive,
    fontSize,
    announceToScreenReader,
    triggerHapticFeedback,
    focusElement,
    setFontSize,
    toggleHighContrast,
  } = useAccessibility()

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
        announceToScreenReader('Incorrect answer. Try again or ask for a hint.')
        triggerHapticFeedback('medium')
      } else {
        announceToScreenReader('Correct! Well done.')
        triggerHapticFeedback('light')
      }
    }
  }

  // Handle hint usage for practice problems
  const handleHintRequest = () => {
    recordHesitation(30) // Assume using a hint indicates 30 seconds of hesitation
    announceToScreenReader(
      'Hint provided. Take your time to understand the concept.'
    )
  }

  // Handle solution reveal
  const handleSolutionReveal = () => {
    recordHesitation(60) // Assume revealing solution indicates 60 seconds of hesitation
    announceToScreenReader(
      'Solution revealed. Review the steps to understand the approach.'
    )
  }

  return (
    <div
      ref={containerRef}
      className='relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
    >
      {/* Futuristic Background Effects */}
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400/10 via-pink-400/5 to-cyan-400/5' />
      <div className='bg-grid-white/[0.02] pointer-events-none absolute inset-0' />

      {/* Animated Particles Background */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-48 -top-48 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 blur-3xl' />
        <div className='absolute -bottom-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 blur-3xl delay-700' />
        <div className='absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl delay-1000' />
      </div>

      {/* Tool mode selector */}
      <div className='relative z-10 border-b border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl'>
        <ModeSelector
          activeMode={activeMode}
          onModeChange={setActiveMode}
          cognitiveState={cognitiveState}
          onReset={resetTracking}
        />
      </div>

      {/* Main content area with sidebar */}
      <div className='relative z-10 flex flex-1 overflow-hidden'>
        {/* Sidebar - Drawing Tools */}
        <div className='border-r border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl'>
          <DrawingToolbar
            drawingTool={drawingTool}
            setDrawingTool={setDrawingTool}
          />
        </div>

        {/* Main Graph/Canvas Area */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Graph Canvas */}
          <div
            className='canvas-container relative m-2 flex-1 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 shadow-2xl backdrop-blur-sm'
            style={{ minHeight: '60vh' }}
          >
            {/* Canvas Glow Effect */}
            <div className='pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5' />
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
            <div className='m-2 h-48 overflow-hidden rounded-lg border-t border-white/20 bg-black/30 shadow-xl backdrop-blur-xl'>
              <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10' />
              <div className='relative z-10'>
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
            </div>
          )}
        </div>

        {/* Right Panel (enhanced with tabs) */}
        <div
          className={`${rightPanelCollapsed ? 'w-12' : 'w-96'} relative flex-shrink-0 border-l border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl transition-all duration-300`}
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className='absolute left-0 top-1/2 z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white transition-transform duration-200 hover:scale-110'
          >
            {rightPanelCollapsed ? (
              <ChevronLeft className='h-4 w-4' />
            ) : (
              <ChevronRight className='h-4 w-4' />
            )}
          </button>

          {!rightPanelCollapsed && (
            <>
              {/* Tab Navigation */}
              <div className='flex border-b border-white/20 bg-black/30'>
                {[
                  { id: 'content', label: 'Content', icon: '📚' },
                  { id: 'ai', label: 'AI Tutor', icon: '🤖' },
                  { id: 'gamification', label: 'Progress', icon: '🏆' },
                  { id: 'accessibility', label: 'Access', icon: '♿' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRightPanelTab(tab.id as any)}
                    className={`flex-1 px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      rightPanelTab === tab.id
                        ? 'border-b-2 border-cyan-400 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-white'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className='flex items-center justify-center space-x-1'>
                      <span>{tab.icon}</span>
                      <span className='hidden lg:inline'>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className='h-full overflow-y-auto pb-16'>
                {/* Content Tab */}
                {rightPanelTab === 'content' && (
                  <div className='p-4'>
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
                      <PracticeProblem
                        problems={problems}
                        currentProblemId={currentProblemId}
                        difficulty={difficulty}
                        setDifficulty={changeDifficulty}
                        onSelectProblem={problemId => {
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
                        difficulty={difficulty}
                      />
                    )}
                  </div>
                )}

                {/* AI Tutor Tab */}
                {rightPanelTab === 'ai' && (
                  <div className='p-4'>
                    <AITutor
                      cognitiveState={cognitiveState}
                      currentProblem={currentProblem}
                      userProgress={{
                        correct: stats.correct,
                        incorrect: stats.incorrect,
                        difficulty: difficulty,
                        streakCount: stats.streakCount,
                      }}
                      onHint={hint => {
                        console.log('AI Hint:', hint)
                        // Show hint in UI
                      }}
                      onDifficultyAdjust={changeDifficulty}
                      onGenerateExplanation={concept => {
                        console.log('Generate explanation for:', concept)
                        // Generate and show explanation
                      }}
                    />
                  </div>
                )}

                {/* Gamification Tab */}
                {rightPanelTab === 'gamification' && (
                  <div className='p-4'>
                    <GameificationPanel
                      userProgress={{
                        correct: stats.correct,
                        incorrect: stats.incorrect,
                        difficulty: difficulty,
                        streakCount: stats.streakCount,
                      }}
                      cognitiveState={cognitiveState}
                      onAchievementUnlocked={achievement => {
                        console.log('Achievement unlocked:', achievement)
                        announceToScreenReader(
                          `Achievement unlocked: ${achievement.title}. ${achievement.description}`
                        )
                        triggerHapticFeedback('heavy')
                      }}
                    />
                  </div>
                )}

                {/* Accessibility Tab */}
                {rightPanelTab === 'accessibility' && (
                  <div className='space-y-6 p-4'>
                    <div className='flex items-center space-x-2 text-cyan-400'>
                      <span className='text-lg'>♿</span>
                      <h3 className='font-bold'>Accessibility Settings</h3>
                    </div>

                    {/* Device Info */}
                    <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                      <h4 className='mb-2 font-medium text-white'>
                        Device Features
                      </h4>
                      <div className='space-y-1 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>Mobile Device:</span>
                          <span
                            className={
                              isMobile ? 'text-green-400' : 'text-gray-500'
                            }
                          >
                            {isMobile ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>
                            Haptic Feedback:
                          </span>
                          <span
                            className={
                              hasHapticFeedback
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }
                          >
                            {hasHapticFeedback ? 'Supported' : 'Not Supported'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>Screen Reader:</span>
                          <span
                            className={
                              screenReaderActive
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }
                          >
                            {screenReaderActive ? 'Active' : 'Not Detected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Font Size Control */}
                    <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                      <h4 className='mb-3 font-medium text-white'>Font Size</h4>
                      <div className='flex space-x-2'>
                        {(['small', 'medium', 'large'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              setFontSize(size)
                              triggerHapticFeedback('light')
                            }}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                              fontSize === size
                                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                            aria-label={`Set font size to ${size}`}
                          >
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* High Contrast Toggle */}
                    <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium text-white'>
                            High Contrast
                          </h4>
                          <p className='text-sm text-gray-300'>
                            Enhance visual contrast for better readability
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            toggleHighContrast()
                            triggerHapticFeedback('medium')
                          }}
                          className={`h-6 w-12 rounded-full transition-all duration-200 ${
                            highContrast
                              ? 'bg-gradient-to-r from-purple-500 to-cyan-500'
                              : 'bg-gray-600'
                          }`}
                          aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                              highContrast
                                ? 'translate-x-6 transform'
                                : 'translate-x-0.5 transform'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Motion Preferences */}
                    <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                      <h4 className='mb-2 font-medium text-white'>
                        Motion Preferences
                      </h4>
                      <div className='flex items-center space-x-2 text-sm'>
                        <span
                          className={`rounded px-2 py-1 ${
                            prefersReducedMotion
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {prefersReducedMotion
                            ? 'Reduced Motion'
                            : 'Normal Motion'}
                        </span>
                        <span className='text-gray-300'>
                          {prefersReducedMotion
                            ? 'Animations minimized'
                            : 'Full animations enabled'}
                        </span>
                      </div>
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                      <h4 className='mb-3 font-medium text-white'>
                        Keyboard Shortcuts
                      </h4>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>Tab</span>
                          <span className='text-cyan-400'>
                            Navigate elements
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>Enter/Space</span>
                          <span className='text-cyan-400'>Activate button</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>Escape</span>
                          <span className='text-cyan-400'>Close modal</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>P</span>
                          <span className='text-cyan-400'>Point tool</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>L</span>
                          <span className='text-cyan-400'>Line tool</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-300'>Ctrl+Z</span>
                          <span className='text-cyan-400'>Undo</span>
                        </div>
                      </div>
                    </div>

                    {/* Haptic Test */}
                    {hasHapticFeedback && (
                      <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                        <h4 className='mb-3 font-medium text-white'>
                          Haptic Feedback Test
                        </h4>
                        <div className='flex space-x-2'>
                          {(['light', 'medium', 'heavy'] as const).map(
                            intensity => (
                              <button
                                key={intensity}
                                onClick={() => {
                                  triggerHapticFeedback(intensity)
                                  announceToScreenReader(
                                    `${intensity} haptic feedback triggered`
                                  )
                                }}
                                className='rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-3 py-2 text-sm text-white transition-all duration-200 hover:from-purple-500/30 hover:to-cyan-500/30'
                                aria-label={`Test ${intensity} haptic feedback`}
                              >
                                {intensity.charAt(0).toUpperCase() +
                                  intensity.slice(1)}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Audio Announcements Test */}
                    <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                      <h4 className='mb-3 font-medium text-white'>
                        Screen Reader Test
                      </h4>
                      <button
                        onClick={() =>
                          announceToScreenReader(
                            'This is a test announcement for screen readers. All accessibility features are working properly.'
                          )
                        }
                        className='w-full rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 font-medium text-white transition-all duration-200 hover:from-purple-600 hover:to-cyan-600'
                        aria-label='Test screen reader announcement'
                      >
                        <Volume2 className='mr-2 inline h-4 w-4' />
                        Test Screen Reader
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className='relative z-10 border-t border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl'>
        <BottomControls
          lineData={lineData}
          resetView={resetView}
          clearPoints={clearPoints}
          onShowAnimation={() => setShowAnimation(true)} // Pass setShowAnimation to trigger animation
        />
      </div>
    </div>
  )
}

export default SlopeDrawingLayout
