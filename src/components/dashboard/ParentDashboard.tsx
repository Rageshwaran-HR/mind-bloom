
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { db, avatarOptions } from '@/lib/mockDatabase';
import { ChildUser, EmotionScore } from '@/lib/types';
import { toast } from '@/lib/toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import ChildRegistrationForm from '../auth/ChildRegistrationForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InfoIcon, Brain, Zap, Smile, Activity, AlertCircle } from 'lucide-react';

interface EmotionTrend {
  date: string;
  emotions: EmotionScore;
}

const ParentDashboard: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [emotionTrends, setEmotionTrends] = useState<EmotionTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [sentimentInsight, setSentimentInsight] = useState<string>("");
  
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
    
    const fetchData = async () => {
      try {
        // Fetch emotion trends
        const trends = await db.getEmotionTrends(selectedChildId);
        setEmotionTrends(trends);
        
        // Fetch sentiment insights
        const insight = await db.getSentimentInsight(selectedChildId);
        setSentimentInsight(insight);
      } catch (error) {
        console.error('Error fetching emotion data:', error);
        toast.error('Failed to load emotion data');
      }
    };
    
    fetchData();
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
  
  const getEmotionIcon = (type: string) => {
    switch (type) {
      case 'joy':
        return <Smile className="w-5 h-5" />;
      case 'focus':
        return <Zap className="w-5 h-5" />;
      case 'engagement':
        return <Activity className="w-5 h-5" />;
      case 'frustration':
        return <AlertCircle className="w-5 h-5" />;
      case 'overall':
        return <Brain className="w-5 h-5" />;
      default:
        return <InfoIcon className="w-5 h-5" />;
    }
  };
  
  const getSelectedChild = (): ChildUser | undefined => {
    if (!parentUser || !selectedChildId) return undefined;
    return parentUser.children.find(child => child.id === selectedChildId);
  };
  
  // Helper function to get avatar URL from avatarId
  const getAvatarUrl = (avatarId: number) => {
    const avatar = avatarOptions.find(a => a.id === avatarId);
    return avatar?.url;
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
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={child.avatarUrl || undefined} alt={child.name} />
                      <AvatarFallback className={`${
                        selectedChildId === child.id
                          ? 'bg-white text-mindbloom-purple'
                          : 'bg-mindbloom-purple text-white'
                      }`}>{child.avatarId}</AvatarFallback>
                    </Avatar>
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
            <CardTitle className="flex items-center">
              {getSelectedChild()?.name}'s Dashboard
              {getSelectedChild()?.avatarUrl && (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage src={getSelectedChild()?.avatarUrl} alt={getSelectedChild()?.name} />
                  <AvatarFallback>{getSelectedChild()?.avatarId}</AvatarFallback>
                </Avatar>
              )}
            </CardTitle>
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
                      <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      <div className="mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <Brain className="w-5 h-5 mr-2 text-mindbloom-purple" />
                              Mental Health Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">
                              {sentimentInsight}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="h-[300px] mb-6">
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-mindbloom-purple" />
                          Overall Emotional Wellbeing
                        </h3>
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
                                  <div className="flex justify-center items-center mb-2">
                                    <Smile className="w-5 h-5 text-green-500 mr-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Joy</p>
                                  </div>
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
                                  <div className="flex justify-center items-center mb-2">
                                    <Zap className="w-5 h-5 text-blue-500 mr-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Focus</p>
                                  </div>
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
                                  <div className="flex justify-center items-center mb-2">
                                    <Activity className="w-5 h-5 text-purple-500 mr-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                                  </div>
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
                                  <div className="flex justify-center items-center mb-2">
                                    <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Frustration</p>
                                  </div>
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
                    
                    <TabsContent value="detailed">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Emotion Balance</CardTitle>
                            <CardDescription>Latest emotional distribution</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              {emotionTrends.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Joy', value: emotionTrends[emotionTrends.length - 1].emotions.joy },
                                        { name: 'Focus', value: emotionTrends[emotionTrends.length - 1].emotions.focus },
                                        { name: 'Engagement', value: emotionTrends[emotionTrends.length - 1].emotions.engagement },
                                        { name: 'Frustration', value: emotionTrends[emotionTrends.length - 1].emotions.frustration },
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                      <Cell fill="#34D399" />
                                      <Cell fill="#8B5CF6" />
                                      <Cell fill="#0EA5E9" />
                                      <Cell fill="#F97316" />
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [(value * 100).toFixed(0) + '%', '']} />
                                  </PieChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Mental Health Indicators</CardTitle>
                            <CardDescription>Comprehensive assessment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              {emotionTrends.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    {
                                      subject: 'Joy',
                                      A: emotionTrends[emotionTrends.length - 1].emotions.joy * 100,
                                      fullMark: 100,
                                    },
                                    {
                                      subject: 'Focus',
                                      A: emotionTrends[emotionTrends.length - 1].emotions.focus * 100,
                                      fullMark: 100,
                                    },
                                    {
                                      subject: 'Engagement',
                                      A: emotionTrends[emotionTrends.length - 1].emotions.engagement * 100,
                                      fullMark: 100,
                                    },
                                    {
                                      subject: 'Resilience',
                                      A: (1 - emotionTrends[emotionTrends.length - 1].emotions.frustration) * 100,
                                      fullMark: 100,
                                    },
                                    {
                                      subject: 'Overall',
                                      A: (emotionTrends[emotionTrends.length - 1].emotions.overall + 1) * 50, // Convert -1 to 1 scale to 0-100
                                      fullMark: 100,
                                    },
                                  ]}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <Radar name="Current" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                                    <Tooltip formatter={(value: number) => [`${value.toFixed(0)}%`, '']} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
                          <CardDescription>How your child's mental state changes over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-muted-foreground">
                              {sentimentInsight}
                            </p>
                            
                            <div className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
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
                                    formatter={(value: number) => [value.toFixed(2), 'Sentiment']}
                                    labelFormatter={formatDate}
                                  />
                                  <Bar 
                                    dataKey="emotions.overall" 
                                    name="Sentiment" 
                                    fill={(entry) => entry.emotions.overall > 0.3 ? '#34D399' : entry.emotions.overall > -0.3 ? '#FCD34D' : '#F87171'}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
      )}
    </div>
  );
};

export default ParentDashboard;
