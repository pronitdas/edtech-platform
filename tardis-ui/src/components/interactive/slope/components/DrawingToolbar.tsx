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
      case 'action': return 'from-red-500 to-pink-500'
      case 'draw': return 'from-purple-500 to-cyan-500'
      case 'edit': return 'from-blue-500 to-indigo-500'
      case 'view': return 'from-green-500 to-teal-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className='flex w-24 flex-col items-center space-y-3 py-6 relative'>
      {/* Glowing background */}
      <div className='absolute inset-0 bg-gradient-to-b from-purple-500/10 to-cyan-500/10 blur-xl' />
      {tools.map((tool, index) => {
        const isActive = drawingTool === tool.id
        const colorClass = getCategoryColor(tool.category)
        
        return (
          <div key={tool.id} className='relative group'>
            <button
              title={tool.label}
              aria-label={tool.label}
              onClick={() => setDrawingTool(tool.id as DrawingTool)}
              className={`
                relative w-14 h-14 rounded-xl font-bold text-lg transition-all duration-300 ease-out
                transform hover:scale-110 hover:-translate-y-1 active:scale-95
                ${
                  isActive
                    ? `bg-gradient-to-br ${colorClass} text-white shadow-2xl shadow-purple-500/30`
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white backdrop-blur-sm border border-white/20'
                }
              `}
            >
              {/* Active glow effect */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
              )}
              
              {/* Icon */}
              <div className='relative z-10 flex items-center justify-center h-full'>
                <span className={`${isActive ? 'drop-shadow-lg' : ''}`}>
                  {tool.icon}
                </span>
              </div>
              
              {/* Hover shimmer effect */}
              <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000' />
              </div>
            </button>
            
            {/* Tooltip */}
            <div className='absolute left-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20'>
              <div className='bg-black/90 text-white text-sm px-3 py-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-xl whitespace-nowrap'>
                {tool.label}
                <div className='absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black/90 rotate-45 border-l border-b border-white/20' />
              </div>
            </div>
            
            {/* Keyboard shortcut indicator */}
            {index < 9 && (
              <div className='absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full text-white text-xs flex items-center justify-center font-bold shadow-lg'>
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
