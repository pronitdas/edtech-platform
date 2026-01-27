import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopicSelectionFlow from './TopicSelectionFlow';
import { apiClient } from '../../services/api-client';
import { useUser } from '../../contexts/UserContext';

interface OnboardingData {
  role: 'teacher' | 'student';
  email: string;
  password: string;
  name: string;
  // Teacher-specific fields
  school_name?: string;
  subjects_taught?: string[];
  grade_levels_taught?: string[];
  years_experience?: number;
  classroom_size?: number;
  // Student-specific fields
  grade_level?: string;
  subjects_of_interest?: string[];
  learning_goals?: string[];
  preferred_difficulty?: 'beginner' | 'intermediate' | 'advanced';
  // Enhanced fields for topic generation
  topics_to_teach?: string[];
  curriculum_standards?: string[];
  content_generation_preferences?: {
    complexity_level: 'beginner' | 'intermediate' | 'advanced';
    content_style: 'formal' | 'conversational' | 'interactive';
    assessment_frequency: 'low' | 'medium' | 'high';
  };
  learning_interests?: string[];
  knowledge_gaps?: string[];
  preferred_learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  current_knowledge_level?: Record<string, 'beginner' | 'intermediate' | 'advanced'>;
}

type ContentGenerationPreferences = NonNullable<
  OnboardingData['content_generation_preferences']
>;

const EnhancedOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    role: 'student',
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopicFlow, setShowTopicFlow] = useState(false);
  const navigate = useNavigate();
  const { register, completeOnboarding, isTeacher, isStudent } = useUser();
  type CompleteOnboardingPayload = Parameters<typeof completeOnboarding>[0];

  // Form field states
  const [subjects, setSubjects] = useState<string[]>([]);
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [contentPreferences, setContentPreferences] = useState<ContentGenerationPreferences>({
    complexity_level: 'intermediate',
    content_style: 'conversational',
    assessment_frequency: 'medium'
  });

  const roleOptions = ['student', 'teacher'] as const;

  const toComplexityLevel = (value: string): ContentGenerationPreferences['complexity_level'] | null => {
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
      return value;
    }
    return null;
  };

  const toContentStyle = (value: string): ContentGenerationPreferences['content_style'] | null => {
    if (value === 'formal' || value === 'conversational' || value === 'interactive') {
      return value;
    }
    return null;
  };

  const toAssessmentFrequency = (
    value: string
  ): ContentGenerationPreferences['assessment_frequency'] | null => {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }
    return null;
  };

  const toPreferredDifficulty = (
    value: string
  ): OnboardingData['preferred_difficulty'] | null => {
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
      return value;
    }
    return null;
  };

  const commonSubjects = [
    'Mathematics', 'Science', 'English/Language Arts', 'History', 'Art', 'Music',
    'Physical Education', 'Technology', 'Foreign Languages', 'Social Studies',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Psychology'
  ];

  const gradeOptions = [
    'K-2', '3-5', '6-8', '9-12', 'College', 'Graduate', 'Adult Education'
  ];

  const learningGoalOptions = [
    'Improve academic performance', 'Prepare for standardized tests',
    'Develop critical thinking skills', 'Learn new subjects',
    'Career preparation', 'Personal enrichment', 'Research skills',
    'Creative expression', 'Problem-solving abilities', 'Collaboration skills'
  ];

  const handleBasicInfoSubmit = () => {
    if (!onboardingData.email || !onboardingData.password || !onboardingData.name) {
      setError('Please fill in all required fields');
      return;
    }
    setCurrentStep(2);
    setError(null);
  };

  const handleRoleSpecificSubmit = () => {
    if (onboardingData.role === 'teacher') {
      if (!onboardingData.school_name || subjects.length === 0 || gradeLevels.length === 0) {
        setError('Please fill in all required fields');
        return;
      }
      setOnboardingData(prev => ({
        ...prev,
        subjects_taught: subjects,
        grade_levels_taught: gradeLevels,
        content_generation_preferences: contentPreferences
      }));
    } else {
      if (!onboardingData.grade_level || subjects.length === 0 || learningGoals.length === 0) {
        setError('Please fill in all required fields');
        return;
      }
      setOnboardingData(prev => ({
        ...prev,
        subjects_of_interest: subjects,
        learning_goals: learningGoals
      }));
    }
    setCurrentStep(3);
    setError(null);
  };

  const handleTopicSelectionComplete = async (selectedTopics: string[]) => {
    setLoading(true);
    setError(null);

    try {
      // First register the user
      await register(onboardingData.email, onboardingData.password, onboardingData.name);

      // Complete the onboarding data
      const baseData = {
        role: onboardingData.role,
        onboarding_completed: true
      };

      if (onboardingData.role === 'teacher') {
        const completeData: CompleteOnboardingPayload = {
          ...baseData,
          topics_to_teach: selectedTopics,
          ...(onboardingData.school_name
            ? { school_name: onboardingData.school_name }
            : {}),
          subjects_taught: subjects,
          grade_levels_taught: gradeLevels,
          ...(onboardingData.years_experience !== undefined
            ? { years_experience: onboardingData.years_experience }
            : {}),
          content_generation_preferences: contentPreferences
        };
        await completeOnboarding(completeData);
      } else {
        const completeData: CompleteOnboardingPayload = {
          ...baseData,
          learning_interests: selectedTopics,
          ...(onboardingData.grade_level
            ? { grade_level: onboardingData.grade_level }
            : {}),
          subjects_of_interest: subjects,
          learning_goals: learningGoals,
          ...(onboardingData.preferred_difficulty
            ? { preferred_difficulty: onboardingData.preferred_difficulty }
            : {})
        };
        await completeOnboarding(completeData);
      }

      // Redirect to appropriate dashboard
      navigate(onboardingData.role === 'teacher' ? '/teacher-dashboard' : '/dashboard');

    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div 
              className={`w-20 h-1 ${
                step < currentStep ? 'bg-purple-500' : 'bg-gray-200'
              }`} 
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderBasicInfo = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Let's get started!</h2>
      
      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role}
                onClick={() => setOnboardingData(prev => ({ ...prev, role }))}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  onboardingData.role === role
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-2">
                  {role === 'student' ? '🎓' : '👩‍🏫'}
                </div>
                <div className="font-medium capitalize">{role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={onboardingData.name}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={onboardingData.email}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={onboardingData.password}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Create a secure password"
            required
          />
        </div>

        <button
          onClick={handleBasicInfoSubmit}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );

  const renderTeacherDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Tell us about your teaching</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School/Institution Name
          </label>
          <input
            type="text"
            value={onboardingData.school_name || ''}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, school_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your school name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects You Teach
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {commonSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSubjects(prev => 
                  prev.includes(subject) 
                    ? prev.filter(s => s !== subject)
                    : [...prev, subject]
                )}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  subjects.includes(subject)
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Levels You Teach
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {gradeOptions.map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeLevels(prev => 
                  prev.includes(grade) 
                    ? prev.filter(g => g !== grade)
                    : [...prev, grade]
                )}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  gradeLevels.includes(grade)
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Teaching Experience
          </label>
          <select
            value={onboardingData.years_experience || ''}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, years_experience: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select experience level</option>
            <option value="0">New Teacher (0 years)</option>
            <option value="1">1-2 years</option>
            <option value="3">3-5 years</option>
            <option value="6">6-10 years</option>
            <option value="11">11-15 years</option>
            <option value="16">16+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Content Generation Preferences
          </label>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Complexity Level
              </label>
              <select
                value={contentPreferences.complexity_level}
                onChange={(e) => {
                  const level = toComplexityLevel(e.target.value);
                  if (level) {
                    setContentPreferences(prev => ({
                      ...prev,
                      complexity_level: level
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Content Style
              </label>
              <select
                value={contentPreferences.content_style}
                onChange={(e) => {
                  const style = toContentStyle(e.target.value);
                  if (style) {
                    setContentPreferences(prev => ({
                      ...prev,
                      content_style: style
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="formal">Formal</option>
                <option value="conversational">Conversational</option>
                <option value="interactive">Interactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Assessment Frequency
              </label>
              <select
                value={contentPreferences.assessment_frequency}
                onChange={(e) => {
                  const frequency = toAssessmentFrequency(e.target.value);
                  if (frequency) {
                    setContentPreferences(prev => ({
                      ...prev,
                      assessment_frequency: frequency
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Back
          </button>
          <button
            onClick={handleRoleSpecificSubmit}
            className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
          >
            Continue to Topic Selection
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderStudentDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Tell us about your learning goals</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Grade Level
          </label>
          <select
            value={onboardingData.grade_level || ''}
            onChange={(e) => setOnboardingData(prev => ({ ...prev, grade_level: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Select your grade level</option>
            {gradeOptions.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects of Interest
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {commonSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSubjects(prev => 
                  prev.includes(subject) 
                    ? prev.filter(s => s !== subject)
                    : [...prev, subject]
                )}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  subjects.includes(subject)
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Goals
          </label>
          <div className="grid md:grid-cols-2 gap-2">
            {learningGoalOptions.map((goal) => (
              <button
                key={goal}
                onClick={() => setLearningGoals(prev => 
                  prev.includes(goal) 
                    ? prev.filter(g => g !== goal)
                    : [...prev, goal]
                )}
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  learningGoals.includes(goal)
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Difficulty Level
          </label>
          <select
            value={onboardingData.preferred_difficulty || 'intermediate'}
            onChange={(e) => {
              const difficulty = toPreferredDifficulty(e.target.value);
              if (difficulty) {
                setOnboardingData(prev => ({ ...prev, preferred_difficulty: difficulty }));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Back
          </button>
          <button
            onClick={handleRoleSpecificSubmit}
            className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
          >
            Continue to Topic Selection
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderBasicInfo();
      case 2: return onboardingData.role === 'teacher' ? renderTeacherDetails() : renderStudentDetails();
      case 3: return (
        <TopicSelectionFlow 
          userType={onboardingData.role}
          onComplete={handleTopicSelectionComplete}
        />
      );
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing your onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {currentStep < 3 && renderStepIndicator()}
        
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOnboarding;
