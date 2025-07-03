import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, BookOpen, Clock, BarChart3, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import TopicContentGenerator from '../ContentGeneration/TopicContentGenerator';
import ContentSharingWorkflow from '../sharing/ContentSharingWorkflow';
import { apiClient } from '../../services/api-client';

interface GeneratedContent {
  knowledge_id: string;
  topic: string;
  status: 'generating' | 'completed' | 'error';
  created_at: string;
  summary: string;
  metadata: any;
}

interface ContentDetails {
  knowledge_id: string;
  topic: string;
  chapters: Array<{
    id: string;
    content: string;
    metadata: any;
  }>;
  mind_maps: any[];
  notes: any;
  summary: any;
  quiz: any;
  external_sources: any[];
  metadata: any;
}

const ContentManagementInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'analytics' | 'sharing'>('create');
  const [myContent, setMyContent] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSharingWorkflow, setShowSharingWorkflow] = useState(false);
  const [contentToShare, setContentToShare] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'manage') {
      loadMyContent();
    }
  }, [activeTab]);

  const loadMyContent = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v2/topic-generation/my-generated-content');
      setMyContent(response.data.generated_content);
    } catch (err: any) {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadContentDetails = async (knowledgeId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v2/topic-generation/content/${knowledgeId}`);
      setSelectedContent(response.data);
    } catch (err: any) {
      setError('Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  const handleContentGenerated = (contentId: string) => {
    // Refresh the content list
    if (activeTab === 'manage') {
      loadMyContent();
    }
    // Switch to manage tab to show the new content
    setActiveTab('manage');
  };

  const renderTabButton = (
    tab: 'create' | 'manage' | 'analytics' | 'sharing',
    label: string,
    icon: string
  ) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );

  const renderCreateContent = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Educational Content</h2>
        <p className="text-gray-600">
          Generate comprehensive educational materials from any topic using AI
        </p>
      </div>
      
      <TopicContentGenerator onContentGenerated={handleContentGenerated} />
    </div>
  );

  const renderManageContent = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Content</h2>
        <p className="text-gray-600">
          View, edit, and organize your generated educational content
        </p>
      </div>

      {loading && !selectedContent && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your content...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !selectedContent && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myContent.map((content) => (
            <motion.div
              key={content.knowledge_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => loadContentDetails(content.knowledge_id)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{content.topic}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  content.status === 'completed' ? 'bg-green-100 text-green-800' :
                  content.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {content.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{content.summary}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(content.created_at).toLocaleDateString()}</span>
                <span>
                  {content.metadata?.chapters_count || 0} chapters
                </span>
              </div>
              
              {content.status === 'completed' && (
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadContentDetails(content.knowledge_id);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContentToShare(content);
                      setShowSharingWorkflow(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs hover:bg-green-200 transition-colors"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Share</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          
          {myContent.length === 0 && !loading && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
              <p className="text-gray-600 mb-4">Create your first educational content to get started</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create Content
              </button>
            </div>
          )}
        </div>
      )}

      {selectedContent && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedContent.topic}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedContent.chapters.length} chapters • Generated {new Date(selectedContent.metadata.generation_completed || '').toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedContent(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to list
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Content Overview */}
              <div className="md:col-span-1">
                <h4 className="font-medium text-gray-900 mb-3">Content Overview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Chapters:</span>
                    <span className="font-medium">{selectedContent.chapters.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mind Maps:</span>
                    <span className="font-medium">{selectedContent.mind_maps.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Quiz Questions:</span>
                    <span className="font-medium">
                      {selectedContent.quiz?.questions?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">External Sources:</span>
                    <span className="font-medium">{selectedContent.external_sources.length}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-medium text-gray-900 mb-3">Actions</h5>
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                      Edit Content
                    </button>
                    <button className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                      Publish to Students
                    </button>
                    <button className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                      Generate Quiz
                    </button>
                    <button className="w-full px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Details */}
              <div className="md:col-span-3">
                <div className="space-y-6">
                  {/* Chapters */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Chapters</h4>
                    <div className="space-y-3">
                      {selectedContent.chapters.map((chapter, index) => (
                        <div key={chapter.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">
                              Chapter {index + 1}: {chapter.metadata?.title || `Chapter ${index + 1}`}
                            </h5>
                            <button className="text-blue-500 hover:text-blue-700 text-sm">
                              Edit
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {chapter.content.substring(0, 200)}...
                          </p>
                          {chapter.metadata?.learning_objectives && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                              <div className="flex flex-wrap gap-1">
                                {chapter.metadata.learning_objectives.slice(0, 3).map((obj: string, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {obj}
                                  </span>
                                ))}
                                {chapter.metadata.learning_objectives.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{chapter.metadata.learning_objectives.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedContent.summary && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Course Summary</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          {selectedContent.summary.overview || 'Summary content available'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* External Sources */}
                  {selectedContent.external_sources.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">External Sources</h4>
                      <div className="space-y-2">
                        {selectedContent.external_sources.map((source, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{source.title}</p>
                              <p className="text-xs text-gray-600">{source.source}</p>
                            </div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 text-sm"
                              >
                                View →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Analytics</h2>
        <p className="text-gray-600">
          Track the performance and engagement of your educational content
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{myContent.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">247</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📈</div>
          <p>Detailed analytics coming soon</p>
          <p className="text-sm">Track student engagement, completion rates, and learning outcomes</p>
        </div>
      </div>
    </div>
  );

  const renderSharingTab = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Content with Students</h2>
        <p className="text-gray-600">
          Manage content sharing and track student progress on shared assignments
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ContentSharingWorkflow
          isOpen={true}
          onClose={() => {}}
          mode="manage"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8">
        {renderTabButton('create', 'Create Content', '✏️')}
        {renderTabButton('manage', 'Manage Content', '📁')}
        {renderTabButton('sharing', 'Share with Students', '👥')}
        {renderTabButton('analytics', 'Analytics', '📊')}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'create' && renderCreateContent()}
        {activeTab === 'manage' && renderManageContent()}
        {activeTab === 'sharing' && renderSharingTab()}
        {activeTab === 'analytics' && renderAnalytics()}
      </motion.div>

      {/* Content Sharing Workflow Modal */}
      <ContentSharingWorkflow
        content={contentToShare}
        isOpen={showSharingWorkflow}
        onClose={() => {
          setShowSharingWorkflow(false);
          setContentToShare(null);
        }}
        mode="share"
      />
    </div>
  );
};

export default ContentManagementInterface;