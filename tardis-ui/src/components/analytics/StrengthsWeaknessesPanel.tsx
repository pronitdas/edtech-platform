import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, AlertTriangle } from 'lucide-react';

interface StrengthsWeaknessesPanelProps {
  strengths: string[] | null;
  weaknesses: string[] | null;
  isLoading?: boolean;
}

export const StrengthsWeaknessesPanel: React.FC<StrengthsWeaknessesPanelProps> = ({ 
  strengths, 
  weaknesses, 
  isLoading = false 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Strengths Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center">
            <ThumbsUp className="w-5 h-5 mr-2 text-green-500" />
            <span>Strengths</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div>
              {strengths && strengths.length > 0 ? (
                <ul className="space-y-2">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No specific strengths identified yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weaknesses Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            <span>Areas for Improvement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div>
              {weaknesses && weaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2 mr-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">Keep up the great work!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 