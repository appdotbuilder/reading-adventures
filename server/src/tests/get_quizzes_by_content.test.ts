import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contentTable, quizzesTable } from '../db/schema';
import { getQuizzesByContent } from '../handlers/get_quizzes_by_content';

// Test data
const testContent = {
  title: 'Test Story',
  type: 'story' as const,
  difficulty: 'beginner' as const,
  text_content: 'Once upon a time...',
  order_index: 1
};

const testQuizzes = [
  {
    title: 'Story Comprehension Quiz',
    description: 'Test understanding of the story'
  },
  {
    title: 'Vocabulary Quiz',
    description: 'Test vocabulary from the story'
  }
];

describe('getQuizzesByContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all quizzes for a specific content', async () => {
    // Create test content
    const contentResult = await db.insert(contentTable)
      .values(testContent)
      .returning()
      .execute();
    
    const contentId = contentResult[0].id;

    // Create test quizzes linked to the content
    const quizResults = await db.insert(quizzesTable)
      .values(testQuizzes.map(quiz => ({
        ...quiz,
        content_id: contentId
      })))
      .returning()
      .execute();

    // Test the handler
    const result = await getQuizzesByContent(contentId);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first quiz
    expect(result[0].id).toBeDefined();
    expect(result[0].content_id).toEqual(contentId);
    expect(result[0].title).toEqual('Story Comprehension Quiz');
    expect(result[0].description).toEqual('Test understanding of the story');
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second quiz
    expect(result[1].id).toBeDefined();
    expect(result[1].content_id).toEqual(contentId);
    expect(result[1].title).toEqual('Vocabulary Quiz');
    expect(result[1].description).toEqual('Test vocabulary from the story');
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Verify quiz IDs match database results
    const quizIds = result.map(q => q.id).sort();
    const expectedIds = quizResults.map(q => q.id).sort();
    expect(quizIds).toEqual(expectedIds);
  });

  it('should return empty array when no quizzes exist for content', async () => {
    // Create test content without any quizzes
    const contentResult = await db.insert(contentTable)
      .values(testContent)
      .returning()
      .execute();
    
    const contentId = contentResult[0].id;

    // Test the handler
    const result = await getQuizzesByContent(contentId);

    // Verify empty result
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent content', async () => {
    const nonExistentContentId = 99999;

    // Test the handler with non-existent content
    const result = await getQuizzesByContent(nonExistentContentId);

    // Verify empty result
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return quizzes for the specified content', async () => {
    // Create two different content items
    const content1Result = await db.insert(contentTable)
      .values({
        ...testContent,
        title: 'First Story'
      })
      .returning()
      .execute();
    
    const content2Result = await db.insert(contentTable)
      .values({
        ...testContent,
        title: 'Second Story',
        order_index: 2
      })
      .returning()
      .execute();
    
    const content1Id = content1Result[0].id;
    const content2Id = content2Result[0].id;

    // Create quizzes for both content items
    await db.insert(quizzesTable)
      .values([
        {
          content_id: content1Id,
          title: 'First Story Quiz',
          description: 'Quiz for first story'
        },
        {
          content_id: content1Id,
          title: 'First Story Vocabulary',
          description: 'Vocabulary for first story'
        },
        {
          content_id: content2Id,
          title: 'Second Story Quiz',
          description: 'Quiz for second story'
        }
      ])
      .execute();

    // Test the handler for first content
    const result1 = await getQuizzesByContent(content1Id);
    expect(result1).toHaveLength(2);
    expect(result1.every(quiz => quiz.content_id === content1Id)).toBe(true);
    expect(result1.some(quiz => quiz.title === 'First Story Quiz')).toBe(true);
    expect(result1.some(quiz => quiz.title === 'First Story Vocabulary')).toBe(true);

    // Test the handler for second content
    const result2 = await getQuizzesByContent(content2Id);
    expect(result2).toHaveLength(1);
    expect(result2[0].content_id).toEqual(content2Id);
    expect(result2[0].title).toEqual('Second Story Quiz');
  });

  it('should handle quizzes with null descriptions', async () => {
    // Create test content
    const contentResult = await db.insert(contentTable)
      .values(testContent)
      .returning()
      .execute();
    
    const contentId = contentResult[0].id;

    // Create quiz with null description
    await db.insert(quizzesTable)
      .values({
        content_id: contentId,
        title: 'Simple Quiz',
        description: null
      })
      .execute();

    // Test the handler
    const result = await getQuizzesByContent(contentId);

    // Verify result handles null description
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Simple Quiz');
    expect(result[0].description).toBeNull();
    expect(result[0].content_id).toEqual(contentId);
  });
});