import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, Content, UserProgress } from '../../server/src/schema';
import { UserProfile } from '@/components/UserProfile';
import { ContentReader } from '@/components/ContentReader';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { ContentManager } from '@/components/ContentManager';
import { WordPractice } from '@/components/WordPractice';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showWordPractice, setShowWordPractice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('library');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersData, contentData] = await Promise.all([
        trpc.getUsers.query(),
        trpc.getAllContent.query()
      ]);
      
      setUsers(usersData);
      setContent(contentData);
      
      // Auto-select first user if available
      if (usersData.length > 0 && !currentUser) {
        setCurrentUser(usersData[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load user progress when user changes
  const loadUserProgress = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const progressData = await trpc.getUserProgress.query({ user_id: currentUser.id });
      setUserProgress(progressData);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadUserProgress();
  }, [loadUserProgress]);

  // Get content filtered by user's level
  const getUserLevelContent = useCallback(() => {
    if (!currentUser) return [];
    return content.filter(c => c.difficulty === currentUser.level);
  }, [content, currentUser]);

  // Get progress percentage for content
  const getContentProgress = useCallback((contentId: number) => {
    const progress = userProgress.find(p => p.content_id === contentId);
    return progress ? progress.completion_percentage : 0;
  }, [userProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-white">Loading your reading adventure...</h2>
        </div>
      </div>
    );
  }

  // Show reading view when content is selected
  if (selectedContent) {
    return (
      <ContentReader
        content={selectedContent}
        user={currentUser!}
        onBack={() => setSelectedContent(null)}
        onProgressUpdate={loadUserProgress}
      />
    );
  }

  // Show word practice
  if (showWordPractice) {
    return (
      <WordPractice
        user={currentUser!}
        onBack={() => setShowWordPractice(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-lg">
            📖 Reading Adventure! 🌟
          </h1>
          <p className="text-xl text-white/90 font-medium">
            Let's explore the magical world of words together!
          </p>
        </div>

        {/* User Selection */}
        {!currentUser ? (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl text-purple-600 mb-2">👋 Who's Reading Today?</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Choose your profile to start your reading journey!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-8xl mb-4">🎭</div>
                    <p className="text-xl text-gray-600 mb-6">No readers yet! Ask a grown-up to create your profile.</p>
                    <UserProfile onUserCreated={loadData} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user: User) => (
                      <Card
                        key={user.id}
                        className="cursor-pointer hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-purple-200 hover:border-purple-400"
                        onClick={() => setCurrentUser(user)}
                      >
                        <CardHeader className="text-center">
                          <div className="text-6xl mb-2">🧑‍🎓</div>
                          <CardTitle className="text-2xl text-purple-700">{user.name}</CardTitle>
                          <Badge className="bg-purple-200 text-purple-800 hover:bg-purple-300">
                            Age {user.age} • Level: {user.level}
                          </Badge>
                        </CardHeader>
                      </Card>
                    ))}
                    <Card className="cursor-pointer hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-green-100 to-blue-100 border-2 border-green-200 hover:border-green-400 flex items-center justify-center">
                      <CardContent className="text-center py-8">
                        <div className="text-6xl mb-2">➕</div>
                        <p className="text-lg font-semibold text-green-700">Add New Reader</p>
                        <UserProfile onUserCreated={loadData} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main App Content */
          <div className="max-w-6xl mx-auto">
            {/* User Welcome Bar */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">👋</div>
                    <div>
                      <h2 className="text-2xl font-bold text-purple-700">Welcome back, {currentUser.name}!</h2>
                      <p className="text-gray-600">Age {currentUser.age} • {currentUser.level.charAt(0).toUpperCase() + currentUser.level.slice(1)} Level</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setCurrentUser(null)}
                    variant="outline"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    Switch Reader 🔄
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm">
                <TabsTrigger value="library" className="text-lg data-[state=active]:bg-purple-200 data-[state=active]:text-purple-800">
                  📚 Reading Library
                </TabsTrigger>
                <TabsTrigger value="progress" className="text-lg data-[state=active]:bg-green-200 data-[state=active]:text-green-800">
                  🏆 My Progress
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-lg data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800">
                  👤 My Profile
                </TabsTrigger>
                <TabsTrigger value="manage" className="text-lg data-[state=active]:bg-orange-200 data-[state=active]:text-orange-800">
                  ⚙️ Add Content
                </TabsTrigger>
              </TabsList>

              {/* Reading Library Tab */}
              <TabsContent value="library" className="mt-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="text-3xl text-center text-purple-700 flex items-center justify-center gap-2">
                      📖 Your Reading Library 🌟
                    </CardTitle>
                    <CardDescription className="text-center text-lg text-gray-600">
                      Choose a story to read and explore!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Quick Practice Button */}
                    <div className="mb-8 text-center">
                      <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-orange-300 inline-block">
                        <CardContent className="p-6">
                          <div className="text-4xl mb-2">🔤</div>
                          <h3 className="text-xl font-bold text-orange-800 mb-2">Practice Words</h3>
                          <p className="text-sm text-orange-600 mb-4">
                            Practice individual words at your level
                          </p>
                          <Button
                            onClick={() => setShowWordPractice(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            🎯 Start Word Practice
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {getUserLevelContent().length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-8xl mb-4">📚</div>
                        <p className="text-xl text-gray-600">No stories available yet! Ask a grown-up to add some content.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getUserLevelContent().map((contentItem: Content) => {
                          const progress = getContentProgress(contentItem.id);
                          const isCompleted = progress >= 100;
                          
                          return (
                            <Card
                              key={contentItem.id}
                              className={`cursor-pointer hover:scale-105 transition-transform duration-200 border-2 ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-500'
                                  : progress > 0
                                  ? 'bg-gradient-to-br from-yellow-50 to-orange-100 border-orange-300 hover:border-orange-500'
                                  : 'bg-gradient-to-br from-blue-50 to-purple-100 border-purple-300 hover:border-purple-500'
                              }`}
                              onClick={() => setSelectedContent(contentItem)}
                            >
                              <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={`text-sm ${
                                    contentItem.type === 'word' ? 'bg-blue-200 text-blue-800' :
                                    contentItem.type === 'sentence' ? 'bg-green-200 text-green-800' :
                                    contentItem.type === 'story' ? 'bg-purple-200 text-purple-800' :
                                    'bg-pink-200 text-pink-800'
                                  }`}>
                                    {contentItem.type === 'word' ? '🔤' : 
                                     contentItem.type === 'sentence' ? '📝' :
                                     contentItem.type === 'story' ? '📚' : '📜'} {contentItem.type}
                                  </Badge>
                                  {isCompleted && <div className="text-2xl">⭐</div>}
                                </div>
                                <CardTitle className="text-xl text-gray-800 line-clamp-2">
                                  {contentItem.title}
                                </CardTitle>
                                {contentItem.phonics_focus && (
                                  <p className="text-sm text-gray-600 bg-gray-100 rounded px-2 py-1 inline-block">
                                    🎯 Focus: {contentItem.phonics_focus}
                                  </p>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{progress.toFixed(0)}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                                <p className="text-gray-600 text-sm line-clamp-3">
                                  {contentItem.text_content}
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="mt-6">
                <ProgressDashboard 
                  user={currentUser} 
                  content={content}
                  userProgress={userProgress}
                />
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="text-3xl text-center text-blue-700 flex items-center justify-center gap-2">
                      👤 My Profile 🌟
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-md mx-auto text-center">
                      <div className="text-8xl mb-4">🧑‍🎓</div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentUser.name}</h2>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-2xl mb-1">🎂</div>
                          <p className="text-sm text-gray-600">Age</p>
                          <p className="text-xl font-bold text-blue-700">{currentUser.age}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-2xl mb-1">📊</div>
                          <p className="text-sm text-gray-600">Level</p>
                          <p className="text-xl font-bold text-purple-700 capitalize">{currentUser.level}</p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <UserProfile 
                          existingUser={currentUser}
                          onUserCreated={loadData}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Management Tab */}
              <TabsContent value="manage" className="mt-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="text-3xl text-center text-orange-700 flex items-center justify-center gap-2">
                      ⚙️ Add Learning Content 📚
                    </CardTitle>
                    <CardDescription className="text-center text-lg text-gray-600">
                      For teachers and parents: Add new stories, words, and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentManager onContentAdded={loadData} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;