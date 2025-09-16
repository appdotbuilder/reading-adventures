import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wordsTable } from '../db/schema';
import { type CreateWordInput } from '../schema';
import { createWord } from '../handlers/create_word';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInputRequired: CreateWordInput = {
  word: 'cat',
  difficulty: 'beginner',
};

// Test input with all optional fields
const testInputComplete: CreateWordInput = {
  word: 'elephant',
  phonetic_spelling: '/ˈɛləfənt/',
  audio_url: 'https://example.com/elephant.mp3',
  difficulty: 'intermediate',
  definition: 'A large mammal with a trunk',
  example_sentence: 'The elephant is gray and big.',
};

describe('createWord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a word with required fields only', async () => {
    const result = await createWord(testInputRequired);

    // Basic field validation
    expect(result.word).toEqual('cat');
    expect(result.difficulty).toEqual('beginner');
    expect(result.phonetic_spelling).toBeNull();
    expect(result.audio_url).toBeNull();
    expect(result.definition).toBeNull();
    expect(result.example_sentence).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a word with all fields provided', async () => {
    const result = await createWord(testInputComplete);

    // Verify all fields are set correctly
    expect(result.word).toEqual('elephant');
    expect(result.phonetic_spelling).toEqual('/ˈɛləfənt/');
    expect(result.audio_url).toEqual('https://example.com/elephant.mp3');
    expect(result.difficulty).toEqual('intermediate');
    expect(result.definition).toEqual('A large mammal with a trunk');
    expect(result.example_sentence).toEqual('The elephant is gray and big.');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save word to database', async () => {
    const result = await createWord(testInputComplete);

    // Query using proper drizzle syntax
    const words = await db.select()
      .from(wordsTable)
      .where(eq(wordsTable.id, result.id))
      .execute();

    expect(words).toHaveLength(1);
    const savedWord = words[0];
    expect(savedWord.word).toEqual('elephant');
    expect(savedWord.phonetic_spelling).toEqual('/ˈɛləfənt/');
    expect(savedWord.audio_url).toEqual('https://example.com/elephant.mp3');
    expect(savedWord.difficulty).toEqual('intermediate');
    expect(savedWord.definition).toEqual('A large mammal with a trunk');
    expect(savedWord.example_sentence).toEqual('The elephant is gray and big.');
    expect(savedWord.created_at).toBeInstanceOf(Date);
  });

  it('should handle different difficulty levels', async () => {
    const beginnerWord: CreateWordInput = {
      word: 'dog',
      difficulty: 'beginner',
    };

    const intermediateWord: CreateWordInput = {
      word: 'butterfly',
      difficulty: 'intermediate',
    };

    const advancedWord: CreateWordInput = {
      word: 'extraordinary',
      difficulty: 'advanced',
    };

    const beginnerResult = await createWord(beginnerWord);
    const intermediateResult = await createWord(intermediateWord);
    const advancedResult = await createWord(advancedWord);

    expect(beginnerResult.difficulty).toEqual('beginner');
    expect(intermediateResult.difficulty).toEqual('intermediate');
    expect(advancedResult.difficulty).toEqual('advanced');

    // Verify they're all saved to database
    const allWords = await db.select()
      .from(wordsTable)
      .execute();

    expect(allWords).toHaveLength(3);
    expect(allWords.map(w => w.difficulty).sort()).toEqual(['advanced', 'beginner', 'intermediate']);
  });

  it('should create multiple words independently', async () => {
    const word1: CreateWordInput = {
      word: 'apple',
      difficulty: 'beginner',
      definition: 'A red or green fruit',
    };

    const word2: CreateWordInput = {
      word: 'banana',
      difficulty: 'beginner',
      phonetic_spelling: '/bəˈnænə/',
    };

    const result1 = await createWord(word1);
    const result2 = await createWord(word2);

    // Ensure both words have unique IDs
    expect(result1.id).not.toEqual(result2.id);
    
    // Verify both words are in database
    const allWords = await db.select()
      .from(wordsTable)
      .execute();

    expect(allWords).toHaveLength(2);
    
    const words = allWords.sort((a, b) => a.id - b.id);
    expect(words[0].word).toEqual('apple');
    expect(words[0].definition).toEqual('A red or green fruit');
    expect(words[0].phonetic_spelling).toBeNull();
    
    expect(words[1].word).toEqual('banana');
    expect(words[1].phonetic_spelling).toEqual('/bəˈnænə/');
    expect(words[1].definition).toBeNull();
  });

  it('should handle empty optional string fields as null', async () => {
    const wordWithEmptyStrings: CreateWordInput = {
      word: 'test',
      phonetic_spelling: undefined,
      audio_url: undefined,
      difficulty: 'beginner',
      definition: undefined,
      example_sentence: undefined,
    };

    const result = await createWord(wordWithEmptyStrings);

    expect(result.phonetic_spelling).toBeNull();
    expect(result.audio_url).toBeNull();
    expect(result.definition).toBeNull();
    expect(result.example_sentence).toBeNull();

    // Verify in database as well
    const savedWord = await db.select()
      .from(wordsTable)
      .where(eq(wordsTable.id, result.id))
      .execute();

    expect(savedWord[0].phonetic_spelling).toBeNull();
    expect(savedWord[0].audio_url).toBeNull();
    expect(savedWord[0].definition).toBeNull();
    expect(savedWord[0].example_sentence).toBeNull();
  });
});