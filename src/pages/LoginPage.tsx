
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ChildLoginForm from '@/components/auth/ChildLoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("parent-login");
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  if (user) {
    const redirectPath = user.isParent ? '/parent-dashboard' : '/child-dashboard';
    navigate(redirectPath, { replace: true });
    return null;
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex justify-center">
        <div className="text-2xl font-bold gradient-bg text-transparent bg-clip-text">MindBloom</div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left side - hero section */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-mindbloom-purple to-mindbloom-blue p-8 md:p-12 flex flex-col justify-center items-center text-white">
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to MindBloom</h1>
            <p className="text-lg md:text-xl mb-6">
              Monitor and improve your child's mental health through fun and engaging games.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl mb-2">🧠</div>
                <h3 className="font-bold mb-1">Mental Health Tracking</h3>
                <p className="text-sm text-white/80">Monitor emotional well-being through gameplay data</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="font-bold mb-1">Fun Games</h3>
                <p className="text-sm text-white/80">Engage with playful challenges designed for children</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold mb-1">Insightful Data</h3>
                <p className="text-sm text-white/80">Get detailed analytics on progress and patterns</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-bold mb-1">Safe & Secure</h3>
                <p className="text-sm text-white/80">Parent-controlled accounts for complete safety</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - login/register form */}
        <div className="w-full md:w-1/2 bg-background p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Tabs defaultValue="parent-login" value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="parent-login">Parents</TabsTrigger>
                <TabsTrigger value="child-login">Children</TabsTrigger>
              </TabsList>
              
              <TabsContent value="parent-login">
                {activeTab === "parent-login" && (
                  activeTab === "parent-login" ? (
                    <LoginForm onToggleForm={() => setActiveTab("parent-register")} />
                  ) : (
                    <RegisterForm onToggleForm={() => setActiveTab("parent-login")} />
                  )
                )}
              </TabsContent>
              
              <TabsContent value="parent-register">
                {activeTab === "parent-register" && (
                  <RegisterForm onToggleForm={() => setActiveTab("parent-login")} />
                )}
              </TabsContent>
              
              <TabsContent value="child-login">
                {activeTab === "child-login" && (
                  <ChildLoginForm onToggleForm={() => setActiveTab("parent-login")} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
