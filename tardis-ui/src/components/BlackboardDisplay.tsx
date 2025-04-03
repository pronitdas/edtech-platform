import React from 'react';

interface BlackboardDisplayProps {
  title?: string;
  // context?: string; // Decided to primarily show the question
  currentQuestion?: string;
  // Adding scenario context to provide background
  scenarioContext?: string; 
}

const BlackboardDisplay: React.FC<BlackboardDisplayProps> = ({ 
    title, 
    currentQuestion, 
    scenarioContext 
}) => {
  return (
    <div className="bg-black rounded-lg p-6 sm:p-8 min-h-[150px] sm:min-h-[200px] shadow-inner shadow-black/30 mb-6 border border-gray-700 relative">
      {/* TODO: Add chalk-like font (e.g., 'Permanent Marker') via global CSS or font utility */}
      <div className="font-sans text-gray-200 text-base sm:text-lg leading-relaxed whitespace-pre-line">
        {title && <h3 className="text-lg sm:text-xl font-semibold text-indigo-400 mb-3">{title}</h3>}
        
        {/* Show context initially or if no question yet */} 
        {scenarioContext && (!currentQuestion || currentQuestion === "Initial Summary Prompt") && (
            <p className="text-sm text-gray-400 mb-4 italic">{scenarioContext}</p>
        )}

        {currentQuestion && currentQuestion !== "Initial Summary Prompt" && (
          <>
            {/* Make label bold and add margin */} 
            <p className="font-semibold text-indigo-300 mb-2">Teacher Asks:</p>
            <p>{currentQuestion}</p>
          </>
        )}

        {/* Fallback if nothing to display */} 
        {!currentQuestion && !title && !scenarioContext && (
          <p className="italic text-gray-500">Blackboard is empty...</p>
        )}
      </div>
    </div>
  );
};

export default BlackboardDisplay;
