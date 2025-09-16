import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, contentTable, quizzesTable, quizAttemptsTable } from '../db/schema';
import { getQuizAttempts } from '../handlers/get_quiz_attempts';

describe('getQuizAttempts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no quiz attempts', async () => {
    // Create a user without quiz attempts
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const result = await getQuizAttempts(userResult[0].id);

    expect(result).toEqual([]);
  });

  it('should return quiz attempts for a specific user', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create content and quiz
    const contentResult = await db.insert(contentTable)
      .values({
        title: 'Test Content',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Test story content',
        order_index: 1
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        content_id: contentResult[0].id,
        title: 'Test Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();
    const quizId = quizResult[0].id;

    // Create quiz attempts
    await db.insert(quizAttemptsTable)
      .values([
        {
          user_id: userId,
          quiz_id: quizId,
          score: 85.5,
          total_questions: 10,
          correct_answers: 8,
          time_taken_seconds: 300
        },
        {
          user_id: userId,
          quiz_id: quizId,
          score: 92.0,
          total_questions: 10,
          correct_answers: 9,
          time_taken_seconds: 250
        }
      ])
      .execute();

    const result = await getQuizAttempts(userId);

    expect(result).toHaveLength(2);
    
    // Check first attempt (should be ordered by completed_at desc)
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].quiz_id).toEqual(quizId);
    expect(typeof result[0].score).toEqual('number');
    expect(result[0].total_questions).toEqual(10);
    expect(result[0].completed_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    // Check that all numeric fields are properly converted
    result.forEach(attempt => {
      expect(typeof attempt.score).toEqual('number');
      expect(typeof attempt.total_questions).toEqual('number');
      expect(typeof attempt.correct_answers).toEqual('number');
      expect(typeof attempt.time_taken_seconds).toEqual('number');
    });
  });

  it('should return attempts ordered by completed_at descending', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create content and quiz
    const contentResult = await db.insert(contentTable)
      .values({
        title: 'Test Content',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Test story content',
        order_index: 1
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        content_id: contentResult[0].id,
        title: 'Test Quiz'
      })
      .returning()
      .execute();
    const quizId = quizResult[0].id;

    // Create attempts with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute ago

    // Insert older attempt first
    await db.insert(quizAttemptsTable)
      .values({
        user_id: userId,
        quiz_id: quizId,
        score: 75.0,
        total_questions: 8,
        correct_answers: 6,
        time_taken_seconds: 400,
        completed_at: earlier
      })
      .execute();

    // Insert newer attempt
    await db.insert(quizAttemptsTable)
      .values({
        user_id: userId,
        quiz_id: quizId,
        score: 90.0,
        total_questions: 10,
        correct_answers: 9,
        time_taken_seconds: 300,
        completed_at: now
      })
      .execute();

    const result = await getQuizAttempts(userId);

    expect(result).toHaveLength(2);
    
    // First result should be the newer attempt (desc order)
    expect(result[0].score).toEqual(90.0);
    expect(result[1].score).toEqual(75.0);
    
    // Verify ordering by checking timestamps
    expect(result[0].completed_at.getTime()).toBeGreaterThan(result[1].completed_at.getTime());
  });

  it('should not return attempts from other users', async () => {
    // Create two users
    const usersResult = await db.insert(usersTable)
      .values([
        { name: 'User 1', age: 8, level: 'beginner' },
        { name: 'User 2', age: 9, level: 'intermediate' }
      ])
      .returning()
      .execute();
    const user1Id = usersResult[0].id;
    const user2Id = usersResult[1].id;

    // Create content and quiz
    const contentResult = await db.insert(contentTable)
      .values({
        title: 'Test Content',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Test story content',
        order_index: 1
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        content_id: contentResult[0].id,
        title: 'Test Quiz'
      })
      .returning()
      .execute();
    const quizId = quizResult[0].id;

    // Create attempts for both users
    await db.insert(quizAttemptsTable)
      .values([
        {
          user_id: user1Id,
          quiz_id: quizId,
          score: 85.0,
          total_questions: 10,
          correct_answers: 8,
          time_taken_seconds: 300
        },
        {
          user_id: user2Id,
          quiz_id: quizId,
          score: 75.0,
          total_questions: 10,
          correct_answers: 7,
          time_taken_seconds: 350
        }
      ])
      .execute();

    // Get attempts for user1 only
    const result = await getQuizAttempts(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].score).toEqual(85.0);
  });

  it('should handle user with non-existent id gracefully', async () => {
    const result = await getQuizAttempts(999999);

    expect(result).toEqual([]);
  });

  it('should handle decimal scores correctly', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create content and quiz
    const contentResult = await db.insert(contentTable)
      .values({
        title: 'Test Content',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Test story content',
        order_index: 1
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        content_id: contentResult[0].id,
        title: 'Test Quiz'
      })
      .returning()
      .execute();

    // Create attempt with decimal score
    await db.insert(quizAttemptsTable)
      .values({
        user_id: userId,
        quiz_id: quizResult[0].id,
        score: 87.75,
        total_questions: 8,
        correct_answers: 7,
        time_taken_seconds: 280
      })
      .execute();

    const result = await getQuizAttempts(userId);

    expect(result).toHaveLength(1);
    expect(result[0].score).toEqual(87.75);
    expect(typeof result[0].score).toEqual('number');
  });
});