import { useState, useEffect } from 'react';
import { interactionTracker } from '@/services/interaction-tracking';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { X, BarChart2, PieChart, FileText, Award, BookOpen, Brain } from 'lucide-react';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface LearningReportProps {
  onClose: () => void;
}

const LearningReport = ({ onClose }: LearningReportProps) => {
  const [data, setData] = useState(interactionTracker.getData());
  const [analysis, setAnalysis] = useState(interactionTracker.generateAnalysis());
  const [activeTab, setActiveTab] = useState('overview');

  // Prepare data for pie chart
  const pieChartData = {
    labels: ['Quiz', 'Notes', 'Summary', 'Mindmap', 'Animation'],
    datasets: [
      {
        data: [
          data.quizClicks,
          data.notesClicks,
          data.summaryClicks,
          data.mindmapClicks,
          data.animationViews
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare data for bar chart
  const barChartData = {
    labels: ['Plays', 'Pauses', 'Timeline Seeks', 'Watch Duration (s)'],
    datasets: [
      {
        label: 'Video Engagement',
        data: [
          data.videoPlays,
          data.videoPauses,
          data.timelineSeeks,
          data.videoWatchDuration.toFixed(2)
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Interaction Distribution', color: '#fff', font: { size: 16 } }
    }
  };

  const barChartOptions = {
    responsive: true,
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Video Engagement Metrics', color: '#fff', font: { size: 16 } }
    }
  };

  // Define tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-5 h-5" /> },
    { id: 'analysis', label: 'Analysis', icon: <Brain className="w-5 h-5" /> },
    { id: 'charts', label: 'Charts', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'questions', label: 'Questions', icon: <BookOpen className="w-5 h-5" /> }
  ];

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
            onClick={onClose}
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
        <div className="mb-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-indigo-400">Video Engagement</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="text-gray-300">Video Plays:</span>
                    <span className="font-semibold">{data.videoPlays}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Watch Duration:</span>
                    <span className="font-semibold">{data.videoWatchDuration.toFixed(2)} seconds</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Video Pauses:</span>
                    <span className="font-semibold">{data.videoPauses}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Timeline Seeks:</span>
                    <span className="font-semibold">{data.timelineSeeks}</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-indigo-400">Feature Usage</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="text-gray-300">Quiz Interactions:</span>
                    <span className="font-semibold">{data.quizClicks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Notes Interactions:</span>
                    <span className="font-semibold">{data.notesClicks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Summary Interactions:</span>
                    <span className="font-semibold">{data.summaryClicks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Mindmap Interactions:</span>
                    <span className="font-semibold">{data.mindmapClicks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-300">Animation Views:</span>
                    <span className="font-semibold">{data.animationViews}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-indigo-400">Learning Analysis</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Understanding</h4>
                  <p className="text-gray-300">{analysis.understanding}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Confidence</h4>
                  <p className="text-gray-300">{analysis.confidence}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Strengths</h4>
                  <p className="text-gray-300">{analysis.strengths}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Weaknesses</h4>
                  <p className="text-gray-300">{analysis.weaknesses}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Areas for Improvement</h4>
                  <p className="text-gray-300">{analysis.improvement}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Charts Tab */}
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="h-64">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="h-64">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
            </div>
          )}
          
          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-indigo-400">Chatbot Questions</h3>
                <span className="bg-indigo-600 text-white text-sm px-2 py-1 rounded-full">
                  Total: {data.chatbotQuestions.length}
                </span>
              </div>
              
              {data.chatbotQuestions.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {data.chatbotQuestions.map((q, index) => (
                    <li key={index} className="bg-gray-700 p-3 rounded-md">
                      <div className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full mt-1">
                          Q{index + 1}
                        </span>
                        <p className="text-gray-200">{q}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No questions have been asked yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button 
            onClick={onClose}
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