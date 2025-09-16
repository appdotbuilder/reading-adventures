import { z } from 'zod';

// Enums
export const difficultyLevelEnum = z.enum(['beginner', 'intermediate', 'advanced']);
export const contentTypeEnum = z.enum(['word', 'sentence', 'story', 'poem']);
export const questionTypeEnum = z.enum(['multiple_choice', 'true_false', 'fill_blank', 'word_match']);
export const progressStatusEnum = z.enum(['not_started', 'in_progress', 'completed']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number().int().min(6).max(12), // Age range for the target audience
  level: difficultyLevelEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Content schema - for words, sentences, stories, poems
export const contentSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: contentTypeEnum,
  difficulty: difficultyLevelEnum,
  text_content: z.string(),
  audio_url: z.string().nullable(), // URL to audio file
  order_index: z.number().int(), // For ordering within curriculum
  phonics_focus: z.string().nullable(), // Phonics patterns being taught
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Content = z.infer<typeof contentSchema>;

// Word schema - individual words with pronunciation
export const wordSchema = z.object({
  id: z.number(),
  word: z.string(),
  phonetic_spelling: z.string().nullable(), // Phonetic representation
  audio_url: z.string().nullable(),
  difficulty: difficultyLevelEnum,
  definition: z.string().nullable(), // Simple definition for kids
  example_sentence: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Word = z.infer<typeof wordSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  content_id: z.number(), // Reference to content this quiz is based on
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Quiz = z.infer<typeof quizSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_text: z.string(),
  question_type: questionTypeEnum,
  correct_answer: z.string(),
  options: z.array(z.string()).nullable(), // For multiple choice questions
  order_index: z.number().int(),
  points: z.number().int().default(1),
});

export type Question = z.infer<typeof questionSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  content_id: z.number(),
  status: progressStatusEnum,
  completion_percentage: z.number().min(0).max(100),
  time_spent_seconds: z.number().int().default(0),
  last_accessed: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Quiz attempt schema
export const quizAttemptSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  quiz_id: z.number(),
  score: z.number().min(0).max(100),
  total_questions: z.number().int(),
  correct_answers: z.number().int(),
  time_taken_seconds: z.number().int(),
  completed_at: z.coerce.date(),
});

export type QuizAttempt = z.infer<typeof quizAttemptSchema>;

// Reading session schema - tracks individual reading sessions
export const readingSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  content_id: z.number(),
  words_read: z.number().int().default(0),
  reading_accuracy: z.number().min(0).max(100).nullable(), // Percentage accuracy if tracked
  session_duration_seconds: z.number().int(),
  started_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable(),
});

export type ReadingSession = z.infer<typeof readingSessionSchema>;

// Input schemas for creating/updating entities

// Create user input
export const createUserInputSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(6).max(12),
  level: difficultyLevelEnum.default('beginner'),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Update user input
export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  age: z.number().int().min(6).max(12).optional(),
  level: difficultyLevelEnum.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Create content input
export const createContentInputSchema = z.object({
  title: z.string().min(1),
  type: contentTypeEnum,
  difficulty: difficultyLevelEnum,
  text_content: z.string().min(1),
  audio_url: z.string().nullable().optional(),
  order_index: z.number().int(),
  phonics_focus: z.string().nullable().optional(),
});

export type CreateContentInput = z.infer<typeof createContentInputSchema>;

// Create word input
export const createWordInputSchema = z.object({
  word: z.string().min(1),
  phonetic_spelling: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  difficulty: difficultyLevelEnum,
  definition: z.string().nullable().optional(),
  example_sentence: z.string().nullable().optional(),
});

export type CreateWordInput = z.infer<typeof createWordInputSchema>;

// Update progress input
export const updateProgressInputSchema = z.object({
  user_id: z.number(),
  content_id: z.number(),
  status: progressStatusEnum.optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
  time_spent_seconds: z.number().int().optional(),
});

export type UpdateProgressInput = z.infer<typeof updateProgressInputSchema>;

// Create quiz attempt input
export const createQuizAttemptInputSchema = z.object({
  user_id: z.number(),
  quiz_id: z.number(),
  score: z.number().min(0).max(100),
  total_questions: z.number().int(),
  correct_answers: z.number().int(),
  time_taken_seconds: z.number().int(),
});

export type CreateQuizAttemptInput = z.infer<typeof createQuizAttemptInputSchema>;

// Create reading session input
export const createReadingSessionInputSchema = z.object({
  user_id: z.number(),
  content_id: z.number(),
  words_read: z.number().int().default(0),
  reading_accuracy: z.number().min(0).max(100).nullable().optional(),
  session_duration_seconds: z.number().int(),
});

export type CreateReadingSessionInput = z.infer<typeof createReadingSessionInputSchema>;

// Get content by difficulty input
export const getContentByDifficultyInputSchema = z.object({
  difficulty: difficultyLevelEnum,
  type: contentTypeEnum.optional(),
});

export type GetContentByDifficultyInput = z.infer<typeof getContentByDifficultyInputSchema>;

// Get user progress input
export const getUserProgressInputSchema = z.object({
  user_id: z.number(),
  content_id: z.number().optional(),
});

export type GetUserProgressInput = z.infer<typeof getUserProgressInputSchema>;