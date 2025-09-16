import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createContentInputSchema,
  createWordInputSchema,
  updateProgressInputSchema,
  createQuizAttemptInputSchema,
  createReadingSessionInputSchema,
  getContentByDifficultyInputSchema,
  getUserProgressInputSchema,
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { createContent } from './handlers/create_content';
import { getContentByDifficulty } from './handlers/get_content_by_difficulty';
import { getAllContent } from './handlers/get_all_content';
import { createWord } from './handlers/create_word';
import { getWords } from './handlers/get_words';
import { updateUserProgress } from './handlers/update_user_progress';
import { getUserProgress } from './handlers/get_user_progress';
import { createQuizAttempt } from './handlers/create_quiz_attempt';
import { getQuizAttempts } from './handlers/get_quiz_attempts';
import { createReadingSession } from './handlers/create_reading_session';
import { getReadingSessions } from './handlers/get_reading_sessions';
import { getQuizzesByContent } from './handlers/get_quizzes_by_content';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Content management routes
  createContent: publicProcedure
    .input(createContentInputSchema)
    .mutation(({ input }) => createContent(input)),

  getAllContent: publicProcedure
    .query(() => getAllContent()),

  getContentByDifficulty: publicProcedure
    .input(getContentByDifficultyInputSchema)
    .query(({ input }) => getContentByDifficulty(input)),

  // Word management routes
  createWord: publicProcedure
    .input(createWordInputSchema)
    .mutation(({ input }) => createWord(input)),

  getWords: publicProcedure
    .query(() => getWords()),

  // Progress tracking routes
  updateUserProgress: publicProcedure
    .input(updateProgressInputSchema)
    .mutation(({ input }) => updateUserProgress(input)),

  getUserProgress: publicProcedure
    .input(getUserProgressInputSchema)
    .query(({ input }) => getUserProgress(input)),

  // Quiz and assessment routes
  createQuizAttempt: publicProcedure
    .input(createQuizAttemptInputSchema)
    .mutation(({ input }) => createQuizAttempt(input)),

  getQuizAttempts: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getQuizAttempts(input.userId)),

  getQuizzesByContent: publicProcedure
    .input(z.object({ contentId: z.number() }))
    .query(({ input }) => getQuizzesByContent(input.contentId)),

  // Reading session routes
  createReadingSession: publicProcedure
    .input(createReadingSessionInputSchema)
    .mutation(({ input }) => createReadingSession(input)),

  getReadingSessions: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getReadingSessions(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Educational Reading App server listening at port: ${port}`);
}

start();