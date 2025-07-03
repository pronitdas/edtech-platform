import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api-client';

interface TopicSuggestion {
  topic: string;
  subject_area: string;
  difficulty_level: string;
  description: string;
  learning_objectives: string[];
  estimated_duration: string;
  prerequisites: string[];
}

interface LearningPathway {
  pathway_name: string;
  description: string;
  topics: TopicSuggestion[];
  estimated_duration: string;
}

interface RelatedContent {
  knowledge_id: string;
  title: string;
  summary: string;
  content_type: string;
  relevance_query: string;
}

interface TopicSelectionFlowProps {
  userType: 'teacher' | 'student';
  onComplete: (selectedTopics: string[]) => void;
}

const TopicSelectionFlow: React.FC<TopicSelectionFlowProps> = ({ 
  userType, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Step 1: Interest Collection
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  
  // Step 2: Knowledge Level Assessment
  const [knowledgeLevels, setKnowledgeLevels] = useState<Record<string, string>>({});
  
  // Step 3: Learning Goals
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  
  // Step 4: Suggested Topics
  const [suggestedTopics, setSuggestedTopics] = useState<TopicSuggestion[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [learningPathways, setLearningPathways] = useState<LearningPathway[]>([]);
  const [relatedContent, setRelatedContent] = useState<RelatedContent[]>([]);

  // Predefined options
  const commonInterests = [
    'Mathematics', 'Science', 'History', 'Literature', 'Art', 'Music',
    'Technology', 'Programming', 'Business', 'Psychology', 'Philosophy',
    'Language Learning', 'Health & Medicine', 'Engineering', 'Physics',
    'Chemistry', 'Biology', 'Economics', 'Geography', 'Politics'
  ];

  const commonGoals = [
    'Master fundamental concepts',
    'Prepare for exams',
    'Career advancement',
    'Personal enrichment',
    'Teaching others',
    'Research skills',
    'Practical application',
    'Problem-solving abilities',
    'Critical thinking',
    'Creative expression'
  ];

  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !interests.includes(customInterest.trim())) {
      setInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleKnowledgeLevelChange = (subject: string, level: string) => {
    setKnowledgeLevels(prev => ({
      ...prev,
      [subject]: level
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setLearningGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleAddCustomGoal = () => {
    if (customGoal.trim() && !learningGoals.includes(customGoal.trim())) {
      setLearningGoals(prev => [...prev, customGoal.trim()]);
      setCustomGoal('');
    }
  };

  const handleTopicSelection = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const getSuggestedTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/v2/topic-generation/suggest-topics', {
        user_interests: interests,
        current_knowledge_level: knowledgeLevels,
        learning_goals: learningGoals,
        preferred_subjects: interests
      });

      setSuggestedTopics(response.data.suggested_topics);
      setLearningPathways(response.data.learning_pathways);
      setRelatedContent(response.data.related_existing_content);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get topic suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 3) {
      await getSuggestedTopics();
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    onComplete(selectedTopics);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return interests.length > 0;
      case 2: return Object.keys(knowledgeLevels).length > 0;
      case 3: return learningGoals.length > 0;
      case 4: return selectedTopics.length > 0;
      default: return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div 
              className={`w-16 h-1 ${
                step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`} 
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        What are you interested in {userType === 'teacher' ? 'teaching' : 'learning'}?
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Select your areas of interest or add your own
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {commonInterests.map((interest) => (
          <button
            key={interest}
            onClick={() => handleInterestToggle(interest)}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
              interests.includes(interest)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customInterest}
          onChange={(e) => setCustomInterest(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
          placeholder="Add custom interest..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddCustomInterest}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Add
        </button>
      </div>

      {interests.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-700 font-medium mb-2">Selected interests:</p>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span 
                key={interest}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        What's your current knowledge level?
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Help us understand your expertise in your areas of interest
      </p>

      <div className="space-y-4">
        {interests.map((interest) => (
          <div key={interest} className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-3">{interest}</h3>
            <div className="flex gap-2">
              {difficultyLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleKnowledgeLevelChange(interest, level)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    knowledgeLevels[interest] === level
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        What are your learning goals?
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Select what you want to achieve or add your own goals
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {commonGoals.map((goal) => (
          <button
            key={goal}
            onClick={() => handleGoalToggle(goal)}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
              learningGoals.includes(goal)
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customGoal}
          onChange={(e) => setCustomGoal(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGoal()}
          placeholder="Add custom learning goal..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAddCustomGoal}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Add
        </button>
      </div>

      {learningGoals.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium mb-2">Selected goals:</p>
          <div className="flex flex-wrap gap-2">
            {learningGoals.map((goal) => (
              <span 
                key={goal}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Recommended Topics for You
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Based on your interests and goals, here are personalized topic suggestions
      </p>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating personalized recommendations...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Learning Pathways */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Suggested Learning Pathways</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {learningPathways.map((pathway) => (
                <div key={pathway.pathway_name} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">{pathway.pathway_name}</h4>
                  <p className="text-sm text-purple-700 mb-2">{pathway.description}</p>
                  <p className="text-xs text-purple-600">Duration: {pathway.estimated_duration}</p>
                  <p className="text-xs text-purple-600">{pathway.topics.length} topics</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Suggestions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Choose Topics to Generate Content ({selectedTopics.length} selected)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {suggestedTopics.map((topic) => (
                <div 
                  key={topic.topic} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTopics.includes(topic.topic)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleTopicSelection(topic.topic)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{topic.topic}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      topic.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                      topic.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {topic.difficulty_level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                  <p className="text-xs text-gray-500 mb-2">Subject: {topic.subject_area}</p>
                  <p className="text-xs text-gray-500">Duration: {topic.estimated_duration}</p>
                  
                  {topic.learning_objectives.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {topic.learning_objectives.slice(0, 2).map((objective, idx) => (
                          <li key={idx}>• {objective}</li>
                        ))}
                        {topic.learning_objectives.length > 2 && (
                          <li>• +{topic.learning_objectives.length - 2} more...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Related Existing Content */}
          {relatedContent.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Related Existing Content</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedContent.slice(0, 4).map((content) => (
                  <div key={content.knowledge_id} className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{content.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{content.summary}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{content.content_type}</span>
                      <span>Related to: {content.relevance_query}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTopics.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-2">
                Selected topics for content generation:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic) => (
                  <span 
                    key={topic}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {renderStepIndicator()}
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 3 ? 'Get Recommendations' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed() || loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {userType === 'teacher' ? 'Start Creating Content' : 'Start Learning'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicSelectionFlow;