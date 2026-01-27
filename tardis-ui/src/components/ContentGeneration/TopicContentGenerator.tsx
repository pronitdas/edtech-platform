import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';
import { useInteractionTracker } from '../../contexts/InteractionTrackerContext';

interface TopicGenerationRequest {
  topic: string;
  subject_area: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  target_audience: 'high_school' | 'college' | 'professional';
  content_depth: 'overview' | 'detailed' | 'comprehensive';
  learning_objectives: string[];
  language: string;
}

interface GenerationStatus {
  knowledge_id: string;
  status: 'generating' | 'completed' | 'error';
  created_at: string;
  metadata: any;
}

interface GeneratedContentSummary {
  knowledge_id: string;
  topic: string;
  status: string;
  generation_time: string;
  content_summary: any;
  external_sources_count: number;
  chapters_count: number;
}

type ApiDataResponse<T> = {
  data: T;
};

interface TopicContentGeneratorProps {
  initialTopic?: string;
  onContentGenerated?: (contentId: string) => void;
}

const TopicContentGenerator: React.FC<TopicContentGeneratorProps> = ({
  initialTopic = '',
  onContentGenerated
}) => {
  const [formData, setFormData] = useState<TopicGenerationRequest>({
    topic: initialTopic,
    subject_area: '',
    difficulty_level: 'intermediate',
    target_audience: 'college',
    content_depth: 'detailed',
    learning_objectives: [],
    language: 'English'
  });

  const [currentObjective, setCurrentObjective] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentSummary | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { trackTopicGenerationStart, trackTopicGenerationComplete } = useInteractionTracker();

  const subjectAreas = [
    'Mathematics', 'Science', 'History', 'Literature', 'Art', 'Music',
    'Technology', 'Programming', 'Business', 'Psychology', 'Philosophy',
    'Language Learning', 'Health & Medicine', 'Engineering', 'Physics',
    'Chemistry', 'Biology', 'Economics', 'Geography', 'Politics'
  ];

  const handleInputChange = (field: keyof TopicGenerationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddObjective = () => {
    if (currentObjective.trim() && !formData.learning_objectives.includes(currentObjective.trim())) {
      setFormData(prev => ({
        ...prev,
        learning_objectives: [...prev.learning_objectives, currentObjective.trim()]
      }));
      setCurrentObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    // Clear the error if files are valid
    if (validFiles.length > 0) {
      setError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim() || !formData.subject_area || formData.learning_objectives.length === 0) {
      setError('Please fill in all required fields and add at least one learning objective');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      // Track generation start
      trackTopicGenerationStart({
        topic: formData.topic,
        subject_area: formData.subject_area,
        difficulty_level: formData.difficulty_level,
        target_audience: formData.target_audience,
        content_depth: formData.content_depth,
        learning_objectives: formData.learning_objectives,
        user_id: 'current_user' // This should come from user context
      });

      // Create FormData for file upload if files exist
      let requestData: any = formData;
      
      if (uploadedFiles.length > 0) {
        const formDataWithFiles = new FormData();
        formDataWithFiles.append('request', JSON.stringify(formData));
        
        uploadedFiles.forEach((file, index) => {
          formDataWithFiles.append(`files`, file);
        });
        
        requestData = formDataWithFiles;
      }

      const response = await apiClient.post<ApiDataResponse<GeneratedContentSummary>>('/api/v2/topic-generation/generate', requestData);
      const contentSummary: GeneratedContentSummary = response.data;
      
      setGeneratedContent(contentSummary);
      
      // Start polling for status updates
      pollGenerationStatus(contentSummary.knowledge_id);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start content generation');
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = async (knowledgeId: string) => {
    try {
      const response = await apiClient.get<ApiDataResponse<GenerationStatus>>(`/api/v2/topic-generation/generation-status/${knowledgeId}`);
      const status: GenerationStatus = response.data;
      
      setGenerationStatus(status);
      
      if (status.status === 'completed') {
        setIsGenerating(false);
        
        // Track generation completion
        trackTopicGenerationComplete({
          knowledge_id: knowledgeId,
          topic: generatedContent?.topic || formData.topic,
          generation_time: 0, // Would need to calculate from start time
          chapters_count: status.metadata?.chapters_count || 0,
          external_sources_count: status.metadata?.external_sources_count || 0,
          status: 'completed'
        });
        
        if (onContentGenerated) {
          onContentGenerated(knowledgeId);
        }
      } else if (status.status === 'error') {
        setIsGenerating(false);
        setError('Content generation failed. Please try again.');
        
        // Track generation failure
        trackTopicGenerationComplete({
          knowledge_id: knowledgeId,
          topic: generatedContent?.topic || formData.topic,
          generation_time: 0,
          chapters_count: 0,
          external_sources_count: 0,
          status: 'error'
        });
      } else if (status.status === 'generating') {
        // Continue polling
        setTimeout(() => pollGenerationStatus(knowledgeId), 5000);
      }
    } catch (err) {
      console.error('Error polling generation status:', err);
      // Continue polling in case of temporary network issues
      setTimeout(() => pollGenerationStatus(knowledgeId), 10000);
    }
  };

  const canSubmit = () => {
    return formData.topic.trim() && 
           formData.subject_area && 
           formData.learning_objectives.length > 0 && 
           !isGenerating;
  };

  const renderFormSection = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Generate Educational Content</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => handleInputChange('topic', e.target.value)}
            placeholder="e.g., Quadratic Equations, World War II, Photosynthesis"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Subject Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Area <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.subject_area}
            onChange={(e) => handleInputChange('subject_area', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select subject area...</option>
            {subjectAreas.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* Difficulty and Audience */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty_level}
              onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <select
              value={formData.target_audience}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high_school">High School</option>
              <option value="college">College</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>

        {/* Content Depth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Depth
          </label>
          <select
            value={formData.content_depth}
            onChange={(e) => handleInputChange('content_depth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overview">Overview (Quick introduction)</option>
            <option value="detailed">Detailed (Comprehensive coverage)</option>
            <option value="comprehensive">Comprehensive (In-depth analysis)</option>
          </select>
        </div>

        {/* Learning Objectives */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Objectives <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentObjective}
              onChange={(e) => setCurrentObjective(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
              placeholder="Add a learning objective..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddObjective}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          
          {formData.learning_objectives.length > 0 && (
            <div className="space-y-2">
              {formData.learning_objectives.map((objective, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{objective}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Supporting Materials (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-gray-600">
                Click to upload files or drag and drop
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX, TXT, PPT, PPTX up to 10MB each
              </span>
            </label>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit()}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating Content...' : 'Generate Complete Course'}
        </button>
      </form>
    </div>
  );

  const renderGenerationProgress = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Content Generation Progress</h3>
      
      {generatedContent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">{generatedContent.topic}</h4>
          <p className="text-sm text-blue-700 mb-2">
            Status: <span className="font-medium">{generatedContent.status}</span>
          </p>
          <p className="text-sm text-blue-700">
            Generation ID: {generatedContent.knowledge_id}
          </p>
        </div>
      )}

      {generationStatus && (
        <div className="space-y-3">
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              generationStatus.status === 'generating' ? 'bg-yellow-500 animate-pulse' :
              generationStatus.status === 'completed' ? 'bg-green-500' :
              'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium capitalize">
              {generationStatus.status === 'generating' ? 'Generating content...' :
               generationStatus.status === 'completed' ? 'Content generated successfully!' :
               'Generation failed'}
            </span>
          </div>

          {generationStatus.status === 'generating' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                🔄 Comprehensive content generation in progress...
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                This includes chapters, mind maps, notes, summary, quiz, and external source integration.
                This may take 2-5 minutes depending on content complexity.
              </p>
            </div>
          )}

          {generationStatus.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium mb-2">
                ✅ Content generation completed successfully!
              </p>
              <p className="text-xs text-green-600">
                Your comprehensive educational content is ready. It includes structured chapters, 
                visual mind maps, study notes, course summary, and assessment quiz.
              </p>
              <button
                onClick={() => onContentGenerated?.(generationStatus.knowledge_id)}
                className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
              >
                View Generated Content
              </button>
            </div>
          )}

          {generationStatus.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                ❌ Content generation failed. Please try again with different parameters.
              </p>
            </div>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="mt-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-blue-600">Generating comprehensive educational content...</span>
          </div>
          
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What's being generated:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>📚 Structured chapters with detailed explanations</li>
              <li>🧠 Visual mind maps for concept relationships</li>
              <li>📝 Comprehensive study notes</li>
              <li>📋 Course summary and key takeaways</li>
              <li>❓ Assessment quiz with multiple question types</li>
              <li>🌐 Integration with Wikipedia and external sources</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {renderFormSection()}
      
      {(isGenerating || generatedContent || generationStatus) && renderGenerationProgress()}
    </div>
  );
};

export default TopicContentGenerator;
