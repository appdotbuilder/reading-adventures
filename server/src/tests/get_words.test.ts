import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wordsTable } from '../db/schema';
import { type CreateWordInput } from '../schema';
import { getWords } from '../handlers/get_words';

// Test word data
const testWords: CreateWordInput[] = [
  {
    word: 'cat',
    phonetic_spelling: 'kæt',
    audio_url: 'https://example.com/audio/cat.mp3',
    difficulty: 'beginner',
    definition: 'A small furry animal that says meow',
    example_sentence: 'The cat likes to play with yarn.'
  },
  {
    word: 'elephant',
    phonetic_spelling: 'ˈɛlɪfənt',
    audio_url: 'https://example.com/audio/elephant.mp3',
    difficulty: 'intermediate',
    definition: 'A large gray animal with a long trunk',
    example_sentence: 'The elephant is the largest land animal.'
  },
  {
    word: 'magnificent',
    phonetic_spelling: 'mæɡˈnɪfɪsənt',
    audio_url: null,
    difficulty: 'advanced',
    definition: 'Very beautiful and impressive',
    example_sentence: 'The magnificent castle stood on the hill.'
  }
];

describe('getWords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no words exist', async () => {
    const result = await getWords();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all words from database', async () => {
    // Insert test words
    await db.insert(wordsTable)
      .values(testWords)
      .execute();

    const result = await getWords();

    expect(result).toHaveLength(3);
    expect(result[0].word).toEqual('cat');
    expect(result[1].word).toEqual('elephant');
    expect(result[2].word).toEqual('magnificent');
  });

  it('should return words with all required fields', async () => {
    // Insert a single test word
    await db.insert(wordsTable)
      .values([testWords[0]])
      .execute();

    const result = await getWords();

    expect(result).toHaveLength(1);
    const word = result[0];

    // Verify all required fields are present
    expect(word.id).toBeDefined();
    expect(typeof word.id).toBe('number');
    expect(word.word).toEqual('cat');
    expect(word.phonetic_spelling).toEqual('kæt');
    expect(word.audio_url).toEqual('https://example.com/audio/cat.mp3');
    expect(word.difficulty).toEqual('beginner');
    expect(word.definition).toEqual('A small furry animal that says meow');
    expect(word.example_sentence).toEqual('The cat likes to play with yarn.');
    expect(word.created_at).toBeInstanceOf(Date);
  });

  it('should handle words with null optional fields', async () => {
    // Insert word with minimal data
    await db.insert(wordsTable)
      .values([{
        word: 'simple',
        phonetic_spelling: null,
        audio_url: null,
        difficulty: 'beginner',
        definition: null,
        example_sentence: null
      }])
      .execute();

    const result = await getWords();

    expect(result).toHaveLength(1);
    const word = result[0];

    expect(word.word).toEqual('simple');
    expect(word.phonetic_spelling).toBeNull();
    expect(word.audio_url).toBeNull();
    expect(word.definition).toBeNull();
    expect(word.example_sentence).toBeNull();
    expect(word.difficulty).toEqual('beginner');
    expect(word.created_at).toBeInstanceOf(Date);
  });

  it('should return words in database insertion order', async () => {
    // Insert words in specific order
    const orderedWords = [
      { ...testWords[1], word: 'zebra' },
      { ...testWords[0], word: 'apple' },
      { ...testWords[2], word: 'book' }
    ];

    await db.insert(wordsTable)
      .values(orderedWords)
      .execute();

    const result = await getWords();

    expect(result).toHaveLength(3);
    // Results should maintain insertion order (by id)
    expect(result[0].word).toEqual('zebra');
    expect(result[1].word).toEqual('apple');
    expect(result[2].word).toEqual('book');
  });

  it('should handle large number of words', async () => {
    // Create many test words
    const manyWords = Array.from({ length: 50 }, (_, i) => ({
      word: `word${i}`,
      phonetic_spelling: `phonetic${i}`,
      audio_url: `https://example.com/audio/word${i}.mp3`,
      difficulty: 'beginner' as const,
      definition: `Definition for word ${i}`,
      example_sentence: `Example sentence with word${i}.`
    }));

    await db.insert(wordsTable)
      .values(manyWords)
      .execute();

    const result = await getWords();

    expect(result).toHaveLength(50);
    expect(result[0].word).toEqual('word0');
    expect(result[49].word).toEqual('word49');

    // Verify all words have proper structure
    result.forEach((word, index) => {
      expect(word.id).toBeDefined();
      expect(word.word).toEqual(`word${index}`);
      expect(word.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return words with different difficulty levels', async () => {
    const mixedDifficultyWords = [
      { ...testWords[0], difficulty: 'beginner' as const },
      { ...testWords[1], difficulty: 'intermediate' as const },
      { ...testWords[2], difficulty: 'advanced' as const }
    ];

    await db.insert(wordsTable)
      .values(mixedDifficultyWords)
      .execute();

    const result = await getWords();

    expect(result).toHaveLength(3);
    
    const difficulties = result.map(word => word.difficulty);
    expect(difficulties).toContain('beginner');
    expect(difficulties).toContain('intermediate');
    expect(difficulties).toContain('advanced');
  });
});