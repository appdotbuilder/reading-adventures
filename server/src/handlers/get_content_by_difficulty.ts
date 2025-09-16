import { db } from '../db';
import { contentTable } from '../db/schema';
import { type GetContentByDifficultyInput, type Content } from '../schema';
import { eq, and, asc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getContentByDifficulty = async (input: GetContentByDifficultyInput): Promise<Content[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by difficulty (required field)
    conditions.push(eq(contentTable.difficulty, input.difficulty));
    
    // Optionally filter by content type
    if (input.type) {
      conditions.push(eq(contentTable.type, input.type));
    }

    // Build the final query with all conditions applied at once
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
    
    const results = await db.select()
      .from(contentTable)
      .where(whereClause)
      .orderBy(asc(contentTable.order_index))
      .execute();

    // Return results as-is since contentTable doesn't have numeric fields that need conversion
    return results;
  } catch (error) {
    console.error('Failed to get content by difficulty:', error);
    throw error;
  }
};