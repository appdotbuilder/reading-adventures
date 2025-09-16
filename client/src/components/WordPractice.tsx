import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { Word, User } from '../../../server/src/schema';

interface WordPracticeProps {
  user: User;
  onBack: () => void;
}

export function WordPractice({ user, onBack }: WordPracticeProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex] = useState(0);
  const [practiceWords, setPracticeWords] = useState<string[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load words based on user level
  const loadWords = useCallback(async () => {
    try {
      setIsLoading(true);
      const wordsData = await trpc.getWords.query();
      const filteredWords = wordsData.filter((word: Word) => word.difficulty === user.level);
      setWords(filteredWords);
      
      // If no words from API, create some sample words based on level
      if (filteredWords.length === 0) {
        const sampleWords = getSampleWords(user.level);
        setPracticeWords(sampleWords);
      } else {
        setPracticeWords(filteredWords.map((w: Word) => w.word));
      }
    } catch (error) {
      console.error('Failed to load words:', error);
      // Fallback to sample words
      const sampleWords = getSampleWords(user.level);
      setPracticeWords(sampleWords);
    } finally {
      setIsLoading(false);
    }
  }, [user.level]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const getSampleWords = (level: string): string[] => {
    switch (level) {
      case 'beginner':
        return ['at', 'be', 'go', 'in', 'it', 'me', 'no', 'on', 'so', 'to', 'up', 'we', 'cat', 'dog', 'sun', 'run', 'fun', 'hat', 'bat', 'mat'];
      case 'intermediate':
        return ['apple', 'happy', 'green', 'water', 'house', 'tree', 'book', 'play', 'jump', 'smile', 'light', 'flower', 'friend', 'animal', 'color'];
      case 'advanced':
        return ['beautiful', 'adventure', 'fantastic', 'wonderful', 'important', 'together', 'different', 'exciting', 'remember', 'celebrate', 'dinosaur', 'elephant', 'butterfly', 'rainbow', 'telescope'];
      default:
        return ['cat', 'dog', 'sun'];
    }
  };

  const currentWord = practiceWords[currentPracticeIndex];
  const progress = practiceWords.length > 0 ? ((currentPracticeIndex + 1) / practiceWords.length) * 100 : 0;

  const handleNext = () => {
    setShowDefinition(false);
    if (currentPracticeIndex < practiceWords.length - 1) {
      setCurrentPracticeIndex(currentPracticeIndex + 1);
    } else {
      // Practice complete
      alert('🎉 Great job! You practiced all the words!');
      onBack();
    }
  };

  const handlePrevious = () => {
    setShowDefinition(false);
    if (currentPracticeIndex > 0) {
      setCurrentPracticeIndex(currentPracticeIndex - 1);
    }
  };

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord);
      utterance.rate = 0.7;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getWordEmoji = (word: string) => {
    // Simple word-to-emoji mapping for visual appeal
    const emojiMap: { [key: string]: string } = {
      'cat': '🐱', 'dog': '🐶', 'sun': '☀️', 'tree': '🌳', 'book': '📚',
      'house': '🏠', 'flower': '🌸', 'water': '💧', 'apple': '🍎', 'happy': '😊',
      'smile': '😄', 'light': '💡', 'friend': '👫', 'animal': '🐻', 'color': '🌈',
      'beautiful': '✨', 'rainbow': '🌈', 'butterfly': '🦋', 'elephant': '🐘', 'dinosaur': '🦕'
    };
    return emojiMap[word.toLowerCase()] || '📝';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">🔤</div>
            <p className="text-xl text-gray-600">Loading your words...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400">
      <div className="container mx-auto p-4">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                onClick={onBack}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                ← Back to Library
              </Button>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-purple-700">🔤 Word Practice</h1>
                <p className="text-gray-600">Level: {user.level}</p>
              </div>
              <div className="w-[100px]"></div> {/* Spacer for centering */}
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Word {currentPracticeIndex + 1} of {practiceWords.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Word Display */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 mb-6">
          <CardContent className="py-16">
            <div className="text-center">
              {/* Word Emoji */}
              <div className="text-8xl mb-6">{getWordEmoji(currentWord)}</div>
              
              {/* Main Word */}
              <div className="text-8xl font-bold text-purple-700 mb-8 tracking-wide">
                {currentWord}
              </div>
              
              {/* Phonetic Spelling (if available) */}
              {words[currentWordIndex]?.phonetic_spelling && (
                <div className="text-2xl text-gray-500 mb-6">
                  /{words[currentWordIndex].phonetic_spelling}/
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <Button 
                  onClick={speakWord}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-6 py-3"
                >
                  🔊 Say It
                </Button>
                
                <Button 
                  onClick={() => setShowDefinition(!showDefinition)}
                  className="bg-green-500 hover:bg-green-600 text-white text-lg px-6 py-3"
                >
                  {showDefinition ? '👁️ Hide Meaning' : '🔍 Show Meaning'}
                </Button>
              </div>

              {/* Definition/Example */}
              {showDefinition && (
                <div className="bg-yellow-50 rounded-xl p-6 max-w-md mx-auto">
                  {words[currentWordIndex]?.definition ? (
                    <div>
                      <p className="text-lg text-gray-700 mb-3">
                        <strong>Meaning:</strong> {words[currentWordIndex].definition}
                      </p>
                      {words[currentWordIndex].example_sentence && (
                        <p className="text-lg text-gray-700">
                          <strong>Example:</strong> "{words[currentWordIndex].example_sentence}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg text-gray-700">
                      This is the word "<strong>{currentWord}</strong>". Try using it in a sentence!
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                disabled={currentPracticeIndex === 0}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50 text-lg px-6 py-3"
              >
                ← Previous Word
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  🎯 Practice makes perfect! Keep going!
                </p>
              </div>
              
              <Button
                onClick={handleNext}
                className="bg-purple-500 hover:bg-purple-600 text-white text-lg px-6 py-3"
              >
                {currentPracticeIndex === practiceWords.length - 1 ? '🎉 Finish' : 'Next Word →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}