import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PenTool,
  Users,
  TrendingUp,
  Eye,
  Heart,
  FileText,
  Video,
  Zap,
  BarChart3,
  Share2,
  Settings,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import TopicContentGenerator from '../ContentGeneration/TopicContentGenerator'

interface ContentStats {
  totalContent: number
  publishedContent: number
  totalViews: number
  totalLikes: number
  averageRating: number
  monthlyViews: number
}

interface ContentItem {
  id: string
  title: string
  type: 'video' | 'interactive' | 'quiz' | 'simulation' | 'text'
  status: 'draft' | 'review' | 'published' | 'archived'
  views: number
  likes: number
  createdAt: string
  lastModified: string
  tags: string[]
}

interface Analytics {
  popularContent: ContentItem[]
  recentViews: { date: string; views: number }[]
  userEngagement: { metric: string; value: number; change: number }[]
}

const ContentCreatorDashboard: React.FC = () => {
  const { user } = useUser()
  const { trackEvent } = useInteractionTracker()
  const [stats, setStats] = useState<ContentStats | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics'>('overview')
  const [showTopicGenerator, setShowTopicGenerator] = useState(false)

  useEffect(() => {
    const loadCreatorData = async () => {
      setLoading(true)
      try {
        // Fetch creator stats
        const statsResponse = await fetch(`/api/v2/creator/stats`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        if (statsResponse.ok) {
          setStats(await statsResponse.json())
        }

        // Fetch content
        const contentResponse = await fetch(`/api/v2/creator/content`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        if (contentResponse.ok) {
          setContent(await contentResponse.json())
        }

        // Fetch analytics
        const analyticsResponse = await fetch(`/api/v2/creator/analytics`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        if (analyticsResponse.ok) {
          setAnalytics(await analyticsResponse.json())
        }

        trackEvent({
          eventType: 'dashboard_view',
          contentId: 'creator_dashboard',
          knowledgeId: 'dashboard',
          moduleId: 'creator_mode',
          contentType: 'dashboard',
          timestamp: Date.now()
        })

      } catch (error) {
        console.error('Error loading creator data:', error)
        // Set fallback empty states
        setStats({
          totalContent: 0,
          publishedContent: 0,
          totalViews: 0,
          totalLikes: 0,
          averageRating: 0,
          monthlyViews: 0
        })
        setContent([])
        setAnalytics({
          popularContent: [],
          recentViews: [],
          userEngagement: []
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadCreatorData()
    }
  }, [user, trackEvent])

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'interactive': return Zap
      case 'quiz': return FileText
      case 'simulation': return Settings
      default: return FileText
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-900 text-green-400'
      case 'review': return 'bg-yellow-900 text-yellow-400'
      case 'draft': return 'bg-gray-700 text-gray-400'
      case 'archived': return 'bg-red-900 text-red-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center">
        <div className="text-white">Loading your creator dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Creator Studio 🎨
          </h1>
          <p className="text-gray-400">
            Manage and analyze your educational content
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {stats?.totalContent || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Total Content</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Share2 className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold text-white">
                {stats?.publishedContent || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Published</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Eye className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {stats?.totalViews?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Total Views</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-8 w-8 text-red-400" />
              <span className="text-2xl font-bold text-white">
                {stats?.totalLikes?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Total Likes</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {stats?.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Avg Rating</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-indigo-400" />
              <span className="text-2xl font-bold text-white">
                {stats?.monthlyViews?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">This Month</h3>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-900 rounded-lg p-1">
          {['overview', 'content', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTopicGenerator(true)}
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors"
                >
                  <Plus className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">Create Content</h3>
                  <p className="text-blue-100 text-sm">Start a new educational resource</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white transition-colors"
                >
                  <BarChart3 className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">View Analytics</h3>
                  <p className="text-green-100 text-sm">Analyze content performance</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white transition-colors"
                >
                  <Search className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">Content Library</h3>
                  <p className="text-purple-100 text-sm">Browse and manage all content</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-orange-600 hover:bg-orange-700 rounded-lg p-6 text-white transition-colors"
                >
                  <Settings className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">AI Tools</h3>
                  <p className="text-orange-100 text-sm">Use AI-powered content generation</p>
                </motion.button>
              </div>
            </div>

            {/* Recent Content */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Recent Content</h2>
              <div className="space-y-4">
                {content.slice(0, 5).map((item, index) => {
                  const Icon = getContentTypeIcon(item.type)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-blue-400 mr-3" />
                          <h3 className="text-white font-medium">{item.title}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Modified: {item.lastModified}</span>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {item.views}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {item.likes}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                
                {content.length === 0 && (
                  <div className="bg-gray-900 rounded-lg p-8 text-center">
                    <PenTool className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No content yet!</p>
                    <p className="text-gray-500 text-sm mt-2">Create your first educational resource to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Content Library</h2>
              <div className="flex items-center space-x-4">
                <button className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  New Content
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item, index) => {
                const Icon = getContentTypeIcon(item.type)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="h-8 w-8 text-blue-400" />
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>Type: {item.type}</span>
                      <span>{item.createdAt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {item.views}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {item.likes}
                        </span>
                      </div>
                      <button className="text-blue-400 hover:text-blue-300">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Content Analytics</h2>
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Advanced analytics coming soon!</p>
              <p className="text-gray-500 text-sm mt-2">
                Track detailed performance metrics for your content.
              </p>
            </div>
          </div>
        )}

        {/* Topic Generator Modal */}
        {showTopicGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Generate New Content</h2>
                  <button
                    onClick={() => setShowTopicGenerator(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="text-gray-600 mb-6">
                  Create comprehensive educational content from any topic using AI
                </div>
                
                <TopicContentGenerator
                  onContentGenerated={(contentId) => {
                    console.log('New content generated:', contentId);
                    setShowTopicGenerator(false);
                    // Refresh the content list
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentCreatorDashboard