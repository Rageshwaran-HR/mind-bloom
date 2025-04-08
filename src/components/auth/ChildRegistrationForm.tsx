
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const avatars = [1, 2, 3, 4, 5, 6];

const ChildRegistrationForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { registerChild } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Please enter a name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await registerChild(name, selectedAvatar);
      setName('');
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
            <Label>Select an Avatar</Label>
            <div className="grid grid-cols-3 gap-4">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`p-2 rounded-full overflow-hidden transition-all ${
                    selectedAvatar === avatar
                      ? 'ring-4 ring-mindbloom-purple scale-105'
                      : 'hover:scale-105'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <div 
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-mindbloom-purple to-mindbloom-blue flex items-center justify-center text-white text-2xl font-bold"
                  >
                    {avatar}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <Button type="submit" className="w-full gradient-bg" disabled={isSubmitting}>
            {isSubmitting ? 'Creating profile...' : 'Create Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChildRegistrationForm;
