import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type GetUserProgressInput, type UserProgress } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getUserProgress(input: GetUserProgressInput): Promise<UserProgress[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(userProgressTable.user_id, input.user_id));

    // Optionally filter by content_id
    if (input.content_id !== undefined) {
      conditions.push(eq(userProgressTable.content_id, input.content_id));
    }

    // Build query with where clause
    const results = await db.select()
      .from(userProgressTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(progress => ({
      ...progress,
      completion_percentage: parseFloat(progress.completion_percentage.toString())
    }));
  } catch (error) {
    console.error('Get user progress failed:', error);
    throw error;
  }
}