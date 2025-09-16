import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentTable } from '../db/schema';
import { type CreateContentInput } from '../schema';
import { createContent } from '../handlers/create_content';
import { eq } from 'drizzle-orm';

// Test inputs for different content types
const storyInput: CreateContentInput = {
  title: 'The Little Red Hen',
  type: 'story',
  difficulty: 'beginner',
  text_content: 'Once upon a time, there was a little red hen who lived on a farm.',
  audio_url: 'https://example.com/audio/little-red-hen.mp3',
  order_index: 1,
  phonics_focus: 'short vowels',
};

const wordInput: CreateContentInput = {
  title: 'Basic Sight Words',
  type: 'word',
  difficulty: 'beginner',
  text_content: 'cat dog run jump',
  order_index: 2,
};

const sentenceInput: CreateContentInput = {
  title: 'Simple Sentences',
  type: 'sentence',
  difficulty: 'intermediate',
  text_content: 'The cat runs fast. The dog jumps high.',
  audio_url: null,
  order_index: 3,
  phonics_focus: null,
};

const poemInput: CreateContentInput = {
  title: 'Nursery Rhyme',
  type: 'poem',
  difficulty: 'advanced',
  text_content: 'Twinkle, twinkle, little star, How I wonder what you are.',
  order_index: 4,
  phonics_focus: 'rhyming patterns',
};

describe('createContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create story content with all fields', async () => {
    const result = await createContent(storyInput);

    // Verify all fields are set correctly
    expect(result.title).toEqual('The Little Red Hen');
    expect(result.type).toEqual('story');
    expect(result.difficulty).toEqual('beginner');
    expect(result.text_content).toEqual('Once upon a time, there was a little red hen who lived on a farm.');
    expect(result.audio_url).toEqual('https://example.com/audio/little-red-hen.mp3');
    expect(result.order_index).toEqual(1);
    expect(result.phonics_focus).toEqual('short vowels');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create word content with minimal fields', async () => {
    const result = await createContent(wordInput);

    // Verify required fields
    expect(result.title).toEqual('Basic Sight Words');
    expect(result.type).toEqual('word');
    expect(result.difficulty).toEqual('beginner');
    expect(result.text_content).toEqual('cat dog run jump');
    expect(result.order_index).toEqual(2);
    
    // Verify optional fields are handled correctly
    expect(result.audio_url).toBeNull();
    expect(result.phonics_focus).toBeNull();
    
    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create sentence content with null optional fields', async () => {
    const result = await createContent(sentenceInput);

    expect(result.title).toEqual('Simple Sentences');
    expect(result.type).toEqual('sentence');
    expect(result.difficulty).toEqual('intermediate');
    expect(result.text_content).toEqual('The cat runs fast. The dog jumps high.');
    expect(result.order_index).toEqual(3);
    expect(result.audio_url).toBeNull();
    expect(result.phonics_focus).toBeNull();
  });

  it('should create poem content', async () => {
    const result = await createContent(poemInput);

    expect(result.title).toEqual('Nursery Rhyme');
    expect(result.type).toEqual('poem');
    expect(result.difficulty).toEqual('advanced');
    expect(result.text_content).toEqual('Twinkle, twinkle, little star, How I wonder what you are.');
    expect(result.order_index).toEqual(4);
    expect(result.phonics_focus).toEqual('rhyming patterns');
  });

  it('should save content to database correctly', async () => {
    const result = await createContent(storyInput);

    // Query the database to verify content was saved
    const savedContent = await db.select()
      .from(contentTable)
      .where(eq(contentTable.id, result.id))
      .execute();

    expect(savedContent).toHaveLength(1);
    expect(savedContent[0].title).toEqual('The Little Red Hen');
    expect(savedContent[0].type).toEqual('story');
    expect(savedContent[0].difficulty).toEqual('beginner');
    expect(savedContent[0].text_content).toEqual('Once upon a time, there was a little red hen who lived on a farm.');
    expect(savedContent[0].audio_url).toEqual('https://example.com/audio/little-red-hen.mp3');
    expect(savedContent[0].order_index).toEqual(1);
    expect(savedContent[0].phonics_focus).toEqual('short vowels');
    expect(savedContent[0].created_at).toBeInstanceOf(Date);
    expect(savedContent[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple content items with different order indices', async () => {
    // Create multiple content items
    const story = await createContent(storyInput);
    const words = await createContent(wordInput);
    const sentences = await createContent(sentenceInput);
    const poem = await createContent(poemInput);

    // Verify they all have different IDs
    const ids = [story.id, words.id, sentences.id, poem.id];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(4);

    // Verify order indices are maintained
    expect(story.order_index).toEqual(1);
    expect(words.order_index).toEqual(2);
    expect(sentences.order_index).toEqual(3);
    expect(poem.order_index).toEqual(4);

    // Verify all are saved in database
    const allContent = await db.select()
      .from(contentTable)
      .execute();

    expect(allContent).toHaveLength(4);
  });

  it('should handle content with empty optional audio_url', async () => {
    const inputWithUndefinedAudio: CreateContentInput = {
      ...storyInput,
      audio_url: undefined,
    };

    const result = await createContent(inputWithUndefinedAudio);
    expect(result.audio_url).toBeNull();

    // Verify in database
    const savedContent = await db.select()
      .from(contentTable)
      .where(eq(contentTable.id, result.id))
      .execute();

    expect(savedContent[0].audio_url).toBeNull();
  });

  it('should handle content with empty optional phonics_focus', async () => {
    const inputWithUndefinedPhonics: CreateContentInput = {
      ...wordInput,
      phonics_focus: undefined,
    };

    const result = await createContent(inputWithUndefinedPhonics);
    expect(result.phonics_focus).toBeNull();

    // Verify in database
    const savedContent = await db.select()
      .from(contentTable)
      .where(eq(contentTable.id, result.id))
      .execute();

    expect(savedContent[0].phonics_focus).toBeNull();
  });
});