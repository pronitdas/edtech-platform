import { useCallback, useRef } from 'react';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { 
  QuizStartEvent, 
  QuizQuestionAnswerEvent,
  QuizSubmitEvent 
} from '@/types/analytics';

interface QuizAnalyticsParams {
  knowledgeId: string;
  moduleId: string;
  quizId: string;
  quizTitle?: string;
}

/**
 * Hook for standardized quiz analytics tracking
 * 
 * @param params Base quiz parameters that will be included in all events
 * @returns Object with tracking methods for quiz interactions
 */
export const useQuizAnalytics = (params: QuizAnalyticsParams) => {
  const { 
    trackQuizStart, 
    trackQuizAnswer, 
    trackQuizComplete 
  } = useInteractionTracker();
  
  // Store quiz attempt data
  const attemptIdRef = useRef<string>(`${params.quizId}_${Date.now()}`);
  const startTimeRef = useRef<number>(0);
  const questionAnswersRef = useRef<{
    questionId: string;
    isCorrect: boolean;
    timeTaken: number;
  }[]>([]);
  const attemptNumberRef = useRef<number>(1);
  
  /**
   * Track quiz start event
   * @param questionCount Total number of questions in the quiz
   * @param difficulty Quiz difficulty level (optional)
   * @param timeLimit Time limit in seconds (optional)
   */
  const trackStart = useCallback((questionCount: number, difficulty?: string, timeLimit?: number) => {
    // Generate a new attempt ID for this quiz session
    attemptIdRef.current = `${params.quizId}_${Date.now()}`;
    
    // Reset tracking data
    questionAnswersRef.current = [];
    startTimeRef.current = Date.now();
    
    // Prepare event data
    const eventData: QuizStartEvent = {
      ...params,
      quizId: params.quizId,
      questionCount,
      difficulty,
      timeLimit,
      attemptNumber: attemptNumberRef.current
    };
    
    // Track the event
    trackQuizStart(parseInt(params.quizId, 10) || 0, eventData);
  }, [params, trackQuizStart]);
  
  /**
   * Create a timer for measuring question response time
   * @returns Object with start and end methods for timing
   */
  const createQuestionTimer = useCallback(() => {
    let startTime = 0;
    
    return {
      start: () => {
        startTime = Date.now();
      },
      end: () => {
        return (Date.now() - startTime) / 1000; // Return seconds
      }
    };
  }, []);
  
  /**
   * Track quiz question answer event
   * @param questionId ID of the question being answered
   * @param questionType Type of question (multiple-choice, fill-blank, etc)
   * @param isCorrect Whether the answer was correct
   * @param timeTaken Time taken to answer in seconds
   * @param userAnswer The answer provided by the user
   * @param correctAnswer The correct answer (optional)
   */
  const trackAnswer = useCallback((
    questionId: string, 
    questionType: string,
    isCorrect: boolean, 
    timeTaken: number,
    userAnswer: any,
    correctAnswer?: any
  ) => {
    // Store the answer data for the final summary
    questionAnswersRef.current.push({
      questionId,
      isCorrect,
      timeTaken
    });
    
    // Prepare event data
    const eventData: QuizQuestionAnswerEvent = {
      ...params,
      quizId: params.quizId,
      attemptId: attemptIdRef.current,
      questionId,
      questionType,
      isCorrect,
      timeTaken,
      userAnswer,
      correctAnswer
    };
    
    // Track the event
    trackQuizAnswer(parseInt(params.quizId, 10) || 0, questionId, eventData);
  }, [params, trackQuizAnswer]);
  
  /**
   * Track quiz submission event
   * @param score Score achieved
   * @param maxScore Maximum possible score
   * @param totalQuestions Total number of questions
   * @param passingScore Passing score threshold (optional)
   */
  const trackSubmit = useCallback((
    score: number,
    maxScore: number,
    totalQuestions: number,
    passingScore?: number
  ) => {
    // Calculate completion time
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    // Count correct answers
    const correctAnswers = questionAnswersRef.current.filter(a => a.isCorrect).length;
    
    // Determine if passed (if passing score is provided)
    const passed = passingScore !== undefined ? score >= passingScore : undefined;
    
    // Prepare event data
    const eventData: QuizSubmitEvent = {
      ...params,
      quizId: params.quizId,
      attemptId: attemptIdRef.current,
      score,
      maxScore,
      durationSeconds,
      correctAnswers,
      totalQuestions,
      attemptNumber: attemptNumberRef.current,
      passingScore,
      passed
    };
    
    // Track the event
    trackQuizComplete(parseInt(params.quizId, 10) || 0, eventData);
    
    // Increment attempt number for next time
    attemptNumberRef.current += 1;
  }, [params, trackQuizComplete]);
  
  /**
   * Reset tracking data (useful for retries)
   */
  const resetTracking = useCallback(() => {
    attemptIdRef.current = `${params.quizId}_${Date.now()}`;
    questionAnswersRef.current = [];
    startTimeRef.current = 0;
    // Don't reset attemptNumber as it should increment
  }, [params.quizId]);
  
  return {
    trackStart,
    trackAnswer,
    trackSubmit,
    createQuestionTimer,
    resetTracking,
    getCurrentAttemptId: () => attemptIdRef.current,
    getCurrentAttemptNumber: () => attemptNumberRef.current
  };
}; 