
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChildUser, EmotionScore } from '@/lib/types';
import { toast } from '@/lib/toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import ChildRegistrationForm from '../auth/ChildRegistrationForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InfoIcon, Brain, Zap, Smile, Activity, AlertCircle } from 'lucide-react';
import EmotionTrends from './EmotionTrends';
import EmotionCards from './EmotionCards';
import ActivityLog from './ActivityLog';

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
        // Fetch emotion trends from database
        const { data: sentimentData, error: sentimentError } = await supabase
          .from('sentiment_analysis')
          .select('*, game_sessions(*)')
          .eq('child_id', selectedChildId)
          .order('created_at', { ascending: true });
          
        if (sentimentError) throw sentimentError;
        
        if (sentimentData) {
          // Transform sentiment data into emotion trends format
          const trends = sentimentData.map(item => ({
            date: item.created_at,
            emotions: {
              joy: item.enjoyment_level / 100,
              frustration: item.frustration_level / 100,
              engagement: item.persistence_level / 100,
              focus: item.focus_level / 100,
              overall: mapOverallSentiment(item.overall_sentiment)
            }
          }));
          
          setEmotionTrends(trends);
          
          // Generate insight from the most recent data
          if (trends.length > 0) {
            const recentData = trends[trends.length - 1];
            const insight = generateSentimentInsight(recentData.emotions, trends);
            setSentimentInsight(insight);
          }
        }
      } catch (error) {
        console.error('Error fetching emotion data:', error);
        toast.error('Failed to load emotion data');
      }
    };
    
    fetchData();
  }, [selectedChildId]);
  
  // Map text sentiment to a number value (-1 to 1)
  const mapOverallSentiment = (sentiment: string | null): number => {
    if (!sentiment) return 0;
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return 0.7;
      case 'negative': return -0.7;
      case 'neutral': return 0;
      default: return 0;
    }
  };
  
  // Generate insight text based on emotional data
  const generateSentimentInsight = (currentEmotions: EmotionScore, trends: EmotionTrend[]): string => {
    if (trends.length < 2) {
      return "Not enough data to generate insights yet. Have your child play more games to see patterns in their emotional state.";
    }
    
    const trendLength = trends.length;
    const recentTrends = trends.slice(Math.max(0, trendLength - 5), trendLength);
    
    // Calculate averages for recent trends
    const averages = {
      joy: recentTrends.reduce((sum, t) => sum + t.emotions.joy, 0) / recentTrends.length,
      frustration: recentTrends.reduce((sum, t) => sum + t.emotions.frustration, 0) / recentTrends.length,
      engagement: recentTrends.reduce((sum, t) => sum + t.emotions.engagement, 0) / recentTrends.length,
      focus: recentTrends.reduce((sum, t) => sum + t.emotions.focus, 0) / recentTrends.length,
      overall: recentTrends.reduce((sum, t) => sum + t.emotions.overall, 0) / recentTrends.length
    };
    
    let insight = "";
    
    if (averages.overall > 0.3) {
      insight = "Your child is showing positive emotional patterns during gameplay. ";
    } else if (averages.overall < -0.3) {
      insight = "Your child may be experiencing some challenges during gameplay. ";
    } else {
      insight = "Your child is showing balanced emotional patterns during gameplay. ";
    }
    
    // Add specific insights based on emotional indicators
    if (averages.joy > 0.7) {
      insight += "They're demonstrating high levels of enjoyment, which suggests the games are providing positive experiences. ";
    }
    
    if (averages.frustration > 0.7) {
      insight += "They're showing signs of frustration, which might indicate the game difficulty needs adjustment. ";
    } else if (averages.frustration < 0.3) {
      insight += "They're managing frustration well, showing good emotional regulation. ";
    }
    
    if (averages.engagement > 0.7) {
      insight += "Their high engagement levels suggest the games are capturing their interest effectively. ";
    } else if (averages.engagement < 0.3) {
      insight += "Their engagement could be improved, perhaps try different game types or activities. ";
    }
    
    if (averages.focus > 0.7) {
      insight += "They're demonstrating excellent focus abilities during gameplay. ";
    } else if (averages.focus < 0.3) {
      insight += "They may benefit from activities that help build focus and concentration skills. ";
    }
    
    return insight;
  };
  
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
  
  // This function returns a string color code based on the overall sentiment value
  const getSentimentColor = (value: number): string => {
    if (value > 0.3) return "#34D399"; // Green for positive
    if (value > -0.3) return "#FCD34D"; // Yellow for neutral
    return "#F87171"; // Red for negative
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
                      
                      <EmotionCards emotionTrends={emotionTrends} />
                    </TabsContent>
                    
                    <TabsContent value="emotions">
                      <EmotionTrends 
                        emotionTrends={emotionTrends}
                        formatDate={formatDate}
                        dataKeys={["emotions.joy", "emotions.frustration"]} 
                        names={["Joy", "Frustration"]}
                        colors={["#34D399", "#F97316"]}
                      />
                    </TabsContent>
                    
                    <TabsContent value="engagement">
                      <EmotionTrends 
                        emotionTrends={emotionTrends}
                        formatDate={formatDate}
                        dataKeys={["emotions.engagement", "emotions.focus"]} 
                        names={["Engagement", "Focus"]}
                        colors={["#0EA5E9", "#8B5CF6"]}
                      />
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
                                      A: (emotionTrends[emotionTrends.length - 1].emotions.overall + 1) * 50,
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
                                    fill={(entry) => getSentimentColor(entry.emotions.overall)}
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
      
      {selectedChildId && <ActivityLog selectedChildId={selectedChildId} emotionTrends={emotionTrends} formatDate={formatDate} getScoreColor={getScoreColor} />}
    </div>
  );
};

export default ParentDashboard;
