import { cookingRouter } from "~/server/api/routers/cooking";
import { movieRouter } from "~/server/api/routers/movie";
import { musicRouter } from "~/server/api/routers/music";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  cooking: cookingRouter,
  movie: movieRouter,
  music: musicRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
