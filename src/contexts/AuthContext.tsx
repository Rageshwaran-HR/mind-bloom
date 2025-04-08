
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ParentUser, ChildUser } from '@/lib/types';
import { db } from '@/lib/mockDatabase';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isParentUser: boolean;
  parentUser: ParentUser | null;
  childUser: ChildUser | null;
  login: (email: string, password: string) => Promise<void>;
  registerParent: (email: string, password: string, name: string) => Promise<void>;
  registerChild: (name: string, avatarId: number) => Promise<void>;
  logout: () => void;
  switchToChild: (childId: string) => Promise<void>;
  switchToParent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parentUser, setParentUser] = useState<ParentUser | null>(null);
  const [childUser, setChildUser] = useState<ChildUser | null>(null);
  
  // Check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('mindbloom_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        loadUser(parsedUser.id, parsedUser.isParent);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('mindbloom_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const loadUser = async (userId: string, isParent: boolean) => {
    try {
      if (isParent) {
        const parent = await db.getParent(userId);
        if (parent) {
          setUser(parent);
          setParentUser(parent);
          setChildUser(null);
        }
      } else {
        const child = await db.getChild(userId);
        if (child) {
          setUser(child);
          setChildUser(child);
          
          // Also load parent
          const parent = await db.getParent(child.parentId);
          setParentUser(parent);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Error loading user profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveUserToStorage = (user: User) => {
    localStorage.setItem('mindbloom_user', JSON.stringify({
      id: user.id,
      isParent: user.isParent
    }));
  };
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await db.login(email, password);
      saveUserToStorage(loggedInUser);
      await loadUser(loggedInUser.id, loggedInUser.isParent);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const registerParent = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const newUser = await db.createParent(email, password, name);
      saveUserToStorage(newUser);
      setUser(newUser);
      setParentUser(newUser);
      setChildUser(null);
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const registerChild = async (name: string, avatarId: number) => {
    if (!parentUser) {
      toast.error('Parent account required');
      return;
    }
    
    setIsLoading(true);
    try {
      const newChild = await db.createChild(parentUser.id, name, avatarId);
      toast.success(`Added ${name}'s profile!`);
      
      // Refresh parent to include new child
      const refreshedParent = await db.getParent(parentUser.id);
      if (refreshedParent) {
        setParentUser(refreshedParent);
      }
    } catch (error) {
      console.error('Child registration error:', error);
      toast.error('Failed to create child profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    setParentUser(null);
    setChildUser(null);
    localStorage.removeItem('mindbloom_user');
    toast.info('Logged out successfully');
  };
  
  const switchToChild = async (childId: string) => {
    setIsLoading(true);
    try {
      const child = await db.getChild(childId);
      if (!child) {
        throw new Error('Child not found');
      }
      
      setUser(child);
      setChildUser(child);
      saveUserToStorage(child);
      toast.success(`Switched to ${child.name}'s profile`);
    } catch (error) {
      console.error('Switch profile error:', error);
      toast.error('Failed to switch profiles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const switchToParent = async () => {
    if (!parentUser) {
      toast.error('Parent profile not found');
      return;
    }
    
    setUser(parentUser);
    setChildUser(null);
    saveUserToStorage(parentUser);
    toast.success('Switched to parent dashboard');
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isParentUser: user?.isParent || false,
        parentUser,
        childUser, 
        login,
        registerParent,
        registerChild,
        logout,
        switchToChild,
        switchToParent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
