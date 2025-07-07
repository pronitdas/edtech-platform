import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  BookOpen,
  Code,
  Calculator,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Download,
  BookmarkPlus
} from 'lucide-react'
import { TimelineMarker } from './VideoTypes'

interface Chapter {
  id: string
  title: string
  startTime: number
  endTime: number
  duration: number
  type: 'lecture' | 'demo' | 'exercise' | 'quiz' | 'discussion'
  description?: string
  thumbnailUrl?: string
  isCompleted: boolean
  watchProgress: number // 0-100
  hasNotes: boolean
  hasBookmarks: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  learningObjectives: string[]
  prerequisites: string[]
  resources: {
    type: 'pdf' | 'code' | 'link' | 'exercise'
    title: string
    url: string
  }[]
}

interface ChapterListSidebarProps {
  chapters: Chapter[]
  currentTime: number
  videoDuration: number
  isPlaying: boolean
  onChapterClick: (startTime: number, chapterId: string) => void
  onChapterComplete: (chapterId: string) => void
  onAddNote: (chapterId: string, timestamp: number) => void
  onAddBookmark: (chapterId: string, timestamp: number) => void
  className?: string
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const getChapterIcon = (type: string) => {
  switch (type) {
    case 'demo': return <Play className="h-4 w-4" />
    case 'exercise': return <Code className="h-4 w-4" />
    case 'quiz': return <Calculator className="h-4 w-4" />
    case 'discussion': return <MessageSquare className="h-4 w-4" />
    default: return <BookOpen className="h-4 w-4" />
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-500'
    case 'intermediate': return 'bg-yellow-500'
    case 'advanced': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const ChapterListSidebar: React.FC<ChapterListSidebarProps> = ({
  chapters,
  currentTime,
  videoDuration,
  isPlaying,
  onChapterClick,
  onChapterComplete,
  onAddNote,
  onAddBookmark,
  className = ''
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Find current chapter
  const currentChapterIndex = chapters.findIndex(chapter => 
    currentTime >= chapter.startTime && currentTime <= chapter.endTime
  )

  // Auto-expand current chapter
  useEffect(() => {
    if (currentChapterIndex >= 0) {
      const currentChapter = chapters[currentChapterIndex]
      setExpandedChapters(prev => new Set([...prev, currentChapter.id]))
    }
  }, [currentChapterIndex, chapters])

  // Filter chapters based on search and filter
  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chapter.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'completed' && chapter.isCompleted) ||
                         (filterType === 'incomplete' && !chapter.isCompleted)
    
    return matchesSearch && matchesFilter
  })

  const toggleExpanded = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  const totalDuration = chapters.reduce((sum, chapter) => sum + chapter.duration, 0)
  const completedChapters = chapters.filter(chapter => chapter.isCompleted).length
  const overallProgress = (completedChapters / chapters.length) * 100

  return (
    <div className={`w-80 bg-gray-900 border-l border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Course Content</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Summary */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>{completedChapters} of {chapters.length} chapters</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="flex gap-2">
                {(['all', 'completed', 'incomplete'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                      filterType === filter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChapters.map((chapter, index) => {
          const isCurrentChapter = currentChapterIndex === chapters.indexOf(chapter)
          const isExpanded = expandedChapters.has(chapter.id)
          const chapterProgress = isCurrentChapter 
            ? ((currentTime - chapter.startTime) / chapter.duration) * 100
            : chapter.watchProgress

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`border-b border-gray-800 ${isCurrentChapter ? 'bg-blue-900/20' : ''}`}
            >
              {/* Chapter Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => onChapterClick(chapter.startTime, chapter.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {chapter.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        isCurrentChapter ? 'border-blue-500' : 'border-gray-500'
                      } flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isCurrentChapter ? 'bg-blue-500' : ''
                        }`} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-300">
                        {index + 1}.
                      </span>
                      <div className="flex items-center gap-1">
                        {getChapterIcon(chapter.type)}
                        <span className={`text-sm font-medium ${
                          isCurrentChapter ? 'text-blue-300' : 'text-white'
                        }`}>
                          {chapter.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(chapter.duration)}</span>
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(chapter.difficulty)}`} />
                      <span className="capitalize">{chapter.difficulty}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          chapter.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${chapterProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {chapter.hasNotes && (
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        )}
                        {chapter.hasBookmarks && (
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(chapter.id)
                          }}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Chapter Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-4 bg-gray-850"
                  >
                    {chapter.description && (
                      <p className="text-sm text-gray-300 mb-3">{chapter.description}</p>
                    )}

                    {/* Learning Objectives */}
                    {chapter.learningObjectives.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-400 mb-1">Learning Objectives:</h5>
                        <ul className="space-y-1">
                          {chapter.learningObjectives.map((objective, idx) => (
                            <li key={idx} className="text-xs text-gray-300 pl-2 border-l-2 border-gray-600">
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resources */}
                    {chapter.resources.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-400 mb-1">Resources:</h5>
                        <div className="space-y-1">
                          {chapter.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAddNote(chapter.id, currentTime)}
                        className="flex-1 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                      >
                        Add Note
                      </button>
                      <button
                        onClick={() => onAddBookmark(chapter.id, currentTime)}
                        className="flex-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        Bookmark
                      </button>
                      {!chapter.isCompleted && (
                        <button
                          onClick={() => onChapterComplete(chapter.id)}
                          className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ChapterListSidebar