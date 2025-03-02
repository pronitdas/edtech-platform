import { useState, useEffect } from 'react';
import MindMap from './MindMap';
import { interactionTracker } from '@/services/interaction-tracking';
import { Maximize, Minimize, ArrowLeft, X, HelpCircle } from 'lucide-react';

interface EnhancedMindMapProps {
  markdown: string;
  fullScreen?: boolean;
  onBack?: () => void;
}

const EnhancedMindMap = ({ 
  markdown, 
  fullScreen = false,
  onBack
}: EnhancedMindMapProps) => {
  const [isFullScreen, setIsFullScreen] = useState(fullScreen);
  const [showHelp, setShowHelp] = useState(false);
  
  // Track mindmap interaction
  useEffect(() => {
    interactionTracker.trackMindmapClick();
  }, []);

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setIsFullScreen(false);
    }
  };

  // Toggle help overlay
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-gray-900' : 'w-full h-full'}`}>
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 p-3 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isFullScreen && (
            <button
              onClick={handleBack}
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              aria-label="Back to course"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Course</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHelp}
            className="text-gray-300 hover:text-white transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleFullScreen}
            className="text-gray-300 hover:text-white transition-colors"
            aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Mindmap Content */}
      <div className="w-full h-full pt-12">
        <MindMap markdown={markdown} />
      </div>
      
      {/* Help Overlay */}
      {showHelp && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40"
        >
          <div className="bg-gray-800 p-6 rounded-lg max-w-md text-white shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Mindmap Help</h3>
              <button 
                onClick={toggleHelp}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300">
                The mindmap helps you visualize connections between concepts in the course material.
              </p>
              <div>
                <h4 className="font-medium mb-2">Tips:</h4>
                <ul className="list-disc pl-5 text-gray-300 space-y-1">
                  <li>Click and drag to move around the mindmap</li>
                  <li>Use the mouse wheel to zoom in and out</li>
                  <li>Click on nodes to expand or collapse branches</li>
                  <li>Double-click on a node to focus on it</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Keyboard Shortcuts:</h4>
                <ul className="list-disc pl-5 text-gray-300 space-y-1">
                  <li><span className="bg-gray-700 px-1 rounded">+</span> / <span className="bg-gray-700 px-1 rounded">-</span> to zoom in/out</li>
                  <li><span className="bg-gray-700 px-1 rounded">Space</span> + drag to pan</li>
                  <li><span className="bg-gray-700 px-1 rounded">Ctrl</span> + click to select multiple nodes</li>
                </ul>
              </div>
            </div>
            <button
              onClick={toggleHelp}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      
      {/* Welcome Overlay (shown when first entering fullscreen) */}
      {isFullScreen && (
        <div 
          id="mindmapMessageOverlay"
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-30 pointer-events-auto"
          onClick={(e) => e.currentTarget.remove()}
        >
          <div className="bg-gray-800 p-8 rounded-lg max-w-md text-white text-center shadow-xl border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4">Welcome to Mindmap View</h3>
            <p className="text-gray-300 mb-6">
              Explore connections between concepts and ideas in this interactive mindmap.
              Use the controls to navigate and zoom.
            </p>
            <p className="text-sm text-gray-400 mb-4">Click anywhere to dismiss this message</p>
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('mindmapMessageOverlay')?.remove();
                  toggleHelp();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 ease-in-out"
              >
                Show Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMindMap; 