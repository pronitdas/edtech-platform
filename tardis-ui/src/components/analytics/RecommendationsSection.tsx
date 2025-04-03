import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface RecommendationsSectionProps {
  recommendations: string[] | null;
  isLoading?: boolean;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ 
  recommendations, 
  isLoading = false 
}) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
          <span>Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div>
            {recommendations && recommendations.length > 0 ? (
              <ul className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No specific recommendations at this time.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 