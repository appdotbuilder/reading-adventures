import { db } from '../db';
import { wordsTable } from '../db/schema';
import { type CreateWordInput, type Word } from '../schema';

export const createWord = async (input: CreateWordInput): Promise<Word> => {
  try {
    // Insert word record
    const result = await db.insert(wordsTable)
      .values({
        word: input.word,
        phonetic_spelling: input.phonetic_spelling || null,
        audio_url: input.audio_url || null,
        difficulty: input.difficulty,
        definition: input.definition || null,
        example_sentence: input.example_sentence || null,
      })
      .returning()
      .execute();

    // Return the created word
    const word = result[0];
    return word;
  } catch (error) {
    console.error('Word creation failed:', error);
    throw error;
  }
};