import React, { useState, useEffect, useCallback } from 'react';
import { Timer, CheckSquare, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import { useCognitiveLoad } from '@/hooks/useCognitiveLoad';
import { CognitiveLoadIndicator } from './CognitiveLoadIndicator';
import { FeedbackSystem } from './FeedbackSystem';

interface PracticeQuestion {
  id: string;
  type: 'multiple-choice' | 'free-response' | 'coding';
  question: string;
  answer: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface PracticeSessionProps {
  questions: PracticeQuestion[];
  initialTimeMinutes?: number;
  adaptiveDifficulty?: boolean;
  onComplete?: (results: {
    score: number;
    timeSpent: number;
    questionsAnswered: number;
    hintsUsed: number;
  }) => void;
  className?: string;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  questions,
  initialTimeMinutes = 15,
  adaptiveDifficulty = true,
  onComplete,
  className = '',
}) => {
  // Session state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialTimeMinutes * 60); // in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solutionsRevealed, setSolutionsRevealed] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    score: number;
    timeSpent: number;
    questionsAnswered: number;
    hintsUsed: number;
  } | null>(null);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Cognitive load tracking
  const { cognitiveState, recordError, recordHesitation, resetTracking } = useCognitiveLoad(60);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !sessionComplete) {
      completeSession();
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start session
  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    resetTracking();
  };
  
  // Pause session
  const pauseSession = () => {
    setIsPaused(true);
  };
  
  // Resume session
  const resumeSession = () => {
    setIsPaused(false);
  };
  
  // Reset session
  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(initialTimeMinutes * 60);
    setCurrentQuestionIndex(0);
    setScore(0);
    setHintsUsed(0);
    setSolutionsRevealed(0);
    setSessionComplete(false);
    setSessionResults(null);
    resetTracking();
  };
  
  // Handle question completion and move to next
  const handleQuestionComplete = (isCorrect: boolean) => {
    // Update score
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      recordError();
    }
    
    // Move to next question if available
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 1000);
    } else {
      completeSession();
    }
  };
  
  // Handle hint usage
  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1);
    recordHesitation(30); // Assume using a hint indicates 30 seconds of hesitation
  };
  
  // Handle solution reveal
  const handleSolutionRevealed = () => {
    setSolutionsRevealed(prev => prev + 1);
    recordHesitation(60); // Assume revealing solution indicates 60 seconds of hesitation
  };
  
  // Complete the session
  const completeSession = useCallback(() => {
    setIsActive(false);
    setSessionComplete(true);
    
    const results = {
      score,
      timeSpent: initialTimeMinutes * 60 - timeRemaining,
      questionsAnswered: currentQuestionIndex + 1,
      hintsUsed,
    };
    
    setSessionResults(results);
    onComplete?.(results);
  }, [score, timeRemaining, currentQuestionIndex, hintsUsed, initialTimeMinutes, onComplete]);

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-xl ${className}`}>
      {/* Session header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Practice Session</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-gray-300">
            <Timer size={18} />
            <span className={`text-sm font-mono ${timeRemaining < 60 ? 'text-red-400' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-300">
            <CheckSquare size={18} />
            <span className="text-sm">{score}/{questions.length}</span>
          </div>
        </div>
      </div>
      
      {/* Session controls */}
      {!isActive && !sessionComplete ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <h3 className="text-lg text-white mb-4">Ready to start your practice session?</h3>
          <p className="text-gray-400 mb-6 text-center">
            You have {initialTimeMinutes} minutes to complete {questions.length} questions.
            {adaptiveDifficulty && ' Questions will adapt to your performance.'}
          </p>
          <button
            onClick={startSession}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition-colors"
          >
            <Play size={18} />
            <span>Start Practice</span>
          </button>
        </div>
      ) : null}
      
      {/* Active session */}
      {isActive && !sessionComplete && currentQuestion ? (
        <div className="p-4">
          {/* Question display */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                currentQuestion.difficulty === 'easy' 
                  ? 'bg-green-500/20 text-green-400'
                  : currentQuestion.difficulty === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
            <h3 className="text-white text-lg mb-2">{currentQuestion.question}</h3>
          </div>

          {/* Feedback system */}
          <FeedbackSystem
            correctAnswer={currentQuestion.answer}
            hints={currentQuestion.hints}
            onHintUsed={handleHintUsed}
            onSolutionRevealed={handleSolutionRevealed}
            onValidationComplete={handleQuestionComplete}
            className="mb-4"
          />
          
          {/* Session controls */}
          <div className="flex justify-between">
            <div>
              {isPaused ? (
                <button
                  onClick={resumeSession}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  <Play size={14} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
              )}
            </div>
            <button
              onClick={resetSession}
              className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-md text-sm transition-colors"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
          
          {/* Cognitive load indicator */}
          <div className="mt-4">
            <CognitiveLoadIndicator
              loadLevel={cognitiveState.loadLevel}
              errorCount={cognitiveState.errorCount}
              hesitationSeconds={cognitiveState.hesitationSeconds}
              idleTimeSeconds={cognitiveState.idleTimeSeconds}
              onReset={resetTracking}
            />
          </div>
        </div>
      ) : null}
      
      {/* Session results */}
      {sessionComplete && sessionResults ? (
        <div className="p-8">
          <h3 className="text-xl text-white mb-4 text-center">Session Complete!</h3>
          
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm text-gray-400 mb-1">Score</h4>
                <p className="text-2xl text-white font-semibold">{score}/{questions.length}</p>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm text-gray-400 mb-1">Time Spent</h4>
                <p className="text-2xl text-white font-semibold">
                  {formatTime(sessionResults.timeSpent)}
                </p>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm text-gray-400 mb-1">Hints Used</h4>
                <p className="text-2xl text-white font-semibold">{hintsUsed}</p>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm text-gray-400 mb-1">Solutions Revealed</h4>
                <p className="text-2xl text-white font-semibold">{solutionsRevealed}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={resetSession}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              <RotateCcw size={18} />
              <span>Start New Session</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}; 