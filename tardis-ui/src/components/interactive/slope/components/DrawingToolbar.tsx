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
  const tools = [
    { id: 'reset', label: 'Reset', icon: '⟲', category: 'action' },
    { id: 'undo', label: 'Undo', icon: '↶', category: 'action' },
    { id: 'redo', label: 'Redo', icon: '↷', category: 'action' },
    { id: 'move', label: 'Move', icon: '✥', category: 'edit' },
    { id: 'solidLine', label: 'Solid Line', icon: '━', category: 'draw' },
    { id: 'dottedLine', label: 'Dotted Line', icon: '⋯', category: 'draw' },
    { id: 'point', label: 'Add Point', icon: '●', category: 'draw' },
    { id: 'text', label: 'Add Text', icon: '𝒯', category: 'draw' },
    { id: 'shape', label: 'Add Shape', icon: '⬒', category: 'draw' },
    { id: 'clear', label: 'Clear', icon: '🗑', category: 'action' },
    { id: 'pan', label: 'Pan', icon: '✋', category: 'view' },
    { id: 'zoomIn', label: 'Zoom In', icon: '＋', category: 'view' },
    { id: 'zoomOut', label: 'Zoom Out', icon: '－', category: 'view' },
  ] as const

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'action':
        return 'from-red-500 to-pink-500'
      case 'draw':
        return 'from-purple-500 to-cyan-500'
      case 'edit':
        return 'from-blue-500 to-indigo-500'
      case 'view':
        return 'from-green-500 to-teal-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className='relative flex w-24 flex-col items-center space-y-3 py-6'>
      {/* Glowing background */}
      <div className='absolute inset-0 bg-gradient-to-b from-purple-500/10 to-cyan-500/10 blur-xl' />
      {tools.map((tool, index) => {
        const isActive = drawingTool === tool.id
        const colorClass = getCategoryColor(tool.category)

        return (
          <div key={tool.id} className='group relative'>
            <button
              title={tool.label}
              aria-label={tool.label}
              onClick={() => setDrawingTool(tool.id as DrawingTool)}
              className={`relative h-14 w-14 transform rounded-xl text-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 active:scale-95 ${
                isActive
                  ? `bg-gradient-to-br ${colorClass} text-white shadow-2xl shadow-purple-500/30`
                  : 'border border-white/20 bg-white/10 text-gray-300 backdrop-blur-sm hover:bg-white/20 hover:text-white'
              } `}
            >
              {/* Active glow effect */}
              {isActive && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colorClass} rounded-xl opacity-50 blur-lg transition-opacity duration-300 group-hover:opacity-75`}
                />
              )}

              {/* Icon */}
              <div className='relative z-10 flex h-full items-center justify-center'>
                <span className={`${isActive ? 'drop-shadow-lg' : ''}`}>
                  {tool.icon}
                </span>
              </div>

              {/* Hover shimmer effect */}
              <div className='absolute inset-0 overflow-hidden rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
                <div className='absolute inset-0 translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[-200%]' />
              </div>
            </button>

            {/* Tooltip */}
            <div className='pointer-events-none absolute left-20 top-1/2 z-20 -translate-y-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              <div className='whitespace-nowrap rounded-lg border border-white/20 bg-black/90 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-sm'>
                {tool.label}
                <div className='absolute left-0 top-1/2 h-2 w-2 -translate-x-1 -translate-y-1/2 rotate-45 transform border-b border-l border-white/20 bg-black/90' />
              </div>
            </div>

            {/* Keyboard shortcut indicator */}
            {index < 9 && (
              <div className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-xs font-bold text-white shadow-lg'>
                {index + 1}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DrawingToolbar
