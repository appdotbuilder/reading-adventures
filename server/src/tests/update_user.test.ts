import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test inputs
const createUserInput: CreateUserInput = {
  name: 'Test Child',
  age: 8,
  level: 'beginner'
};

const updateUserInput: UpdateUserInput = {
  id: 1, // Will be replaced with actual ID
  name: 'Updated Child Name',
  age: 9,
  level: 'intermediate'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        name: createUserInput.name,
        age: createUserInput.age,
        level: createUserInput.level
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update all user fields', async () => {
    // Create a test user first
    const createdUser = await createTestUser();
    
    const input: UpdateUserInput = {
      id: createdUser.id,
      name: 'Updated Child Name',
      age: 9,
      level: 'intermediate'
    };

    const result = await updateUser(input);

    // Verify updated fields
    expect(result.id).toEqual(createdUser.id);
    expect(result.name).toEqual('Updated Child Name');
    expect(result.age).toEqual(9);
    expect(result.level).toEqual('intermediate');
    expect(result.created_at).toEqual(createdUser.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update only name field', async () => {
    const createdUser = await createTestUser();
    
    const input: UpdateUserInput = {
      id: createdUser.id,
      name: 'New Name Only'
    };

    const result = await updateUser(input);

    expect(result.name).toEqual('New Name Only');
    expect(result.age).toEqual(createdUser.age); // Unchanged
    expect(result.level).toEqual(createdUser.level); // Unchanged
  });

  it('should update only age field', async () => {
    const createdUser = await createTestUser();
    
    const input: UpdateUserInput = {
      id: createdUser.id,
      age: 10
    };

    const result = await updateUser(input);

    expect(result.age).toEqual(10);
    expect(result.name).toEqual(createdUser.name); // Unchanged
    expect(result.level).toEqual(createdUser.level); // Unchanged
  });

  it('should update only level field', async () => {
    const createdUser = await createTestUser();
    
    const input: UpdateUserInput = {
      id: createdUser.id,
      level: 'advanced'
    };

    const result = await updateUser(input);

    expect(result.level).toEqual('advanced');
    expect(result.name).toEqual(createdUser.name); // Unchanged
    expect(result.age).toEqual(createdUser.age); // Unchanged
  });

  it('should save updated user to database', async () => {
    const createdUser = await createTestUser();
    
    const input: UpdateUserInput = {
      id: createdUser.id,
      name: 'Database Update Test',
      age: 11,
      level: 'advanced'
    };

    await updateUser(input);

    // Query database directly to verify update
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Database Update Test');
    expect(users[0].age).toEqual(11);
    expect(users[0].level).toEqual('advanced');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input: UpdateUserInput = {
      id: 999, // Non-existent ID
      name: 'Non-existent User'
    };

    await expect(updateUser(input)).rejects.toThrow(/User with id 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const createdUser = await createTestUser();
    
    // Update with minimal input (only ID and name)
    const input: UpdateUserInput = {
      id: createdUser.id,
      name: 'Partial Update'
    };

    const result = await updateUser(input);

    expect(result.name).toEqual('Partial Update');
    expect(result.age).toEqual(createdUser.age);
    expect(result.level).toEqual(createdUser.level);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update timestamp even with no field changes', async () => {
    const createdUser = await createTestUser();
    
    // Update with only ID (no field changes)
    const input: UpdateUserInput = {
      id: createdUser.id
    };

    const result = await updateUser(input);

    // All fields should remain the same except updated_at
    expect(result.name).toEqual(createdUser.name);
    expect(result.age).toEqual(createdUser.age);
    expect(result.level).toEqual(createdUser.level);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should validate age boundaries', async () => {
    const createdUser = await createTestUser();
    
    // Test valid age range
    const validInput: UpdateUserInput = {
      id: createdUser.id,
      age: 6 // Minimum age
    };

    const result1 = await updateUser(validInput);
    expect(result1.age).toEqual(6);

    const validInput2: UpdateUserInput = {
      id: createdUser.id,
      age: 12 // Maximum age
    };

    const result2 = await updateUser(validInput2);
    expect(result2.age).toEqual(12);
  });
});