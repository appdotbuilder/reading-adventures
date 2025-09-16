import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Quiz, Question, User, CreateQuizAttemptInput } from '../../../server/src/schema';

interface QuizSectionProps {
  quiz: Quiz;
  user: User;
  onComplete: () => void;
  onSkip: () => void;
}

// Create sample questions for demonstration since backend handlers are stubs
const createSampleQuestions = (quiz: Quiz): Question[] => {
  return [
    {
      id: 1,
      quiz_id: quiz.id,
      question_text: "What was the main character's name?",
      question_type: 'multiple_choice',
      correct_answer: "Sam",
      options: ["Sam", "Tom", "Ben", "Max"],
      order_index: 1,
      points: 1
    },
    {
      id: 2,
      quiz_id: quiz.id,
      question_text: "The story was about friendship.",
      question_type: 'true_false',
      correct_answer: "true",
      options: ["true", "false"],
      order_index: 2,
      points: 1
    },
    {
      id: 3,
      quiz_id: quiz.id,
      question_text: "Fill in the blank: The cat was very _____.",
      question_type: 'fill_blank',
      correct_answer: "happy",
      options: null,
      order_index: 3,
      points: 1
    }
  ];
};

export function QuizSection({ quiz, user, onComplete, onSkip }: QuizSectionProps) {
  const [questions] = useState<Question[]>(createSampleQuestions(quiz)); // Using sample questions since backend handlers are stubs
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev: { [key: number]: string }) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = async () => {
    let correctCount = 0;
    questions.forEach((question: Question) => {
      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    setScore(finalScore);
    setShowResults(true);

    // Save quiz attempt
    try {
      setIsSubmitting(true);
      const attemptData: CreateQuizAttemptInput = {
        user_id: user.id,
        quiz_id: quiz.id,
        score: finalScore,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        time_taken_seconds: 300 // Placeholder time since we're not tracking it yet
      };
      
      await trpc.createQuizAttempt.mutate(attemptData);
    } catch (error) {
      console.error('Failed to save quiz attempt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const userAnswer = answers[question.id] || '';

    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={userAnswer}
              onValueChange={(value) => handleAnswer(question.id, value)}
              className="space-y-3"
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="text-lg cursor-pointer flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={userAnswer}
              onValueChange={(value) => handleAnswer(question.id, value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="text-xl cursor-pointer flex-1 flex items-center gap-2">
                  ✅ True
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-red-300 transition-colors">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="text-xl cursor-pointer flex-1 flex items-center gap-2">
                  ❌ False
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <Input
              value={userAnswer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleAnswer(question.id, e.target.value)
              }
              placeholder="Type your answer here..."
              className="text-lg p-4 border-2 border-gray-200 focus:border-purple-400"
            />
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 60) return '🥉';
    return '💪';
  };

  const getEncouragementMessage = (score: number) => {
    if (score >= 90) return "Outstanding! You're a reading superstar! 🌟";
    if (score >= 80) return "Excellent work! You really understood the story! 🎉";
    if (score >= 70) return "Great job! You're getting better and better! 👏";
    if (score >= 60) return "Good effort! Keep practicing and you'll improve! 📚";
    return "Nice try! Reading takes practice - keep going! 💪";
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center p-4">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="text-8xl mb-4">{getScoreEmoji(score)}</div>
            <CardTitle className="text-4xl text-purple-700 mb-2">Quiz Complete!</CardTitle>
            <p className="text-xl text-gray-600">{getEncouragementMessage(score)}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-purple-700 mb-4">Your Score</h3>
              <div className="text-6xl font-bold text-purple-800 mb-2">{score}%</div>
              <p className="text-lg text-gray-600">
                {questions.filter(q => {
                  const userAnswer = answers[q.id];
                  return userAnswer && userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
                }).length} out of {totalQuestions} questions correct!
              </p>
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-700 text-center">Review Your Answers</h3>
              {questions.map((question: Question, index) => {
                const userAnswer = answers[question.id] || 'No answer';
                const isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
                
                return (
                  <div key={question.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{isCorrect ? '✅' : '❌'}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2">
                          Question {index + 1}: {question.question_text}
                        </p>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Your answer:</span> <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></p>
                          {!isCorrect && (
                            <p><span className="font-medium">Correct answer:</span> <span className="text-green-700">{question.correct_answer}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={onComplete}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-lg py-3"
                disabled={isSubmitting}
              >
                🌟 Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
                onClick={onSkip}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                ⏭️ Skip Quiz
              </Button>
              <Badge className="bg-blue-200 text-blue-800 text-lg px-4 py-2">
                🧩 Quiz Time!
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-purple-700 mb-4">
              {quiz.title}
            </CardTitle>
            {quiz.description && (
              <p className="text-center text-gray-600">{quiz.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Current Question */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion.question_text}
              </h3>
              
              {renderQuestion(currentQuestion)}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                ← Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {currentQuestionIndex === questions.length - 1 ? '🏁 Finish Quiz' : 'Next →'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Tips */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-4 text-center">
            <p className="text-gray-600">
              💡 <strong>Tip:</strong> Take your time and think about what you read in the story!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}