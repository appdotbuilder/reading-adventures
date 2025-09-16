import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { CreateUserInput, UpdateUserInput, User } from '../../../server/src/schema';

interface UserProfileProps {
  onUserCreated: () => void;
  existingUser?: User;
}

export function UserProfile({ onUserCreated, existingUser }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    name: existingUser?.name || '',
    age: existingUser?.age || 9,
    level: existingUser?.level || 'beginner'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (existingUser) {
        // Update existing user
        const updateData: UpdateUserInput = {
          id: existingUser.id,
          name: formData.name,
          age: formData.age,
          level: formData.level
        };
        await trpc.updateUser.mutate(updateData);
      } else {
        // Create new user
        await trpc.createUser.mutate(formData);
      }
      
      onUserCreated();
      setIsOpen(false);
      
      // Reset form if creating new user
      if (!existingUser) {
        setFormData({
          name: '',
          age: 9,
          level: 'beginner'
        });
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`mt-4 ${existingUser 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3'
          }`}
        >
          {existingUser ? '✏️ Edit Profile' : '➕ Create New Reader'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-pink-50">
        <DialogHeader>
          <DialogTitle className="text-2xl text-purple-700 text-center">
            {existingUser ? '✏️ Edit Your Profile' : '🌟 Create New Reader Profile'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {existingUser 
              ? 'Update your reading profile information'
              : 'Let\'s set up your reading adventure!'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Card className="bg-white/80 border-purple-200">
            <CardContent className="p-4 space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  👤 What's your name?
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter your first name"
                  required
                  className="text-lg py-3 border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* Age Field */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  🎂 How old are you?
                </Label>
                <Select
                  value={formData.age.toString()}
                  onValueChange={(value) => 
                    setFormData((prev: CreateUserInput) => ({ ...prev, age: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="text-lg py-3 border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Select your age" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map((age) => (
                      <SelectItem key={age} value={age.toString()} className="text-lg">
                        {age} years old {age === 9 ? '🎯' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level Field */}
              <div className="space-y-2">
                <Label htmlFor="level" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  📊 What's your reading level?
                </Label>
                <Select
                  value={formData.level || 'beginner'}
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                    setFormData((prev: CreateUserInput) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger className="text-lg py-3 border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner" className="text-lg">
                      🌱 Beginner - Just starting to read
                    </SelectItem>
                    <SelectItem value="intermediate" className="text-lg">
                      🌿 Intermediate - Reading short stories
                    </SelectItem>
                    <SelectItem value="advanced" className="text-lg">
                      🌳 Advanced - Reading longer stories
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isLoading 
                ? (existingUser ? 'Updating...' : 'Creating...') 
                : (existingUser ? '✅ Update Profile' : '🚀 Start Reading!')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}