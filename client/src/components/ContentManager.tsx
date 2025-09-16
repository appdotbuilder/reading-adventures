import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { CreateContentInput } from '../../../server/src/schema';

interface ContentManagerProps {
  onContentAdded: () => void;
}

// Sample content for easy seeding
const sampleContent = [
  {
    title: "Two Letter Words",
    type: 'word' as const,
    difficulty: 'beginner' as const,
    text_content: "at be go in it me no on so to up we",
    order_index: 1,
    phonics_focus: "Short vowels and common consonants"
  },
  {
    title: "My First Cat",
    type: 'sentence' as const,
    difficulty: 'beginner' as const,
    text_content: "I see a cat. The cat is big. The cat is on the mat. I pet the cat.",
    order_index: 2,
    phonics_focus: "Simple sentences with short words"
  },
  {
    title: "The Little Red Hen",
    type: 'story' as const,
    difficulty: 'intermediate' as const,
    text_content: "Once upon a time, there was a little red hen who lived on a farm. She found some wheat seeds and wanted to plant them. 'Who will help me plant these seeds?' she asked. 'Not I,' said the lazy dog. 'Not I,' said the sleepy cat. 'Not I,' said the noisy duck. 'Then I will do it myself,' said the little red hen. And she did! She planted the seeds, watered them, and watched them grow into tall wheat. When it was time to harvest, she asked again, 'Who will help me?' But no one would help. So she harvested the wheat herself, ground it into flour, and baked delicious bread. The smell of fresh bread filled the air. 'Who will help me eat this bread?' she asked. 'I will!' said the dog. 'I will!' said the cat. 'I will!' said the duck. But the little red hen said, 'No, you would not help me make it, so I will eat it myself.' And she enjoyed every bite of her delicious bread.",
    order_index: 3,
    phonics_focus: "Longer sentences and story structure"
  },
  {
    title: "Colors All Around",
    type: 'poem' as const,
    difficulty: 'beginner' as const,
    text_content: "Red is the apple on the tree, Yellow is the buzzing bee. Blue is the sky up high, Green is the grass where we lie. Orange is the setting sun, Purple flowers when day is done. Colors, colors everywhere, Beautiful colors we can share!",
    order_index: 4,
    phonics_focus: "Rhyming words and color vocabulary"
  },
  {
    title: "Three Letter Words",
    type: 'word' as const,
    difficulty: 'intermediate' as const,
    text_content: "cat dog run sun fun hat bat mat sit big top cup pen red yes mom dad can man pan van",
    order_index: 5,
    phonics_focus: "CVC words (consonant-vowel-consonant)"
  },
  {
    title: "My Family",
    type: 'sentence' as const,
    difficulty: 'intermediate' as const,
    text_content: "I love my family very much. My mom helps me with homework. My dad plays games with me. My sister reads books with me. We have fun together every day.",
    order_index: 6,
    phonics_focus: "Family words and longer sentences"
  }
];

