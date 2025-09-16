import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<{
      name: string;
      age: number;
      level: 'beginner' | 'intermediate' | 'advanced';
      updated_at: Date;
    }> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.age !== undefined) {
      updateData.age = input.age;
    }

    if (input.level !== undefined) {
      updateData.level = input.level;
    }

    // Update the user record
    const result = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};