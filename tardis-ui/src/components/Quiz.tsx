'use client'

import React, { useState, useEffect } from "react";

interface Question {
  question: string;
  options: string[];
  answer: string;
  points?: number; // Optional points per question
}

interface QuizProps {
  questions: Question[];
  negativeMarking?: number; // Fraction of points deducted for wrong answers (0.25 = 25%)
}

const Quiz: React.FC<QuizProps> = ({ 
  questions, 
  negativeMarking = 0.25 // Default to 25% negative marking
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [attempted, setAttempted] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0);

  // Calculate maximum possible score
  useEffect(() => {
    const total = questions.reduce((sum, question) => sum + (question.points || 1), 0);
    setMaxScore(total);
  }, [questions]);

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  // Calculate score and show results with negative marking
  const handleSubmit = () => {
    let newScore = 0;
    let correct = 0;
    let incorrect = 0;
    let attempted = 0;

    questions.forEach((question, index) => {
      const pointsForQuestion = question.points || 1;
      
      // If question was attempted
      if (selectedAnswers[index]) {
        attempted++;
        
        if (selectedAnswers[index] === question.answer) {
          // Correct answer
          newScore += pointsForQuestion;
          correct++;
        } else {
          // Incorrect answer - apply negative marking
          newScore -= pointsForQuestion * negativeMarking;
          incorrect++;
        }
      }
    });

    // Ensure score doesn't go below zero
    newScore = Math.max(0, newScore);
    
    setScore(newScore);
    setShowResults(true);
    setAttempted(attempted);
    setCorrectAnswers(correct);
    setIncorrectAnswers(incorrect);
  };

  // Reset quiz
  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setAttempted(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
  };

  // Calculate percentage score
  const percentageScore = Math.round((score / maxScore) * 100);

  return (
    <div className="bg-gray-800 text-white flex flex-col rounded-lg overflow-y-auto p-6 shadow-lg max-w-xl mx-auto mt-6">
      <h2 className="text-2xl font-bold text-center mb-4">Interactive Quiz</h2>
      
      {/* Progress indicator */}
      {!showResults && (
        <div className="mb-4">
          <p className="text-sm text-gray-300">
            {Object.keys(selectedAnswers).length} of {questions.length} questions answered
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Questions */}
      <div className="space-y-6 flex-grow">
        {questions.map((question, index) => (
          <div key={index} className="p-4 bg-gray-700 rounded-lg">
            <p className="font-semibold">
              {index + 1}. {question.question} 
              <span className="text-sm text-gray-300 ml-2">
                ({question.points || 1} point{(question.points || 1) !== 1 ? 's' : ''})
              </span>
            </p>
            <div className="mt-3 space-y-2">
              {question.options.map((option, i) => {
                let buttonClass = "w-full text-left p-2 rounded-md ";
                
                if (!showResults) {
                  // Not submitted yet
                  buttonClass += selectedAnswers[index] === option 
                    ? "bg-blue-600 border border-blue-400" 
                    : "bg-gray-600 hover:bg-gray-500";
                } else {
                  // After submission
                  if (option === question.answer) {
                    // Correct answer
                    buttonClass += "bg-green-600";
                  } else if (selectedAnswers[index] === option) {
                    // Selected wrong answer
                    buttonClass += "bg-red-600";
                  } else {
                    // Unselected options
                    buttonClass += "bg-gray-600";
                  }
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswerSelect(index, option)}
                    className={buttonClass}
                    disabled={showResults}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Results Summary */}
      {showResults && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Quiz Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-600 rounded-lg">
              <p className="text-lg font-bold text-blue-300">{percentageScore}%</p>
              <p className="text-sm">Score</p>
            </div>
            <div className="text-center p-3 bg-gray-600 rounded-lg">
              <p className="text-lg font-bold">{score.toFixed(1)} / {maxScore}</p>
              <p className="text-sm">Points</p>
            </div>
            <div className="text-center p-3 bg-gray-600 rounded-lg">
              <p className="text-lg font-bold text-green-400">{correctAnswers}</p>
              <p className="text-sm">Correct</p>
            </div>
            <div className="text-center p-3 bg-gray-600 rounded-lg">
              <p className="text-lg font-bold text-red-400">{incorrectAnswers}</p>
              <p className="text-sm">Incorrect</p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Controls */}
      <div className="flex justify-between mt-6">
        {!showResults ? (
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-150"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-150"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;