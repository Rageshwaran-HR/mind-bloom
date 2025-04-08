import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GameType } from '@/lib/types';
import GameContainer from '@/components/games/GameContainer';
import { toast } from '@/lib/toast';

const GamePage: React.FC = () => {
  const { gameType, levelId, mode } = useParams<{ gameType: string; levelId: string; mode: string }>();
  const { childUser } = useAuth();
  const navigate = useNavigate();
  
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
        <GameContainer 
          gameType={gameType as GameType} 
          levelId={parseInt(levelId)} 
          childId={childUser.id}
          isDailyChallenge={mode === 'daily'}
        />
      </main>
    </div>
  );
};

export default GamePage;
