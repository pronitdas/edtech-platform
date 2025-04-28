'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface AnimatedSolutionProps {
  points: Array<{ x: number; y: number }>;
  slope: number | null;
  equation: string;
  onPointsChange: (points: Array<{ x: number; y: number }>) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
  onSpeedChange?: (speed: 'slow' | 'normal' | 'fast') => void;
}

interface AnimationStep {
  points: Array<{ x: number; y: number }>;
  description: string;
  highlight?: 'rise' | 'run' | 'slope' | 'equation';
}

const AnimatedSolution: React.FC<AnimatedSolutionProps> = ({
  points,
  slope,
  equation,
  onPointsChange,
  onComplete,
  autoPlay = false,
  speed = 'normal',
  onSpeedChange
}) => {
  // Animation state
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);

  // Calculate animation speed in milliseconds
  const getAnimationSpeed = useCallback(() => {
    switch (speed) {
      case 'slow': return 3000;
      case 'fast': return 1000;
      default: return 2000;
    }
  }, [speed]);

  // Generate animation steps
  useEffect(() => {
    if (points.length !== 2) return;

    const p1 = points[0];
    const p2 = points[1];
    const rise = p2.y - p1.y;
    const run = p2.x - p1.x;

    const steps: AnimationStep[] = [
      {
        points: [p1],
        description: `Start with the first point (${p1.x}, ${p1.y}).`,
      },
      {
        points: points,
        description: `Add the second point (${p2.x}, ${p2.y}).`,
      },
      {
        points: points,
        description: `Calculate the rise (change in y): ${p2.y} - ${p1.y} = ${rise}`,
        highlight: 'rise'
      },
      {
        points: points,
        description: `Calculate the run (change in x): ${p2.x} - ${p1.x} = ${run}`,
        highlight: 'run'
      },
      {
        points: points,
        description: `Calculate the slope: rise/run = ${rise}/${run} = ${slope !== null ? slope.toFixed(2) : 'undefined'}`,
        highlight: 'slope'
      },
      {
        points: points,
        description: `The equation of the line is: ${equation}`,
        highlight: 'equation'
      }
    ];

    setAnimationSteps(steps);
  }, [points, slope, equation]);

  // Handle auto-play
  useEffect(() => {
    if (!isPlaying || currentStep >= animationSteps.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= animationSteps.length) {
          setIsPlaying(false);
          onComplete?.();
          return prev;
        }
        return nextStep;
      });
    }, getAnimationSpeed());

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, animationSteps.length, getAnimationSpeed, onComplete]);

  // Navigation handlers
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    if (step < animationSteps.length) {
      onPointsChange(animationSteps[step].points);
    }
  }, [animationSteps, onPointsChange]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    if (animationSteps.length > 0) {
      onPointsChange(animationSteps[0].points);
    }
  }, [animationSteps, onPointsChange]);

  if (animationSteps.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-md">
        <p className="text-gray-400 text-center">Place two points to see the solution steps.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-md flex flex-col">
      {/* Current step description */}
      <div className={`p-4 bg-gray-900 rounded-md mb-4 border-l-4 ${
        animationSteps[currentStep].highlight === 'rise' ? 'border-blue-500' :
        animationSteps[currentStep].highlight === 'run' ? 'border-green-500' :
        animationSteps[currentStep].highlight === 'slope' ? 'border-yellow-500' :
        animationSteps[currentStep].highlight === 'equation' ? 'border-purple-500' :
        'border-gray-700'
      }`}>
        <p className="text-gray-200">{animationSteps[currentStep].description}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / animationSteps.length) * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex space-x-2">
          <button
            onClick={reset}
            className="p-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
            title="Reset"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="p-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Step navigation */}
        <div className="flex-1 flex justify-center space-x-1">
          {animationSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-blue-500 w-4'
                  : index < currentStep
                  ? 'bg-blue-800'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Speed control */}
        <select
          value={speed}
          onChange={(e) => onSpeedChange?.(e.target.value as 'slow' | 'normal' | 'fast')}
          className="bg-gray-700 text-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>
    </div>
  );
};

export default AnimatedSolution; 