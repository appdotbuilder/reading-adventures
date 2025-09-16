import { db } from '../db';
import { wordsTable } from '../db/schema';
import { type Word } from '../schema';

export const getWords = async (): Promise<Word[]> => {
  try {
    const results = await db.select()
      .from(wordsTable)
      .execute();

    // No numeric fields need conversion in the words table
    return results;
  } catch (error) {
    console.error('Failed to fetch words:', error);
    throw error;
  }
};