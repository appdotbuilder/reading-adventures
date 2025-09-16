import { db } from '../db';
import { userProgressTable, usersTable, contentTable } from '../db/schema';
import { type UpdateProgressInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateUserProgress = async (input: UpdateProgressInput): Promise<UserProgress> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Verify content exists
    const content = await db.select()
      .from(contentTable)
      .where(eq(contentTable.id, input.content_id))
      .execute();

    if (content.length === 0) {
      throw new Error(`Content with id ${input.content_id} does not exist`);
    }

    // Check if progress record already exists
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.content_id, input.content_id)
        )
      )
      .execute();

    let result;

    if (existingProgress.length > 0) {
      // Update existing progress record
      const updateData: any = {
        last_accessed: new Date(),
      };

      if (input.status !== undefined) {
        updateData.status = input.status;
      }
      if (input.completion_percentage !== undefined) {
        updateData.completion_percentage = input.completion_percentage;
      }
      if (input.time_spent_seconds !== undefined) {
        updateData.time_spent_seconds = input.time_spent_seconds;
      }

      const updated = await db.update(userProgressTable)
        .set(updateData)
        .where(
          and(
            eq(userProgressTable.user_id, input.user_id),
            eq(userProgressTable.content_id, input.content_id)
          )
        )
        .returning()
        .execute();

      result = updated[0];
    } else {
      // Create new progress record
      const inserted = await db.insert(userProgressTable)
        .values({
          user_id: input.user_id,
          content_id: input.content_id,
          status: input.status || 'not_started',
          completion_percentage: input.completion_percentage || 0,
          time_spent_seconds: input.time_spent_seconds || 0,
          last_accessed: new Date(),
        })
        .returning()
        .execute();

      result = inserted[0];
    }

    // Convert numeric fields back to numbers for the return type
    return {
      ...result,
      completion_percentage: parseFloat(result.completion_percentage.toString()),
    };
  } catch (error) {
    console.error('Update user progress failed:', error);
    throw error;
  }
};