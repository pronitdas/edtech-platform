import { Problem } from '@/types/interactive';
'use client';

import React, { useState } from 'react';
import { LineData } from '@/types/geometry';

// Define LineData interface to match what's returned from useGraphManagement


export interface PracticeProblemProps {
  problems: Problem[];
  currentProblemId: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onSelectProblem: (problemId: string) => void;
  onGenerateNewProblem: () => void;
  lineData?: import("@/types/geometry").LineData | null;
  onSubmitAnswer: () => void;
  isCorrect: boolean | null;
  showSolution: boolean;
  onToggleSolution: () => void;
  onNextProblem: () => void;
  stats: {
    correct: number;
    incorrect: number;
    attempted: number;
    streakCount: number;
    history?: Array<import("../types").SolutionResult>;
    difficultyStats?: {
      easy: { attempted: number; correct: number };
      medium: { attempted: number; correct: number };
      hard: { attempted: number; correct: number };
    };
  };
  onHintRequest?: () => void;
}

const PracticeProblem: React.FC<PracticeProblemProps> = ({
  problems,
  currentProblemId,
  difficulty,
  setDifficulty,
  onSelectProblem,
  onGenerateNewProblem,
  lineData,
  onSubmitAnswer,
  isCorrect,
  showSolution,
  onToggleSolution,
  onNextProblem,
  stats,
  onHintRequest,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState<number>(-1);

  // Get current problem
  const currentProblem = problems.find(p => p.id === currentProblemId) || null;

  // Filter problems by difficulty
  const filteredProblems = problems.filter(p => p.difficulty === difficulty);

  const handleSubmit = () => {
    onSubmitAnswer();
  };

  // Handle showing hints with cognitive load tracking
  const handleShowHint = () => {
    setShowHint(!showHint);
    // Call onHintRequest if it exists to track cognitive load
    if (!showHint && onHintRequest) {
      onHintRequest();
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md flex flex-col h-full">
      {/* Fixed top controls */}
      <div className="flex-shrink-0">
        {/* Difficulty selector */}
        <div className="mb-4">
          <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-300 mb-2">
            Difficulty:
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setDifficulty('easy')}
              className={`px-3 py-1 rounded-md text-sm ${difficulty === 'easy' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
            >
              Easy
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={`px-3 py-1 rounded-md text-sm ${difficulty === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
            >
              Medium
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`px-3 py-1 rounded-md text-sm ${difficulty === 'hard' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Problem selector */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="problem-select" className="block text-sm font-medium text-gray-300">
              Select a problem:
            </label>
            <button
              onClick={onGenerateNewProblem}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Generate New
            </button>
          </div>
          <select
            id="problem-select"
            className="w-full bg-gray-900 text-white p-2 rounded-md border border-gray-700"
            value={currentProblemId || ''}
            onChange={(e) => onSelectProblem(e.target.value)}
          >
            <option value="">--Select a problem--</option>
            {filteredProblems.map(problem => (
              <option key={problem.id} value={problem.id}>
                Problem #{problem.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Current problem display */}
        {currentProblem ? (
          <div className="flex flex-col">
            <div className="p-3 bg-gray-900 rounded-md mb-4">
              <h3 className="text-md font-medium text-white mb-2">Problem</h3>
              <p className="text-gray-300 whitespace-pre-line">{currentProblem.question}</p>
            </div>

            {/* Hints section */}
            <div className="mb-4">
              <button
                onClick={handleShowHint}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>

              {showHint && (
                <div className="mt-2 p-3 bg-gray-900 rounded-md border-l-4 border-purple-500">
                  <p className="text-gray-300">{currentProblem.hints[0]}</p>
                </div>
              )}
            </div>

            {/* User answer section */}
            <div className="mb-4">
              <h3 className="text-md font-medium text-white mb-2">Your Answer</h3>
              {lineData ? (
                <div className="p-3 bg-gray-900 rounded-md">
                  <p className="text-gray-300">
                    <span className="text-green-400">Points:</span> ({lineData.point1.x.toFixed(1)}, {lineData.point1.y.toFixed(1)}) and ({lineData.point2.x.toFixed(1)}, {lineData.point2.y.toFixed(1)})
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400">Slope:</span> {lineData.slope !== null ? lineData.slope.toFixed(2) : 'Undefined'}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-green-400">Equation:</span> {lineData.equation}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-900 rounded-md">
                  <p className="text-gray-400 italic">Place two points on the graph to define your answer.</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleSubmit}
                disabled={!lineData}
                className={`px-4 py-2 rounded-md text-white ${!lineData ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Submit Answer
              </button>

              <button
                onClick={onToggleSolution}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                {showSolution ? 'Hide Solution' : 'Show Solution'}
              </button>
            </div>

            {/* Feedback */}
            {isCorrect !== null && (
              <div className={`p-3 rounded-md mb-4 ${isCorrect ? 'bg-green-900 border-l-4 border-green-500' : 'bg-red-900 border-l-4 border-red-500'
                }`}>
                <p className="text-white font-medium">
                  {isCorrect ? 'Correct! Well done!' : 'Incorrect. Try again!'}
                </p>
              </div>
            )}

            {/* Solution */}
            {showSolution && (
              <div className="mt-2 p-3 bg-gray-900 rounded-md">
                <h5 className="text-md font-medium text-white mb-1">Solution:</h5>
                <div className="text-gray-300">
                  {typeof currentProblem.solution === 'string' ? (
                    <p>{currentProblem.solution}</p>
                  ) : currentProblem.solution ? (
                    <>
                      <p>Slope: {currentProblem.solution.slope}</p>
                      <p>Y-Intercept: {currentProblem.solution.yIntercept}</p>
                      <p>Equation: y = {currentProblem.solution.slope}x + {currentProblem.solution.yIntercept}</p>
                    </>
                  ) : (
                    <p>No solution available</p>
                  )}
                </div>
              </div>
            )}

            {/* Next problem button (only shown when current problem is solved correctly) */}
            {isCorrect && (
              <button
                onClick={onNextProblem}
                className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Next Problem
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-900 rounded-md p-8">
            <p className="text-gray-400 text-center">
              Select a problem or generate a new one to get started.
            </p>
          </div>
        )}
      </div>

      {/* Fixed stats display at bottom */}
      <div className="mt-4 p-3 bg-gray-900 rounded-md grid grid-cols-4 gap-2 text-center flex-shrink-0">
        <div>
          <p className="text-xs text-gray-400">Attempted</p>
          <p className="text-lg font-medium text-white">{stats.attempted}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Correct</p>
          <p className="text-lg font-medium text-green-400">{stats.correct}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Incorrect</p>
          <p className="text-lg font-medium text-red-400">{stats.incorrect}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Streak</p>
          <p className="text-lg font-medium text-yellow-400">{stats.streakCount}</p>
        </div>
      </div>
    </div>
  );
};

export default PracticeProblem; 