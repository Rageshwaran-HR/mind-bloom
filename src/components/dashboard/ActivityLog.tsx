
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionScore } from '@/lib/types';
import { Brain, Smile, Zap, Activity, AlertCircle } from 'lucide-react';

interface EmotionTrend {
  date: string;
  emotions: EmotionScore;
}

interface ActivityLogProps {
  selectedChildId: string;
  emotionTrends: EmotionTrend[];
  formatDate: (date: string) => string;
  getScoreColor: (score: number) => string;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ 
  selectedChildId, 
  emotionTrends, 
  formatDate, 
  getScoreColor 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent games and emotional states</CardDescription>
      </CardHeader>
      <CardContent>
        {emotionTrends.length > 0 ? (
          <div className="space-y-3">
            {emotionTrends.slice().reverse().map((entry, index) => (
              <div key={index} className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{formatDate(entry.date)}</h4>
                  <div 
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${
                      entry.emotions.overall > 0.3 
                        ? 'bg-green-100 text-green-800' 
                        : entry.emotions.overall > -0.3
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    {entry.emotions.overall > 0.3 
                      ? 'Positive' 
                      : entry.emotions.overall > -0.3
                        ? 'Neutral'
                        : 'Needs Attention'}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center">
                    <Smile className="w-4 h-4 mr-1 text-green-500" />
                    <span className="text-muted-foreground">Joy: </span>
                    <span className={`ml-1 ${getScoreColor(entry.emotions.joy)}`}>
                      {(entry.emotions.joy * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-muted-foreground">Focus: </span>
                    <span className={`ml-1 ${getScoreColor(entry.emotions.focus)}`}>
                      {(entry.emotions.focus * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-purple-500" />
                    <span className="text-muted-foreground">Engagement: </span>
                    <span className={`ml-1 ${getScoreColor(entry.emotions.engagement)}`}>
                      {(entry.emotions.engagement * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
                    <span className="text-muted-foreground">Frustration: </span>
                    <span className={`ml-1 ${getScoreColor(1 - entry.emotions.frustration)}`}>
                      {(entry.emotions.frustration * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No activity logs available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
