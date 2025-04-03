import React, { useState } from 'react';
import { useLearningAnalytics } from '@/hooks/useLearningAnalytics';
import { EngagementScoreCard } from './EngagementScoreCard';
import { UnderstandingLevelDisplay } from './UnderstandingLevelDisplay';
import { StrengthsWeaknessesPanel } from './StrengthsWeaknessesPanel';
import { RecommendationsSection } from './RecommendationsSection';
import { InteractionHistoryChart } from './InteractionHistoryChart';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Printer } from 'lucide-react';

interface LearningAnalyticsDashboardProps {
  userId: string;
  knowledgeId: string;
  onClose?: () => void;
}

export const LearningAnalyticsDashboard: React.FC<LearningAnalyticsDashboardProps> = ({
  userId,
  knowledgeId,
  onClose
}) => {
  const { analytics, isLoading, error, refreshAnalytics } = useLearningAnalytics(userId, knowledgeId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create a JSON string of the analytics data
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create a download link
    const exportFileDefaultName = `learning-analytics-${knowledgeId}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Learning Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <EngagementScoreCard 
            score={analytics?.engagement_score || null} 
            isLoading={isLoading} 
          />
          <UnderstandingLevelDisplay 
            level={analytics?.understanding_level || null} 
            isLoading={isLoading} 
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <StrengthsWeaknessesPanel 
            strengths={analytics?.strengths || null} 
            weaknesses={analytics?.weaknesses || null} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="space-y-6">
        <RecommendationsSection 
          recommendations={analytics?.recommendations || null} 
          isLoading={isLoading} 
        />
        <InteractionHistoryChart 
          userId={userId} 
          knowledgeId={knowledgeId} 
          isLoading={isLoading} 
        />
      </div>

      {/* Footer */}
      {onClose && (
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Close Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}; 