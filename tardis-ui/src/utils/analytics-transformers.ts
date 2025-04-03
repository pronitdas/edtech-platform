/**
 * Utility functions for transforming analytics data into formats suitable for display
 */

/**
 * Format engagement score as a percentage with one decimal place
 */
export function formatEngagementScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Format time duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Transform video stats into chart data format
 */
export function transformVideoStatsForChart(videoStats: any): any {
  if (!videoStats) return { labels: [], datasets: [] };
  
  return {
    labels: ['Watched', 'Not Watched'],
    datasets: [
      {
        label: 'Videos',
        data: [
          videoStats.videos_watched || 0,
          (videoStats.total_videos || 0) - (videoStats.videos_watched || 0)
        ],
        backgroundColor: ['#4CAF50', '#E0E0E0']
      }
    ]
  };
}

/**
 * Transform quiz stats into chart data format
 */
export function transformQuizStatsForChart(quizStats: any): any {
  if (!quizStats) return { labels: [], datasets: [] };
  
  return {
    labels: ['Completed', 'Attempted', 'Not Attempted'],
    datasets: [
      {
        label: 'Quizzes',
        data: [
          quizStats.quizzes_completed || 0,
          (quizStats.quizzes_attempted || 0) - (quizStats.quizzes_completed || 0),
          (quizStats.total_quizzes || 0) - (quizStats.quizzes_attempted || 0)
        ],
        backgroundColor: ['#4CAF50', '#FFC107', '#E0E0E0']
      }
    ]
  };
}

/**
 * Calculate understanding level based on quiz performance and engagement
 */
export function calculateUnderstandingLevel(quizStats: any, engagementScore: number): string {
  if (!quizStats) return 'Not enough data';
  
  const quizScore = quizStats.average_score || 0;
  const quizWeight = 0.7;
  const engagementWeight = 0.3;
  
  const weightedScore = (quizScore * quizWeight) + (engagementScore * engagementWeight);
  
  if (weightedScore >= 0.8) return 'Expert';
  if (weightedScore >= 0.6) return 'Advanced';
  if (weightedScore >= 0.4) return 'Intermediate';
  if (weightedScore >= 0.2) return 'Beginner';
  return 'Novice';
}

/**
 * Generate recommendations based on analytics data
 */
export function generateRecommendations(
  videoStats: any, 
  quizStats: any, 
  interactionSummary: any
): string[] {
  const recommendations: string[] = [];
  
  // Video engagement recommendations
  if (videoStats) {
    const completionRate = videoStats.completion_rate || 0;
    if (completionRate < 0.5) {
      recommendations.push('Try to watch more videos completely to improve your understanding.');
    }
    
    const watchPercentage = videoStats.average_watch_percentage || 0;
    if (watchPercentage < 0.7) {
      recommendations.push('Consider watching videos more thoroughly to get the full benefit.');
    }
  }
  
  // Quiz performance recommendations
  if (quizStats) {
    const quizCompletionRate = quizStats.quizzes_completed / (quizStats.total_quizzes || 1);
    if (quizCompletionRate < 0.7) {
      recommendations.push('Complete more quizzes to test your knowledge and identify areas for improvement.');
    }
    
    const averageScore = quizStats.average_score || 0;
    if (averageScore < 0.6) {
      recommendations.push('Review the content and retake quizzes to improve your score.');
    }
  }
  
  // Interaction recommendations
  if (interactionSummary) {
    const totalInteractions = interactionSummary.total_interactions || 0;
    if (totalInteractions < 10) {
      recommendations.push('Engage more with the learning materials to improve retention.');
    }
  }
  
  // Default recommendation if none were generated
  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work! Continue with your current learning approach.');
  }
  
  return recommendations;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} 