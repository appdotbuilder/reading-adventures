import { db } from '../db';
import { readingSessionsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type ReadingSession } from '../schema';

export const getReadingSessions = async (userId: number): Promise<ReadingSession[]> => {
  try {
    // Fetch all reading sessions for the specified user, ordered by most recent first
    const results = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.user_id, userId))
      .orderBy(desc(readingSessionsTable.started_at))
      .execute();

    // Convert numeric fields back to numbers and return
    return results.map(session => ({
      ...session,
      reading_accuracy: session.reading_accuracy ? parseFloat(session.reading_accuracy.toString()) : null
    }));
  } catch (error) {
    console.error('Get reading sessions failed:', error);
    throw error;
  }
};