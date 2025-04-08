import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ParentUser, ChildUser } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isParentUser: boolean;
  parentUser: ParentUser | null;
  childUser: ChildUser | null;
  login: (email: string, password: string) => Promise<void>;
  childLogin: (username: string, password: string) => Promise<void>;
  registerParent: (email: string, password: string, name: string) => Promise<void>;
  registerChild: (name: string, avatarId: number, username: string, password: string) => Promise<void>;
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
        const { data: parent, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;
        setUser({
          id: parent.id,
          name: parent.full_name,
          email: '', // Add email if available or leave as an empty string
          isParent: parent.is_parent,
          avatarUrl: parent.avatar_url,
          createdAt: parent.created_at,
          updatedAt: parent.updated_at,
        });
        setParentUser({
          id: parent.id,
          name: parent.full_name,
          email: '', // Add email if available or leave as an empty string
          isParent: parent.is_parent,
          avatarUrl: parent.avatar_url,
          createdAt: parent.created_at,
          updatedAt: parent.updated_at,
          children: [] // Add children if available or leave as an empty array
        });
        setChildUser(null);
      } else {
        const { data: child, error } = await supabase
          .from('children')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;

        setUser({
          id: child.id,
          name: child.name,
          email: '', // Add email if available or leave as an empty string
          isParent: false,
          avatarUrl: child.avatar_emoji, // Assuming avatar_emoji corresponds to avatarUrl
          createdAt: child.created_at,
          updatedAt: child.updated_at,
        });
        setChildUser({
                  id: child.id,
                  name: child.name,
                  email: '', // Add email if available or leave as an empty string
                  avatarId: parseInt(child.avatar_emoji, 10), // Assuming avatar_emoji corresponds to avatarId
                  parentId: child.parent_id,
                  streakDays: 0, // Default value or fetch if available
                  createdAt: child.created_at,
                  updatedAt: child.updated_at,
                  isParent: false, // Child users are not parents
                  avatarUrl: child.avatar_emoji, // Assuming avatar_emoji corresponds to avatarUrl
                });

        const { data: parent, error: parentError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', child.parent_id)
          .single();
        if (parentError) throw parentError;

        setParentUser({
          id: parent.id,
          name: parent.full_name,
          email: '', // Add email if available or leave as an empty string
          isParent: parent.is_parent,
          avatarUrl: parent.avatar_url,
          createdAt: parent.created_at,
          updatedAt: parent.updated_at,
          children: [] // Add children if available or leave as an empty array
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Error loading user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserToStorage = (user: { id: string; is_parent: boolean }) => {
    localStorage.setItem('mindbloom_user', JSON.stringify({
      id: user.id,
      isParent: user.is_parent
    }));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: authRes, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !authRes.user) throw error || new Error('User not found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authRes.user.id)
        .single();
      if (profileError) throw profileError;

      saveUserToStorage(profile);
      await loadUser(profile.id, profile.is_parent);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const childLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Trying to login with:', { username, password });
  
      const { data: child, error } = await supabase
        .from('children')
        .select('id, username, password, parent_id')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle(); // avoids the multiple/no rows error
  
      console.log('Supabase result:', { child, error });
  
      if (error) throw error;
      if (!child) {
        toast.error('Invalid username or password');
        return;
      }
  
      saveUserToStorage({ id: child.id, is_parent: false });
      await loadUser(child.id, false);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Child login error:', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const registerParent = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data: authRes, error } = await supabase.auth.signUp({ email, password });
      if (error || !authRes.user) throw error || new Error('User not created');

      const { data: newUser, error: dbError } = await supabase
        .from('profiles')
        .insert([{ id: authRes.user.id, full_name: name, is_parent: true }])
        .single() as { data: { id: string; is_parent: boolean } | null, error: { message: string; details?: string; hint?: string } | null };
      if (dbError) throw dbError;

      saveUserToStorage(newUser);
      setUser({
        id: newUser.id,
        name: '', // Provide a default or fetched name
        email: '', // Provide a default or fetched email
        isParent: newUser.is_parent,
        avatarUrl: '', // Provide a default or fetched avatar URL
        createdAt: '', // Provide a default or fetched createdAt timestamp
        updatedAt: '', // Provide a default or fetched updatedAt timestamp
      });
      setParentUser({
        id: newUser.id,
        name: '', // Provide a default or fetched name
        email: '', // Provide a default or fetched email
        isParent: newUser.is_parent,
        avatarUrl: '', // Provide a default or fetched avatar URL
        createdAt: '', // Provide a default or fetched createdAt timestamp
        updatedAt: '', // Provide a default or fetched updatedAt timestamp
        children: [] // Provide a default or fetched list of children
      });
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

  const registerChild = async (
    name: string,
    avatarId: number,
    username: string,
    password: string
  ) => {
    if (!parentUser) {
      toast.error('Parent account required');
      return;
    }
  
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .insert([{
          parent_id: parentUser.id,
          name,
          avatar_id: avatarId, // make sure this is INTEGER in Supabase
          username,
          password // ⚠️ Use hashing in real apps
        }]);
      if (error) throw error;
  
      const { data: updatedParent, error: parentErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', parentUser.id)
        .single();
      if (parentErr) throw parentErr;
  
      setParentUser({
        id: updatedParent.id,
        name: updatedParent.full_name,
        email: '',
        isParent: updatedParent.is_parent,
        avatarUrl: updatedParent.avatar_url,
        createdAt: updatedParent.created_at,
        updatedAt: updatedParent.updated_at,
        children: [] // load children if needed
      });
  
      toast.success(`Added ${name}'s profile!`);
    } catch (error) {
      console.error('Child registration error:', error);
      toast.error('Failed to create child profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setParentUser(null);
    setChildUser(null);
    localStorage.removeItem('mindbloom_user');
    toast.info('Logged out successfully');
  };

  const switchToChild = async (childId: string) => {
    setIsLoading(true);
    try {
      const { data: child, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();
      if (!child || error) throw error || new Error('Child not found');

      setUser({
        id: child.id,
        name: child.name,
        email: '', // Add email if available or leave as an empty string
        isParent: false,
        avatarUrl: child.avatar_emoji, // Assuming avatar_emoji corresponds to avatarUrl
        createdAt: child.created_at,
        updatedAt: child.updated_at,
      });
      setChildUser({
        id: child.id,
        name: child.name,
        email: '', // Add email if available or leave as an empty string
        avatarId: parseInt(child.avatar_emoji, 10), // Assuming avatar_emoji corresponds to avatarId
        parentId: child.parent_id,
        streakDays: 0, // Default value or fetch if available
        createdAt: child.created_at,
        updatedAt: child.updated_at,
        isParent: false, // Child users are not parents
        avatarUrl: child.avatar_emoji, // Assuming avatar_emoji corresponds to avatarUrl
      });
      saveUserToStorage({ id: child.id, is_parent: false });
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
    saveUserToStorage({ id: parentUser.id, is_parent: true });
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
        childLogin,
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
