import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, contentTable, userProgressTable } from '../db/schema';
import { type UpdateProgressInput } from '../schema';
import { updateUserProgress } from '../handlers/update_user_progress';
import { eq, and } from 'drizzle-orm';

// Test data
const testUser = {
  name: 'Test Child',
  age: 8,
  level: 'beginner' as const,
};

const testContent = {
  title: 'Test Story',
  type: 'story' as const,
  difficulty: 'beginner' as const,
  text_content: 'Once upon a time...',
  order_index: 1,
};

describe('updateUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let contentId: number;

  beforeEach(async () => {
    // Create prerequisite user and content
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    const contentResult = await db.insert(contentTable)
      .values(testContent)
      .returning()
      .execute();
    contentId = contentResult[0].id;
  });

  it('should create new progress record when none exists', async () => {
    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: contentId,
      status: 'in_progress',
      completion_percentage: 25,
      time_spent_seconds: 300,
    };

    const result = await updateUserProgress(input);

    // Verify return values
    expect(result.user_id).toEqual(userId);
    expect(result.content_id).toEqual(contentId);
    expect(result.status).toEqual('in_progress');
    expect(result.completion_percentage).toEqual(25);
    expect(typeof result.completion_percentage).toEqual('number');
    expect(result.time_spent_seconds).toEqual(300);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_accessed).toBeInstanceOf(Date);
  });

  it('should save new progress record to database', async () => {
    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: contentId,
      completion_percentage: 50,
    };

    const result = await updateUserProgress(input);

    // Verify database record
    const progressRecords = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, userId),
          eq(userProgressTable.content_id, contentId)
        )
      )
      .execute();

    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].id).toEqual(result.id);
    expect(parseFloat(progressRecords[0].completion_percentage.toString())).toEqual(50);
    expect(progressRecords[0].status).toEqual('not_started'); // Default when not provided
  });

  it('should update existing progress record', async () => {
    // First create a progress record
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        content_id: contentId,
        status: 'not_started',
        completion_percentage: 0,
        time_spent_seconds: 0,
      })
      .execute();

    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: contentId,
      status: 'completed',
      completion_percentage: 100,
      time_spent_seconds: 1200,
    };

    const result = await updateUserProgress(input);

    // Verify updated values
    expect(result.status).toEqual('completed');
    expect(result.completion_percentage).toEqual(100);
    expect(result.time_spent_seconds).toEqual(1200);
    expect(result.last_accessed).toBeInstanceOf(Date);

    // Verify only one record exists in database
    const progressRecords = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, userId),
          eq(userProgressTable.content_id, contentId)
        )
      )
      .execute();

    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].status).toEqual('completed');
    expect(parseFloat(progressRecords[0].completion_percentage.toString())).toEqual(100);
    expect(progressRecords[0].time_spent_seconds).toEqual(1200);
  });

  it('should update only provided fields', async () => {
    // First create a progress record
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        content_id: contentId,
        status: 'in_progress',
        completion_percentage: 30,
        time_spent_seconds: 500,
      })
      .execute();

    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: contentId,
      completion_percentage: 75, // Only update completion percentage
    };

    const result = await updateUserProgress(input);

    // Verify only completion_percentage was updated
    expect(result.status).toEqual('in_progress'); // Should remain unchanged
    expect(result.completion_percentage).toEqual(75); // Should be updated
    expect(result.time_spent_seconds).toEqual(500); // Should remain unchanged
  });

  it('should apply defaults when creating new record with minimal input', async () => {
    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: contentId,
    };

    const result = await updateUserProgress(input);

    expect(result.status).toEqual('not_started');
    expect(result.completion_percentage).toEqual(0);
    expect(result.time_spent_seconds).toEqual(0);
    expect(result.last_accessed).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input: UpdateProgressInput = {
      user_id: 9999, // Non-existent user
      content_id: contentId,
    };

    expect(updateUserProgress(input)).rejects.toThrow(/User with id 9999 does not exist/i);
  });

  it('should throw error for non-existent content', async () => {
    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: 9999, // Non-existent content
    };

    expect(updateUserProgress(input)).rejects.toThrow(/Content with id 9999 does not exist/i);
  });

  it('should update last_accessed timestamp on every call', async () => {
    // Create initial progress record
    const initialTime = new Date('2023-01-01T00:00:00.000Z');
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        content_id: contentId,
        status: 'in_progress',
        completion_percentage: 25,
        time_spent_seconds: 300,
        last_accessed: initialTime,
      })
      .execute();

    const input: UpdateProgressInput = {
      user_id: userId,
      content_id: contentId,
      completion_percentage: 30,
    };

    const result = await updateUserProgress(input);

    // Verify last_accessed was updated to current time (not the initial time)
    expect(result.last_accessed.getTime()).toBeGreaterThan(initialTime.getTime());
  });
});