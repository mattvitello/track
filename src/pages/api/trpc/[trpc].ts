import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { publicCacheHeaders } from "~/server/public-cache";

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  responseMeta({ type, paths, errors }) {
    return { headers: publicCacheHeaders(type, paths, errors.length > 0) };
  },
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
});
