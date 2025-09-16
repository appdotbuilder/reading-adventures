import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentTable } from '../db/schema';
import { getAllContent } from '../handlers/get_all_content';

describe('getAllContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no content exists', async () => {
    const result = await getAllContent();
    
    expect(result).toEqual([]);
  });

  it('should fetch all content and order by difficulty and order_index', async () => {
    // Create test content with different difficulties and order indices
    const testContent = [
      {
        title: 'Advanced Story 1',
        type: 'story' as const,
        difficulty: 'advanced' as const,
        text_content: 'This is an advanced story.',
        order_index: 1,
        phonics_focus: 'complex vowels'
      },
      {
        title: 'Beginner Word 2',
        type: 'word' as const,
        difficulty: 'beginner' as const,
        text_content: 'cat',
        order_index: 2,
        phonics_focus: 'short a'
      },
      {
        title: 'Beginner Word 1',
        type: 'word' as const,
        difficulty: 'beginner' as const,
        text_content: 'bat',
        order_index: 1,
        phonics_focus: 'short a'
      },
      {
        title: 'Intermediate Sentence',
        type: 'sentence' as const,
        difficulty: 'intermediate' as const,
        text_content: 'The quick brown fox jumps.',
        order_index: 1,
        phonics_focus: 'consonant blends'
      }
    ];

    // Insert test content in mixed order
    await db.insert(contentTable)
      .values(testContent)
      .execute();

    const result = await getAllContent();

    // Should have 4 items
    expect(result).toHaveLength(4);

    // Verify ordering: beginner (order 1, 2), intermediate (order 1), advanced (order 1)
    expect(result[0].title).toBe('Beginner Word 1');
    expect(result[0].difficulty).toBe('beginner');
    expect(result[0].order_index).toBe(1);

    expect(result[1].title).toBe('Beginner Word 2');
    expect(result[1].difficulty).toBe('beginner');
    expect(result[1].order_index).toBe(2);

    expect(result[2].title).toBe('Intermediate Sentence');
    expect(result[2].difficulty).toBe('intermediate');
    expect(result[2].order_index).toBe(1);

    expect(result[3].title).toBe('Advanced Story 1');
    expect(result[3].difficulty).toBe('advanced');
    expect(result[3].order_index).toBe(1);
  });

  it('should include all content fields in the response', async () => {
    // Create content with all possible fields populated
    const testContent = {
      title: 'Test Poem',
      type: 'poem' as const,
      difficulty: 'intermediate' as const,
      text_content: 'Roses are red, violets are blue.',
      audio_url: 'https://example.com/audio.mp3',
      order_index: 5,
      phonics_focus: 'rhyming patterns'
    };

    await db.insert(contentTable)
      .values(testContent)
      .execute();

    const result = await getAllContent();

    expect(result).toHaveLength(1);
    const content = result[0];

    // Verify all fields are present and correct
    expect(content.id).toBeDefined();
    expect(content.title).toBe('Test Poem');
    expect(content.type).toBe('poem');
    expect(content.difficulty).toBe('intermediate');
    expect(content.text_content).toBe('Roses are red, violets are blue.');
    expect(content.audio_url).toBe('https://example.com/audio.mp3');
    expect(content.order_index).toBe(5);
    expect(content.phonics_focus).toBe('rhyming patterns');
    expect(content.created_at).toBeInstanceOf(Date);
    expect(content.updated_at).toBeInstanceOf(Date);
  });

  it('should handle content with nullable fields', async () => {
    // Create content with nullable fields set to null
    const testContent = {
      title: 'Simple Word',
      type: 'word' as const,
      difficulty: 'beginner' as const,
      text_content: 'dog',
      audio_url: null,
      order_index: 1,
      phonics_focus: null
    };

    await db.insert(contentTable)
      .values(testContent)
      .execute();

    const result = await getAllContent();

    expect(result).toHaveLength(1);
    const content = result[0];

    expect(content.title).toBe('Simple Word');
    expect(content.audio_url).toBeNull();
    expect(content.phonics_focus).toBeNull();
  });

  it('should maintain correct ordering with same difficulty levels', async () => {
    // Create multiple content items with same difficulty but different order_index
    const testContent = [
      {
        title: 'Word 3',
        type: 'word' as const,
        difficulty: 'beginner' as const,
        text_content: 'run',
        order_index: 3,
        phonics_focus: 'short u'
      },
      {
        title: 'Word 1',
        type: 'word' as const,
        difficulty: 'beginner' as const,
        text_content: 'sun',
        order_index: 1,
        phonics_focus: 'short u'
      },
      {
        title: 'Word 5',
        type: 'word' as const,
        difficulty: 'beginner' as const,
        text_content: 'fun',
        order_index: 5,
        phonics_focus: 'short u'
      }
    ];

    await db.insert(contentTable)
      .values(testContent)
      .execute();

    const result = await getAllContent();

    expect(result).toHaveLength(3);
    
    // Should be ordered by order_index within the same difficulty
    expect(result[0].title).toBe('Word 1');
    expect(result[0].order_index).toBe(1);
    
    expect(result[1].title).toBe('Word 3');
    expect(result[1].order_index).toBe(3);
    
    expect(result[2].title).toBe('Word 5');
    expect(result[2].order_index).toBe(5);
  });

  it('should handle all content types correctly', async () => {
    // Test with all possible content types
    const testContent = [
      {
        title: 'Test Word',
        type: 'word' as const,
        difficulty: 'beginner' as const,
        text_content: 'cat',
        order_index: 1
      },
      {
        title: 'Test Sentence',
        type: 'sentence' as const,
        difficulty: 'beginner' as const,
        text_content: 'The cat sat on the mat.',
        order_index: 2
      },
      {
        title: 'Test Story',
        type: 'story' as const,
        difficulty: 'beginner' as const,
        text_content: 'Once upon a time, there was a little cat...',
        order_index: 3
      },
      {
        title: 'Test Poem',
        type: 'poem' as const,
        difficulty: 'beginner' as const,
        text_content: 'Little cat, little cat, where have you been?',
        order_index: 4
      }
    ];

    await db.insert(contentTable)
      .values(testContent)
      .execute();

    const result = await getAllContent();

    expect(result).toHaveLength(4);
    
    const types = result.map(content => content.type);
    expect(types).toContain('word');
    expect(types).toContain('sentence');
    expect(types).toContain('story');
    expect(types).toContain('poem');
  });
});