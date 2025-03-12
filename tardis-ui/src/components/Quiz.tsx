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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

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

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Reset quiz
  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setAttempted(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setCurrentQuestionIndex(0);
  };

  // Calculate percentage score
  const percentageScore = Math.round((score / maxScore) * 100);

  return (
    <div className="bg-gray-800 text-white flex flex-col rounded-lg p-6 shadow-lg max-w-xl mx-auto mt-6 min-h-[600px]">
      <h2 className="text-2xl font-bold text-center mb-4">Interactive Quiz</h2>
      
      {!showResults ? (
        <>
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Object.keys(selectedAnswers).length} answered</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Question */}
          <div className="flex-grow flex flex-col">
            <div className="p-4 bg-gray-700 rounded-lg mb-4 flex-grow">
              <p className="font-semibold text-lg mb-4">
                {questions[currentQuestionIndex].question}
                <span className="text-sm text-gray-300 ml-2">
                  ({questions[currentQuestionIndex].points || 1} point{(questions[currentQuestionIndex].points || 1) !== 1 ? 's' : ''})
                </span>
              </p>
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option, i) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === option;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                      className={`w-full text-left p-3 rounded-md transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-600 border border-blue-400"
                          : "bg-gray-600 hover:bg-gray-500"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-auto">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        // Results view
        <div className="flex-grow flex flex-col">
          <div className="p-6 bg-gray-700 rounded-lg mb-6">
            <h3 className="text-2xl font-bold mb-4 text-center">Quiz Results</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-gray-600 rounded-lg">
                <p className="text-3xl font-bold text-blue-300 mb-1">{percentageScore}%</p>
                <p className="text-sm">Score</p>
              </div>
              <div className="text-center p-4 bg-gray-600 rounded-lg">
                <p className="text-3xl font-bold mb-1">{score.toFixed(1)}/{maxScore}</p>
                <p className="text-sm">Points</p>
              </div>
              <div className="text-center p-4 bg-gray-600 rounded-lg">
                <p className="text-3xl font-bold text-green-400 mb-1">{correctAnswers}</p>
                <p className="text-sm">Correct</p>
              </div>
              <div className="text-center p-4 bg-gray-600 rounded-lg">
                <p className="text-3xl font-bold text-red-400 mb-1">{incorrectAnswers}</p>
                <p className="text-sm">Incorrect</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-150 w-full"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;