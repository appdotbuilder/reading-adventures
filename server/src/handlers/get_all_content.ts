import { db } from '../db';
import { contentTable } from '../db/schema';
import { type Content } from '../schema';
import { asc } from 'drizzle-orm';

export const getAllContent = async (): Promise<Content[]> => {
  try {
    // Fetch all content ordered by difficulty (beginner -> intermediate -> advanced) 
    // and then by order_index within each difficulty level
    const results = await db.select()
      .from(contentTable)
      .orderBy(
        asc(contentTable.difficulty),
        asc(contentTable.order_index)
      )
      .execute();

    // Convert the results to match the Content schema
    return results.map(content => ({
      ...content,
      // No numeric conversions needed - all fields are already in correct format
    }));
  } catch (error) {
    console.error('Failed to fetch all content:', error);
    throw error;
  }
};