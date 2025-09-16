import { serial, text, pgTable, timestamp, integer, pgEnum, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const difficultyLevel = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced']);
export const contentType = pgEnum('content_type', ['word', 'sentence', 'story', 'poem']);
export const questionType = pgEnum('question_type', ['multiple_choice', 'true_false', 'fill_blank', 'word_match']);
export const progressStatus = pgEnum('progress_status', ['not_started', 'in_progress', 'completed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  level: difficultyLevel('level').notNull().default('beginner'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Content table - stores words, sentences, stories, poems
export const contentTable = pgTable('content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: contentType('type').notNull(),
  difficulty: difficultyLevel('difficulty').notNull(),
  text_content: text('text_content').notNull(),
  audio_url: text('audio_url'), // Nullable - URL to audio file
  order_index: integer('order_index').notNull(),
  phonics_focus: text('phonics_focus'), // Nullable - phonics patterns being taught
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Words table - individual words with pronunciation
export const wordsTable = pgTable('words', {
  id: serial('id').primaryKey(),
  word: text('word').notNull(),
  phonetic_spelling: text('phonetic_spelling'), // Nullable
  audio_url: text('audio_url'), // Nullable
  difficulty: difficultyLevel('difficulty').notNull(),
  definition: text('definition'), // Nullable - simple definition for kids
  example_sentence: text('example_sentence'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  content_id: integer('content_id').notNull(),
  title: text('title').notNull(),
  description: text('description'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull(),
  question_text: text('question_text').notNull(),
  question_type: questionType('question_type').notNull(),
  correct_answer: text('correct_answer').notNull(),
  options: text('options').array(), // Nullable array for multiple choice options
  order_index: integer('order_index').notNull(),
  points: integer('points').notNull().default(1),
});

// User progress table
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  content_id: integer('content_id').notNull(),
  status: progressStatus('status').notNull().default('not_started'),
  completion_percentage: real('completion_percentage').notNull().default(0),
  time_spent_seconds: integer('time_spent_seconds').notNull().default(0),
  last_accessed: timestamp('last_accessed').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quiz attempts table
export const quizAttemptsTable = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  quiz_id: integer('quiz_id').notNull(),
  score: real('score').notNull(),
  total_questions: integer('total_questions').notNull(),
  correct_answers: integer('correct_answers').notNull(),
  time_taken_seconds: integer('time_taken_seconds').notNull(),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
});

// Reading sessions table - tracks individual reading sessions
export const readingSessionsTable = pgTable('reading_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  content_id: integer('content_id').notNull(),
  words_read: integer('words_read').notNull().default(0),
  reading_accuracy: real('reading_accuracy'), // Nullable
  session_duration_seconds: integer('session_duration_seconds').notNull(),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'), // Nullable
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  progress: many(userProgressTable),
  quizAttempts: many(quizAttemptsTable),
  readingSessions: many(readingSessionsTable),
}));

export const contentRelations = relations(contentTable, ({ many }) => ({
  quizzes: many(quizzesTable),
  userProgress: many(userProgressTable),
  readingSessions: many(readingSessionsTable),
}));

export const quizzesRelations = relations(quizzesTable, ({ one, many }) => ({
  content: one(contentTable, {
    fields: [quizzesTable.content_id],
    references: [contentTable.id],
  }),
  questions: many(questionsTable),
  attempts: many(quizAttemptsTable),
}));

export const questionsRelations = relations(questionsTable, ({ one }) => ({
  quiz: one(quizzesTable, {
    fields: [questionsTable.quiz_id],
    references: [quizzesTable.id],
  }),
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userProgressTable.user_id],
    references: [usersTable.id],
  }),
  content: one(contentTable, {
    fields: [userProgressTable.content_id],
    references: [contentTable.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttemptsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [quizAttemptsTable.user_id],
    references: [usersTable.id],
  }),
  quiz: one(quizzesTable, {
    fields: [quizAttemptsTable.quiz_id],
    references: [quizzesTable.id],
  }),
}));

export const readingSessionsRelations = relations(readingSessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [readingSessionsTable.user_id],
    references: [usersTable.id],
  }),
  content: one(contentTable, {
    fields: [readingSessionsTable.content_id],
    references: [contentTable.id],
  }),
}));

// TypeScript types for table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Content = typeof contentTable.$inferSelect;
export type NewContent = typeof contentTable.$inferInsert;

export type Word = typeof wordsTable.$inferSelect;
export type NewWord = typeof wordsTable.$inferInsert;

export type Quiz = typeof quizzesTable.$inferSelect;
export type NewQuiz = typeof quizzesTable.$inferInsert;

export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

export type UserProgress = typeof userProgressTable.$inferSelect;
export type NewUserProgress = typeof userProgressTable.$inferInsert;

export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type NewQuizAttempt = typeof quizAttemptsTable.$inferInsert;

export type ReadingSession = typeof readingSessionsTable.$inferSelect;
export type NewReadingSession = typeof readingSessionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  content: contentTable,
  words: wordsTable,
  quizzes: quizzesTable,
  questions: questionsTable,
  userProgress: userProgressTable,
  quizAttempts: quizAttemptsTable,
  readingSessions: readingSessionsTable,
};