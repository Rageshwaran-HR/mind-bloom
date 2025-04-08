
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameType } from '@/lib/types';
import GameContainer from '@/components/games/GameContainer';
import { toast } from '@/lib/toast';
import { db } from '@/lib/mockDatabase';

const GamePage: React.FC = () => {
  const { gameType, levelId, mode } = useParams<{ gameType: string; levelId: string; mode: string }>();
  const { childUser } = useAuth();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<number>(parseInt(levelId || '1'));
  const [levels, setLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load game levels on mount
  React.useEffect(() => {
    if (!gameType) return;
    
    const fetchLevels = async () => {
      try {
        const gameLevels = await db.getGameLevels(gameType as GameType);
        setLevels(gameLevels);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading game levels:', error);
        toast.error('Failed to load game levels');
        setIsLoading(false);
      }
    };
    
    fetchLevels();
  }, [gameType]);
  
  // Redirect if no child selected
  React.useEffect(() => {
    if (!childUser) {
      toast.error('Please select a child profile first');
      navigate('/login');
    }
  }, [childUser, navigate]);
  
  if (!gameType || !levelId || !childUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game not found</h1>
          <Button onClick={() => navigate('/child-dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  const validGameType = ['mage-run', 'snake-game', 'mirror-moves', 'maze-runner'].includes(gameType);
  
  if (!validGameType) {
    toast.error('Invalid game type');
    navigate('/child-dashboard');
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin-slow w-16 h-16 border-4 border-mindbloom-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  const handleLevelChange = (level: number) => {
    setSelectedLevel(level);
    // Update URL without refreshing the page
    navigate(`/game/${gameType}/${level}/${mode || 'practice'}`, { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold gradient-bg text-transparent bg-clip-text">MindBloom</div>
          <Button variant="outline" onClick={() => navigate('/child-dashboard')}>
            Dashboard
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        {mode !== 'daily' && levels.length > 0 && (
          <div className="max-w-md mx-auto mb-6">
            <Tabs 
              defaultValue={selectedLevel.toString()} 
              onValueChange={(value) => handleLevelChange(parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                {levels.map(level => (
                  <TabsTrigger 
                    key={level.id} 
                    value={level.id.toString()}
                    className={`${level.difficulty === 'easy' ? 'data-[state=active]:bg-green-500' : 
                      level.difficulty === 'medium' ? 'data-[state=active]:bg-amber-500' : 
                      'data-[state=active]:bg-red-500'} data-[state=active]:text-white`}
                  >
                    {level.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
        
        <GameContainer 
          gameType={gameType as GameType} 
          levelId={selectedLevel} 
          childId={childUser.id}
          isDailyChallenge={mode === 'daily'}
        />
      </main>
    </div>
  );
};

export default GamePage;
