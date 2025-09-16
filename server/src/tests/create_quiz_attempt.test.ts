import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizAttemptsTable, usersTable, contentTable, quizzesTable } from '../db/schema';
import { type CreateQuizAttemptInput } from '../schema';
import { createQuizAttempt } from '../handlers/create_quiz_attempt';
import { eq } from 'drizzle-orm';

// Test setup - create prerequisite data
const setupTestData = async () => {
  // Create a test user
  const userResult = await db.insert(usersTable)
    .values({
      name: 'Test Child',
      age: 8,
      level: 'beginner'
    })
    .returning()
    .execute();

  // Create test content
  const contentResult = await db.insert(contentTable)
    .values({
      title: 'Test Reading',
      type: 'word',
      difficulty: 'beginner',
      text_content: 'cat dog hat',
      order_index: 1
    })
    .returning()
    .execute();

  // Create a test quiz
  const quizResult = await db.insert(quizzesTable)
    .values({
      content_id: contentResult[0].id,
      title: 'Word Recognition Quiz',
      description: 'Test quiz for phonics'
    })
    .returning()
    .execute();

  return {
    user: userResult[0],
    content: contentResult[0],
    quiz: quizResult[0]
  };
};

// Simple test input
const testInput: CreateQuizAttemptInput = {
  user_id: 1,
  quiz_id: 1,
  score: 85.5,
  total_questions: 10,
  correct_answers: 8,
  time_taken_seconds: 120
};

describe('createQuizAttempt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz attempt', async () => {
    const testData = await setupTestData();
    
    const input = {
      ...testInput,
      user_id: testData.user.id,
      quiz_id: testData.quiz.id
    };

    const result = await createQuizAttempt(input);

    // Basic field validation
    expect(result.user_id).toEqual(testData.user.id);
    expect(result.quiz_id).toEqual(testData.quiz.id);
    expect(result.score).toEqual(85.5);
    expect(typeof result.score).toBe('number');
    expect(result.total_questions).toEqual(10);
    expect(result.correct_answers).toEqual(8);
    expect(result.time_taken_seconds).toEqual(120);
    expect(result.id).toBeDefined();
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should save quiz attempt to database', async () => {
    const testData = await setupTestData();
    
    const input = {
      ...testInput,
      user_id: testData.user.id,
      quiz_id: testData.quiz.id
    };

    const result = await createQuizAttempt(input);

    // Query using proper drizzle syntax
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, result.id))
      .execute();

    expect(attempts).toHaveLength(1);
    expect(attempts[0].user_id).toEqual(testData.user.id);
    expect(attempts[0].quiz_id).toEqual(testData.quiz.id);
    expect(attempts[0].score).toEqual(85.5);
    expect(attempts[0].total_questions).toEqual(10);
    expect(attempts[0].correct_answers).toEqual(8);
    expect(attempts[0].time_taken_seconds).toEqual(120);
    expect(attempts[0].completed_at).toBeInstanceOf(Date);
  });

  it('should handle perfect score', async () => {
    const testData = await setupTestData();
    
    const perfectScoreInput = {
      user_id: testData.user.id,
      quiz_id: testData.quiz.id,
      score: 100,
      total_questions: 5,
      correct_answers: 5,
      time_taken_seconds: 90
    };

    const result = await createQuizAttempt(perfectScoreInput);

    expect(result.score).toEqual(100);
    expect(result.total_questions).toEqual(5);
    expect(result.correct_answers).toEqual(5);
    expect(result.time_taken_seconds).toEqual(90);
  });

  it('should handle zero score', async () => {
    const testData = await setupTestData();
    
    const zeroScoreInput = {
      user_id: testData.user.id,
      quiz_id: testData.quiz.id,
      score: 0,
      total_questions: 8,
      correct_answers: 0,
      time_taken_seconds: 180
    };

    const result = await createQuizAttempt(zeroScoreInput);

    expect(result.score).toEqual(0);
    expect(result.total_questions).toEqual(8);
    expect(result.correct_answers).toEqual(0);
    expect(result.time_taken_seconds).toEqual(180);
  });

  it('should handle decimal scores correctly', async () => {
    const testData = await setupTestData();
    
    const decimalScoreInput = {
      user_id: testData.user.id,
      quiz_id: testData.quiz.id,
      score: 73.33,
      total_questions: 15,
      correct_answers: 11,
      time_taken_seconds: 300
    };

    const result = await createQuizAttempt(decimalScoreInput);

    expect(result.score).toEqual(73.33);
    expect(typeof result.score).toBe('number');
    
    // Verify in database
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, result.id))
      .execute();

    expect(attempts[0].score).toEqual(73.33);
  });

  it('should handle multiple quiz attempts for same user', async () => {
    const testData = await setupTestData();
    
    // First attempt
    const firstAttempt = await createQuizAttempt({
      user_id: testData.user.id,
      quiz_id: testData.quiz.id,
      score: 60,
      total_questions: 10,
      correct_answers: 6,
      time_taken_seconds: 150
    });

    // Second attempt
    const secondAttempt = await createQuizAttempt({
      user_id: testData.user.id,
      quiz_id: testData.quiz.id,
      score: 80,
      total_questions: 10,
      correct_answers: 8,
      time_taken_seconds: 130
    });

    expect(firstAttempt.id).not.toEqual(secondAttempt.id);
    expect(firstAttempt.score).toEqual(60);
    expect(secondAttempt.score).toEqual(80);

    // Verify both are saved in database
    const allAttempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.user_id, testData.user.id))
      .execute();

    expect(allAttempts).toHaveLength(2);
  });
});