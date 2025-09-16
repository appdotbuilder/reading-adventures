import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Content, User, Quiz, CreateReadingSessionInput } from '../../../server/src/schema';
import { QuizSection } from '@/components/QuizSection';

interface ContentReaderProps {
  content: Content;
  user: User;
  onBack: () => void;
  onProgressUpdate: () => void;
}

export function ContentReader({ content, user, onBack, onProgressUpdate }: ContentReaderProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [wordsRead, setWordsRead] = useState(0);
  const [sessionStartTime] = useState(new Date());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [readingSpeed, setReadingSpeed] = useState(300); // Words per minute
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Split content into words
  const words = content.text_content.split(/\s+/).filter(word => word.length > 0);
  const totalWords = words.length;
  const readingProgress = Math.min((wordsRead / totalWords) * 100, 100);

  // Load quizzes for this content
  const loadQuizzes = useCallback(async () => {
    try {
      const quizzesData = await trpc.getQuizzesByContent.query({ contentId: content.id });
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  }, [content.id]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleReadingComplete = useCallback(async () => {
    const sessionDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
    
    try {
      // Create reading session
      const sessionData: CreateReadingSessionInput = {
        user_id: user.id,
        content_id: content.id,
        words_read: totalWords,
        session_duration_seconds: sessionDuration
      };
      await trpc.createReadingSession.mutate(sessionData);

      // Update user progress
      await trpc.updateUserProgress.mutate({
        user_id: user.id,
        content_id: content.id,
        status: 'completed',
        completion_percentage: 100,
        time_spent_seconds: sessionDuration
      });

      onProgressUpdate();
      
      // Show quiz if available
      if (quizzes.length > 0) {
        setShowQuiz(true);
      }
    } catch (error) {
      console.error('Failed to save reading session:', error);
    }
  }, [user.id, content.id, totalWords, sessionStartTime, onProgressUpdate, quizzes.length]);

  // Auto-highlight words during reading
  useEffect(() => {
    if (!isReading) return;

    const intervalMs = (60 / readingSpeed) * 1000; // Convert WPM to milliseconds per word
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => {
        const next = prev + 1;
        if (next >= words.length) {
          setIsReading(false);
          handleReadingComplete();
          return prev;
        }
        setWordsRead(next);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isReading, readingSpeed, words.length, handleReadingComplete]);

  const handleStartReading = () => {
    setIsReading(true);
    setCurrentWordIndex(0);
    setWordsRead(0);
  };

  const handlePauseReading = () => {
    setIsReading(false);
  };

  const handleResetReading = () => {
    setIsReading(false);
    setCurrentWordIndex(0);
    setWordsRead(0);
  };

  const handleWordClick = (index: number) => {
    setCurrentWordIndex(index);
    setWordsRead(Math.max(wordsRead, index + 1));
  };

  const playAudio = () => {
    if (content.audio_url && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  const adjustSpeed = (newSpeed: number) => {
    setReadingSpeed(newSpeed);
  };

  if (showQuiz && quizzes.length > 0) {
    return (
      <QuizSection
        quiz={quizzes[0]}
        user={user}
        onComplete={() => {
          setShowQuiz(false);
          onBack();
        }}
        onSkip={() => {
          setShowQuiz(false);
          onBack();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
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
              <Badge className={`text-lg px-4 py-2 ${
                content.type === 'word' ? 'bg-blue-200 text-blue-800' :
                content.type === 'sentence' ? 'bg-green-200 text-green-800' :
                content.type === 'story' ? 'bg-purple-200 text-purple-800' :
                'bg-pink-200 text-pink-800'
              }`}>
                {content.type === 'word' ? '🔤' : 
                 content.type === 'sentence' ? '📝' :
                 content.type === 'story' ? '📚' : '📜'} {content.type}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Reading Area */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-purple-700 mb-4">
              {content.title}
            </CardTitle>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Reading Progress</span>
                <span>{Math.round(readingProgress)}% • {wordsRead}/{totalWords} words</span>
              </div>
              <Progress value={readingProgress} className="h-3" />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              {!isReading ? (
                <Button 
                  onClick={handleStartReading}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {wordsRead === 0 ? '▶️ Start Reading' : '▶️ Continue'}
                </Button>
              ) : (
                <Button 
                  onClick={handlePauseReading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  ⏸️ Pause
                </Button>
              )}
              
              <Button 
                onClick={handleResetReading}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                🔄 Reset
              </Button>

              {content.audio_url && (
                <Button 
                  onClick={playAudio}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  🔊 Listen
                </Button>
              )}

              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Speed:</span>
                <select 
                  value={readingSpeed} 
                  onChange={(e) => adjustSpeed(parseInt(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={150}>🐌 Slow</option>
                  <option value={300}>🚶 Normal</option>
                  <option value={450}>🏃 Fast</option>
                </select>
              </div>
            </div>

            {content.phonics_focus && (
              <div className="text-center">
                <Badge className="bg-yellow-200 text-yellow-800 text-sm">
                  🎯 Focus: {content.phonics_focus}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Main Text Display */}
            <div className="text-center max-w-4xl mx-auto">
              <div className="text-2xl leading-relaxed space-y-2 p-8 bg-gray-50 rounded-lg min-h-[300px] flex flex-wrap items-center justify-center gap-2">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className={`cursor-pointer transition-all duration-200 px-1 py-0.5 rounded ${
                      index === currentWordIndex
                        ? 'bg-yellow-300 text-black font-bold transform scale-110 shadow-md'
                        : index < currentWordIndex
                        ? 'bg-green-100 text-green-800'
                        : 'text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => handleWordClick(index)}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Audio Element */}
            {content.audio_url && (
              <audio ref={audioRef} preload="metadata">
                <source src={content.audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
          </CardContent>
        </Card>

        {/* Reading Tips */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">📚 Reading Tips</h3>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span>👆 Click on any word to jump there</span>
                <Separator orientation="vertical" className="h-4" />
                <span>⏯️ Use controls to pace yourself</span>
                <Separator orientation="vertical" className="h-4" />
                <span>🔊 Listen to pronunciation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Celebration */}
        {wordsRead >= totalWords && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400 shadow-2xl max-w-md mx-4">
              <CardContent className="text-center p-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-orange-600 mb-2">Amazing!</h2>
                <p className="text-lg text-gray-700 mb-6">
                  You completed "{content.title}"! Great job reading all {totalWords} words!
                </p>
                
                {quizzes.length > 0 ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowQuiz(true)}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      🧩 Take the Quiz
                    </Button>
                    <Button 
                      onClick={onBack}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-600"
                    >
                      📚 Back to Library
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={onBack}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    🌟 Choose Another Story
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}