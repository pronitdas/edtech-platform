import React, { useState, useEffect } from 'react';
import { Brain, BookOpen, Zap, Clock, Users } from 'lucide-react';
import { QuizComponent } from './QuizComponent';
import GeneratedQuizRenderer from './GeneratedQuizRenderer';
import { apiClient } from '@/services/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LegacyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface LegacyQuiz {
  id: number;
  title: string;
  questions: LegacyQuizQuestion[];
}

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

interface QuizOption {
  id: string;
  title: string;
  description: string;
  type: 'legacy' | 'generated';
  questions_count: number;
  estimated_time: number;
  difficulty?: string;
  topic_tags?: string[];
  data: LegacyQuiz | GeneratedQuiz;
}

interface UnifiedQuizInterfaceProps {
  knowledgeId?: string;
  chapterId?: string;
  topicId?: string;
  showGeneratedQuizzes?: boolean;
  showLegacyQuizzes?: boolean;
  onQuizComplete?: (score: number, totalScore: number, quizType: 'legacy' | 'generated') => void;
}

const UnifiedQuizInterface: React.FC<UnifiedQuizInterfaceProps> = ({
  knowledgeId,
  chapterId,
  topicId,
  showGeneratedQuizzes = true,
  showLegacyQuizzes = true,
  onQuizComplete
}) => {
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuizOptions();
  }, [knowledgeId, chapterId, topicId]);

  const loadQuizOptions = async () => {
    setLoading(true);
    setError(null);
    const options: QuizOption[] = [];

    try {
      // Load legacy quizzes if enabled
      if (showLegacyQuizzes && chapterId) {
        try {
          const legacyResponse = await apiClient.get(`/api/v1/quizzes/chapter/${chapterId}`);
          if (legacyResponse.data?.quizzes) {
            legacyResponse.data.quizzes.forEach((quiz: LegacyQuiz) => {
              options.push({
                id: `legacy_${quiz.id}`,
                title: quiz.title,
                description: 'Traditional quiz format with multiple choice questions',
                type: 'legacy',
                questions_count: quiz.questions.length,
                estimated_time: Math.max(quiz.questions.length * 2, 10), // 2 min per question, min 10
                data: quiz
              });
            });
          }
        } catch (err) {
          console.log('No legacy quizzes available for this chapter');
        }
      }

      // Load generated quizzes if enabled
      if (showGeneratedQuizzes && knowledgeId) {
        try {
          const generatedResponse = await apiClient.get(`/api/v2/topic-generation/quizzes/${knowledgeId}`);
          if (generatedResponse.data?.quizzes) {
            generatedResponse.data.quizzes.forEach((quiz: GeneratedQuiz) => {
              options.push({
                id: `generated_${quiz.knowledge_id}`,
                title: `${quiz.topic} - AI Generated Quiz`,
                description: 'Comprehensive AI-generated quiz with explanations and multiple question types',
                type: 'generated',
                questions_count: quiz.questions.length,
                estimated_time: quiz.estimated_time,
                difficulty: getDominantDifficulty(quiz.difficulty_distribution),
                topic_tags: [...new Set(quiz.questions.flatMap(q => q.topic_tags))],
                data: quiz
              });
            });
          }
        } catch (err) {
          console.log('No generated quizzes available for this topic');
        }
      }

      // If no specific content provided, load available quizzes
      if (!knowledgeId && !chapterId && !topicId) {
        try {
          const availableResponse = await apiClient.get('/api/v2/topic-generation/available-quizzes');
          if (availableResponse.data?.quizzes) {
            availableResponse.data.quizzes.forEach((quiz: GeneratedQuiz) => {
              options.push({
                id: `generated_${quiz.knowledge_id}`,
                title: `${quiz.topic} - AI Generated Quiz`,
                description: 'Comprehensive AI-generated quiz with explanations',
                type: 'generated',
                questions_count: quiz.questions.length,
                estimated_time: quiz.estimated_time,
                difficulty: getDominantDifficulty(quiz.difficulty_distribution),
                topic_tags: [...new Set(quiz.questions.flatMap(q => q.topic_tags))],
                data: quiz
              });
            });
          }
        } catch (err) {
          console.log('No available quizzes found');
        }
      }

      setQuizOptions(options);
    } catch (err: any) {
      setError('Failed to load quiz options');
      console.error('Error loading quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDominantDifficulty = (distribution: { easy: number; medium: number; hard: number }) => {
    const { easy, medium, hard } = distribution;
    if (easy >= medium && easy >= hard) return 'easy';
    if (medium >= hard) return 'medium';
    return 'hard';
  };

  const getDifficultyColor = (difficulty?: string) => {
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

  const handleQuizSelect = (quiz: QuizOption) => {
    setSelectedQuiz(quiz);
  };

  const handleQuizComplete = (score: number, totalScore: number, answers?: Record<string, string>) => {
    if (onQuizComplete && selectedQuiz) {
      onQuizComplete(score, totalScore, selectedQuiz.type);
    }
    // Optionally reset to selection screen
    // setSelectedQuiz(null);
  };

  const handleBackToSelection = () => {
    setSelectedQuiz(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Loading quiz options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="text-red-400 mb-2">⚠️ Error</div>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={loadQuizOptions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  // If a quiz is selected, render the appropriate component
  if (selectedQuiz) {
    return (
      <div>
        {/* Back Button */}
        <button
          onClick={handleBackToSelection}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Quiz Selection
        </button>

        {/* Render the selected quiz */}
        {selectedQuiz.type === 'legacy' ? (
          <QuizComponent
            quizId={(selectedQuiz.data as LegacyQuiz).id}
            title={(selectedQuiz.data as LegacyQuiz).title}
            questions={(selectedQuiz.data as LegacyQuiz).questions}
          />
        ) : (
          <GeneratedQuizRenderer
            quiz={selectedQuiz.data as GeneratedQuiz}
            onComplete={handleQuizComplete}
            showExplanations={true}
            allowRetake={true}
          />
        )}
      </div>
    );
  }

  // Quiz selection screen
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Quiz</h2>
        <p className="text-gray-400">
          Select from traditional quizzes or AI-generated comprehensive assessments
        </p>
      </div>

      {quizOptions.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Quizzes Available</h3>
            <p className="text-gray-400">
              No quizzes are currently available for this content. Check back later or try generating new content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizOptions.map((option) => (
            <Card
              key={option.id}
              className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => handleQuizSelect(option)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      option.type === 'generated' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {option.type === 'generated' ? <Zap className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white line-clamp-1">
                        {option.title}
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {option.difficulty && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(option.difficulty)}`}>
                        {option.difficulty}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      option.type === 'generated' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {option.type === 'generated' ? 'AI Generated' : 'Traditional'}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{option.questions_count} questions</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{option.estimated_time} min</span>
                    </div>
                  </div>
                </div>

                {option.topic_tags && option.topic_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {option.topic_tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {option.topic_tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                        +{option.topic_tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Quiz
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnifiedQuizInterface;