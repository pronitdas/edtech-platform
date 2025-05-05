import React from 'react';
import { DrawingTool } from '../types';

interface DrawingToolbarProps {
  drawingTool: DrawingTool;
  setDrawingTool: (tool: DrawingTool) => void;
}

/**
 * DrawingToolbar component provides drawing tool controls for the SlopeDrawing
 */
const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ drawingTool, setDrawingTool }) => {
  return (
    <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-2">
      <button title="Reset" 
        onClick={() => setDrawingTool('reset')} 
        className={`tool-btn ${drawingTool==='reset'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >⟲</button>
      
      <button title="Undo" 
        onClick={() => setDrawingTool('undo')} 
        className={`tool-btn ${drawingTool==='undo'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >↶</button>
      
      <button title="Redo" 
        onClick={() => setDrawingTool('redo')} 
        className={`tool-btn ${drawingTool==='redo'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >↷</button>
      
      <button title="Move" 
        onClick={() => setDrawingTool('move')} 
        className={`tool-btn ${drawingTool==='move'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >✥</button>
      
      <button title="Draw Solid Line" 
        onClick={() => setDrawingTool('solidLine')} 
        className={`tool-btn ${drawingTool==='solidLine'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >━</button>
      
      <button title="Draw Dotted Line" 
        onClick={() => setDrawingTool('dottedLine')} 
        className={`tool-btn ${drawingTool==='dottedLine'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >⋯</button>
      
      <button title="Add Point" 
        onClick={() => setDrawingTool('point')} 
        className={`tool-btn ${drawingTool==='point'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >●</button>
      
      <button title="Add Text" 
        onClick={() => setDrawingTool('text')} 
        className={`tool-btn ${drawingTool==='text'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >𝒯</button>
      
      <button title="Add Shape" 
        onClick={() => setDrawingTool('shape')} 
        className={`tool-btn ${drawingTool==='shape'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >⬒</button>
      
      <button title="Clear" 
        onClick={() => setDrawingTool('clear')} 
        className={`tool-btn ${drawingTool==='clear'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >🗑</button>
      
      <button title="Pan" 
        onClick={() => setDrawingTool('pan')} 
        className={`tool-btn ${drawingTool==='pan'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >✋</button>
      
      <button title="Zoom In" 
        onClick={() => setDrawingTool('zoomIn')} 
        className={`tool-btn ${drawingTool==='zoomIn'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >＋</button>
      
      <button title="Zoom Out" 
        onClick={() => setDrawingTool('zoomOut')} 
        className={`tool-btn ${drawingTool==='zoomOut'?'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}
      >－</button>
    </div>
  );
};

export default DrawingToolbar; 