import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RefreshCw,
  Target,
  TrendingUp,
  Award,
  Brain,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  tags: string[];
  timeLimit?: number; // seconds
  points: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

export interface QuizState {
  currentQuestion: number;
  answers: Record<string, string | string[]>;
  flagged: Set<string>;
  startTime: number;
  questionStartTime: number;
  timeSpent: Record<string, number>; // questionId -> seconds
  isComplete: boolean;
  isPaused: boolean;
}

export interface AdaptiveConfig {
  initialDifficulty: 'easy' | 'medium' | 'hard';
  minDifficulty: 'easy' | 'medium' | 'hard';
  maxDifficulty: 'hard' | 'expert';
  difficultyAdjustmentStep: number;
  questionsPerAssessment: number;
  enableTimePressure: boolean;
  timePressureMultiplier: number;
}

export interface QuizPerformance {
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  difficultyDistribution: Record<string, number>;
  topicPerformance: Record<string, { correct: number; total: number }>;
  streak: number;
  maxStreak: number;
  score: number;
  maxScore: number;
  percentile?: number;
}

// Adaptive Quiz Engine Hook
export const useAdaptiveQuiz = (
  questions: QuizQuestion[],
  config: Partial<AdaptiveConfig> = {}
) => {
  const defaultConfig: AdaptiveConfig = {
    initialDifficulty: 'medium',
    minDifficulty: 'easy',
    maxDifficulty: 'hard',
    difficultyAdjustmentStep: 1,
    questionsPerAssessment: 5,
    enableTimePressure: false,
    timePressureMultiplier: 1,
    ...config,
  };

  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<AdaptiveConfig['initialDifficulty']>(
    defaultConfig.initialDifficulty
  );
  const [performanceHistory, setPerformanceHistory] = useState<boolean[]>([]);

  // Initialize questions in adaptive order
  useEffect(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setOrderedQuestions(shuffled);
  }, [questions]);

  // Adjust difficulty based on performance
  const adjustDifficulty = useCallback(
    (isCorrect: boolean) => {
      const recentPerformance = performanceHistory.slice(-defaultConfig.questionsPerAssessment);
      const accuracy =
        recentPerformance.length > 0
          ? recentPerformance.filter(Boolean).length / recentPerformance.length
          : 0.5;

      setPerformanceHistory((prev) => [...prev, isCorrect]);

      if (accuracy >= 0.8 && currentDifficulty !== defaultConfig.maxDifficulty) {
        setCurrentDifficulty((prev) => {
          const levels: AdaptiveConfig['initialDifficulty'][] = ['easy', 'medium', 'hard'];
          const currentIndex = levels.indexOf(prev);
          return levels[Math.min(currentIndex + 1, levels.length - 1)];
        });
      } else if (accuracy <= 0.4 && currentDifficulty !== defaultConfig.minDifficulty) {
        setCurrentDifficulty((prev) => {
          const levels: AdaptiveConfig['initialDifficulty'][] = ['easy', 'medium', 'hard'];
          const currentIndex = levels.indexOf(prev);
          return levels[Math.max(currentIndex - 1, 0)];
        });
      }
    },
    [currentDifficulty, defaultConfig, performanceHistory]
  );

  const getQuestionByDifficulty = useCallback(
    (difficulty: AdaptiveConfig['initialDifficulty']) => {
      return orderedQuestions.filter((q) => q.difficulty === difficulty);
    },
    [orderedQuestions]
  );

  return {
    questions: orderedQuestions,
    currentDifficulty,
    adjustDifficulty,
    getQuestionByDifficulty,
    performanceHistory,
  };
};

// Mobile-optimized Quiz Component
interface AdaptiveQuizProps {
  questions: QuizQuestion[];
  onComplete: (performance: QuizPerformance, answers: Record<string, string | string[]>) => void;
  config?: Partial<AdaptiveConfig>;
  showFeedback?: boolean;
  shuffleQuestions?: boolean;
  enableReview?: boolean;
}

