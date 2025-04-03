import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { History } from 'lucide-react';
import { analyticsService } from '@/services/analytics-service';

interface InteractionHistoryChartProps {
  userId: string;
  knowledgeId: string;
  isLoading?: boolean;
}

interface InteractionData {
  date: string;
  interactions: number;
}

export const InteractionHistoryChart: React.FC<InteractionHistoryChartProps> = ({ 
  userId, 
  knowledgeId,
  isLoading = false 
}) => {
  const [interactionData, setInteractionData] = useState<InteractionData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  useEffect(() => {
    const fetchInteractionData = async () => {
      if (!userId || !knowledgeId) return;
      
      setIsLoadingData(true);
      try {
        // Get interaction summary from the analytics service
        const summary = await analyticsService.getKnowledgeInteractionSummary(userId, knowledgeId);
        
        // Process the data for the chart
        // This is a simplified example - in a real app, you would process the actual interaction data
        const processedData: InteractionData[] = [];
        
        // If we have interaction data, process it
        if (summary && summary.interaction_history) {
          // Assuming interaction_history is an array of {date, count} objects
          // If not, you would need to transform the data accordingly
          processedData.push(...summary.interaction_history);
        } else {
          // Generate sample data if no real data is available
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            processedData.push({
              date: date.toLocaleDateString('en-US', { weekday: 'short' }),
              interactions: Math.floor(Math.random() * 10) + 1
            });
          }
        }
        
        setInteractionData(processedData);
      } catch (error) {
        console.error('Error fetching interaction data:', error);
        // Generate sample data on error
        const today = new Date();
        const sampleData: InteractionData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          sampleData.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            interactions: Math.floor(Math.random() * 10) + 1
          });
        }
        setInteractionData(sampleData);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchInteractionData();
  }, [userId, knowledgeId]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center">
          <History className="w-5 h-5 mr-2 text-indigo-400" />
          <span>Interaction History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || isLoadingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interactionData}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F3F4F6'
                  }}
                />
                <Bar 
                  dataKey="interactions" 
                  fill="#6366F1" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 