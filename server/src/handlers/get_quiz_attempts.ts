import { db } from '../db';
import { quizAttemptsTable } from '../db/schema';
import { type QuizAttempt } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
  try {
    const results = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.user_id, userId))
      .orderBy(desc(quizAttemptsTable.completed_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(attempt => ({
      ...attempt,
      score: parseFloat(attempt.score.toString()) // Convert numeric back to number
    }));
  } catch (error) {
    console.error('Failed to get quiz attempts:', error);
    throw error;
  }
}