export const AdaptiveQuiz: React.FC<AdaptiveQuizProps> = ({
  questions,
  onComplete,
  config,
  showFeedback = true,
  shuffleQuestions = true,
  enableReview = true,
}) => {
  const [state, setState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    flagged: new Set(),
    startTime: Date.now(),
    questionStartTime: Date.now(),
    timeSpent: {},
    isComplete: false,
    isPaused: false,
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [localConfig] = useState<AdaptiveConfig>({
    initialDifficulty: 'medium',
    minDifficulty: 'easy',
    maxDifficulty: 'hard',
    difficultyAdjustmentStep: 1,
    questionsPerAssessment: 5,
    enableTimePressure: false,
    timePressureMultiplier: 1,
    ...config,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[state.currentQuestion];

  // Timer for time-limited questions
  useEffect(() => {
    if (currentQ?.timeLimit && !state.isComplete && !state.isPaused) {
      const elapsed = (Date.now() - state.questionStartTime) / 1000;
      const remaining = currentQ.timeLimit - elapsed;
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        handleTimeUp();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentQ, state.questionStartTime, state.isComplete, state.isPaused]);

  const handleTimeUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQ.id]: '__TIMEOUT__',
      },
    }));
  }, [currentQ]);

  const handleAnswer = useCallback(
    (answer: string | string[]) => {
      setState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQ.id]: answer,
        },
        timeSpent: {
          ...prev.timeSpent,
          [currentQ.id]: (Date.now() - prev.questionStartTime) / 1000,
        },
      }));
    },
    [currentQ]
  );

  const handleNext = useCallback(() => {
    if (state.currentQuestion < questions.length - 1) {
      setState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        questionStartTime: Date.now(),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        isComplete: true,
      }));
      setShowResults(true);
    }
  }, [state.currentQuestion, questions.length]);

  const handlePrevious = useCallback(() => {
    if (state.currentQuestion > 0) {
      setState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
      }));
    }
  }, [state.currentQuestion]);

  const toggleFlag = useCallback(() => {
    setState((prev) => {
      const newFlagged = new Set(prev.flagged);
      if (newFlagged.has(currentQ.id)) {
        newFlagged.delete(currentQ.id);
      } else {
        newFlagged.add(currentQ.id);
      }
      return { ...prev, flagged: newFlagged };
    });
  }, [currentQ]);

  const calculatePerformance = useCallback((): QuizPerformance => {
    let correct = 0;
    let totalTime = 0;
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    const difficultyDistribution: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    let streak = 0;
    let maxStreak = 0;

    questions.forEach((q, index) => {
      const userAnswer = state.answers[q.id];
      const isCorrect = validateAnswer(userAnswer, q.correctAnswer);

      if (isCorrect) {
        correct++;
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }

      totalTime += state.timeSpent[q.id] || 0;

      // Track topic performance
      if (!topicPerformance[q.topic]) {
        topicPerformance[q.topic] = { correct: 0, total: 0 };
      }
      topicPerformance[q.topic].total++;
      if (isCorrect) topicPerformance[q.topic].correct++;

      // Track difficulty distribution
      difficultyDistribution[q.difficulty]++;
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = questions.reduce((sum, q) => {
      const userAnswer = state.answers[q.id];
      return sum + (validateAnswer(userAnswer, q.correctAnswer) ? q.points : 0);
    }, 0);

    return {
      totalQuestions: questions.length,
      correctAnswers: correct,
      averageTime: totalTime / questions.length,
      difficultyDistribution,
      topicPerformance,
      streak,
      maxStreak,
      score: earnedPoints,
      maxScore: totalPoints,
    };
  }, [questions, state.answers, state.timeSpent]);

  const validateAnswer = (
    userAnswer: string | string[] | undefined,
    correctAnswer: string | string[]
  ): boolean => {
    if (!userAnswer || userAnswer === '__TIMEOUT__') return false;
    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return (
        userAnswer.length === correctAnswer.length &&
        userAnswer.every((a) => correctAnswer.includes(a))
      );
    }
    if (Array.isArray(userAnswer) && typeof correctAnswer === 'string') {
      return userAnswer.includes(correctAnswer);
    }
    if (typeof userAnswer === 'string' && Array.isArray(correctAnswer)) {
      return correctAnswer.includes(userAnswer);
    }
    return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
  };

  useEffect(() => {
    if (state.isComplete) {
      const performance = calculatePerformance();
      onComplete(performance, state.answers);
    }
  }, [state.isComplete, calculatePerformance, onComplete, state.answers]);

  // Progress indicator
  const progress = ((state.currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Question {state.currentQuestion + 1} of {questions.length}
          </h2>
          {currentQ?.timeLimit && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                timeRemaining && timeRemaining < 30
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-gray-700 text-gray-300'
              )}
            >
              <Clock className="w-4 h-4" />
              {Math.floor((timeRemaining || 0) / 60)}:
              {String(Math.floor((timeRemaining || 0) % 60)).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          {/* Question header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  currentQ.difficulty === 'easy'
                    ? 'bg-green-500/20 text-green-400'
                    : currentQ.difficulty === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                )}
              >
                {currentQ.difficulty}
              </span>
              <span className="text-xs text-gray-500">{currentQ.topic}</span>
            </div>
            <button
              onClick={toggleFlag}
              className={cn(
                'p-2 rounded-lg transition-colors',
                state.flagged.has(currentQ.id)
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              )}
              aria-label={state.flagged.has(currentQ.id) ? 'Unflag question' : 'Flag question'}
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Question text */}
          <div className="mb-6">
            <p className="text-lg text-white leading-relaxed">{currentQ.question}</p>
          </div>

          {/* Options or input */}
          {currentQ.type === 'multiple_choice' && currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = state.answers[currentQ.id] === option;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      'w-full p-4 rounded-lg text-left transition-all border',
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-white'
                        : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                    )}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-sm font-medium mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-700">
            <button
              onClick={handlePrevious}
              disabled={state.currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {/* Question dots */}
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() =>
                    setState((prev) => ({ ...prev, currentQuestion: index }))
                  }
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    index === state.currentQuestion
                      ? 'bg-blue-500'
                      : state.answers[q.id]
                        ? 'bg-green-500'
                        : state.flagged.has(q.id)
                          ? 'bg-yellow-500'
                          : 'bg-gray-600 hover:bg-gray-500'
                  )}
                  aria-label={`Question ${index + 1}${
                    state.answers[q.id] ? ' answered' : ''
                  }${state.flagged.has(q.id) ? ' flagged' : ''}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (state.answers[currentQ.id]) {
                  handleNext();
                }
              }}
              disabled={!state.answers[currentQ.id]}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700"
            >
              <QuizResults performance={calculatePerformance()} questions={questions} answers={state.answers} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Results Component
interface QuizResultsProps {
  performance: QuizPerformance;
  questions: QuizQuestion[];
  answers: Record<string, string | string[]>;
}

const QuizResults: React.FC<QuizResultsProps> = ({ performance, questions, answers }) => {
  const scorePercentage = (performance.score / performance.maxScore) * 100;

  return (
    <div className="text-center">
      <div className="mb-6">
        <div
          className={cn(
            'inline-flex items-center justify-center w-24 h-24 rounded-full mb-4',
            scorePercentage >= 80
              ? 'bg-green-500/20'
              : scorePercentage >= 60
                ? 'bg-yellow-500/20'
                : 'bg-red-500/20'
          )}
        >
          <span className="text-3xl font-bold text-white">
            {Math.round(scorePercentage)}%
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-400">
          You scored {performance.score} out of {performance.maxScore} points
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Correct</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {performance.correctAnswers}/{performance.totalQuestions}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Avg Time</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round(performance.averageTime)}s
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Best Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{performance.maxStreak}</p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round(
              (performance.correctAnswers / performance.totalQuestions) * 100
            )}
            %
          </p>
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        Try Again
      </button>
    </div>
  );
};

export default AdaptiveQuiz;
