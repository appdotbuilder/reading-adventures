import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUser1: CreateUserInput = {
  name: 'Alice Johnson',
  age: 8,
  level: 'beginner'
};

const testUser2: CreateUserInput = {
  name: 'Bob Smith',
  age: 10,
  level: 'intermediate'
};

const testUser3: CreateUserInput = {
  name: 'Charlie Brown',
  age: 7,
  level: 'beginner'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          name: testUser1.name,
          age: testUser1.age,
          level: testUser1.level
        },
        {
          name: testUser2.name,
          age: testUser2.age,
          level: testUser2.level
        },
        {
          name: testUser3.name,
          age: testUser3.age,
          level: testUser3.level
        }
      ])
      .execute();

    const result = await getUsers();

    // Verify we get all users
    expect(result).toHaveLength(3);
    
    // Verify user data structure and content
    const userNames = result.map(user => user.name).sort();
    expect(userNames).toEqual(['Alice Johnson', 'Bob Smith', 'Charlie Brown']);

    // Verify each user has required fields
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
      expect(typeof user.age).toBe('number');
      expect(user.age).toBeGreaterThanOrEqual(6);
      expect(user.age).toBeLessThanOrEqual(12);
      expect(['beginner', 'intermediate', 'advanced']).toContain(user.level);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return users with different difficulty levels', async () => {
    // Create users with different levels
    await db.insert(usersTable)
      .values([
        {
          name: 'Beginner Student',
          age: 7,
          level: 'beginner'
        },
        {
          name: 'Intermediate Student',
          age: 9,
          level: 'intermediate'
        },
        {
          name: 'Advanced Student',
          age: 11,
          level: 'advanced'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    const levels = result.map(user => user.level).sort();
    expect(levels).toEqual(['advanced', 'beginner', 'intermediate']);
  });

  it('should return users with correct age range', async () => {
    // Create users with different ages within valid range
    await db.insert(usersTable)
      .values([
        {
          name: 'Young Student',
          age: 6,
          level: 'beginner'
        },
        {
          name: 'Middle Student',
          age: 9,
          level: 'intermediate'
        },
        {
          name: 'Older Student',
          age: 12,
          level: 'advanced'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    const ages = result.map(user => user.age).sort((a, b) => a - b);
    expect(ages).toEqual([6, 9, 12]);
    
    // Verify all ages are within expected range
    result.forEach(user => {
      expect(user.age).toBeGreaterThanOrEqual(6);
      expect(user.age).toBeLessThanOrEqual(12);
    });
  });

  it('should return users ordered by database insertion', async () => {
    // Insert users in specific order
    const user1 = await db.insert(usersTable)
      .values({
        name: 'First User',
        age: 8,
        level: 'beginner'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        name: 'Second User',
        age: 9,
        level: 'intermediate'
      })
      .returning()
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First User');
    expect(result[1].name).toBe('Second User');
    
    // Verify IDs are in ascending order (typical database behavior)
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});