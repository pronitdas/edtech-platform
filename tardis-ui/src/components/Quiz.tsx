'use client'

import React, { useState } from "react";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface QuizProps {
  questions: Question[];
}

const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number>(0);

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  // Calculate score and show results
  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        newScore++;
      }
    });
    setScore(newScore);
    setShowResults(true);
  };

  // Reset quiz
  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="bg-gray-800 text-white flex flex-col h-3/4 rounded-lg  overflow-y-auto p-6 shadow-lg max-w-xl mx-auto mt-6">
      <h2 className="text-2xl font-bold text-center mb-4">Interactive Quiz</h2>
      
      {questions.map((question, index) => (
        <div key={index} className="mb-6 flex-grow">
          <p className="font-semibold">{index + 1}. {question.question}</p>
          <div className="mt-2 space-y-2">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswerSelect(index, option)}
                className={`w-full p-2 rounded-md ${
                  selectedAnswers[index] === option
                    ? selectedAnswers[index] === question.answer
                      ? "bg-green-500" // Correct answer (after submission)
                      : "bg-red-500"   // Incorrect answer (after submission)
                    : "bg-gray-700 hover:bg-gray-600" // Default state
                }`}
                disabled={showResults}
              >
                {option}
              </button>
            ))}
          </div>
          {showResults && (
            <p className={`mt-2 ${selectedAnswers[index] === question.answer ? "text-green-400" : "text-red-400"}`}>
              {selectedAnswers[index] === question.answer ? "Correct!" : `Incorrect. The correct answer is: ${question.answer}`}
            </p>
          )}
        </div>
      ))}

      {/* Quiz Controls */}
      <div className="flex justify-between mt-6">
        {!showResults ? (
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Submit Quiz
          </button>
        ) : (
          <>
            <p className="text-lg font-semibold">Your Score: {score} / {questions.length}</p>
            <button
              onClick={handleReset}
              className="bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;
