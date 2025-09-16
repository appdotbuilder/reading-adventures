import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, Content, UserProgress, QuizAttempt, ReadingSession } from '../../../server/src/schema';
import { Achievements } from '@/components/Achievements';

interface ProgressDashboardProps {
  user: User;
  content: Content[];
  userProgress: UserProgress[];
}

export function ProgressDashboard({ user, content, userProgress }: ProgressDashboardProps) {
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load additional progress data
  const loadProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [attempts, sessions] = await Promise.all([
        trpc.getQuizAttempts.query({ userId: user.id }),
        trpc.getReadingSessions.query({ userId: user.id })
      ]);
      
      setQuizAttempts(attempts);
      setReadingSessions(sessions);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Calculate statistics
  const completedContent = userProgress.filter(p => p.status === 'completed').length;
  const totalContent = content.filter(c => c.difficulty === user.level).length;
  const overallProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
  
  const totalWordsRead = readingSessions.reduce((sum, session) => sum + session.words_read, 0);
  const totalReadingTime = readingSessions.reduce((sum, session) => sum + session.session_duration_seconds, 0);
  const averageQuizScore = quizAttempts.length > 0 
    ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length 
    : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getProgressEmoji = (percentage: number) => {
    if (percentage >= 100) return '⭐';
    if (percentage >= 75) return '🔥';
    if (percentage >= 50) return '💪';
    if (percentage >= 25) return '🌱';
    return '🚀';
  };

  const getContentProgress = (contentId: number) => {
    const progress = userProgress.find(p => p.content_id === contentId);
    return progress ? progress.completion_percentage : 0;
  };

  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
        <CardContent className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-lg text-gray-600">Loading your progress...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm text-purple-600 font-medium">Stories Read</p>
            <p className="text-2xl font-bold text-purple-800">{completedContent}/{totalContent}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-200 border-green-300">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🔤</div>
            <p className="text-sm text-green-600 font-medium">Words Read</p>
            <p className="text-2xl font-bold text-green-800">{totalWordsRead.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">⏰</div>
            <p className="text-sm text-blue-600 font-medium">Reading Time</p>
            <p className="text-2xl font-bold text-blue-800">{formatTime(totalReadingTime)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-sm text-yellow-600 font-medium">Quiz Average</p>
            <p className="text-2xl font-bold text-yellow-800">
              {averageQuizScore > 0 ? `${Math.round(averageQuizScore)}%` : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-purple-700 flex items-center justify-center gap-2">
            {getProgressEmoji(overallProgress)} Your Reading Journey
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Keep reading to unlock more stories and adventures!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-lg font-semibold text-gray-700 mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-4 mb-4" />
            <p className="text-center text-gray-600">
              {completedContent === totalContent 
                ? '🎉 Congratulations! You\'ve completed all stories at your level!'
                : `${totalContent - completedContent} more ${totalContent - completedContent === 1 ? 'story' : 'stories'} to go!`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Progress Tabs */}
      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm">
          <TabsTrigger value="stories" className="data-[state=active]:bg-purple-200 data-[state=active]:text-purple-800">
            📖 Stories
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800">
            🧩 Quizzes
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800">
            📊 Sessions
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-yellow-200 data-[state=active]:text-yellow-800">
            🏆 Achievements
          </TabsTrigger>
        </TabsList>

        {/* Story Progress */}
        <TabsContent value="stories" className="mt-4">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl text-purple-700">📖 Your Story Progress</CardTitle>
              <CardDescription>Track your reading journey through each story</CardDescription>
            </CardHeader>
            <CardContent>
              {content.filter(c => c.difficulty === user.level).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-lg text-gray-600">No stories available at your level yet!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {content
                    .filter(c => c.difficulty === user.level)
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((contentItem: Content) => {
                      const progress = getContentProgress(contentItem.id);
                      const progressData = userProgress.find(p => p.content_id === contentItem.id);
                      
                      return (
                        <div key={contentItem.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {progress >= 100 ? '⭐' : progress > 0 ? '📖' : '📚'}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{contentItem.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${
                                    contentItem.type === 'word' ? 'bg-blue-100 text-blue-800' :
                                    contentItem.type === 'sentence' ? 'bg-green-100 text-green-800' :
                                    contentItem.type === 'story' ? 'bg-purple-100 text-purple-800' :
                                    'bg-pink-100 text-pink-800'
                                  }`}>
                                    {contentItem.type}
                                  </Badge>
                                  {progressData?.status && (
                                    <Badge className="text-xs bg-gray-100 text-gray-800">
                                      {progressData.status.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-700">{Math.round(progress)}%</p>
                              {progressData?.time_spent_seconds && (
                                <p className="text-xs text-gray-500">
                                  {formatTime(progressData.time_spent_seconds)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Results */}
        <TabsContent value="quizzes" className="mt-4">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">🧩 Your Quiz Results</CardTitle>
              <CardDescription>See how well you understood the stories</CardDescription>
            </CardHeader>
            <CardContent>
              {quizAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🧩</div>
                  <p className="text-lg text-gray-600">No quizzes completed yet!</p>
                  <p className="text-sm text-gray-500">Complete some stories to unlock quizzes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizAttempts.map((attempt: QuizAttempt) => (
                    <div key={attempt.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {attempt.score >= 90 ? '🏆' : 
                             attempt.score >= 70 ? '🥉' : 
                             attempt.score >= 50 ? '📚' : '💪'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">Quiz #{attempt.quiz_id}</p>
                            <p className="text-sm text-gray-600">
                              {attempt.correct_answers}/{attempt.total_questions} correct • 
                              {formatTime(attempt.time_taken_seconds)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attempt.completed_at.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{Math.round(attempt.score)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reading Sessions */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl text-green-700">📊 Your Reading Sessions</CardTitle>
              <CardDescription>Track your daily reading activity</CardDescription>
            </CardHeader>
            <CardContent>
              {readingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg text-gray-600">No reading sessions yet!</p>
                  <p className="text-sm text-gray-500">Start reading some stories to see your activity here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readingSessions
                    .sort((a, b) => b.started_at.getTime() - a.started_at.getTime())
                    .slice(0, 10) // Show last 10 sessions
                    .map((session: ReadingSession) => (
                      <div key={session.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">📖</div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                Reading Session
                              </p>
                              <p className="text-sm text-gray-600">
                                {session.words_read} words • {formatTime(session.session_duration_seconds)}
                              </p>
                              {session.reading_accuracy && (
                                <p className="text-sm text-green-600">
                                  {Math.round(session.reading_accuracy)}% accuracy
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {session.started_at.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.started_at.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-4">
          <Achievements 
            user={user}
            userProgress={userProgress}
            quizAttempts={quizAttempts}
            readingSessions={readingSessions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}