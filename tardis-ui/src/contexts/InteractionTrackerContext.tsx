import React, { createContext, useContext, ReactNode } from 'react';
import { AnalyticsService } from '@/services/analytics-service';

interface InteractionData {
  timestamp: number;
  [key: string]: any;
}

interface InteractionTrackerContextType {
  trackVideoPlay: (contentId: number, data: InteractionData) => void;
  trackVideoPause: (contentId: number, data: InteractionData) => void;
  trackVideoComplete: (contentId: number, data: InteractionData) => void;
  trackQuizStart: (quizId: number, data: InteractionData) => void;
  trackQuizAnswer: (quizId: number, questionId: string, data: InteractionData) => void;
  trackQuizComplete: (quizId: number, data: InteractionData) => void;
  trackContentView: (contentId: string, data: InteractionData) => void;
}

const InteractionTrackerContext = createContext<InteractionTrackerContextType | undefined>(undefined);

interface InteractionTrackerProviderProps {
  children: ReactNode;
  dataService: AnalyticsService;
  userId: string;
}

export const InteractionTrackerProvider: React.FC<InteractionTrackerProviderProps> = ({
  children,
  dataService,
  userId,
}) => {
  const trackVideoPlay = (contentId: number, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'video_play',
      contentId: contentId.toString(),
      ...data
    });
  };

  const trackVideoPause = (contentId: number, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'video_pause',
      contentId: contentId.toString(),
      ...data
    });
  };

  const trackVideoComplete = (contentId: number, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'video_complete',
      contentId: contentId.toString(),
      ...data
    });
  };

  const trackQuizStart = (quizId: number, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'quiz_start',
      contentId: quizId.toString(),
      ...data
    });
  };

  const trackQuizAnswer = (quizId: number, questionId: string, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'quiz_answer',
      contentId: quizId.toString(),
      questionId,
      ...data
    });
  };

  const trackQuizComplete = (quizId: number, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'quiz_complete',
      contentId: quizId.toString(),
      ...data
    });
  };

  const trackContentView = (contentId: string, data: InteractionData) => {
    dataService.trackEvent({
      userId,
      eventType: 'content_view',
      contentId,
      ...data
    });
  };

  return (
    <InteractionTrackerContext.Provider
      value={{
        trackVideoPlay,
        trackVideoPause,
        trackVideoComplete,
        trackQuizStart,
        trackQuizAnswer,
        trackQuizComplete,
        trackContentView
      }}
    >
      {children}
    </InteractionTrackerContext.Provider>
  );
};

export const useInteractionTracker = (): InteractionTrackerContextType => {
  const context = useContext(InteractionTrackerContext);
  if (!context) {
    throw new Error('useInteractionTracker must be used within an InteractionTrackerProvider');
  }
  return context;
}; 