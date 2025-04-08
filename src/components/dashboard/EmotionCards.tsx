
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EmotionScore } from '@/lib/types';
import { Smile, Zap, Activity, AlertCircle } from 'lucide-react';

interface EmotionTrend {
  date: string;
  emotions: EmotionScore;
}

interface EmotionCardsProps {
  emotionTrends: EmotionTrend[];
}

const EmotionCards: React.FC<EmotionCardsProps> = ({ emotionTrends }) => {
  const getScoreColor = (score: number) => {
    if (score > 0.6) return 'text-green-500';
    if (score > 0.3) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (emotionTrends.length === 0) return null;
  
  const latestEmotions = emotionTrends[emotionTrends.length - 1].emotions;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center items-center mb-2">
              <Smile className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-sm font-medium text-muted-foreground">Joy</p>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(latestEmotions.joy)}`}>
              {(latestEmotions.joy * 100).toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center items-center mb-2">
              <Zap className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-sm font-medium text-muted-foreground">Focus</p>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(latestEmotions.focus)}`}>
              {(latestEmotions.focus * 100).toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center items-center mb-2">
              <Activity className="w-5 h-5 text-purple-500 mr-2" />
              <p className="text-sm font-medium text-muted-foreground">Engagement</p>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(latestEmotions.engagement)}`}>
              {(latestEmotions.engagement * 100).toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center items-center mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
              <p className="text-sm font-medium text-muted-foreground">Frustration</p>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(1 - latestEmotions.frustration)}`}>
              {(latestEmotions.frustration * 100).toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionCards;
