import React, { useRef, useEffect, useState } from 'react'
import { useSlopeDrawing } from '../contexts/SlopeDrawingContext'
import GraphCanvas from '../../../../components/GraphCanvas'
import DrawingToolbar from './DrawingToolbar'
import TouchFeedback from './TouchFeedback'

// Add touch optimization styles
const touchOptimizedStyles = {
  WebkitUserSelect: 'none' as const,
  userSelect: 'none' as const,
  WebkitTouchCallout: 'none' as const,
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation' as const,
}

const SlopeDrawingLayout: React.FC = () => {
  const {
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

    // Drawing tools
    drawingTool,
    setDrawingTool,

    // Practice problem mode
    currentProblem,
    isCorrect,
    stats,

    // Canvas dimensions
    dimensions,
    setDimensions,
  } = useSlopeDrawing()

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle submission
  const handleSubmitAnswer = () => {
    if (lineData && currentProblem) {
      // Check if the slope matches the expected answer
      const expectedSlope = 2 // For the (2,3) to (6,11) problem
      const calculatedSlope = lineData.slope
      const isCorrectAnswer = calculatedSlope !== null && Math.abs(calculatedSlope - expectedSlope) < 0.1
      
      if (isCorrectAnswer) {
        alert('Correct! The slope is 2.')
      } else {
        alert(`Not quite. Your slope is ${calculatedSlope?.toFixed(2)}. The correct answer is 2.`)
      }
    }
  }

  // Update canvas dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (!containerRef.current) return

      const canvas = containerRef.current.querySelector('.canvas-container')
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        // Better mobile/tablet sizing
        const width = Math.max(rect.width, window.innerWidth < 768 ? 300 : 320)
        const height = Math.max(rect.height, window.innerWidth < 768 ? 400 : 240)
        
        setDimensions({
          width: width,
          height: height,
        })
      }
    }

    const timeoutId = setTimeout(() => {
      updateDimensions()
    }, 100)

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId)
      setTimeout(updateDimensions, 100)
    })
    
    // Also listen for orientation changes on mobile devices
    const handleOrientationChange = () => {
      setTimeout(updateDimensions, 200) // Delay for orientation change
    }
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      clearTimeout(timeoutId)
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [setDimensions])

  // Detect if we're on a touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // iPad-specific optimizations
  useEffect(() => {
    if (isTouchDevice) {
      // Prevent pull-to-refresh on mobile Safari
      document.body.style.overscrollBehavior = 'none'
      
      // Prevent zoom on inputs (iOS Safari)
      const meta = document.querySelector('meta[name="viewport"]')
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      } else {
        const newMeta = document.createElement('meta')
        newMeta.name = 'viewport'
        newMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        document.head.appendChild(newMeta)
      }
      
      // Add CSS for better touch performance
      const style = document.createElement('style')
      style.textContent = `
        * {
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* iPad specific improvements */
        @media (max-width: 1024px) and (orientation: landscape) {
          .canvas-container {
            height: calc(100vh - 120px) !important;
          }
        }
        
        @media (max-width: 768px) and (orientation: portrait) {
          .canvas-container {
            height: calc(100vh - 200px) !important;
          }
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.body.style.overscrollBehavior = 'auto'
        document.head.removeChild(style)
      }
    }
  }, [isTouchDevice])

  return (
    <div
      ref={containerRef}
      className='flex h-full w-full overflow-hidden bg-gray-900'
      style={touchOptimizedStyles}
      role='application'
      aria-label='Slope Drawing Tool - Interactive math learning tool'
    >
      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Drawing Toolbar - Responsive */}
        <div
          className='hidden md:block border-r border-gray-600 bg-gray-800 shadow-2xl'
          role='toolbar'
          aria-label='Drawing tools'
        >
          <DrawingToolbar
            drawingTool={drawingTool}
            setDrawingTool={(tool) => {
              // Handle special tools before setting
              if (tool === 'reset') {
                resetView()
                return
              }
              if (tool === 'zoomIn') {
                setZoom(zoom * 1.2)
                return
              }
              if (tool === 'zoomOut') {
                setZoom(zoom * 0.8)
                return
              }
              if (tool === 'clear') {
                clearPoints()
                return
              }
              setDrawingTool(tool)
            }}
          />
        </div>

        {/* Mobile Drawing Toolbar */}
        <div
          className='md:hidden absolute top-0 left-0 right-0 z-10 bg-gray-800 border-b border-gray-600 p-2'
          role='toolbar'
          aria-label='Drawing tools'
        >
          <div className='flex justify-center'>
            <div className='flex space-x-2 overflow-x-auto'>
              <DrawingToolbar
                drawingTool={drawingTool}
                setDrawingTool={(tool) => {
                  // Handle special tools before setting
                  if (tool === 'reset') {
                    resetView()
                    return
                  }
                  if (tool === 'zoomIn') {
                    setZoom(zoom * 1.2)
                    return
                  }
                  if (tool === 'zoomOut') {
                    setZoom(zoom * 0.8)
                    return
                  }
                  if (tool === 'clear') {
                    clearPoints()
                    return
                  }
                  setDrawingTool(tool)
                }}
              />
            </div>
          </div>
        </div>

        {/* Graph Canvas */}
        <div className='flex-1 p-2 md:p-4 pt-16 md:pt-4 pb-32 lg:pb-4'>
          <div
            className={`canvas-container relative h-full w-full rounded-lg border border-gray-600 bg-white ${
              isTouchDevice ? 'touch-none' : ''
            }`}
            style={{
              ...touchOptimizedStyles,
              // Prevent zoom on double tap for iOS Safari
              WebkitUserZoom: 'disabled',
              msContentZooming: 'none',
            }}
            role='img'
            aria-label={`Interactive graph canvas. Current zoom: ${(zoom * 100).toFixed(0)}%. ${points.length} points placed.`}
          >
            <TouchFeedback
              className="h-full w-full"
              onTouch={(point) => {
                // Handle touch interactions for drawing
                if (drawingTool === 'point') {
                  const worldPoint = mapCanvasToPoint(point)
                  setPoints([...points, worldPoint])
                }
              }}
              onTouchMove={(point) => {
                // Handle drag operations for move tool
                if (drawingTool === 'move') {
                  // Pan functionality is handled by the canvas itself
                }
              }}
            >
              {dimensions.width === 0 || dimensions.height === 0 ? (
                <div className='flex items-center justify-center h-full text-gray-600'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                    <p>Loading graph...</p>
                  </div>
                </div>
              ) : (
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
                  editMode={true}
                  highlightSolution={false}
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
                    xRange: [-2, 12],
                    yRange: [-2, 15],
                    stepSize: 1,
                    // Touch-friendly configurations
                    touchSensitivity: isTouchDevice ? 30 : 20,
                    minZoom: 0.5,
                    maxZoom: 3,
                    gridSize: isTouchDevice ? 40 : 30, // Larger grid for touch
                  }}
                  // Enhanced interaction handlers
                  onElementClick={(type, index, data) => {
                    console.log('Element clicked:', type, index, data)
                    // Handle element selection and interaction
                    if (type === 'point') {
                      setSelectedItem(`point-${index}`)
                    }
                  }}
                  // Pass touch device info
                  isTouchDevice={isTouchDevice}
                />
              )}
            </TouchFeedback>
          </div>
        </div>

        {/* Side Panel - Responsive */}
        <div className='hidden lg:block w-80 border-l border-gray-600 bg-gray-800 p-4'>
          <div className='space-y-4'>
            {/* Current Solution */}
            {lineData && (
              <div>
                <h3 className='text-white font-semibold mb-2'>Your Solution</h3>
                <div className='bg-gray-700 p-3 rounded'>
                  <div className='text-green-400 font-mono text-lg'>
                    Slope = {lineData.slope?.toFixed(2)}
                  </div>
                  <div className='text-gray-300 text-sm mt-1'>
                    Rise: {lineData.rise?.toFixed(1)}, Run: {lineData.run?.toFixed(1)}
                  </div>
                  <div className='text-gray-300 text-sm'>
                    Formula: ({lineData.point2?.y} - {lineData.point1?.y}) / ({lineData.point2?.x} - {lineData.point1?.x})
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div>
              <h3 className='text-white font-semibold mb-2'>Instructions</h3>
              <div className='bg-gray-700 p-3 rounded text-sm text-gray-300'>
                <ol className='space-y-1'>
                  <li>1. Select Point tool (left toolbar)</li>
                  <li>2. Click to place point at (2, 3)</li>
                  <li>3. Click to place point at (6, 11)</li>
                  <li>4. Select Line tool to connect points</li>
                  <li>5. Check your slope calculation</li>
                </ol>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className='text-white font-semibold mb-2'>Quick Actions</h3>
              <div className='space-y-3'>
                <button
                  onClick={() => {
                    setPointsFromCoordinates([{x: 2, y: 3}, {x: 6, y: 11}])
                    setDrawingTool('line')
                  }}
                  className='w-full bg-purple-600 text-white py-3 px-4 rounded hover:bg-purple-700 active:bg-purple-800 text-sm touch-manipulation'
                >
                  📍 Place Both Points
                </button>
                
                <button
                  onClick={handleSubmitAnswer}
                  className='w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-500 touch-manipulation'
                  disabled={!lineData}
                >
                  ✓ Check Answer
                </button>
                
                <div className='flex space-x-2'>
                  <button
                    onClick={resetView}
                    className='flex-1 bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-500 active:bg-gray-700 text-sm touch-manipulation'
                  >
                    🔄 Reset View
                  </button>
                  <button
                    onClick={clearPoints}
                    className='flex-1 bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-500 active:bg-gray-700 text-sm touch-manipulation'
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Answer Feedback */}
            {isCorrect !== null && (
              <div className={`p-3 rounded ${isCorrect ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                {isCorrect ? '✅ Correct! Well done.' : '❌ Try again. Check your points and calculation.'}
              </div>
            )}

            {/* Stats */}
            <div>
              <h3 className='text-white font-semibold mb-2'>Progress</h3>
              <div className='grid grid-cols-2 gap-2 text-center text-sm'>
                <div className='bg-gray-700 p-2 rounded'>
                  <div className='text-green-400 font-bold'>{stats.correct}</div>
                  <div className='text-gray-400'>Correct</div>
                </div>
                <div className='bg-gray-700 p-2 rounded'>
                  <div className='text-red-400 font-bold'>{stats.incorrect}</div>
                  <div className='text-gray-400'>Incorrect</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Panel */}
        <div className='lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 z-20'>
          {/* Tool Status Bar */}
          <div className='border-b border-gray-600 px-4 py-2 bg-gray-700'>
            <div className='text-center text-white text-sm'>
              Active Tool: <span className='font-semibold text-blue-400'>{drawingTool.charAt(0).toUpperCase() + drawingTool.slice(1)}</span>
              {points.length > 0 && (
                <span className='ml-4 text-gray-300'>
                  Points: {points.length}
                </span>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className='p-4'>
            <div className='flex space-x-2'>
              {lineData ? (
                <div className='flex-1 bg-gray-700 p-3 rounded text-center'>
                  <div className='text-green-400 font-mono text-lg font-bold'>
                    Slope = {lineData.slope?.toFixed(2)}
                  </div>
                  <div className='text-gray-300 text-xs'>
                    Rise: {lineData.rise?.toFixed(1)}, Run: {lineData.run?.toFixed(1)}
                  </div>
                </div>
              ) : (
                <div className='flex-1 bg-gray-700 p-3 rounded text-center'>
                  <div className='text-gray-400 text-sm'>
                    Place 2 points to calculate slope
                  </div>
                </div>
              )}
              
              <button
                onClick={handleSubmitAnswer}
                className='bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-500 touch-manipulation font-semibold'
                disabled={!lineData}
              >
                ✓ Check
              </button>
              
              <button
                onClick={clearPoints}
                className='bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-500 active:bg-gray-700 touch-manipulation'
              >
                🗑️
              </button>
            </div>
            
            {/* Safe area for home indicator on iPhone */}
            <div className='h-2'></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlopeDrawingLayout