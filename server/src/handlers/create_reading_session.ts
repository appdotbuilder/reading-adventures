import { db } from '../db';
import { readingSessionsTable } from '../db/schema';
import { type CreateReadingSessionInput, type ReadingSession } from '../schema';

export const createReadingSession = async (input: CreateReadingSessionInput): Promise<ReadingSession> => {
  try {
    // Insert reading session record
    const result = await db.insert(readingSessionsTable)
      .values({
        user_id: input.user_id,
        content_id: input.content_id,
        words_read: input.words_read,
        reading_accuracy: input.reading_accuracy !== undefined ? input.reading_accuracy : null, // Real column accepts number directly
        session_duration_seconds: input.session_duration_seconds,
        started_at: new Date(),
        ended_at: null // Session is ongoing when created
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const session = result[0];
    return {
      ...session,
      reading_accuracy: session.reading_accuracy !== null ? parseFloat(session.reading_accuracy.toString()) : null // Convert to number for consistency
    };
  } catch (error) {
    console.error('Reading session creation failed:', error);
    throw error;
  }
};