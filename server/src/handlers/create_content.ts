import { db } from '../db';
import { contentTable } from '../db/schema';
import { type CreateContentInput, type Content } from '../schema';

export const createContent = async (input: CreateContentInput): Promise<Content> => {
  try {
    // Insert content record
    const result = await db.insert(contentTable)
      .values({
        title: input.title,
        type: input.type,
        difficulty: input.difficulty,
        text_content: input.text_content,
        audio_url: input.audio_url || null,
        order_index: input.order_index,
        phonics_focus: input.phonics_focus || null,
      })
      .returning()
      .execute();

    // Return the created content
    return result[0];
  } catch (error) {
    console.error('Content creation failed:', error);
    throw error;
  }
};