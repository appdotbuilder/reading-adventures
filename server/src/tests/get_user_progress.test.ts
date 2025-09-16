import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, contentTable, userProgressTable } from '../db/schema';
import { type GetUserProgressInput } from '../schema';
import { getUserProgress } from '../handlers/get_user_progress';

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all progress for a user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Child',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    // Create test content
    const content1 = await db.insert(contentTable)
      .values({
        title: 'Test Story 1',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A simple story',
        order_index: 1
      })
      .returning()
      .execute();

    const content2 = await db.insert(contentTable)
      .values({
        title: 'Test Story 2',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Another story',
        order_index: 2
      })
      .returning()
      .execute();

    // Create progress records
    await db.insert(userProgressTable)
      .values([
        {
          user_id: user[0].id,
          content_id: content1[0].id,
          status: 'in_progress',
          completion_percentage: 75.5,
          time_spent_seconds: 300
        },
        {
          user_id: user[0].id,
          content_id: content2[0].id,
          status: 'completed',
          completion_percentage: 100,
          time_spent_seconds: 450
        }
      ])
      .execute();

    const input: GetUserProgressInput = {
      user_id: user[0].id
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(2);
    
    // Verify numeric conversion
    result.forEach(progress => {
      expect(typeof progress.completion_percentage).toBe('number');
      expect(progress.user_id).toBe(user[0].id);
      expect(progress.id).toBeDefined();
      expect(progress.created_at).toBeInstanceOf(Date);
      expect(progress.last_accessed).toBeInstanceOf(Date);
    });

    // Check specific values
    const progress1 = result.find(p => p.content_id === content1[0].id);
    const progress2 = result.find(p => p.content_id === content2[0].id);

    expect(progress1).toBeDefined();
    expect(progress1!.status).toBe('in_progress');
    expect(progress1!.completion_percentage).toBe(75.5);
    expect(progress1!.time_spent_seconds).toBe(300);

    expect(progress2).toBeDefined();
    expect(progress2!.status).toBe('completed');
    expect(progress2!.completion_percentage).toBe(100);
    expect(progress2!.time_spent_seconds).toBe(450);
  });

  it('should get progress for specific content', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Child',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    // Create test content
    const content1 = await db.insert(contentTable)
      .values({
        title: 'Test Story 1',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A simple story',
        order_index: 1
      })
      .returning()
      .execute();

    const content2 = await db.insert(contentTable)
      .values({
        title: 'Test Story 2',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'Another story',
        order_index: 2
      })
      .returning()
      .execute();

    // Create progress records for both content items
    await db.insert(userProgressTable)
      .values([
        {
          user_id: user[0].id,
          content_id: content1[0].id,
          status: 'in_progress',
          completion_percentage: 75.5,
          time_spent_seconds: 300
        },
        {
          user_id: user[0].id,
          content_id: content2[0].id,
          status: 'completed',
          completion_percentage: 100,
          time_spent_seconds: 450
        }
      ])
      .execute();

    const input: GetUserProgressInput = {
      user_id: user[0].id,
      content_id: content1[0].id
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].content_id).toBe(content1[0].id);
    expect(result[0].status).toBe('in_progress');
    expect(result[0].completion_percentage).toBe(75.5);
    expect(typeof result[0].completion_percentage).toBe('number');
    expect(result[0].time_spent_seconds).toBe(300);
  });

  it('should return empty array when user has no progress', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Child',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const input: GetUserProgressInput = {
      user_id: user[0].id
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when specific content has no progress', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Child',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    // Create test content
    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A simple story',
        order_index: 1
      })
      .returning()
      .execute();

    const input: GetUserProgressInput = {
      user_id: user[0].id,
      content_id: content[0].id
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(0);
  });

  it('should handle decimal completion percentages correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Child',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    // Create test content
    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A simple story',
        order_index: 1
      })
      .returning()
      .execute();

    // Create progress with precise decimal value
    await db.insert(userProgressTable)
      .values({
        user_id: user[0].id,
        content_id: content[0].id,
        status: 'in_progress',
        completion_percentage: 33.333,
        time_spent_seconds: 120
      })
      .execute();

    const input: GetUserProgressInput = {
      user_id: user[0].id,
      content_id: content[0].id
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].completion_percentage).toBeCloseTo(33.333, 2);
    expect(typeof result[0].completion_percentage).toBe('number');
  });

  it('should filter progress by user_id correctly', async () => {
    // Create two test users
    const user1 = await db.insert(usersTable)
      .values({
        name: 'Test Child 1',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        name: 'Test Child 2',
        age: 9,
        level: 'intermediate'
      })
      .returning()
      .execute();

    // Create test content
    const content = await db.insert(contentTable)
      .values({
        title: 'Test Story',
        type: 'story',
        difficulty: 'beginner',
        text_content: 'A simple story',
        order_index: 1
      })
      .returning()
      .execute();

    // Create progress records for both users
    await db.insert(userProgressTable)
      .values([
        {
          user_id: user1[0].id,
          content_id: content[0].id,
          status: 'in_progress',
          completion_percentage: 50,
          time_spent_seconds: 200
        },
        {
          user_id: user2[0].id,
          content_id: content[0].id,
          status: 'completed',
          completion_percentage: 100,
          time_spent_seconds: 400
        }
      ])
      .execute();

    const input: GetUserProgressInput = {
      user_id: user1[0].id
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1[0].id);
    expect(result[0].status).toBe('in_progress');
    expect(result[0].completion_percentage).toBe(50);
  });
});