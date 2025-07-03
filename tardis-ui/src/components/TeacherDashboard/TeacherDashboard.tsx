import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings,
  Plus,
  FileText,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import ContentManagementInterface from './ContentManagementInterface';
import NavigationHeader from '../navigation/NavigationHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiClient } from '../../services/api-client';
import { useUser } from '../../contexts/UserContext';

interface TeacherStats {
  totalStudents: number;
  totalContent: number;
  activeAssignments: number;
  avgCompletionRate: number;
  recentActivity: Array<{
    student: string;
    content: string;
    progress: number;
    timestamp: string;
  }>;
}

interface ClassroomData {
  classId: string;
  className: string;
  studentCount: number;
  avgProgress: number;
  recentActivity: string;
}

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'students' | 'analytics'>('overview');
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isTeacher } = useUser();

  useEffect(() => {
    if (isTeacher()) {
      loadTeacherData();
    }
  }, [user]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      // In production, these would be real API calls
      // For now, using mock data that represents the expected structure
      
      setTeacherStats({
        totalStudents: 127,
        totalContent: 23,
        activeAssignments: 8,
        avgCompletionRate: 73,
        recentActivity: [
          {
            student: 'Alice Johnson',
            content: 'Quadratic Equations',
            progress: 85,
            timestamp: new Date().toISOString()
          },
          {
            student: 'Bob Smith',
            content: 'Linear Functions',
            progress: 62,
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            student: 'Carol Davis',
            content: 'Polynomial Factoring',
            progress: 94,
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      });

      setClassrooms([
        {
          classId: '1',
          className: 'Advanced Algebra - Period 1',
          studentCount: 28,
          avgProgress: 78,
          recentActivity: '2 hours ago'
        },
        {
          classId: '2', 
          className: 'Geometry - Period 3',
          studentCount: 31,
          avgProgress: 65,
          recentActivity: '4 hours ago'
        },
        {
          classId: '3',
          className: 'Pre-Calculus - Period 5',
          studentCount: 25,
          avgProgress: 82,
          recentActivity: '1 hour ago'
        }
      ]);

    } catch (err: any) {
      setError('Failed to load teacher data');
      console.error('Error loading teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (
    tab: 'overview' | 'content' | 'students' | 'analytics',
    label: string,
    icon: React.ReactNode
  ) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-500 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-white">{teacherStats?.totalStudents || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span>
              <span className="text-gray-400 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Content Created</p>
                <p className="text-2xl font-bold text-white">{teacherStats?.totalContent || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Plus className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">5 new</span>
              <span className="text-gray-400 ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Assignments</p>
                <p className="text-2xl font-bold text-white">{teacherStats?.activeAssignments || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-yellow-500">3 due</span>
              <span className="text-gray-400 ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg Completion</p>
                <p className="text-2xl font-bold text-white">{teacherStats?.avgCompletionRate || 0}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+5%</span>
              <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classrooms and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classrooms */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <GraduationCap className="mr-2" size={20} />
              Your Classrooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classrooms.map((classroom) => (
                <div key={classroom.classId} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{classroom.className}</h4>
                    <p className="text-sm text-gray-400">{classroom.studentCount} students</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{classroom.avgProgress}%</div>
                    <div className="text-xs text-gray-400">{classroom.recentActivity}</div>
                  </div>
                  <div className="ml-4">
                    <div className="w-16 h-2 bg-gray-600 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${classroom.avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="mr-2" size={20} />
              Recent Student Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teacherStats?.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{activity.student}</h4>
                    <p className="text-sm text-gray-400">{activity.content}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      activity.progress >= 80 ? 'text-green-400' :
                      activity.progress >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {activity.progress}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab('content')}
              className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="h-6 w-6 text-white mb-2" />
              <h3 className="font-medium text-white">Create New Content</h3>
              <p className="text-sm text-blue-100">Generate comprehensive educational materials</p>
            </button>
            
            <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              <Users className="h-6 w-6 text-white mb-2" />
              <h3 className="font-medium text-white">Manage Students</h3>
              <p className="text-sm text-green-100">View progress and assign content</p>
            </button>
            
            <button 
              onClick={() => setActiveTab('analytics')}
              className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-white mb-2" />
              <h3 className="font-medium text-white">View Analytics</h3>
              <p className="text-sm text-purple-100">Track learning outcomes and engagement</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Student Management</h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center">
          <Plus size={16} className="mr-2" />
          Add Student
        </button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Student Management</h3>
            <p>Detailed student progress tracking and management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Learning Analytics</h2>
        <div className="flex space-x-2">
          <select className="px-3 py-2 bg-gray-700 text-white rounded border-gray-600">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Class Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Detailed analytics dashboard coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Content Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p>Content performance metrics coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isTeacher()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">This dashboard is only available to teachers.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'Teacher'}!
          </h1>
          <p className="text-gray-400">
            Manage your classes, create content, and track student progress
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          {renderTabButton('overview', 'Overview', <BarChart3 size={18} />)}
          {renderTabButton('content', 'Content', <FileText size={18} />)}
          {renderTabButton('students', 'Students', <Users size={18} />)}
          {renderTabButton('analytics', 'Analytics', <TrendingUp size={18} />)}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'content' && <ContentManagementInterface />}
          {activeTab === 'students' && renderStudentsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </motion.div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;