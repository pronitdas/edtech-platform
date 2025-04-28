'use client';

import React, { useState, useCallback } from 'react';
import { OpenAIClient } from '@/services/openAi';

export interface WordProblemProps {
  lineData?: {
    slope: number | null;
    yIntercept: number | null;
    equation: string;
    point1: { x: number; y: number };
    point2: { x: number; y: number };
    rise: number;
    run: number;
  } | null;
  onPointsChange: (points: Array<{ x: number; y: number }>) => void;
  openaiClient?: OpenAIClient;
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface WordProblemData {
  question: string;
  context: string;
  hints: string[];
  expectedSlope?: number | null;
  expectedIntercept?: number | null;
  solution?: string;
  explanation?: string;
}

const WordProblem: React.FC<WordProblemProps> = ({
  lineData,
  onPointsChange,
  openaiClient,
  language = 'en',
  difficulty = 'medium'
}) => {
  // State
  const [problem, setProblem] = useState<WordProblemData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [showSolution, setShowSolution] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Generate a new word problem
  const generateProblem = useCallback(async () => {
    if (!openaiClient) {
      setFeedback('AI client is required for word problems.');
      return;
    }

    setIsLoading(true);
    setHasSubmitted(false);
    setShowSolution(false);
    setFeedback('');

    try {
      const prompt = `Generate a real-world slope word problem at ${difficulty} difficulty level.
      The problem should involve finding a slope in a practical context.
      
      Return a JSON object with:
      - question: The word problem text
      - context: Real-world context/scenario explanation
      - hints: Array of helpful hints
      - expectedSlope: The correct slope value or null if undefined
      - expectedIntercept: The correct y-intercept or null if undefined
      - solution: Step-by-step solution
      - explanation: Real-world interpretation of the slope

      Language: ${language}`;

      const result = await openaiClient.chatCompletion([
        { role: "system", content: "You are a math teacher creating engaging slope problems." },
        { role: "user", content: prompt }
      ], "gpt-4o-mini", 800);

      try {
        const problemData = JSON.parse(result);
        setProblem(problemData);
      } catch (e) {
        console.error('Error parsing AI response:', e);
        setFeedback('Error generating problem. Please try again.');
      }
    } catch (e) {
      console.error('Error generating problem:', e);
      setFeedback('Error generating problem. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [openaiClient, language, difficulty]);

  // Check the user's answer
  const checkAnswer = useCallback(async () => {
    if (!problem || !lineData || !openaiClient) return;

    setHasSubmitted(true);
    
    try {
      const prompt = `Word Problem: ${problem.question}
      
      User's solution:
      - Slope: ${lineData.slope !== null ? lineData.slope.toFixed(2) : 'undefined'}
      - Y-intercept: ${lineData.yIntercept !== null ? lineData.yIntercept.toFixed(2) : 'undefined'}
      - Equation: ${lineData.equation}
      - Points: (${lineData.point1.x.toFixed(1)}, ${lineData.point1.y.toFixed(1)}) and (${lineData.point2.x.toFixed(1)}, ${lineData.point2.y.toFixed(1)})
      
      Expected values:
      - Expected slope: ${problem.expectedSlope !== null ? problem.expectedSlope : 'undefined'}
      - Expected y-intercept: ${problem.expectedIntercept !== null ? problem.expectedIntercept : 'undefined'}
      
      Evaluate if the solution is correct and provide specific feedback about:
      1. The mathematical accuracy
      2. The real-world interpretation
      3. Any suggestions for improvement`;

      const result = await openaiClient.chatCompletion([
        { role: "system", content: "You are a helpful math tutor providing feedback on slope word problems." },
        { role: "user", content: prompt }
      ], "gpt-4o-mini", 400);

      setFeedback(result);
    } catch (e) {
      console.error('Error checking answer:', e);
      setFeedback('Error evaluating your answer. Please try again.');
    }
  }, [problem, lineData, openaiClient]);

  return (
    <div className="bg-gray-800 p-4 rounded-md flex flex-col h-full">
      {/* Controls */}
      <div className="mb-4">
        <button
          onClick={generateProblem}
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-md text-white ${
            isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate New Problem'}
        </button>
      </div>

      {/* Problem Display */}
      {problem && (
        <div className="flex-grow flex flex-col">
          {/* Question */}
          <div className="p-4 bg-gray-900 rounded-md mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Problem</h3>
            <p className="text-gray-300 mb-4">{problem.context}</p>
            <p className="text-gray-200 font-medium">{problem.question}</p>
            
            {!hasSubmitted && problem.hints && problem.hints.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-purple-400 mb-1">Hint:</p>
                <p className="text-gray-400 text-sm">{problem.hints[0]}</p>
              </div>
            )}
          </div>

          {/* User's Answer */}
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

          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            <button
              onClick={checkAnswer}
              disabled={!lineData}
              className={`w-full px-4 py-2 rounded-md text-white ${
                !lineData ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Check Answer
            </button>
            
            <button
              onClick={() => setShowSolution(prev => !prev)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </button>
          </div>

          {/* Feedback */}
          {hasSubmitted && feedback && (
            <div className="p-4 bg-gray-900 rounded-md border-l-4 border-blue-500 mb-4">
              <h3 className="text-md font-medium text-white mb-2">Feedback</h3>
              <p className="text-gray-300 whitespace-pre-line">{feedback}</p>
            </div>
          )}

          {/* Solution */}
          {showSolution && problem.solution && (
            <div className="p-4 bg-gray-900 rounded-md border-l-4 border-green-500">
              <h3 className="text-md font-medium text-white mb-2">Solution</h3>
              <div className="text-gray-300 space-y-4">
                <p className="whitespace-pre-line">{problem.solution}</p>
                {problem.explanation && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-purple-400 font-medium mb-2">Real-world Interpretation:</p>
                    <p className="text-gray-300">{problem.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WordProblem; 