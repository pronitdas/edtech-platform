import React, { useState } from 'react';
import { SlopeDrawing } from '../index';
import { InteractiveComponentTypes } from '../index';
import { InteractiveContent } from '@/types/database';

/**
 * Integration Test Component for SlopeDrawing with Cognitive Load Management
 * 
 * This component enables testing the integration between the SlopeDrawing tool
 * and the cognitive load management system.
 */
const IntegrationTest: React.FC = () => {
  const [testProgress, setTestProgress] = useState(0);
  
  // Sample interactive content for testing
  const sampleInteractiveContent: InteractiveContent = {
    type: InteractiveComponentTypes.SLOPE_DRAWER,
    problems: [
      {
        id: "test1",
        question: "Draw a line with slope 2 and y-intercept 3",
        difficulty: "easy",
        hints: ["Remember slope is rise over run", "Try plotting (0,3) first"],
        solution: "y = 2x + 3",
        data: { slope: 2, yIntercept: 3 }
      },
      {
        id: "test2",
        question: "Draw a line with slope -1 and y-intercept 5",
        difficulty: "medium",
        hints: ["Negative slope means the line goes down as x increases", "Try plotting (0,5) first"],
        solution: "y = -1x + 5",
        data: { slope: -1, yIntercept: 5 }
      },
      {
        id: "test3",
        question: "Draw a vertical line at x = 4",
        difficulty: "hard",
        hints: ["Vertical lines have undefined slope", "All points on the line have the same x-value"],
        solution: "Vertical line: x = 4"
      }
    ]
  };
  
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Integration Test: Slope Drawing + Cognitive Load</h1>
        <p className="text-gray-300">
          Test progress: {testProgress}%
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <SlopeDrawing
          interactiveContent={sampleInteractiveContent}
          userId="test-user"
          knowledgeId="test-knowledge"
          language="en"
          onUpdateProgress={setTestProgress}
        />
      </div>
    </div>
  );
};

export default IntegrationTest; 