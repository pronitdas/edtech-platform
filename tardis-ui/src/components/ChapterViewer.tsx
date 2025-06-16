import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKnowledgeData, useChapters } from '../hooks/useKnowledgeData'
import { useLanguage } from '../hooks/useLanguage'
import MarkdownViewer from './MarkdownViewer'
import VideoPlayer from './VideoPlayer'
import QuizComponent from './QuizComponent'
import MindmapViewer from './MindmapViewer'

type TabType = 'content' | 'notes' | 'summary' | 'quiz' | 'mindmap'

export default function ChapterViewer() {
  const { knowledgeId, chapterId } = useParams<{
    knowledgeId: string
    chapterId: string
  }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [editMode, setEditMode] = useState(false)

  const { knowledge, loading: knowledgeLoading } = useKnowledgeData(knowledgeId)
  const { chapters, loading: chaptersLoading } = useChapters(knowledgeId)
  const { language } = useLanguage()

  const currentChapter = chapters.find(ch => ch.id === chapterId)
  const loading = knowledgeLoading || chaptersLoading

  useEffect(() => {
    if (!loading && !currentChapter) {
      navigate('/app')
    }
  }, [loading, currentChapter, navigate])

  const handleSaveContent = async (content: string, type: TabType) => {
    if (!knowledgeId || !chapterId) return

    try {
      const response = await fetch(`/v2/chapters/${knowledgeId}/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          [type]: content,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      setEditMode(false)
      // Refresh chapter data
      // TODO: Add refresh function to useChapters hook
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  const handleGenerateContent = async (type: TabType) => {
    if (!knowledgeId) return

    try {
      const response = await fetch(`/v2/content/generate/${knowledgeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          chapter_id: chapterId,
          content_type: type,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      // TODO: Handle WebSocket updates for generation progress
    } catch (error) {
      console.error('Error generating content:', error)
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
      </div>
    )
  }

  if (!currentChapter) {
    return null
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'content', label: 'Content', icon: '📖' },
    { key: 'notes', label: 'Notes', icon: '📝' },
    { key: 'summary', label: 'Summary', icon: '📋' },
    { key: 'quiz', label: 'Quiz', icon: '❓' },
    { key: 'mindmap', label: 'Mind Map', icon: '🧠' },
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='border-b bg-white shadow-sm'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate('/app')}
                className='text-gray-500 hover:text-gray-700'
              >
                ← Back to Knowledge
              </button>
              <div>
                <h1 className='text-xl font-semibold text-gray-900'>
                  {currentChapter.title}
                </h1>
                <p className='text-sm text-gray-500'>{knowledge?.name}</p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => setEditMode(!editMode)}
                className='rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700'
              >
                {editMode ? 'View' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b bg-white'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex space-x-8'>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className='mr-2'>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='rounded-lg bg-white shadow'>
          <div className='p-6'>
            {activeTab === 'content' && (
              <div className='space-y-6'>
                {currentChapter.video_url && (
                  <VideoPlayer
                    src={currentChapter.video_url}
                    title={currentChapter.title}
                  />
                )}
                <MarkdownViewer
                  content={currentChapter.content || ''}
                  editMode={editMode}
                  onSave={content => handleSaveContent(content, 'content')}
                />
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-medium'>Chapter Notes</h3>
                  {!currentChapter.notes && (
                    <button
                      onClick={() => handleGenerateContent('notes')}
                      className='rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700'
                    >
                      Generate Notes
                    </button>
                  )}
                </div>
                <MarkdownViewer
                  content={currentChapter.notes || 'No notes available'}
                  editMode={editMode}
                  onSave={content => handleSaveContent(content, 'notes')}
                />
              </div>
            )}

            {activeTab === 'summary' && (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-medium'>Chapter Summary</h3>
                  {!currentChapter.summary && (
                    <button
                      onClick={() => handleGenerateContent('summary')}
                      className='rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700'
                    >
                      Generate Summary
                    </button>
                  )}
                </div>
                <MarkdownViewer
                  content={currentChapter.summary || 'No summary available'}
                  editMode={editMode}
                  onSave={content => handleSaveContent(content, 'summary')}
                />
              </div>
            )}

            {activeTab === 'quiz' && (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-medium'>Chapter Quiz</h3>
                  {!currentChapter.quiz && (
                    <button
                      onClick={() => handleGenerateContent('quiz')}
                      className='rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700'
                    >
                      Generate Quiz
                    </button>
                  )}
                </div>
                {currentChapter.quiz ? (
                  <QuizComponent
                    quiz={currentChapter.quiz}
                    chapterId={chapterId}
                    editMode={editMode}
                    onSave={content => handleSaveContent(content, 'quiz')}
                  />
                ) : (
                  <p className='text-gray-500'>No quiz available</p>
                )}
              </div>
            )}

            {activeTab === 'mindmap' && (
              <div>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-medium'>Mind Map</h3>
                  {!currentChapter.mindmap && (
                    <button
                      onClick={() => handleGenerateContent('mindmap')}
                      className='rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700'
                    >
                      Generate Mind Map
                    </button>
                  )}
                </div>
                {currentChapter.mindmap ? (
                  <MindmapViewer
                    data={currentChapter.mindmap}
                    editMode={editMode}
                    onSave={content => handleSaveContent(content, 'mindmap')}
                  />
                ) : (
                  <p className='text-gray-500'>No mind map available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
