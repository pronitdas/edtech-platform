'use client';

import React, { useState, useCallback } from 'react';
import { OpenAIClient } from '@/services/openAi';
import { ProblemData } from './PracticeProblem';

export interface CustomProblemSolverProps {
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
}

const CustomProblemSolver: React.FC<CustomProblemSolverProps> = ({
  lineData,
  onPointsChange,
  openaiClient,
  language = 'en',
}) => {
  // State for custom problem
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedProblem, setGeneratedProblem] = useState<ProblemData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Generate a problem from user input using AI
  const generateProblem = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a problem description first');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedProblem(null);
    setShowSolution(false);
    setFeedback(null);
    setHasSubmitted(false);
    
    try {
      if (!openaiClient) {
        // Create a simple problem if no AI client
        const newProblem: ProblemData = {
          id: `custom-${Date.now()}`,
          question: userPrompt,
          difficulty: 'medium',
          expectedSlope: null,
          expectedIntercept: null,
          hints: ['Try drawing a line that represents the scenario.'],
          solution: 'Draw a line that fits the description.',
        };
        setGeneratedProblem(newProblem);
      } else {
        // Use AI to generate a problem based on user's description
        const prompt = `Generate a slope/linear equation problem based on this description: "${userPrompt}"
        
        Return a JSON object with these fields:
        - question: Detailed problem statement
        - difficulty: 'easy', 'medium', or 'hard'
        - hints: An array of helpful hints
        - expectedSlope: The correct slope value or null if undefined
        - expectedIntercept: The correct y-intercept or null if undefined  
        - targetPoints: An array of exact points to plot (optional)
        - solution: Step-by-step solution`;
        
        const result = await openaiClient.chatCompletion([
          { role: "system", content: "You are a helpful math assistant specializing in slope problems." },
          { role: "user", content: prompt }
        ], "gpt-4o-mini", 800);
        
        // Parse the AI response
        try {
          const parsedResult = JSON.parse(result);
          const newProblem: ProblemData = {
            id: `custom-${Date.now()}`,
            question: parsedResult.question,
            difficulty: parsedResult.difficulty || 'medium',
            expectedSlope: parsedResult.expectedSlope,
            expectedIntercept: parsedResult.expectedIntercept,
            hints: parsedResult.hints || [],
            targetPoints: parsedResult.targetPoints || [],
            solution: parsedResult.solution,
          };
          setGeneratedProblem(newProblem);
          
          // Set points if provided
          if (parsedResult.targetPoints && parsedResult.targetPoints.length > 0) {
            onPointsChange(parsedResult.targetPoints);
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          setError('Failed to parse the generated problem. Please try again.');
        }
      }
    } catch (e) {
      console.error('Error generating problem:', e);
      setError('Failed to generate problem. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [userPrompt, openaiClient, onPointsChange]);
  
  // Check user's answer against the generated problem
  const checkAnswer = useCallback(async () => {
    if (!generatedProblem || !lineData) {
      return;
    }
    
    setHasSubmitted(true);
    
    try {
      if (!openaiClient) {
        // Simple validation if no AI client
        const isCorrect = generatedProblem.expectedSlope === lineData.slope;
        setFeedback(isCorrect ? 'Great job! Your answer looks correct.' : 'That doesn\'t seem right. Try again!');
      } else {
        // Use AI to validate the answer
        const prompt = `Problem: ${generatedProblem.question}
        
        User's solution:
        - Slope: ${lineData.slope !== null ? lineData.slope.toFixed(2) : 'undefined'}
        - Y-intercept: ${lineData.yIntercept !== null ? lineData.yIntercept.toFixed(2) : 'undefined'}
        - Equation: ${lineData.equation}
        - Points: (${lineData.point1.x.toFixed(1)}, ${lineData.point1.y.toFixed(1)}) and (${lineData.point2.x.toFixed(1)}, ${lineData.point2.y.toFixed(1)})
        
        Expected values:
        - Expected slope: ${generatedProblem.expectedSlope !== null ? generatedProblem.expectedSlope : 'undefined'}
        - Expected y-intercept: ${generatedProblem.expectedIntercept !== null ? generatedProblem.expectedIntercept : 'undefined'}
        
        Is the user's solution correct? If not, what's wrong with it? Provide specific, helpful feedback.`;
        
        const result = await openaiClient.chatCompletion([
          { role: "system", content: "You are a helpful math tutor providing feedback on slope problems." },
          { role: "user", content: prompt }
        ], "gpt-4o-mini", 300);
        
        setFeedback(result);
      }
    } catch (e) {
      console.error('Error checking answer:', e);
      setFeedback('Error evaluating your answer. Please try again.');
    }
  }, [generatedProblem, lineData, openaiClient]);
  
  // Toggle solution visibility
  const toggleSolution = useCallback(() => {
    setShowSolution(prev => !prev);
  }, []);
  
  return (
    <div className="bg-gray-800 p-4 rounded-md flex flex-col h-full">
      <h3 className="text-lg font-medium text-white mb-4">Custom Problem Solver</h3>
      
      {/* Problem input section */}
      <div className="mb-4">
        <label htmlFor="problem-input" className="block text-sm font-medium text-gray-300 mb-2">
          Describe your problem:
        </label>
        <textarea
          id="problem-input"
          className="w-full bg-gray-900 text-white p-3 rounded-md border border-gray-700 min-h-[120px]"
          placeholder="Example: Find the slope of a line that passes through the points (3, 5) and (7, 9)"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
        />
        
        <button
          onClick={generateProblem}
          disabled={isGenerating || !userPrompt.trim()}
          className={`mt-2 px-4 py-2 rounded-md text-white ${
            isGenerating || !userPrompt.trim() 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Problem'}
        </button>
        
        {error && (
          <div className="mt-2 p-2 bg-red-900/50 text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Generated problem display */}
      {generatedProblem && (
        <div className="flex-grow flex flex-col">
          <div className="p-3 bg-gray-900 rounded-md mb-4">
            <h4 className="text-md font-medium text-white mb-2">Problem</h4>
            <p className="text-gray-300 whitespace-pre-line">{generatedProblem.question}</p>
            
            {generatedProblem.hints && generatedProblem.hints.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-purple-400 mb-1">Hint:</p>
                <p className="text-gray-400 text-sm">{generatedProblem.hints[0]}</p>
              </div>
            )}
          </div>
          
          {/* User's answer */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-white mb-2">Your Answer</h4>
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
              onClick={toggleSolution}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              {solution ? 'Hide Solution' : 'Show Solution'}
            </button>
          </div>
          
          {/* Feedback and solution */}
          {hasSubmitted && feedback && (
            <div className="p-3 bg-gray-900 rounded-md border-l-4 border-blue-500 mb-4">
              <h4 className="text-md font-medium text-white mb-1">Feedback</h4>
              <p className="text-gray-300 whitespace-pre-line">{feedback}</p>
            </div>
          )}
          
          {solution && generatedProblem.solution && (
            <div className="p-3 bg-gray-900 rounded-md border-l-4 border-green-500">
              <h4 className="text-md font-medium text-white mb-1">Solution</h4>
              <p className="text-gray-300 whitespace-pre-line">{generatedProblem.solution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomProblemSolver; 