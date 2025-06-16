import React from 'react'

interface BlackboardDisplayProps {
  title?: string
  // context?: string; // Decided to primarily show the question
  currentQuestion?: string
  // Adding scenario context to provide background
  scenarioContext?: string
}

const BlackboardDisplay: React.FC<BlackboardDisplayProps> = ({
  title,
  currentQuestion,
  scenarioContext,
}) => {
  return (
    <div className='relative mb-6 min-h-[150px] rounded-lg border border-gray-700 bg-black p-6 shadow-inner shadow-black/30 sm:min-h-[200px] sm:p-8'>
      {/* TODO: Add chalk-like font (e.g., 'Permanent Marker') via global CSS or font utility */}
      <div className='whitespace-pre-line font-sans text-base leading-relaxed text-gray-200 sm:text-lg'>
        {title && (
          <h3 className='mb-3 text-lg font-semibold text-indigo-400 sm:text-xl'>
            {title}
          </h3>
        )}

        {/* Show context initially or if no question yet */}
        {scenarioContext &&
          (!currentQuestion ||
            currentQuestion === 'Initial Summary Prompt') && (
            <p className='mb-4 text-sm italic text-gray-400'>
              {scenarioContext}
            </p>
          )}

        {currentQuestion && currentQuestion !== 'Initial Summary Prompt' && (
          <>
            {/* Make label bold and add margin */}
            <p className='mb-2 font-semibold text-indigo-300'>Teacher Asks:</p>
            <p>{currentQuestion}</p>
          </>
        )}

        {/* Fallback if nothing to display */}
        {!currentQuestion && !title && !scenarioContext && (
          <p className='italic text-gray-500'>Blackboard is empty...</p>
        )}
      </div>
    </div>
  )
}

export default BlackboardDisplay
