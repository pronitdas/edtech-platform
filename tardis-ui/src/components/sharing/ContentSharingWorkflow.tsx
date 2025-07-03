import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Users, 
  Send, 
  Copy, 
  Check, 
  BookOpen, 
  Clock, 
  Star,
  UserPlus,
  Mail,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { apiClient } from '@/services/api-client';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  class_id?: string;
  class_name?: string;
  progress?: {
    completed_content: number;
    total_content: number;
    last_active: string;
  };
}

interface SharedContent {
  knowledge_id: string;
  topic: string;
  content_type: 'complete' | 'chapter' | 'quiz' | 'notes';
  difficulty_level: string;
  estimated_time: number;
  chapters_count: number;
  created_at: string;
  status: 'active' | 'archived' | 'draft';
}

interface SharingAssignment {
  id: string;
  content: SharedContent;
  students: Student[];
  due_date?: string;
  instructions?: string;
  shared_at: string;
  completion_stats: {
    completed: number;
    in_progress: number;
    not_started: number;
  };
}

interface ContentSharingWorkflowProps {
  content?: SharedContent;
  isOpen: boolean;
  onClose: () => void;
  mode: 'share' | 'manage' | 'view';
}

const ContentSharingWorkflow: React.FC<ContentSharingWorkflowProps> = ({
  content,
  isOpen,
  onClose,
  mode = 'share'
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<SharingAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'select' | 'assign' | 'manage'>('select');
  const [assignmentData, setAssignmentData] = useState({
    due_date: '',
    instructions: '',
    send_notification: true,
    access_level: 'view_only' // 'view_only' | 'interactive' | 'collaborative'
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  const { user, isTeacher } = useUser();
  const { trackContentView } = useInteractionTracker();

  useEffect(() => {
    if (isOpen) {
      if (mode === 'share') {
        setActiveTab('select');
        loadStudents();
      } else if (mode === 'manage') {
        setActiveTab('manage');
        loadAssignments();
      }
    }
  }, [isOpen, mode]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v2/teacher/students?teacher_id=${user?.id}`);
      if (response.data?.students) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      // Mock data for demo
      setStudents([
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice.johnson@school.edu',
          class_id: 'math_101',
          class_name: 'Mathematics 101',
          progress: { completed_content: 8, total_content: 12, last_active: '2024-01-15' }
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob.smith@school.edu',
          class_id: 'math_101',
          class_name: 'Mathematics 101',
          progress: { completed_content: 5, total_content: 12, last_active: '2024-01-14' }
        },
        {
          id: '3',
          name: 'Carol Davis',
          email: 'carol.davis@school.edu',
          class_id: 'math_102',
          class_name: 'Advanced Mathematics',
          progress: { completed_content: 15, total_content: 18, last_active: '2024-01-15' }
        }
      ]);
    }
    setLoading(false);
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v2/teacher/assignments?teacher_id=${user?.id}`);
      if (response.data?.assignments) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      // Mock data for demo
      setAssignments([
        {
          id: '1',
          content: {
            knowledge_id: 'k1',
            topic: 'Quadratic Equations',
            content_type: 'complete',
            difficulty_level: 'intermediate',
            estimated_time: 45,
            chapters_count: 5,
            created_at: '2024-01-10',
            status: 'active'
          },
          students: students.slice(0, 2),
          due_date: '2024-01-20',
          instructions: 'Complete all chapters and quiz',
          shared_at: '2024-01-12',
          completion_stats: { completed: 1, in_progress: 1, not_started: 0 }
        }
      ]);
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !classFilter || student.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = [...new Set(students.map(s => s.class_name).filter(Boolean))];

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleShareContent = async () => {
    if (!content || selectedStudents.length === 0) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/api/v2/teacher/share-content', {
        teacher_id: user?.id,
        content_id: content.knowledge_id,
        student_ids: selectedStudents,
        assignment_data: assignmentData
      });

      if (response.data?.success) {
        // Track sharing event
        trackContentView('content_shared', {
          knowledgeId: content.knowledge_id,
          moduleId: 'teacher_sharing',
          contentType: 'sharing_assignment',
          studentCount: selectedStudents.length,
          timestamp: Date.now()
        });

        setActiveTab('manage');
        loadAssignments();
      }
    } catch (error) {
      console.error('Error sharing content:', error);
    }
    setLoading(false);
  };

  const copyShareLink = async (contentId: string) => {
    const shareLink = `${window.location.origin}/shared-content/${contentId}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const renderStudentSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Select Students</h3>
        <span className="text-sm text-gray-400">
          {selectedStudents.length} selected
        </span>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {uniqueClasses.map(className => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            onClick={() => handleStudentSelect(student.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedStudents.includes(student.id)
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-600 bg-gray-700 text-white hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedStudents.includes(student.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedStudents.includes(student.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{student.name}</h4>
                    <p className="text-sm opacity-70">{student.email}</p>
                    {student.class_name && (
                      <p className="text-xs opacity-60">{student.class_name}</p>
                    )}
                  </div>
                </div>
              </div>
              {student.progress && (
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {Math.round((student.progress.completed_content / student.progress.total_content) * 100)}%
                  </div>
                  <div className="text-xs opacity-60">
                    {student.progress.completed_content}/{student.progress.total_content} completed
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedStudents.length > 0 && (
        <button
          onClick={() => setActiveTab('assign')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Assignment Details
        </button>
      )}
    </div>
  );

  const renderAssignmentDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Assignment Details</h3>
        <button
          onClick={() => setActiveTab('select')}
          className="text-gray-400 hover:text-white"
        >
          ← Back
        </button>
      </div>

      {/* Content Summary */}
      {content && (
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              <h4 className="font-medium text-white">{content.topic}</h4>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>{content.chapters_count} chapters</span>
              <span>{content.estimated_time} min</span>
              <span className="capitalize">{content.difficulty_level}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Options */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Due Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={assignmentData.due_date}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, due_date: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Instructions for Students
          </label>
          <textarea
            value={assignmentData.instructions}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="Add any special instructions or notes for students..."
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Access Level
          </label>
          <select
            value={assignmentData.access_level}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, access_level: e.target.value as any }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="view_only">View Only - Students can read content</option>
            <option value="interactive">Interactive - Students can take quizzes</option>
            <option value="collaborative">Collaborative - Students can contribute</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="send_notification"
            checked={assignmentData.send_notification}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, send_notification: e.target.checked }))}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="send_notification" className="text-sm text-gray-300">
            Send email notification to students
          </label>
        </div>
      </div>

      {/* Selected Students Summary */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Selected Students ({selectedStudents.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {students
            .filter(s => selectedStudents.includes(s.id))
            .map(student => (
              <span
                key={student.id}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {student.name}
              </span>
            ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleShareContent}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sharing...' : 'Share Content'}
        </button>
        <button
          onClick={() => copyShareLink(content?.knowledge_id || '')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const renderAssignmentManagement = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Manage Assignments</h3>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h4 className="font-medium mb-2">No shared content yet</h4>
          <p>Start sharing content with your students to see assignments here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(assignment => (
            <Card key={assignment.id} className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                      <h4 className="font-medium text-white">{assignment.content.topic}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.content.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.content.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-300 mb-2">
                      <span>{assignment.students.length} students</span>
                      <span>Shared {new Date(assignment.shared_at).toLocaleDateString()}</span>
                      {assignment.due_date && (
                        <span>Due {new Date(assignment.due_date).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Progress Summary */}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-400">
                        {assignment.completion_stats.completed} completed
                      </span>
                      <span className="text-yellow-400">
                        {assignment.completion_stats.in_progress} in progress
                      </span>
                      <span className="text-gray-400">
                        {assignment.completion_stats.not_started} not started
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedAssignment(
                      expandedAssignment === assignment.id ? null : assignment.id
                    )}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {expandedAssignment === assignment.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedAssignment === assignment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-600"
                    >
                      <div className="space-y-3">
                        {assignment.instructions && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-300 mb-1">Instructions</h5>
                            <p className="text-sm text-gray-400">{assignment.instructions}</p>
                          </div>
                        )}

                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Students</h5>
                          <div className="space-y-1">
                            {assignment.students.map(student => (
                              <div key={student.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{student.name}</span>
                                <span className="text-gray-400">
                                  {student.progress ? 
                                    `${student.progress.completed_content}/${student.progress.total_content} completed` :
                                    'Not started'
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyShareLink(assignment.content.knowledge_id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Copy Link
                          </button>
                          <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors">
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

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
        className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">
              {mode === 'share' ? 'Share Content with Students' : 'Manage Shared Content'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {activeTab === 'select' && renderStudentSelection()}
          {activeTab === 'assign' && renderAssignmentDetails()}
          {activeTab === 'manage' && renderAssignmentManagement()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContentSharingWorkflow;