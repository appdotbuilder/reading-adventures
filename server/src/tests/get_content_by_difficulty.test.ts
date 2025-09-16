import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentTable } from '../db/schema';
import { type GetContentByDifficultyInput, type CreateContentInput } from '../schema';
import { getContentByDifficulty } from '../handlers/get_content_by_difficulty';

describe('getContentByDifficulty', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test content
  const createTestContent = async (content: CreateContentInput) => {
    const result = await db.insert(contentTable)
      .values({
        title: content.title,
        type: content.type,
        difficulty: content.difficulty,
        text_content: content.text_content,
        audio_url: content.audio_url || null,
        order_index: content.order_index,
        phonics_focus: content.phonics_focus || null
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should get content by difficulty level', async () => {
    // Create test content with different difficulty levels
    await createTestContent({
      title: 'Beginner Word',
      type: 'word',
      difficulty: 'beginner',
      text_content: 'cat',
      order_index: 1
    });

    await createTestContent({
      title: 'Advanced Story',
      type: 'story',
      difficulty: 'advanced',
      text_content: 'A complex story...',
      order_index: 2
    });

    await createTestContent({
      title: 'Beginner Sentence',
      type: 'sentence',
      difficulty: 'beginner',
      text_content: 'The cat runs.',
      order_index: 3
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'beginner'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Beginner Word');
    expect(result[0].difficulty).toEqual('beginner');
    expect(result[1].title).toEqual('Beginner Sentence');
    expect(result[1].difficulty).toEqual('beginner');
  });

  it('should filter by difficulty and content type', async () => {
    // Create test content with same difficulty but different types
    await createTestContent({
      title: 'Beginner Word',
      type: 'word',
      difficulty: 'beginner',
      text_content: 'dog',
      order_index: 1
    });

    await createTestContent({
      title: 'Beginner Story',
      type: 'story',
      difficulty: 'beginner',
      text_content: 'A simple story...',
      order_index: 2
    });

    await createTestContent({
      title: 'Beginner Sentence',
      type: 'sentence',
      difficulty: 'beginner',
      text_content: 'The dog barks.',
      order_index: 3
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'beginner',
      type: 'story'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Beginner Story');
    expect(result[0].type).toEqual('story');
    expect(result[0].difficulty).toEqual('beginner');
  });

  it('should return content ordered by order_index', async () => {
    // Create content with different order_index values
    await createTestContent({
      title: 'Third Content',
      type: 'word',
      difficulty: 'intermediate',
      text_content: 'third',
      order_index: 3
    });

    await createTestContent({
      title: 'First Content',
      type: 'word',
      difficulty: 'intermediate',
      text_content: 'first',
      order_index: 1
    });

    await createTestContent({
      title: 'Second Content',
      type: 'word',
      difficulty: 'intermediate',
      text_content: 'second',
      order_index: 2
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'intermediate'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First Content');
    expect(result[0].order_index).toEqual(1);
    expect(result[1].title).toEqual('Second Content');
    expect(result[1].order_index).toEqual(2);
    expect(result[2].title).toEqual('Third Content');
    expect(result[2].order_index).toEqual(3);
  });

  it('should return empty array when no content matches difficulty', async () => {
    // Create content with different difficulty
    await createTestContent({
      title: 'Advanced Content',
      type: 'story',
      difficulty: 'advanced',
      text_content: 'Complex content',
      order_index: 1
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'beginner'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no content matches type filter', async () => {
    // Create content with different type
    await createTestContent({
      title: 'Beginner Story',
      type: 'story',
      difficulty: 'beginner',
      text_content: 'Simple story',
      order_index: 1
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'beginner',
      type: 'poem'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(0);
  });

  it('should handle all content types correctly', async () => {
    // Create one content item of each type
    const contentTypes = ['word', 'sentence', 'story', 'poem'] as const;
    
    for (let i = 0; i < contentTypes.length; i++) {
      await createTestContent({
        title: `Advanced ${contentTypes[i]}`,
        type: contentTypes[i],
        difficulty: 'advanced',
        text_content: `Content for ${contentTypes[i]}`,
        order_index: i + 1
      });
    }

    const input: GetContentByDifficultyInput = {
      difficulty: 'advanced'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(4);
    expect(result.map(c => c.type)).toEqual(['word', 'sentence', 'story', 'poem']);
  });

  it('should handle optional fields correctly', async () => {
    // Create content with all optional fields populated
    await createTestContent({
      title: 'Rich Content',
      type: 'word',
      difficulty: 'beginner',
      text_content: 'phonics',
      audio_url: 'https://example.com/audio.mp3',
      order_index: 1,
      phonics_focus: 'ph sound'
    });

    // Create content with minimal fields
    await createTestContent({
      title: 'Simple Content',
      type: 'word',
      difficulty: 'beginner',
      text_content: 'simple',
      order_index: 2
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'beginner'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(2);
    
    // Rich content should have all fields
    const richContent = result.find(c => c.title === 'Rich Content');
    expect(richContent?.audio_url).toEqual('https://example.com/audio.mp3');
    expect(richContent?.phonics_focus).toEqual('ph sound');
    
    // Simple content should have null optional fields
    const simpleContent = result.find(c => c.title === 'Simple Content');
    expect(simpleContent?.audio_url).toBeNull();
    expect(simpleContent?.phonics_focus).toBeNull();
  });

  it('should include all required content fields in response', async () => {
    await createTestContent({
      title: 'Test Content',
      type: 'sentence',
      difficulty: 'intermediate',
      text_content: 'This is a test sentence.',
      order_index: 1
    });

    const input: GetContentByDifficultyInput = {
      difficulty: 'intermediate'
    };

    const result = await getContentByDifficulty(input);

    expect(result).toHaveLength(1);
    const content = result[0];
    
    // Verify all required fields are present
    expect(content.id).toBeDefined();
    expect(content.title).toEqual('Test Content');
    expect(content.type).toEqual('sentence');
    expect(content.difficulty).toEqual('intermediate');
    expect(content.text_content).toEqual('This is a test sentence.');
    expect(content.order_index).toEqual(1);
    expect(content.created_at).toBeInstanceOf(Date);
    expect(content.updated_at).toBeInstanceOf(Date);
    
    // Optional fields should be defined (can be null)
    expect(content).toHaveProperty('audio_url');
    expect(content).toHaveProperty('phonics_focus');
  });
});