'use client';

import React, { useState, useRef, useEffect } from 'react';
// Import from vite instead of next since this is a Vite project
// import dynamic from 'next/dynamic';
import { InteractiveContent } from '@/types/database';

// Temporarily comment out dynamic imports until components are created
// const GraphCanvas = dynamic(
//   () => import('./components/GraphCanvas'),
//   { ssr: false }
// );

// Temporarily comment out component imports until they are created
// import ConceptExplanation from './components/ConceptExplanation';
// import PracticeProblem from './components/PracticeProblem';
// import CustomProblemSolver from './components/CustomProblemSolver';
// import StatsDisplay from './components/StatsDisplay';
// import WordProblem from './components/WordProblem';
// import AnimatedSolution from './components/AnimatedSolution';

// Temporarily comment out hook imports until they are created
// import { useGraphManagement } from './hooks/useGraphManagement';
// import { useProblemGeneration } from './hooks/useProblemGeneration';

// Define state types
type ToolMode = 'concept' | 'practice' | 'custom' | 'word';

interface SlopeDrawingProps {
  interactiveContent: InteractiveContent;
  userId?: string;
  knowledgeId?: string;
  language?: string;
  onUpdateProgress?: (progress: number) => void;
}

const SlopeDrawing: React.FC<SlopeDrawingProps> = ({
  interactiveContent,
  userId = 'anonymous',
  knowledgeId = '',
  language = 'en',
  onUpdateProgress,
}) => {
  // Component state
  const [activeMode, setActiveMode] = useState<ToolMode>('concept');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    attempted: 0,
    streakCount: 0,
  });

  // Reference to the container div (for sizing calculations)
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Temporarily replace hook implementations with mock data
  const points = [];
  const setPoints = (newPoints: any) => console.log('setPoints', newPoints);
  const canvasWidth = 800;
  const canvasHeight = 600;
  const zoom = 1;
  const setZoom = (newZoom: number) => console.log('setZoom', newZoom);
  const offset = { x: 0, y: 0 };
  const setOffset = (newOffset: { x: number, y: number }) => console.log('setOffset', newOffset);
  const mapPointToCanvas = (point: { x: number, y: number }) => ({ x: point.x, y: point.y });
  const mapCanvasToPoint = (point: { x: number, y: number }) => ({ x: point.x, y: point.y });
  const resetView = () => console.log('resetView');

  // Mock problem generation data
  const currentProblem = null;
  const generateProblem = (diff: string) => console.log('generateProblem', diff);
  const checkSolution = (pts: any, id: string) => console.log('checkSolution', pts, id);
  const difficulty = 'medium';
  const setDifficulty = (diff: string) => console.log('setDifficulty', diff);

  // Effect to generate initial problem
  useEffect(() => {
    if (activeMode === 'practice' && !currentProblem) {
      generateProblem(difficulty);
    }
  }, [activeMode, currentProblem, generateProblem, difficulty]);

  // Effect to select first concept when switching to concept mode
  useEffect(() => {
    if (activeMode === 'concept' && interactiveContent.conceptExplanations?.length && !selectedConceptId) {
      setSelectedConceptId(interactiveContent.conceptExplanations[0].id);
    }
  }, [activeMode, interactiveContent.conceptExplanations, selectedConceptId]);

  // Handle tool mode changes
  const handleModeChange = (mode: ToolMode) => {
    setActiveMode(mode);
    resetView(); // Reset the graph view when changing modes
  };

  // Get the selected concept data
  const selectedConcept = interactiveContent.conceptExplanations?.find(
    concept => concept.id === selectedConceptId
  );

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden"
    >
      {/* Tool Header & Mode Selector */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Slope Drawing Tool</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleModeChange('concept')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'concept' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Concept
          </button>
          <button
            onClick={() => handleModeChange('practice')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'practice' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => handleModeChange('word')}
            className={`px-4 py-2 rounded-md ${
              activeMode === 'word' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            Word Problems
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph Canvas - Always visible */}
        <div className="w-3/5 h-full border-r border-gray-700 flex items-center justify-center bg-gray-850">
          {/* Placeholder for the GraphCanvas component */}
          <div className="text-center p-4">
            <p className="text-gray-400 mb-4">Graph Canvas will be implemented here</p>
            <div className="w-full h-64 bg-gray-800 rounded-md border border-gray-700 flex items-center justify-center">
              <span className="text-gray-500">Canvas Placeholder</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Changes based on mode */}
        <div className="w-2/5 h-full overflow-y-auto p-4">
          {activeMode === 'concept' && selectedConcept && (
            // Placeholder for the ConceptExplanation component
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-lg font-medium text-white mb-2">
                {selectedConcept.title}
              </h3>
              <div className="prose prose-invert">
                <p className="text-gray-300">{selectedConcept.content}</p>
              </div>
            </div>
          )}

          {activeMode === 'practice' && (
            // Placeholder for the PracticeProblem component
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-lg font-medium text-white mb-2">Practice Problem</h3>
              <p className="text-gray-300 mb-4">
                This is where practice problems will be displayed.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Generate New Problem
              </button>
            </div>
          )}

          {activeMode === 'custom' && (
            // Placeholder for the CustomProblemSolver component
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-lg font-medium text-white mb-2">Custom Problem Solver</h3>
              <p className="text-gray-300 mb-4">
                This is where you can input your own problems to solve.
              </p>
              <textarea
                className="w-full p-2 bg-gray-900 text-white border border-gray-700 rounded-md"
                rows={4}
                placeholder="Enter your problem here..."
              />
            </div>
          )}

          {activeMode === 'word' && (
            // Placeholder for the WordProblem component
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-lg font-medium text-white mb-2">Word Problems</h3>
              <p className="text-gray-300 mb-4">
                This is where word problems will be displayed.
              </p>
              <div className="p-3 bg-gray-900 rounded-md border border-gray-700">
                <p className="text-gray-300">
                  Example word problem about calculating slopes...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar - Shows stats and other metrics */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
        <div className="text-sm text-gray-300">
          {userId !== 'anonymous' ? `User: ${userId}` : 'Guest User'} | Knowledge: {knowledgeId || 'N/A'}
        </div>
        
        {/* Placeholder for the StatsDisplay component */}
        <div className="flex space-x-4 text-sm">
          <span className="text-green-400">Correct: {stats.correct}</span>
          <span className="text-red-400">Incorrect: {stats.incorrect}</span>
          <span className="text-blue-400">Streak: {stats.streakCount}</span>
        </div>
      </div>
    </div>
  );
};

export default SlopeDrawing; 