import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  Brain, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  Award
} from 'lucide-react';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/api-client';

interface GeneratedQuizQuestion {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic_tags: string[];
  points: number;
}

interface GeneratedQuiz {
  knowledge_id: string;
  topic: string;
  questions: GeneratedQuizQuestion[];
  total_points: number;
  estimated_time: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface GeneratedQuizRendererProps {
  quiz: GeneratedQuiz;
  onComplete?: (score: number, totalScore: number, answers: Record<string, string>) => void;
  showExplanations?: boolean;
  allowRetake?: boolean;
}

const GeneratedQuizRenderer: React.FC<GeneratedQuizRendererProps> = ({
  quiz,
  onComplete,
  showExplanations = true,
  allowRetake = true
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalScore: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    questionResults: Array<{
      questionId: string;
      correct: boolean;
      timeSpent: number;
      points: number;
    }>;
  } | null>(null);

  const { trackQuizStart, trackQuizAnswer, trackQuizComplete } = useInteractionTracker();

  const currentQuestion = quiz.questions[currentQuestionIndex];

  useEffect(() => {
    // Track quiz start
    trackQuizStart(parseInt(quiz.knowledge_id) || 0, {
      quizId: quiz.knowledge_id,
      quizTitle: quiz.topic,
      questionCount: quiz.questions.length,
      attemptNumber: 1,
      knowledgeId: quiz.knowledge_id,
      moduleId: quiz.knowledge_id,
      timestamp: Date.now(),
    });

    // Initialize start time for first question
    if (quiz.questions[0]) {
      setStartTime({
        [quiz.questions[0].id]: Date.now(),
      });
    }
  }, [quiz, trackQuizStart]);

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNextQuestion = () => {
    const timeSpent = Date.now() - questionStartTime;
    
    // Track the answer
    trackQuizAnswer(
      parseInt(quiz.knowledge_id) || 0,
      currentQuestion.id,
      {
        questionId: currentQuestion.id,
        selectedAnswer: answers[currentQuestion.id] || '',
        correctAnswer: currentQuestion.correct_answer,
        isCorrect: answers[currentQuestion.id] === currentQuestion.correct_answer,
        timeSpent: timeSpent / 1000, // Convert to seconds
        questionType: currentQuestion.question_type,
        knowledgeId: quiz.knowledge_id,
        moduleId: quiz.knowledge_id,
        timestamp: Date.now(),
      }
    );

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      // Complete the quiz
      completeQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const completeQuiz = () => {
    const startTimestamp = startTime[quiz.questions[0]?.id] || Date.now();
    const totalTimeSpent = Date.now() - startTimestamp;
    
    // Calculate results
    let score = 0;
    let correctAnswers = 0;
    const questionResults = quiz.questions.map(question => {
      const userAnswer = answers[question.id];
      const correct = userAnswer === question.correct_answer;
      if (correct) {
        score += question.points;
        correctAnswers++;
      }
      return {
        questionId: question.id,
        correct,
        timeSpent: 0, // Would need to track individual question times
        points: correct ? question.points : 0
      };
    });

    const finalResults = {
      score,
      totalScore: quiz.total_points,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent: totalTimeSpent / 1000, // Convert to seconds
      questionResults
    };

    setResults(finalResults);
    setIsCompleted(true);
    setShowResults(true);

    // Track quiz completion
    trackQuizComplete(parseInt(quiz.knowledge_id) || 0, {
      quizId: quiz.knowledge_id,
      score: score,
      totalScore: quiz.total_points,
      correctAnswers: correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent: totalTimeSpent / 1000,
      completionRate: (correctAnswers / quiz.questions.length) * 100,
      knowledgeId: quiz.knowledge_id,
      moduleId: quiz.knowledge_id,
      timestamp: Date.now(),
    });

    // Call completion callback
    if (onComplete) {
      onComplete(score, quiz.total_points, answers);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setStartTime({ [quiz.questions[0]?.id]: Date.now() });
    setQuestionStartTime(Date.now());
    setIsCompleted(false);
    setShowResults(false);
    setResults(null);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return <BarChart3 className="h-4 w-4" />;
      case 'true_false':
        return <CheckCircle className="h-4 w-4" />;
      case 'short_answer':
      case 'fill_blank':
        return <Brain className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showResults && results) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-6"
      >
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Award className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Quiz Completed!</CardTitle>
            <p className="text-gray-400">Great job on completing the {quiz.topic} quiz</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round((results.score / results.totalScore) * 100)}%
                </div>
                <div className="text-sm text-gray-400">Overall Score</div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-400">Correct Answers</div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {results.score}/{results.totalScore}
                </div>
                <div className="text-sm text-gray-400">Points Earned</div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  {Math.round(results.timeSpent / 60)}m
                </div>
                <div className="text-sm text-gray-400">Time Spent</div>
              </div>
            </div>

            {/* Question Review */}
            {showExplanations && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Question Review</h3>
                {quiz.questions.map((question, index) => {
                  const userAnswer = answers[question.id];
                  const correct = userAnswer === question.correct_answer;
                  
                  return (
                    <div key={question.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-gray-400">Question {index + 1}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          </div>
                          <p className="text-white font-medium">{question.question}</p>
                        </div>
                        <div className="ml-4">
                          {correct ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-sm text-gray-400">Your Answer:</span>
                          <p className={`text-sm ${correct ? 'text-green-400' : 'text-red-400'}`}>
                            {userAnswer || 'No answer selected'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Correct Answer:</span>
                          <p className="text-sm text-green-400">{question.correct_answer}</p>
                        </div>
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-gray-600 rounded">
                          <span className="text-sm text-gray-400">Explanation:</span>
                          <p className="text-sm text-gray-300 mt-1">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {allowRetake && (
                <button
                  onClick={resetQuiz}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Retake Quiz</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white">{quiz.topic}</CardTitle>
              <p className="text-gray-400 mt-1">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>~{quiz.estimated_time} min</span>
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                <span>{quiz.total_points} pts</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getQuestionTypeIcon(currentQuestion.question_type)}
                  <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-sm text-gray-400">
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {currentQuestion.topic_tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-medium text-white mb-6">
                {currentQuestion.question}
              </h3>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                  <>
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full p-4 text-left rounded-lg border transition-all ${
                          answers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-600 bg-gray-700 text-white hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <>
                    {['True', 'False'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full p-4 text-left rounded-lg border transition-all ${
                          answers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-600 bg-gray-700 text-white hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                          }`}>
                            {answers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'fill_blank') && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="text-sm text-gray-400">
                  {answers[currentQuestion.id] ? 'Answered' : 'Select an answer to continue'}
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={!answers[currentQuestion.id]}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>{currentQuestionIndex === quiz.questions.length - 1 ? 'Complete' : 'Next'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GeneratedQuizRenderer;