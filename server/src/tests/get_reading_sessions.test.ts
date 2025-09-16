import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, contentTable, readingSessionsTable } from '../db/schema';
import { getReadingSessions } from '../handlers/get_reading_sessions';

describe('getReadingSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no reading sessions', async () => {
    // Create a user but no reading sessions
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const result = await getReadingSessions(user[0].id);

    expect(result).toEqual([]);
  });

  it('should return all reading sessions for a user', async () => {
    // Create user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    // Create content
    const content1 = await db.insert(contentTable)
      .values({
        title: 'Test Story 1',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A simple test story for reading.',
        order_index: 1
      })
      .returning()
      .execute();

    const content2 = await db.insert(contentTable)
      .values({
        title: 'Test Story 2',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Another test story for reading.',
        order_index: 2
      })
      .returning()
      .execute();

    // Create reading sessions
    const session1 = await db.insert(readingSessionsTable)
      .values({
        user_id: user[0].id,
        content_id: content1[0].id,
        words_read: 25,
        reading_accuracy: 85.5,
        session_duration_seconds: 180
      })
      .returning()
      .execute();

    const session2 = await db.insert(readingSessionsTable)
      .values({
        user_id: user[0].id,
        content_id: content2[0].id,
        words_read: 40,
        reading_accuracy: 92.3,
        session_duration_seconds: 240
      })
      .returning()
      .execute();

    const result = await getReadingSessions(user[0].id);

    expect(result).toHaveLength(2);
    
    // Verify all fields are present and correct types
    result.forEach(session => {
      expect(session.id).toBeDefined();
      expect(session.user_id).toBe(user[0].id);
      expect(session.content_id).toBeDefined();
      expect(typeof session.words_read).toBe('number');
      expect(typeof session.reading_accuracy).toBe('number');
      expect(typeof session.session_duration_seconds).toBe('number');
      expect(session.started_at).toBeInstanceOf(Date);
    });

    // Check specific values
    const sessionIds = result.map(s => s.id).sort();
    const expectedIds = [session1[0].id, session2[0].id].sort();
    expect(sessionIds).toEqual(expectedIds);
  });

  it('should handle sessions with null reading_accuracy', async () => {
    // Create user and content
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A test story.',
        order_index: 1
      })
      .returning()
      .execute();

    // Create reading session with null accuracy
    await db.insert(readingSessionsTable)
      .values({
        user_id: user[0].id,
        content_id: content[0].id,
        words_read: 15,
        reading_accuracy: null,
        session_duration_seconds: 120
      })
      .returning()
      .execute();

    const result = await getReadingSessions(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].reading_accuracy).toBeNull();
    expect(result[0].words_read).toBe(15);
    expect(result[0].session_duration_seconds).toBe(120);
  });

  it('should return sessions ordered by most recent first', async () => {
    // Create user and content
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A test story.',
        order_index: 1
      })
      .returning()
      .execute();

    // Create sessions with different timestamps
    const earlierDate = new Date('2023-01-01T10:00:00Z');
    const laterDate = new Date('2023-01-02T10:00:00Z');

    const olderSession = await db.insert(readingSessionsTable)
      .values({
        user_id: user[0].id,
        content_id: content[0].id,
        words_read: 20,
        session_duration_seconds: 150,
        started_at: earlierDate
      })
      .returning()
      .execute();

    const newerSession = await db.insert(readingSessionsTable)
      .values({
        user_id: user[0].id,
        content_id: content[0].id,
        words_read: 30,
        session_duration_seconds: 200,
        started_at: laterDate
      })
      .returning()
      .execute();

    const result = await getReadingSessions(user[0].id);

    expect(result).toHaveLength(2);
    // Should be ordered by most recent first
    expect(result[0].id).toBe(newerSession[0].id);
    expect(result[1].id).toBe(olderSession[0].id);
    expect(result[0].started_at.getTime()).toBeGreaterThan(result[1].started_at.getTime());
  });

  it('should only return sessions for the specified user', async () => {
    // Create two users
    const user1 = await db.insert(usersTable)
      .values({
        name: 'User 1',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        name: 'User 2',
        age: 9,
        level: 'intermediate'
      })
      .returning()
      .execute();

    // Create content
    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A test story.',
        order_index: 1
      })
      .returning()
      .execute();

    // Create sessions for both users
    await db.insert(readingSessionsTable)
      .values({
        user_id: user1[0].id,
        content_id: content[0].id,
        words_read: 25,
        session_duration_seconds: 180
      })
      .returning()
      .execute();

    await db.insert(readingSessionsTable)
      .values({
        user_id: user2[0].id,
        content_id: content[0].id,
        words_read: 35,
        session_duration_seconds: 220
      })
      .returning()
      .execute();

    // Should only return sessions for user1
    const user1Sessions = await getReadingSessions(user1[0].id);
    expect(user1Sessions).toHaveLength(1);
    expect(user1Sessions[0].user_id).toBe(user1[0].id);
    expect(user1Sessions[0].words_read).toBe(25);

    // Should only return sessions for user2
    const user2Sessions = await getReadingSessions(user2[0].id);
    expect(user2Sessions).toHaveLength(1);
    expect(user2Sessions[0].user_id).toBe(user2[0].id);
    expect(user2Sessions[0].words_read).toBe(35);
  });

  it('should handle numeric conversion for reading_accuracy correctly', async () => {
    // Create user and content
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A test story.',
        order_index: 1
      })
      .returning()
      .execute();

    // Create session with precise reading accuracy
    await db.insert(readingSessionsTable)
      .values({
        user_id: user[0].id,
        content_id: content[0].id,
        words_read: 50,
        reading_accuracy: 87.75, // Precise decimal value
        session_duration_seconds: 300
      })
      .returning()
      .execute();

    const result = await getReadingSessions(user[0].id);

    expect(result).toHaveLength(1);
    expect(typeof result[0].reading_accuracy).toBe('number');
    expect(result[0].reading_accuracy).toBe(87.75);
  });
});