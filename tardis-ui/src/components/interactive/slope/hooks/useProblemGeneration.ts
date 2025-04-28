'use client';

import { useState, useCallback, useEffect } from 'react';

export interface ProblemData {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  solution?: { slope: number; yIntercept: number } | string;
  targetPoints?: { x: number; y: number }[];
  startPoints?: { x: number; y: number }[];
  expectedSlope?: number | null;
  expectedIntercept?: number | null;
}

type ProblemDifficulty = 'easy' | 'medium' | 'hard';
type SolutionResult = 'correct' | 'incorrect';

interface ProblemGenerationConfig {
  initialDifficulty?: ProblemDifficulty;
  initialProblems?: ProblemData[];
  predefinedProblems?: ProblemData[];
  maxHistoryLength?: number;
}

export function useProblemGeneration({
  initialDifficulty = 'easy',
  initialProblems = [],
  predefinedProblems = [],
  maxHistoryLength = 10
}: ProblemGenerationConfig = {}) {
  // State
  const [problems, setProblems] = useState<ProblemData[]>(initialProblems.length > 0 ? initialProblems : predefinedProblems);
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>(initialDifficulty);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    attempted: 0,
    streakCount: 0,
    history: [] as SolutionResult[],
    difficultyStats: {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
    }
  });

  // Get current problem
  const currentProblem = problems.find(p => p.id === currentProblemId) || null;

  // Generate a random problem based on difficulty
  const generateProblem = useCallback(() => {
    // Generate random points based on difficulty
    const generatePoints = (diff: ProblemDifficulty) => {
      let range, offset;
      
      switch (diff) {
        case 'easy':
          range = 10;
          offset = 0;
          break;
        case 'medium':
          range = 15;
          offset = -5;
          break;
        case 'hard':
          range = 20;
          offset = -10;
          break;
      }
      
      // Generate distinct x values
      let x1 = Math.floor(Math.random() * range + offset);
      let x2 = x1;
      while (x2 === x1) {
        x2 = Math.floor(Math.random() * range + offset);
      }
      
      // Generate y values
      const y1 = Math.floor(Math.random() * range + offset);
      const y2 = Math.floor(Math.random() * range + offset);
      
      return { x1, y1, x2, y2 };
    };
    
    // Generate problem ID
    const problemId = `gen-${Date.now()}`;
    
    // Generate problem points
    const { x1, y1, x2, y2 } = generatePoints(difficulty);
    
    // Calculate expected slope
    const expectedSlope = x2 === x1 ? null : (y2 - y1) / (x2 - x1);
    
    // Calculate expected y-intercept
    const expectedIntercept = expectedSlope !== null ? y1 - expectedSlope * x1 : null;
    
    // Create problem data
    const newProblem: ProblemData = {
      id: problemId,
      difficulty,
      question: `Find the slope of the line passing through (${x1}, ${y1}) and (${x2}, ${y2}).`,
      hints: [
        "Remember, slope = (y₂ - y₁) / (x₂ - x₁)",
        `For this problem: (${y2} - ${y1}) / (${x2} - ${x1})`
      ],
      expectedSlope,
      expectedIntercept,
      startPoints: [],
      targetPoints: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
      solution: createSolutionText(x1, y1, x2, y2, expectedSlope)
    };
    
    // Add the new problem to the problems array
    setProblems(prev => [...prev, newProblem]);
    
    // Set it as the current problem
    setCurrentProblemId(problemId);
    
    // Reset states
    setIsCorrect(null);
    setShowSolution(false);
    
    return newProblem;
  }, [difficulty]);

  // Helper to create solution text
  const createSolutionText = (x1: number, y1: number, x2: number, y2: number, slope: number | null): string => {
    if (slope === null) {
      return `The slope is undefined because the x-coordinates are the same (${x1}), making this a vertical line.
      
For vertical lines, we write the equation as x = ${x1}.`;
    }
    
    const rise = y2 - y1;
    const run = x2 - x1;
    
    const slopeText = slope === Math.round(slope) 
      ? `${slope}`
      : `${rise}/${run} = ${slope.toFixed(2)}`;
    
    let equationText = '';
    if (slope === 0) {
      equationText = `y = ${y1}`;
    } else {
      const b = y1 - slope * x1;
      const bText = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
      equationText = `y = ${slopeText}x${bText}`;
    }
    
    return `Step 1: Identify the two points: (${x1}, ${y1}) and (${x2}, ${y2})
      
Step 2: Calculate the slope using the formula: slope = (y₂ - y₁) / (x₂ - x₁)
      
Step 3: Substitute the values:
slope = (${y2} - ${y1}) / (${x2} - ${x1})
slope = ${rise} / ${run}
slope = ${slopeText}

Step 4: The equation of the line is ${equationText}`;
  };

  // Check answer against expected solution
  const checkSolution = useCallback((lineData: { slope: number | null; point1: any; point2: any }) => {
    if (!currentProblem || !lineData) return;
    
    // If expected slope is null (vertical line), check if user's slope is also null/undefined
    if (currentProblem.expectedSlope === null) {
      const isAnswerCorrect = lineData.slope === null;
      setIsCorrect(isAnswerCorrect);
      
      // Update stats
      setStats(prev => {
        // Add to history, keeping only maxHistoryLength records
        const newHistory: SolutionResult[] = [...prev.history, isAnswerCorrect ? 'correct' : 'incorrect'];
        if (newHistory.length > maxHistoryLength) {
          newHistory.shift(); // Remove oldest entry
        }
        
        // Update difficulty stats
        const difficultyStats = { ...prev.difficultyStats };
        difficultyStats[currentProblem.difficulty].attempted += 1;
        if (isAnswerCorrect) {
          difficultyStats[currentProblem.difficulty].correct += 1;
        }
        
        const newStats = {
          attempted: prev.attempted + 1,
          correct: isAnswerCorrect ? prev.correct + 1 : prev.correct,
          incorrect: isAnswerCorrect ? prev.incorrect : prev.incorrect + 1,
          streakCount: isAnswerCorrect ? prev.streakCount + 1 : 0,
          history: newHistory,
          difficultyStats
        };
        return newStats;
      });
      
      return isAnswerCorrect;
    }
    
    // For regular slopes, check within a tolerance
    const tolerance = 0.01;
    const isAnswerCorrect = Math.abs((lineData.slope || 0) - (currentProblem.expectedSlope || 0)) < tolerance;
    setIsCorrect(isAnswerCorrect);
    
    // Update stats
    setStats(prev => {
      // Add to history, keeping only maxHistoryLength records
      const newHistory: SolutionResult[] = [...prev.history, isAnswerCorrect ? 'correct' : 'incorrect'];
      if (newHistory.length > maxHistoryLength) {
        newHistory.shift(); // Remove oldest entry
      }
      
      // Update difficulty stats
      const difficultyStats = { ...prev.difficultyStats };
      difficultyStats[currentProblem.difficulty].attempted += 1;
      if (isAnswerCorrect) {
        difficultyStats[currentProblem.difficulty].correct += 1;
      }
      
      const newStats = {
        attempted: prev.attempted + 1,
        correct: isAnswerCorrect ? prev.correct + 1 : prev.correct,
        incorrect: isAnswerCorrect ? prev.incorrect : prev.incorrect + 1,
        streakCount: isAnswerCorrect ? prev.streakCount + 1 : 0,
        history: newHistory,
        difficultyStats
      };
      return newStats;
    });
    
    return isAnswerCorrect;
  }, [currentProblem, maxHistoryLength]);

  // Toggle solution visibility
  const toggleSolution = useCallback(() => {
    setShowSolution(prev => !prev);
  }, []);

  // Generate a new problem and set it as current
  const nextProblem = useCallback(() => {
    generateProblem();
  }, [generateProblem]);

  // Reset stats to initial values
  const resetStats = useCallback(() => {
    setStats({
      correct: 0,
      incorrect: 0,
      attempted: 0,
      streakCount: 0,
      history: [],
      difficultyStats: {
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: 0, correct: 0 },
        hard: { attempted: 0, correct: 0 },
      }
    });
  }, []);

  // Change the difficulty and generate a new problem
  const changeDifficulty = useCallback((newDifficulty: ProblemDifficulty) => {
    setDifficulty(newDifficulty);
    // Generate a new problem if difficulty changes
    if (newDifficulty !== difficulty) {
      setTimeout(() => generateProblem(), 0);
    }
  }, [difficulty, generateProblem]);

  // Handle adaptive difficulty based on performance
  useEffect(() => {
    const adaptDifficulty = () => {
      // Only adapt if we have enough data (at least 5 problems)
      if (stats.attempted < 5) return;
      
      const successRate = stats.correct / stats.attempted;
      
      // Adjust difficulty based on success rate
      if (successRate > 0.8 && difficulty !== 'hard') {
        // If success rate is high, increase difficulty
        const newDifficulty = difficulty === 'easy' ? 'medium' : 'hard';
        setDifficulty(newDifficulty);
      } else if (successRate < 0.4 && difficulty !== 'easy') {
        // If success rate is low, decrease difficulty
        const newDifficulty = difficulty === 'hard' ? 'medium' : 'easy';
        setDifficulty(newDifficulty);
      }
    };
    
    // Check for difficulty adaptation after every 5 problems
    if (stats.attempted > 0 && stats.attempted % 5 === 0) {
      adaptDifficulty();
    }
  }, [stats.attempted, stats.correct, difficulty]);

  // Generate initial problem when component mounts if no problems exist
  useEffect(() => {
    if (problems.length === 0) {
      generateProblem();
    } else if (!currentProblemId && problems.length > 0) {
      setCurrentProblemId(problems[0].id);
    }
  }, [problems.length, currentProblemId, generateProblem]);

  return {
    problems,
    currentProblemId,
    currentProblem,
    difficulty,
    isCorrect,
    showSolution,
    stats,
    setCurrentProblemId,
    setDifficulty: changeDifficulty,
    generateProblem,
    checkSolution,
    toggleSolution,
    nextProblem,
    resetStats
  };
} 