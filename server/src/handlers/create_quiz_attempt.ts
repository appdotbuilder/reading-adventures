import { db } from '../db';
import { quizAttemptsTable } from '../db/schema';
import { type CreateQuizAttemptInput, type QuizAttempt } from '../schema';

export async function createQuizAttempt(input: CreateQuizAttemptInput): Promise<QuizAttempt> {
  try {
    // Insert quiz attempt record
    const result = await db.insert(quizAttemptsTable)
      .values({
        user_id: input.user_id,
        quiz_id: input.quiz_id,
        score: input.score, // real column accepts numbers directly
        total_questions: input.total_questions,
        correct_answers: input.correct_answers,
        time_taken_seconds: input.time_taken_seconds
      })
      .returning()
      .execute();

    // Return the quiz attempt result
    const quizAttempt = result[0];
    return quizAttempt;
  } catch (error) {
    console.error('Quiz attempt creation failed:', error);
    throw error;
  }
}