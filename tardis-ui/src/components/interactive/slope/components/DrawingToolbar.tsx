import React from 'react'
import { DrawingTool } from '../types'

interface DrawingToolbarProps {
  drawingTool: DrawingTool
  setDrawingTool: (tool: DrawingTool) => void
}

/**
 * DrawingToolbar component provides drawing tool controls for the SlopeDrawing
 */
const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  drawingTool,
  setDrawingTool,
}) => {
  return (
    <div className='flex w-20 flex-col items-center space-y-2 border-r border-gray-800 bg-gray-900 py-4'>
      <button
        title='Reset'
        aria-label='Reset'
        onClick={() => setDrawingTool('reset')}
        className={`tool-btn ${drawingTool === 'reset' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ⟲
      </button>

      <button
        title='Undo'
        aria-label='Undo'
        onClick={() => setDrawingTool('undo')}
        className={`tool-btn ${drawingTool === 'undo' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ↶
      </button>

      <button
        title='Redo'
        aria-label='Redo'
        onClick={() => setDrawingTool('redo')}
        className={`tool-btn ${drawingTool === 'redo' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ↷
      </button>

      <button
        title='Move'
        aria-label='Move'
        onClick={() => setDrawingTool('move')}
        className={`tool-btn ${drawingTool === 'move' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ✥
      </button>

      <button
        title='Draw Solid Line'
        aria-label='Draw Solid Line'
        onClick={() => setDrawingTool('solidLine')}
        className={`tool-btn ${drawingTool === 'solidLine' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ━
      </button>

      <button
        title='Draw Dotted Line'
        aria-label='Draw Dotted Line'
        onClick={() => setDrawingTool('dottedLine')}
        className={`tool-btn ${drawingTool === 'dottedLine' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ⋯
      </button>

      <button
        title='Add Point'
        aria-label='Add Point'
        onClick={() => setDrawingTool('point')}
        className={`tool-btn ${drawingTool === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ●
      </button>

      <button
        title='Add Text'
        aria-label='Add Text'
        onClick={() => setDrawingTool('text')}
        className={`tool-btn ${drawingTool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        𝒯
      </button>

      <button
        title='Add Shape'
        aria-label='Add Shape'
        onClick={() => setDrawingTool('shape')}
        className={`tool-btn ${drawingTool === 'shape' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ⬒
      </button>

      <button
        title='Clear'
        aria-label='Clear'
        onClick={() => setDrawingTool('clear')}
        className={`tool-btn ${drawingTool === 'clear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        🗑
      </button>

      <button
        title='Pan'
        aria-label='Pan'
        onClick={() => setDrawingTool('pan')}
        className={`tool-btn ${drawingTool === 'pan' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ✋
      </button>

      <button
        title='Zoom In'
        aria-label='Zoom In'
        onClick={() => setDrawingTool('zoomIn')}
        className={`tool-btn ${drawingTool === 'zoomIn' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        ＋
      </button>

      <button
        title='Zoom Out'
        aria-label='Zoom Out'
        onClick={() => setDrawingTool('zoomOut')}
        className={`tool-btn ${drawingTool === 'zoomOut' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
      >
        －
      </button>
    </div>
  )
}

export default DrawingToolbar
