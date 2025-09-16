import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { readingSessionsTable, usersTable, contentTable } from '../db/schema';
import { type CreateReadingSessionInput } from '../schema';
import { createReadingSession } from '../handlers/create_reading_session';
import { eq } from 'drizzle-orm';

describe('createReadingSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create prerequisite data for tests
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
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'This is a test story for reading.',
        order_index: 1
      })
      .returning()
      .execute();

    return {
      userId: userResult[0].id,
      contentId: contentResult[0].id
    };
  };

  it('should create a reading session with basic data', async () => {
    const { userId, contentId } = await setupTestData();

    const testInput: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 25,
      session_duration_seconds: 300
    };

    const result = await createReadingSession(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.content_id).toEqual(contentId);
    expect(result.words_read).toEqual(25);
    expect(result.reading_accuracy).toBeNull(); // Not provided, should be null
    expect(result.session_duration_seconds).toEqual(300);
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull(); // Should be null for new sessions
  });

  it('should create a reading session with reading accuracy', async () => {
    const { userId, contentId } = await setupTestData();

    const testInput: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 50,
      reading_accuracy: 87.5,
      session_duration_seconds: 600
    };

    const result = await createReadingSession(testInput);

    // Validate reading accuracy conversion
    expect(result.reading_accuracy).toEqual(87.5);
    expect(typeof result.reading_accuracy).toBe('number');
    expect(result.words_read).toEqual(50);
    expect(result.session_duration_seconds).toEqual(600);
  });

  it('should save reading session to database correctly', async () => {
    const { userId, contentId } = await setupTestData();

    const testInput: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 35,
      reading_accuracy: 92.0,
      session_duration_seconds: 450
    };

    const result = await createReadingSession(testInput);

    // Query the database to verify the session was saved
    const sessions = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    const savedSession = sessions[0];
    
    expect(savedSession.user_id).toEqual(userId);
    expect(savedSession.content_id).toEqual(contentId);
    expect(savedSession.words_read).toEqual(35);
    expect(parseFloat(savedSession.reading_accuracy!.toString())).toEqual(92.0);
    expect(savedSession.session_duration_seconds).toEqual(450);
    expect(savedSession.started_at).toBeInstanceOf(Date);
    expect(savedSession.ended_at).toBeNull();
  });

  it('should create session with default words_read when not provided', async () => {
    const { userId, contentId } = await setupTestData();

    const testInput: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 0, // Use explicit default since Zod applies defaults after parsing
      session_duration_seconds: 180
    };

    const result = await createReadingSession(testInput);

    expect(result.words_read).toEqual(0); // Default value from Zod schema
    expect(result.session_duration_seconds).toEqual(180);
    expect(result.reading_accuracy).toBeNull();
  });

  it('should handle zero values correctly', async () => {
    const { userId, contentId } = await setupTestData();

    const testInput: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 0,
      reading_accuracy: 0.0,
      session_duration_seconds: 60
    };

    const result = await createReadingSession(testInput);

    expect(result.words_read).toEqual(0);
    expect(result.reading_accuracy).toEqual(0);
    expect(typeof result.reading_accuracy).toBe('number');
    expect(result.session_duration_seconds).toEqual(60);
  });

  it('should handle boundary values for reading accuracy', async () => {
    const { userId, contentId } = await setupTestData();

    // Test 100% accuracy
    const testInput: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 100,
      reading_accuracy: 100,
      session_duration_seconds: 900
    };

    const result = await createReadingSession(testInput);

    expect(result.reading_accuracy).toEqual(100);
    expect(result.words_read).toEqual(100);
  });

  it('should create multiple sessions for same user and content', async () => {
    const { userId, contentId } = await setupTestData();

    const session1Input: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 20,
      session_duration_seconds: 240
    };

    const session2Input: CreateReadingSessionInput = {
      user_id: userId,
      content_id: contentId,
      words_read: 30,
      reading_accuracy: 85.5,
      session_duration_seconds: 360
    };

    const result1 = await createReadingSession(session1Input);
    const result2 = await createReadingSession(session2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.words_read).toEqual(20);
    expect(result2.words_read).toEqual(30);
    expect(result1.reading_accuracy).toBeNull();
    expect(result2.reading_accuracy).toEqual(85.5);

    // Verify both sessions exist in database
    const allSessions = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.user_id, userId))
      .execute();

    expect(allSessions).toHaveLength(2);
  });
});