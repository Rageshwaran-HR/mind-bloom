
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.isParent) {
          navigate('/parent-dashboard');
        } else {
          navigate('/child-dashboard');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 gradient-bg text-transparent bg-clip-text">MindBloom</h1>
        <div className="animate-spin-slow w-12 h-12 border-4 border-mindbloom-purple border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default Index;
