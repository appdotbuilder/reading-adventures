import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testInput: CreateUserInput = {
  name: 'Alice Smith',
  age: 8,
  level: 'beginner'
};

const testInputWithoutLevel: CreateUserInput = {
  name: 'Bob Jones',
  age: 10,
  level: 'beginner' // Must be explicitly provided as it's required in the type
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields specified', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('Alice Smith');
    expect(result.age).toEqual(8);
    expect(result.level).toEqual('beginner');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with level explicitly set', async () => {
    const result = await createUser(testInputWithoutLevel);

    expect(result.name).toEqual('Bob Jones');
    expect(result.age).toEqual(10);
    expect(result.level).toEqual('beginner');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Alice Smith');
    expect(users[0].age).toEqual(8);
    expect(users[0].level).toEqual('beginner');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create users with different difficulty levels', async () => {
    const beginnerInput: CreateUserInput = {
      name: 'Charlie Brown',
      age: 6,
      level: 'beginner'
    };

    const intermediateInput: CreateUserInput = {
      name: 'Diana Prince',
      age: 10,
      level: 'intermediate'
    };

    const advancedInput: CreateUserInput = {
      name: 'Eddie Murphy',
      age: 12,
      level: 'advanced'
    };

    const beginnerUser = await createUser(beginnerInput);
    const intermediateUser = await createUser(intermediateInput);
    const advancedUser = await createUser(advancedInput);

    expect(beginnerUser.level).toEqual('beginner');
    expect(intermediateUser.level).toEqual('intermediate');
    expect(advancedUser.level).toEqual('advanced');

    // Verify all users are in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
  });

  it('should create users with valid age range', async () => {
    const youngInput: CreateUserInput = {
      name: 'Young Reader',
      age: 6, // Minimum age
      level: 'beginner'
    };

    const oldInput: CreateUserInput = {
      name: 'Older Reader',
      age: 12, // Maximum age
      level: 'advanced'
    };

    const youngUser = await createUser(youngInput);
    const oldUser = await createUser(oldInput);

    expect(youngUser.age).toEqual(6);
    expect(oldUser.age).toEqual(12);

    // Verify both users exist in database
    const users = await db.select().from(usersTable).execute();
    expect(users).toHaveLength(2);
    
    const ages = users.map(user => user.age).sort((a, b) => a - b);
    expect(ages).toEqual([6, 12]);
  });

  it('should generate unique IDs for different users', async () => {
    const user1Input: CreateUserInput = {
      name: 'First User',
      age: 7,
      level: 'beginner'
    };

    const user2Input: CreateUserInput = {
      name: 'Second User',
      age: 9,
      level: 'intermediate'
    };

    const user1 = await createUser(user1Input);
    const user2 = await createUser(user2Input);

    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();
    expect(user1.id).not.toEqual(user2.id);
    expect(typeof user1.id).toBe('number');
    expect(typeof user2.id).toBe('number');
  });
});