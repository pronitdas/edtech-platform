import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, BookOpen, Video, FileText, Brain, X, Clock, Star } from 'lucide-react';
import { semanticSearchService } from '../../services/semantic-search-service';
import { useUser } from '../../contexts/UserContext';
import { useInteractionTracker } from '../../contexts/InteractionTrackerContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'quiz' | 'notes' | 'interactive' | 'chapter' | 'mindmap';
  relevance_score: number;
  knowledge_id?: string;
  chapter_id?: string;
  metadata?: {
    difficulty?: string;
    duration?: number;
    topic_tags?: string[];
    last_accessed?: string;
  };
}

interface SemanticSearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect: (result: SearchResult) => void;
  initialQuery?: string;
  contentFilter?: string[];
  showFilters?: boolean;
}

const SemanticSearchInterface: React.FC<SemanticSearchInterfaceProps> = ({
  isOpen,
  onClose,
  onResultSelect,
  initialQuery = '',
  contentFilter = [],
  showFilters = true
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(contentFilter);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { user } = useUser();
  const { trackContentView } = useInteractionTracker();

  // Content type configuration
  const contentTypes = [
    { type: 'video', label: 'Videos', icon: Video, color: 'bg-red-100 text-red-600' },
    { type: 'quiz', label: 'Quizzes', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { type: 'notes', label: 'Notes', icon: FileText, color: 'bg-green-100 text-green-600' },
    { type: 'interactive', label: 'Interactive', icon: Brain, color: 'bg-purple-100 text-purple-600' },
    { type: 'chapter', label: 'Chapters', icon: BookOpen, color: 'bg-orange-100 text-orange-600' },
    { type: 'mindmap', label: 'Mind Maps', icon: Brain, color: 'bg-pink-100 text-pink-600' }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('semantic_search_recent');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('semantic_search_recent', JSON.stringify(updated));
  }, [recentSearches]);

  // Perform semantic search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await semanticSearchService.performSearch({
        query: searchQuery,
        user_id: user?.id || 'anonymous',
        content_types: selectedFilters.length > 0 ? selectedFilters : undefined,
        difficulty_level: difficultyFilter || undefined,
        limit: 20,
        include_related: true
      });

      if (response.success && response.data.results) {
        setResults(response.data.results);
        saveRecentSearch(searchQuery);
        
        // Track search event
        trackContentView('search', {
          knowledgeId: 'semantic_search',
          moduleId: 'search_interface',
          contentType: 'search',
          query: searchQuery,
          resultsCount: response.data.results.length,
          filters: selectedFilters,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Semantic search error:', error);
      setResults([]);
    }
    setLoading(false);
  }, [user?.id, selectedFilters, difficultyFilter, saveRecentSearch, trackContentView]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Filter handlers
  const toggleFilter = (filterType: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterType) 
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setDifficultyFilter('');
  };

  // Result selection handler
  const handleResultSelect = (result: SearchResult) => {
    trackContentView(result.id, {
      knowledgeId: result.knowledge_id || 'unknown',
      moduleId: result.chapter_id || 'unknown',
      contentType: result.content_type,
      searchQuery: query,
      relevanceScore: result.relevance_score,
      timestamp: Date.now()
    });
    
    onResultSelect(result);
    onClose();
  };

  // Get icon for content type
  const getContentIcon = (type: string) => {
    const config = contentTypes.find(ct => ct.type === type);
    return config ? config.icon : FileText;
  };

  // Get color for content type
  const getContentColor = (type: string) => {
    const config = contentTypes.find(ct => ct.type === type);
    return config ? config.color : 'bg-gray-100 text-gray-600';
  };

  // Relevance score color
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Semantic Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for concepts, topics, or specific content..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              autoFocus
            />
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(recent)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Content Type:</span>
              </div>
              
              {contentTypes.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedFilters.includes(type)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {(selectedFilters.length > 0 || difficultyFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="p-6 space-y-4">
              {results.map((result) => {
                const Icon = getContentIcon(result.content_type);
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${getContentColor(result.content_type)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 line-clamp-1">{result.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{result.description}</p>
                          </div>
                        </div>
                        
                        {result.metadata && (
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            {result.metadata.difficulty && (
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {result.metadata.difficulty}
                              </span>
                            )}
                            {result.metadata.duration && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {result.metadata.duration} min
                              </span>
                            )}
                            {result.metadata.topic_tags && result.metadata.topic_tags.length > 0 && (
                              <div className="flex space-x-1">
                                {result.metadata.topic_tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <div className={`flex items-center ${getRelevanceColor(result.relevance_score)}`}>
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            {Math.round(result.relevance_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-center">
                Try adjusting your search terms or removing some filters
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start your semantic search</h3>
              <p className="text-center">
                Type a concept, topic, or question to find relevant learning content
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {results.length > 0 && (
                <span>{results.length} results found</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Powered by semantic AI</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SemanticSearchInterface;