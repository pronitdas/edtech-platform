import { useState, useEffect } from 'react'
import MindMap from './MindMap'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import { Maximize, Minimize, ArrowLeft, X, HelpCircle } from 'lucide-react'

interface EnhancedMindMapProps {
  data: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onBack?: () => void
}

const EnhancedMindMap = ({
  data,
  isFullscreen = false,
  onToggleFullscreen,
  onBack,
}: EnhancedMindMapProps) => {
  const [isFullScreen, setIsFullScreen] = useState(isFullscreen)
  const [showHelp, setShowHelp] = useState(false)
  const { trackContentView } = useInteractionTracker()

  // Track mindmap interaction
  useEffect(() => {
    // interactionTracker.trackMindmapClick();
    trackContentView('mindmap', {
      contentId: 'mindmap',
      contentType: 'mindmap',
      knowledgeId: 'mindmap',
      moduleId: 'mindmap',
      type: 'mindmap_view',
    })
  }, [trackContentView])

  // Update state when prop changes
  useEffect(() => {
    setIsFullScreen(isFullscreen)
  }, [isFullscreen])

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen()
    } else {
      setIsFullScreen(!isFullScreen)
    }
  }

  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      setIsFullScreen(false)
    }
  }

  // Toggle help overlay
  const toggleHelp = () => {
    setShowHelp(!showHelp)
  }

  return (
    <div
      className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-gray-900' : 'h-full w-full'}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Header Bar */}
      <div className='absolute left-0 right-0 top-0 z-50 flex items-center justify-between bg-gray-800 p-3'>
        <div className='flex items-center gap-3'>
          {isFullScreen && (
            <button
              onClick={handleBack}
              className='flex items-center gap-1 text-gray-300 transition-colors hover:text-white'
              aria-label='Back to course'
            >
              <ArrowLeft className='h-5 w-5' />
              <span className='text-sm font-medium'>Back to Course</span>
            </button>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={toggleHelp}
            className='text-gray-300 transition-colors hover:text-white'
            aria-label='Help'
          >
            <HelpCircle className='h-5 w-5' />
          </button>

          <button
            onClick={toggleFullScreen}
            className='text-gray-300 transition-colors hover:text-white'
            aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullScreen ? (
              <Minimize className='h-5 w-5' />
            ) : (
              <Maximize className='h-5 w-5' />
            )}
          </button>
        </div>
      </div>

      {/* Mindmap Content - Ensure explicit sizing for React Flow */}
      <div
        className='h-full w-full pt-12'
        style={{ width: '100%', height: 'calc(100% - 48px)' }}
      >
        <MindMap markdown={data} />
      </div>

      {/* Help Overlay */}
      {showHelp && (
        <div className='absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75'>
          <div className='max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6 text-white shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-xl font-semibold'>Mindmap Help</h3>
              <button
                onClick={toggleHelp}
                className='text-gray-400 transition-colors hover:text-white'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <div className='space-y-4'>
              <p className='text-gray-300'>
                The mindmap helps you visualize connections between concepts in
                the course material.
              </p>
              <div>
                <h4 className='mb-2 font-medium'>Tips:</h4>
                <ul className='list-disc space-y-1 pl-5 text-gray-300'>
                  <li>Click and drag to move around the mindmap</li>
                  <li>Use the mouse wheel to zoom in and out</li>
                  <li>Click on nodes to expand or collapse branches</li>
                  <li>Double-click on a node to focus on it</li>
                </ul>
              </div>
              <div>
                <h4 className='mb-2 font-medium'>Keyboard Shortcuts:</h4>
                <ul className='list-disc space-y-1 pl-5 text-gray-300'>
                  <li>
                    <span className='rounded bg-gray-700 px-1'>+</span> /{' '}
                    <span className='rounded bg-gray-700 px-1'>-</span> to zoom
                    in/out
                  </li>
                  <li>
                    <span className='rounded bg-gray-700 px-1'>Space</span> +
                    drag to pan
                  </li>
                  <li>
                    <span className='rounded bg-gray-700 px-1'>Ctrl</span> +
                    click to select multiple nodes
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={toggleHelp}
              className='mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition duration-200 ease-in-out hover:bg-indigo-700'
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Welcome Overlay (shown when first entering fullscreen) */}
      {isFullScreen && (
        <div
          id='mindmapMessageOverlay'
          className='pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-75'
          onClick={e => e.currentTarget.remove()}
        >
          <div className='max-w-md rounded-lg border border-gray-700 bg-gray-800 p-8 text-center text-white shadow-xl'>
            <h3 className='mb-4 text-2xl font-semibold'>
              Welcome to Mindmap View
            </h3>
            <p className='mb-6 text-gray-300'>
              Explore connections between concepts and ideas in this interactive
              mindmap. Use the controls to navigate and zoom.
            </p>
            <p className='mb-4 text-sm text-gray-400'>
              Click anywhere to dismiss this message
            </p>
            <div className='flex justify-center'>
              <button
                onClick={e => {
                  e.stopPropagation()
                  document.getElementById('mindmapMessageOverlay')?.remove()
                  toggleHelp()
                }}
                className='rounded-md bg-indigo-600 px-6 py-2 font-medium text-white transition duration-200 ease-in-out hover:bg-indigo-700'
              >
                Show Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedMindMap
