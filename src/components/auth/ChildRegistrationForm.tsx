import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

const avatars = [1, 2, 3, 4, 5, 6];

const ChildRegistrationForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { registerChild } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !username || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await registerChild(name, selectedAvatar, username, password);
      setName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is already handled in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Add a Child Profile</CardTitle>
        <CardDescription className="text-center">
          Create a profile for your child to start their MindBloom journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="childName">Child's Name</Label>
            <Input 
              id="childName" 
              placeholder="Jane" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              placeholder="jane123" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar</Label>
            <div className="flex space-x-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`w-10 h-10 rounded-full ${selectedAvatar === avatar ? 'ring-2 ring-offset-2 ring-offset-white ring-primary' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img src={`/avatars/${avatar}.png`} alt={`Avatar ${avatar}`} />
                </button>
              ))}
            </div>
          </div>
          
          <Button type="submit" className="w-full gradient-bg" disabled={isSubmitting}>
            {isSubmitting ? 'Creating profile...' : 'Create profile'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSuccess}>
          Done
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChildRegistrationForm;