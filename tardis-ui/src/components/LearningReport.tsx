import { useState, useEffect } from 'react'
// import { interactionTracker } from '@/services/interaction-tracking';
import { analyticsService } from '@/services/analytics-service'
import { LearningAnalytics } from '@/types/api' // Import the type
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2' // Keep for now, might remove later
import {
  X,
  BarChart2,
  PieChart,
  FileText,
  Award,
  BookOpen,
  Brain,
  Loader2,
} from 'lucide-react'
import { LearningAnalyticsDashboard } from './analytics/LearningAnalyticsDashboard'

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
)

// REMOVE OLD INTERFACE
/*
interface InteractionData {
  videoPlays: number;
  videoWatchDuration: number;
  videoPauses: number;
  timelineSeeks: number;
  quizClicks: number;
  notesClicks: number;
  summaryClicks: number;
  mindmapClicks: number;
  animationViews: number;
  chatbotQuestions: string[];
  chapterNavigations: { chapterId: string; timestamp: number }[];
}
*/

interface LearningReportProps {
  userId: string
  knowledgeId: string // Use knowledgeId for consistency
  onClose?: () => void
  // learningData?: InteractionData; // Remove old prop
}

const LearningReport = ({
  userId,
  knowledgeId,
  onClose,
}: LearningReportProps) => {
  // const [data, setData] = useState<InteractionData>(learningData || interactionTracker.getData());
  // const [analysis, setAnalysis] = useState(interactionTracker.generateAnalysis());
  const [analyticsData, setAnalyticsData] = useState<LearningAnalytics | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState('analysis') // Default to analysis now

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId || !knowledgeId) {
        setError('User ID or Knowledge ID is missing.')
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // TODO: Verify/update analyticsService to return LearningAnalytics structure
        // Assuming getUserCompletion or a similar function returns the required data.
        // The current getUserCompletion returns { completion: number, ... }
        // We might need a new function like getUserLearningAnalytics(userId, knowledgeId)
        const fetchedData = await analyticsService.getUserCompletion(
          userId,
          knowledgeId
        )

        // TEMP: Map fetched data to LearningAnalytics - replace with actual data structure later
        const mappedData: LearningAnalytics = {
          engagement_score: fetchedData.engagement_score || null,
          understanding_level: fetchedData.understanding || 'Not available',
          strengths: fetchedData.strengths || [],
          weaknesses: fetchedData.weaknesses || [],
          recommendations: fetchedData.recommendations || [],
          user_id: userId,
          knowledge_id: knowledgeId,
          total_time: 0, // Placeholder
          completion_rate: 0, // Placeholder
          last_activity: new Date().toISOString(), // Placeholder
          analytics_data: {}, // Placeholder
        }

        // setAnalyticsData(fetchedData as LearningAnalytics); // Use this once service returns correct type
        setAnalyticsData(mappedData)
      } catch (err) {
        console.error('Failed to fetch learning analytics:', err)
        setError('Could not load learning analytics data.')
        setAnalyticsData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [userId, knowledgeId])

  // REMOVE OLD CHART DATA PREPARATION (Pie and Bar)
  // ... (pieChartData preparation removed)
  // ... (barChartData preparation removed)

  // REMOVE OLD useEffect for analysis generation
  /*
  useEffect(() => {
    // ... (old analysis generation logic removed)
  }, [learningData]);
  */

  // Chart options (Keep for now, might reuse or remove)
  const pieChartOptions = {
    // ... existing code ...
  }

  // Define tabs (removing Overview, Charts, Questions)
  const tabs = [
    // { id: 'overview', label: 'Overview', icon: <FileText className="w-5 h-5" /> },
    { id: 'analysis', label: 'Analysis', icon: <Brain className='h-5 w-5' /> },
    // { id: 'charts', label: 'Charts', icon: <BarChart2 className="w-5 h-5" /> },
    // { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> }
  ]

  // Handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm'>
      <div
        className='w-full max-w-5xl overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-6 text-white shadow-2xl'
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className='mb-6 flex items-center justify-between border-b border-gray-700 pb-4'>
          <div className='flex items-center gap-3'>
            <Award className='h-8 w-8 text-indigo-500' />
            <h2 className='text-3xl font-bold'>Learning Report</h2>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 transition-colors hover:text-white'
            aria-label='Close'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* Tabs */}
        <div className='mb-6'>
          <div className='flex space-x-2 border-b border-gray-700'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-400 text-indigo-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className='mb-6 min-h-[200px]'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-indigo-500' />
              <span className='ml-2 text-gray-300'>Loading report...</span>
            </div>
          ) : error ? (
            <div className='flex h-full items-center justify-center text-red-500'>
              <X className='mr-2 h-6 w-6' />
              <span>{error}</span>
            </div>
          ) : (
            <LearningAnalyticsDashboard
              userId={userId}
              knowledgeId={knowledgeId}
            />
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end border-t border-gray-700 pt-4'>
          <button
            onClick={handleClose}
            className='rounded-md bg-indigo-600 px-6 py-2 font-medium text-white shadow transition duration-200 ease-in-out hover:bg-indigo-700'
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default LearningReport
