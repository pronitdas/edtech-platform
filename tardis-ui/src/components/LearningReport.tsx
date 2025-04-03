import { useState, useEffect } from 'react';
// import { interactionTracker } from '@/services/interaction-tracking';
import { analyticsService } from '@/services/analytics-service';
import { LearningAnalytics } from '@/types/database'; // Import the type
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2'; // Keep for now, might remove later
import { X, BarChart2, PieChart, FileText, Award, BookOpen, Brain, Loader2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
  userId: string;
  knowledgeId: string; // Use knowledgeId for consistency
  onClose?: () => void;
  // learningData?: InteractionData; // Remove old prop
}

const LearningReport = ({ userId, knowledgeId, onClose }: LearningReportProps) => {
  // const [data, setData] = useState<InteractionData>(learningData || interactionTracker.getData());
  // const [analysis, setAnalysis] = useState(interactionTracker.generateAnalysis());
  const [analyticsData, setAnalyticsData] = useState<LearningAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('analysis'); // Default to analysis now

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId || !knowledgeId) {
        setError("User ID or Knowledge ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Verify/update analyticsService to return LearningAnalytics structure
        // Assuming getUserCompletion or a similar function returns the required data.
        // The current getUserCompletion returns { completion: number, ... }
        // We might need a new function like getUserLearningAnalytics(userId, knowledgeId)
        const fetchedData = await analyticsService.getUserCompletion(userId, knowledgeId);
        
        // TEMP: Map fetched data to LearningAnalytics - replace with actual data structure later
        const mappedData: LearningAnalytics = {
            engagement_score: fetchedData.engagement_score || null,
            understanding_level: fetchedData.understanding || "Not available",
            strengths: fetchedData.strengths || [],
            weaknesses: fetchedData.weaknesses || [],
            recommendations: fetchedData.recommendations || []
        }
        
        // setAnalyticsData(fetchedData as LearningAnalytics); // Use this once service returns correct type
        setAnalyticsData(mappedData);

      } catch (err) {
        console.error("Failed to fetch learning analytics:", err);
        setError("Could not load learning analytics data.");
        setAnalyticsData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, knowledgeId]);

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
  };

  // Define tabs (removing Overview, Charts, Questions)
  const tabs = [
    // { id: 'overview', label: 'Overview', icon: <FileText className="w-5 h-5" /> },
    { id: 'analysis', label: 'Analysis', icon: <Brain className="w-5 h-5" /> },
    // { id: 'charts', label: 'Charts', icon: <BarChart2 className="w-5 h-5" /> },
    // { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> }
  ];

  // Handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-2xl max-w-4xl w-full overflow-auto border border-gray-700" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-500" />
            <h2 className="text-3xl font-bold">Learning Report</h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-4 transition-colors ${
                  activeTab === tab.id 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
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
        <div className="mb-6 min-h-[200px]">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-2 text-gray-300">Loading analysis...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-red-500">
              <X className="w-6 h-6 mr-2" />
              <span>{error}</span>
            </div>
          )}
          {!isLoading && !error && analyticsData && (
            <>
              {/* REMOVE Overview Tab Content */}
              {/* {activeTab === 'overview' && ( ... )} */}

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                   <div className="bg-gray-800 p-4 rounded-lg">
                     <h3 className="text-xl font-semibold mb-3 text-indigo-400">Understanding Level</h3>
                     <p className="text-gray-300">{analyticsData.understanding_level || 'Analysis pending...'}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-gray-800 p-4 rounded-lg">
                       <h3 className="text-xl font-semibold mb-3 text-green-500">Strengths</h3>
                       {analyticsData.strengths && analyticsData.strengths.length > 0 ? (
                         <ul className="list-disc pl-5 text-gray-300 space-y-2">
                           {analyticsData.strengths.map((item, index) => <li key={index}>{item}</li>)}
                         </ul>
                       ) : (
                         <p className="text-gray-400 italic">No specific strengths identified yet.</p>
                       )}
                     </div>
                     <div className="bg-gray-800 p-4 rounded-lg">
                       <h3 className="text-xl font-semibold mb-3 text-yellow-500">Areas for Improvement</h3>
                       {analyticsData.weaknesses && analyticsData.weaknesses.length > 0 ? (
                         <ul className="list-disc pl-5 text-gray-300 space-y-2">
                           {analyticsData.weaknesses.map((item, index) => <li key={index}>{item}</li>)}
                         </ul>
                       ) : (
                         <p className="text-gray-400 italic">Keep up the great work!</p>
                       )}
                     </div>
                   </div>
                   <div className="bg-gray-800 p-4 rounded-lg">
                     <h3 className="text-xl font-semibold mb-3 text-blue-500">Recommendations</h3>
                      {analyticsData.recommendations && analyticsData.recommendations.length > 0 ? (
                         <ul className="list-disc pl-5 text-gray-300 space-y-2">
                           {analyticsData.recommendations.map((item, index) => <li key={index}>{item}</li>)}
                         </ul>
                       ) : (
                         <p className="text-gray-400 italic">No specific recommendations at this time.</p>
                       )}
                   </div>
                   {analyticsData.engagement_score && (
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <h3 className="text-lg font-semibold mb-2 text-indigo-400">Engagement Score</h3>
                        <p className="text-4xl font-bold text-white">{analyticsData.engagement_score}</p>
                        <p className="text-xs text-gray-400 mt-1">Based on interactions across the content</p>
                    </div>
                   )}
                </div>
              )}

              {/* REMOVE Charts Tab Content */}
              {/* {activeTab === 'charts' && ( ... )} */}

              {/* REMOVE Questions Tab Content */}
              {/* {activeTab === 'questions' && ( ... )} */}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button 
            onClick={handleClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow transition duration-200 ease-in-out"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningReport; 