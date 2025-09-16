import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { User, UserProgress, QuizAttempt, ReadingSession } from '../../../server/src/schema';

interface AchievementsProps {
  user: User;
  userProgress: UserProgress[];
  quizAttempts: QuizAttempt[];
  readingSessions: ReadingSession[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  category: 'reading' | 'progress' | 'quiz' | 'streak';
}

export function Achievements({ user, userProgress, quizAttempts, readingSessions }: AchievementsProps) {
  // Calculate achievement data
  const completedStories = userProgress.filter(p => p.status === 'completed').length;
  const totalWordsRead = readingSessions.reduce((sum, session) => sum + session.words_read, 0);
  const totalReadingTime = readingSessions.reduce((sum, session) => sum + session.session_duration_seconds, 0);
  const averageQuizScore = quizAttempts.length > 0 
    ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length 
    : 0;
  const perfectQuizzes = quizAttempts.filter(attempt => attempt.score === 100).length;

  // Define achievements
  const achievements: Achievement[] = [
    // Reading Achievements
    {
      id: 'first_story',
      title: 'First Story',
      description: 'Complete your first story!',
      emoji: '📖',
      unlocked: completedStories >= 1,
      category: 'reading'
    },
    {
      id: 'story_master',
      title: 'Story Master',
      description: 'Complete 5 stories',
      emoji: '📚',
      unlocked: completedStories >= 5,
      progress: Math.min(completedStories, 5),
      maxProgress: 5,
      category: 'reading'
    },
    {
      id: 'reading_champion',
      title: 'Reading Champion',
      description: 'Complete 10 stories',
      emoji: '🏆',
      unlocked: completedStories >= 10,
      progress: Math.min(completedStories, 10),
      maxProgress: 10,
      category: 'reading'
    },

    // Word Count Achievements
    {
      id: 'word_explorer',
      title: 'Word Explorer',
      description: 'Read 100 words',
      emoji: '🔤',
      unlocked: totalWordsRead >= 100,
      progress: Math.min(totalWordsRead, 100),
      maxProgress: 100,
      category: 'reading'
    },
    {
      id: 'word_collector',
      title: 'Word Collector',
      description: 'Read 500 words',
      emoji: '📝',
      unlocked: totalWordsRead >= 500,
      progress: Math.min(totalWordsRead, 500),
      maxProgress: 500,
      category: 'reading'
    },
    {
      id: 'word_master',
      title: 'Word Master',
      description: 'Read 1,000 words',
      emoji: '🌟',
      unlocked: totalWordsRead >= 1000,
      progress: Math.min(totalWordsRead, 1000),
      maxProgress: 1000,
      category: 'reading'
    },

    // Time-based Achievements
    {
      id: 'quick_reader',
      title: 'Quick Reader',
      description: 'Read for 30 minutes total',
      emoji: '⚡',
      unlocked: totalReadingTime >= 1800, // 30 minutes in seconds
      progress: Math.min(totalReadingTime, 1800),
      maxProgress: 1800,
      category: 'reading'
    },
    {
      id: 'dedicated_reader',
      title: 'Dedicated Reader',
      description: 'Read for 2 hours total',
      emoji: '💪',
      unlocked: totalReadingTime >= 7200, // 2 hours in seconds
      progress: Math.min(totalReadingTime, 7200),
      maxProgress: 7200,
      category: 'reading'
    },

    // Quiz Achievements
    {
      id: 'quiz_rookie',
      title: 'Quiz Rookie',
      description: 'Complete your first quiz',
      emoji: '🧩',
      unlocked: quizAttempts.length >= 1,
      category: 'quiz'
    },
    {
      id: 'quiz_expert',
      title: 'Quiz Expert',
      description: 'Average 80% on quizzes',
      emoji: '🎯',
      unlocked: averageQuizScore >= 80,
      category: 'quiz'
    },
    {
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Get 100% on a quiz',
      emoji: '💯',
      unlocked: perfectQuizzes >= 1,
      category: 'quiz'
    },
    {
      id: 'quiz_master',
      title: 'Quiz Master',
      description: 'Get 3 perfect quiz scores',
      emoji: '🏅',
      unlocked: perfectQuizzes >= 3,
      progress: Math.min(perfectQuizzes, 3),
      maxProgress: 3,
      category: 'quiz'
    },

    // Progress Achievements
    {
      id: 'getting_started',
      title: 'Getting Started',
      description: 'Start your reading journey!',
      emoji: '🚀',
      unlocked: readingSessions.length >= 1,
      category: 'progress'
    },
    {
      id: 'level_up_ready',
      title: 'Level Up Ready',
      description: 'You\'re ready for the next level!',
      emoji: '⬆️',
      unlocked: completedStories >= 8 && averageQuizScore >= 75,
      category: 'progress'
    }
  ];

  // Sort achievements: unlocked first, then by category
  const sortedAchievements = achievements.sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }
    return a.category.localeCompare(b.category);
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'progress': return 'bg-green-100 text-green-800';
      case 'streak': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-orange-700 flex items-center justify-center gap-2">
            🏆 Achievement Progress
          </CardTitle>
          <CardDescription className="text-center text-lg">
            You've unlocked {unlockedCount} out of {totalAchievements} achievements!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm font-semibold text-orange-700 mb-2">
              <span>Overall Progress</span>
              <span>{Math.round((unlockedCount / totalAchievements) * 100)}%</span>
            </div>
            <Progress 
              value={(unlockedCount / totalAchievements) * 100} 
              className="h-3 mb-4"
            />
            <div className="text-center text-6xl mb-2">
              {unlockedCount === totalAchievements ? '👑' : 
               unlockedCount >= totalAchievements * 0.75 ? '🌟' :
               unlockedCount >= totalAchievements * 0.5 ? '⭐' : '🏃'}
            </div>
            <p className="text-center text-orange-600 font-medium">
              {unlockedCount === totalAchievements ? 'Achievement Master!' :
               unlockedCount >= totalAchievements * 0.75 ? 'Almost there!' :
               unlockedCount >= totalAchievements * 0.5 ? 'Great progress!' : 'Keep going!'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAchievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={`transition-all duration-200 ${
              achievement.unlocked 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md' 
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                  {achievement.emoji}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(achievement.category)}>
                    {achievement.category}
                  </Badge>
                  {achievement.unlocked && (
                    <Badge className="bg-green-200 text-green-800">
                      ✅ Unlocked
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className={`text-lg ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                {achievement.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {achievement.description}
              </CardDescription>
            </CardHeader>
            
            {(achievement.progress !== undefined && achievement.maxProgress !== undefined) && (
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Progress</span>
                    <span>
                      {achievement.id.includes('time') 
                        ? `${formatTime(achievement.progress)} / ${formatTime(achievement.maxProgress)}`
                        : `${achievement.progress} / ${achievement.maxProgress}`
                      }
                    </span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Motivational Message */}
      <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300">
        <CardContent className="text-center py-6">
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="text-xl font-bold text-purple-700 mb-2">Keep Reading!</h3>
          <p className="text-purple-600">
            Every story you read and every quiz you complete brings you closer to new achievements. 
            You're doing amazing, {user.name}!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}