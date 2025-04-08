
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EmotionScore } from '@/lib/types';

interface EmotionTrend {
  date: string;
  emotions: EmotionScore;
}

interface EmotionTrendsProps {
  emotionTrends: EmotionTrend[];
  formatDate: (date: string) => string;
  dataKeys: string[];
  names: string[];
  colors: string[];
}

const EmotionTrends: React.FC<EmotionTrendsProps> = ({ 
  emotionTrends, 
  formatDate, 
  dataKeys, 
  names, 
  colors 
}) => {
  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={emotionTrends}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 1]} 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => (value * 100).toFixed(0) + '%'}
          />
          <Tooltip 
            formatter={(value: number) => [(value * 100).toFixed(0) + '%', '']}
            labelFormatter={formatDate}
          />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index]}
              fill={`${colors[index]}80`}
              name={names[index]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionTrends;
