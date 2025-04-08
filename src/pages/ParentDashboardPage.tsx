
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ParentDashboard from '@/components/dashboard/ParentDashboard';

const ParentDashboardPage: React.FC = () => {
  const { user, parentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not logged in as parent
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!user.isParent) {
      navigate('/child-dashboard');
    }
  }, [user, navigate]);
  
  if (!parentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading dashboard...</h1>
          <div className="animate-spin-slow w-12 h-12 border-4 border-mindbloom-purple border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold gradient-bg text-transparent bg-clip-text">MindBloom</div>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </header>
      
      <main>
        <ParentDashboard />
      </main>
    </div>
  );
};

export default ParentDashboardPage;
