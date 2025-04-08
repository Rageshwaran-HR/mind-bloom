
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/mockDatabase';
import { ChildUser, EmotionScore } from '@/lib/types';
import { toast } from '@/components/ui/sonner';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChildRegistrationForm from '../auth/ChildRegistrationForm';

interface EmotionTrend {
  date: string;
  emotions: EmotionScore;
}

const ParentDashboard: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [emotionTrends, setEmotionTrends] = useState<EmotionTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  
  const { parentUser, childUser, switchToChild } = useAuth();
  
  useEffect(() => {
    if (!parentUser) return;
    
    // Set first child as selected if none selected
    if (!selectedChildId && parentUser.children.length > 0) {
      setSelectedChildId(parentUser.children[0].id);
    }
    
    setIsLoading(false);
  }, [parentUser, selectedChildId]);
  
  useEffect(() => {
    if (!selectedChildId) return;
    
    const fetchEmotionTrends = async () => {
      try {
        const trends = await db.getEmotionTrends(selectedChildId);
        setEmotionTrends(trends);
      } catch (error) {
        console.error('Error fetching emotion trends:', error);
        toast.error('Failed to load emotion data');
      }
    };
    
    fetchEmotionTrends();
  }, [selectedChildId]);
  
  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
  };
  
  const handleSwitchToChild = async (childId: string) => {
    await switchToChild(childId);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  const getScoreColor = (score: number) => {
    if (score > 0.6) return 'text-green-500';
    if (score > 0.3) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getEmotionInsight = (emotions: EmotionTrend[]) => {
    if (emotions.length === 0) return "No data available yet.";
    
    // Get the most recent emotion data
    const latest = emotions[emotions.length - 1].emotions;
    
    // Get trends by comparing to previous data
    const trend = emotions.length > 1
      ? emotions[emotions.length - 1].emotions.overall - emotions[emotions.length - 2].emotions.overall
      : 0;
    
    const insights = [];
    
    // Overall sentiment
    if (latest.overall > 0.6) {
      insights.push("Overall positive emotional state. Doing great!");
    } else if (latest.overall > 0.2) {
      insights.push("Balanced emotional state with room for improvement.");
    } else if (latest.overall > -0.2) {
      insights.push("Neutral emotional state. Pay attention to any changes.");
    } else {
      insights.push("Showing signs of negative emotional state. Consider checking in.");
    }
    
    // Trend insight
    if (trend > 0.2) {
      insights.push("Significant positive improvement recently.");
    } else if (trend < -0.2) {
      insights.push("Recent decline in emotional wellbeing.");
    }
    
    // Specific emotion insights
    if (latest.frustration > 0.7) {
      insights.push("Higher levels of frustration detected. May need support.");
    }
    
    if (latest.engagement < 0.3) {
      insights.push("Low engagement levels. Might be losing interest.");
    }
    
    if (latest.joy < 0.3) {
      insights.push("Joy levels are lower than usual.");
    }
    
    if (latest.focus < 0.4) {
      insights.push("Focus seems to be challenging. Consider shorter sessions.");
    }
    
    return insights.join(' ');
  };
  
  const getSelectedChild = (): ChildUser | undefined => {
    if (!parentUser || !selectedChildId) return undefined;
    return parentUser.children.find(child => child.id === selectedChildId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin-slow w-16 h-16 border-4 border-mindbloom-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-1">Parent Dashboard</h1>
      <p className="text-muted-foreground mb-6">Monitor your child's mental health and progress</p>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Children</CardTitle>
            <CardDescription>Select a child to view insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parentUser && parentUser.children.length > 0 ? (
              parentUser.children.map(child => (
                <div 
                  key={child.id} 
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedChildId === child.id 
                      ? 'bg-mindbloom-purple text-white' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => handleChildSelect(child.id)}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-10 h-10 rounded-full ${
                      selectedChildId === child.id
                        ? 'bg-white text-mindbloom-purple'
                        : 'bg-mindbloom-purple text-white'
                    } flex items-center justify-center font-bold mr-3`}>
                      {child.avatarId}
                    </div>
                    <span className="font-medium">{child.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`${selectedChildId === child.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {child.streakDays} day streak
                    </span>
                    <Button 
                      size="sm" 
                      variant={selectedChildId === child.id ? "secondary" : "outline"} 
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitchToChild(child.id);
                      }}
                    >
                      Switch to
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No children added yet
              </div>
            )}
            
            <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
              <DialogTrigger asChild>
                <Button className="w-full gradient-bg">Add Child</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add a Child Profile</DialogTitle>
                  <DialogDescription>
                    Create a new profile for your child
                  </DialogDescription>
                </DialogHeader>
                <ChildRegistrationForm onSuccess={() => setShowAddChild(false)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{getSelectedChild()?.name}'s Dashboard</CardTitle>
            <CardDescription>Mental health insights and trends</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChildId ? (
              <>
                {emotionTrends.length > 0 ? (
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="emotions">Emotions</TabsTrigger>
                      <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      <div className="mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Mental Health Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">
                              {getEmotionInsight(emotionTrends)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="h-[300px] mb-6">
                        <h3 className="text-lg font-medium mb-2">Overall Emotional Wellbeing</h3>
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
                              domain={[-1, 1]} 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => value.toFixed(1)}
                            />
                            <Tooltip 
                              formatter={(value: number) => [value.toFixed(2), 'Score']}
                              labelFormatter={formatDate}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="emotions.overall" 
                              stroke="#8B5CF6" 
                              fill="#8B5CF680" 
                              name="Overall"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {emotionTrends.length > 0 && (
                          <>
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Joy</p>
                                  <p className={`text-2xl font-bold ${
                                    getScoreColor(emotionTrends[emotionTrends.length - 1].emotions.joy)
                                  }`}>
                                    {(emotionTrends[emotionTrends.length - 1].emotions.joy * 100).toFixed(0)}%
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Focus</p>
                                  <p className={`text-2xl font-bold ${
                                    getScoreColor(emotionTrends[emotionTrends.length - 1].emotions.focus)
                                  }`}>
                                    {(emotionTrends[emotionTrends.length - 1].emotions.focus * 100).toFixed(0)}%
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Engagement</p>
                                  <p className={`text-2xl font-bold ${
                                    getScoreColor(emotionTrends[emotionTrends.length - 1].emotions.engagement)
                                  }`}>
                                    {(emotionTrends[emotionTrends.length - 1].emotions.engagement * 100).toFixed(0)}%
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Frustration</p>
                                  <p className={`text-2xl font-bold ${
                                    getScoreColor(1 - emotionTrends[emotionTrends.length - 1].emotions.frustration)
                                  }`}>
                                    {(emotionTrends[emotionTrends.length - 1].emotions.frustration * 100).toFixed(0)}%
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="emotions">
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
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="emotions.joy" 
                              stroke="#34D399" 
                              fill="#34D39980" 
                              name="Joy"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="emotions.frustration" 
                              stroke="#F97316" 
                              fill="#F9731680" 
                              name="Frustration"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="engagement">
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
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="emotions.engagement" 
                              stroke="#0EA5E9" 
                              fill="#0EA5E980" 
                              name="Engagement"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="emotions.focus" 
                              stroke="#8B5CF6" 
                              fill="#8B5CF680" 
                              name="Focus"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-2">No data available yet.</p>
                    <p>Data will appear after your child plays some games.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">Please select a child to view their data.</p>
                {parentUser && parentUser.children.length === 0 && (
                  <Button onClick={() => setShowAddChild(true)}>
                    Add Your First Child
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedChildId && (
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
                        className={`px-3 py-1 rounded-full text-sm ${
                          entry.emotions.overall > 0.3 
                            ? 'bg-green-100 text-green-800' 
                            : entry.emotions.overall > -0.3
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {entry.emotions.overall > 0.3 
                          ? 'Positive' 
                          : entry.emotions.overall > -0.3
                            ? 'Neutral'
                            : 'Needs Attention'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Joy: </span>
                        <span className={getScoreColor(entry.emotions.joy)}>
                          {(entry.emotions.joy * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Focus: </span>
                        <span className={getScoreColor(entry.emotions.focus)}>
                          {(entry.emotions.focus * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagement: </span>
                        <span className={getScoreColor(entry.emotions.engagement)}>
                          {(entry.emotions.engagement * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frustration: </span>
                        <span className={getScoreColor(1 - entry.emotions.frustration)}>
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
      )}
    </div>
  );
};

export default ParentDashboard;