export function ContentManager({ onContentAdded }: ContentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingSample, setIsAddingSample] = useState(false);
  const [formData, setFormData] = useState<CreateContentInput>({
    title: '',
    type: 'word',
    difficulty: 'beginner',
    text_content: '',
    audio_url: null,
    order_index: 1,
    phonics_focus: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createContent.mutate(formData);
      onContentAdded();
      setIsOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        type: 'word',
        difficulty: 'beginner',
        text_content: '',
        audio_url: null,
        order_index: 1,
        phonics_focus: null
      });
    } catch (error) {
      console.error('Failed to create content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleContent = async () => {
    setIsAddingSample(true);
    try {
      // Add all sample content
      for (const content of sampleContent) {
        await trpc.createContent.mutate(content);
      }
      onContentAdded();
      alert('Sample content added successfully! 🎉');
    } catch (error) {
      console.error('Failed to add sample content:', error);
      alert('Failed to add sample content. Please try again.');
    } finally {
      setIsAddingSample(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-300">
          <CardContent className="p-4 text-center">
            <div className="text-4xl mb-2">🌟</div>
            <h3 className="font-semibold text-green-800 mb-2">Add Sample Content</h3>
            <p className="text-sm text-green-600 mb-4">
              Quickly add pre-made stories and words perfect for young readers
            </p>
            <Button
              onClick={addSampleContent}
              disabled={isAddingSample}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isAddingSample ? 'Adding Content...' : '📚 Add Sample Stories'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300">
          <CardContent className="p-4 text-center">
            <div className="text-4xl mb-2">✏️</div>
            <h3 className="font-semibold text-blue-800 mb-2">Create Custom Content</h3>
            <p className="text-sm text-blue-600 mb-4">
              Write your own stories, sentences, or word lists
            </p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  ➕ Create New Content
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-purple-700 text-center">
                    ✏️ Create New Learning Content
                  </DialogTitle>
                  <DialogDescription className="text-center text-gray-600">
                    Add new words, sentences, stories, or poems for children to read
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateContentInput) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="e.g., 'My First Story'"
                        required
                      />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Content Type</Label>
                      <Select
                        value={formData.type || 'word'}
                        onValueChange={(value: 'word' | 'sentence' | 'story' | 'poem') => 
                          setFormData((prev: CreateContentInput) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="word">🔤 Words</SelectItem>
                          <SelectItem value="sentence">📝 Sentences</SelectItem>
                          <SelectItem value="story">📚 Story</SelectItem>
                          <SelectItem value="poem">📜 Poem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Difficulty Level</Label>
                      <Select
                        value={formData.difficulty || 'beginner'}
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                          setFormData((prev: CreateContentInput) => ({ ...prev, difficulty: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">🌱 Beginner</SelectItem>
                          <SelectItem value="intermediate">🌿 Intermediate</SelectItem>
                          <SelectItem value="advanced">🌳 Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Order Index */}
                    <div className="space-y-2">
                      <Label htmlFor="order" className="text-sm font-semibold">Order in Curriculum</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order_index}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateContentInput) => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))
                        }
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {/* Content Text */}
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-semibold">Content Text</Label>
                    <Textarea
                      id="content"
                      value={formData.text_content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateContentInput) => ({ ...prev, text_content: e.target.value }))
                      }
                      placeholder={
                        formData.type === 'word' ? 'cat dog run sun fun (separate words with spaces)' :
                        formData.type === 'sentence' ? 'I see a cat. The cat is big.' :
                        formData.type === 'story' ? 'Once upon a time...' :
                        'Roses are red, violets are blue...'
                      }
                      rows={6}
                      required
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phonics Focus */}
                    <div className="space-y-2">
                      <Label htmlFor="phonics" className="text-sm font-semibold">Phonics Focus (Optional)</Label>
                      <Input
                        id="phonics"
                        value={formData.phonics_focus || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateContentInput) => ({ 
                            ...prev, 
                            phonics_focus: e.target.value || null 
                          }))
                        }
                        placeholder="e.g., 'Short vowel sounds'"
                      />
                    </div>

                    {/* Audio URL */}
                    <div className="space-y-2">
                      <Label htmlFor="audio" className="text-sm font-semibold">Audio URL (Optional)</Label>
                      <Input
                        id="audio"
                        type="url"
                        value={formData.audio_url || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateContentInput) => ({ 
                            ...prev, 
                            audio_url: e.target.value || null 
                          }))
                        }
                        placeholder="https://example.com/audio.mp3"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      {isLoading ? 'Creating...' : 'Create Content'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Sample Content Preview */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">📚 Sample Content Included</CardTitle>
          <CardDescription>
            Click "Add Sample Stories" above to quickly populate the app with these learning materials:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sampleContent.map((content, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`text-xs ${
                    content.type === 'word' ? 'bg-blue-100 text-blue-800' :
                    content.type === 'sentence' ? 'bg-green-100 text-green-800' :
                    content.type === 'story' ? 'bg-purple-100 text-purple-800' :
                    'bg-pink-100 text-pink-800'
                  }`}>
                    {content.type}
                  </Badge>
                  <Badge className={`text-xs ${
                    content.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    content.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {content.difficulty}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm text-gray-800 mb-1">{content.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{content.text_content}</p>
                {content.phonics_focus && (
                  <p className="text-xs text-purple-600 mt-1">🎯 {content.phonics_focus}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}