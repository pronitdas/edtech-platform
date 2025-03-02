interface InteractionData {
  videoPlays: number;
  videoWatchDuration: number;
  videoPauses: number;
  timelineSeeks: number;
  quizClicks: number;
  notesClicks: number;
  summaryClicks: number;
  mindmapClicks: number;
  animationViews: number;
  chatbotQuestions: string[];
}

class InteractionTracker {
  private data: InteractionData = {
    videoPlays: 0,
    videoWatchDuration: 0,
    videoPauses: 0,
    timelineSeeks: 0,
    quizClicks: 0,
    notesClicks: 0,
    summaryClicks: 0,
    mindmapClicks: 0,
    animationViews: 0,
    chatbotQuestions: []
  };

  private videoPlayStartTime: number | null = null;

  // Video tracking methods
  trackVideoPlay(): void {
    this.data.videoPlays++;
    this.videoPlayStartTime = Date.now();
  }

  trackVideoPause(): void {
    if (this.videoPlayStartTime) {
      const elapsed = (Date.now() - this.videoPlayStartTime) / 1000;
      this.data.videoWatchDuration += elapsed;
      this.videoPlayStartTime = null;
    }
    this.data.videoPauses++;
  }

  trackVideoEnd(): void {
    if (this.videoPlayStartTime) {
      const elapsed = (Date.now() - this.videoPlayStartTime) / 1000;
      this.data.videoWatchDuration += elapsed;
      this.videoPlayStartTime = null;
    }
  }

  trackTimelineSeek(): void {
    this.data.timelineSeeks++;
  }

  // Feature usage tracking
  trackQuizClick(): void {
    this.data.quizClicks++;
  }

  trackNotesClick(): void {
    this.data.notesClicks++;
  }

  trackSummaryClick(): void {
    this.data.summaryClicks++;
  }

  trackMindmapClick(): void {
    this.data.mindmapClicks++;
  }

  trackAnimationView(): void {
    this.data.animationViews++;
  }

  // Chatbot tracking
  trackChatbotQuestion(question: string): void {
    this.data.chatbotQuestions.push(question);
  }

  // Get current data
  getData(): InteractionData {
    return { ...this.data };
  }

  // Reset data
  resetData(): void {
    this.data = {
      videoPlays: 0,
      videoWatchDuration: 0,
      videoPauses: 0,
      timelineSeeks: 0,
      quizClicks: 0,
      notesClicks: 0,
      summaryClicks: 0,
      mindmapClicks: 0,
      animationViews: 0,
      chatbotQuestions: []
    };
    this.videoPlayStartTime = null;
  }

  // Generate analysis based on interaction data
  generateAnalysis(): {
    understanding: string;
    confidence: string;
    strengths: string;
    weaknesses: string;
    improvement: string;
  } {
    let understanding, confidence, strengths, weaknesses, improvement;

    // Analyze video engagement
    if (this.data.videoWatchDuration > 300) {
      understanding = "Strong understanding of the subject demonstrated through extensive video engagement.";
    } else {
      understanding = "Limited video engagement suggests there may be areas that require further review.";
    }

    // Analyze quiz engagement
    if (this.data.quizClicks > 2) {
      confidence = "You have actively engaged with quizzes, indicating a desire to validate your understanding, which may also reflect some uncertainty.";
    } else {
      confidence = "Few quiz attempts suggest high confidence, or possibly underutilization of available assessments.";
    }

    // Analyze content interactions
    const contentInteractions = this.data.notesClicks + this.data.summaryClicks;
    if (contentInteractions > 3) {
      strengths = "You have extensively reviewed notes and summaries, which indicates strong theoretical understanding.";
    } else {
      strengths = "Consider reviewing the notes and summaries to strengthen your theoretical knowledge.";
    }

    // Analyze timeline seeking behavior
    if (this.data.timelineSeeks > 5) {
      weaknesses = "Frequent timeline seeking may suggest challenges in following the video content.";
    } else {
      weaknesses = "Your interaction with the video timeline appears steady.";
    }

    // Analyze mindmap usage
    if (this.data.mindmapClicks < 1) {
      improvement = "Engaging with the mindmap section could help in visualizing and reinforcing the connections between concepts.";
    } else {
      improvement = "Consider exploring more interactive tools to further consolidate your learning.";
    }

    return {
      understanding,
      confidence,
      strengths,
      weaknesses,
      improvement
    };
  }
}

// Export a singleton instance
export const interactionTracker = new InteractionTracker(); 