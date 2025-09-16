import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type Quiz } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuizzesByContent(contentId: number): Promise<Quiz[]> {
  try {
    // Query quizzes associated with the specified content
    const results = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.content_id, contentId))
      .execute();

    // Return the results with proper type structure
    return results.map(quiz => ({
      id: quiz.id,
      content_id: quiz.content_id,
      title: quiz.title,
      description: quiz.description,
      created_at: quiz.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch quizzes by content:', error);
    throw error;
  }
}