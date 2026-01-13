/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

type CreateContextOptions = Record<string, never>;

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 */
const createInnerTRPCContext = (_opts: CreateContextOptions) => {
  return {
    prisma,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const zapierAccessToken = opts.req.headers[`${process.env.ZAPIER_ACCESS_TOKEN_HEADER}`] as string;
  const isAuthorizedWithZapier = (zapierAccessToken === process.env.ZAPIER_ACCESS_TOKEN);
  
  // Get client IP from various headers (supporting proxies/load balancers)
  const forwarded = opts.req.headers["x-forwarded-for"];
  const realIp = opts.req.headers["x-real-ip"];
  let clientIp = typeof forwarded === "string" 
    ? forwarded.split(",")[0]?.trim() ?? ""
    : typeof realIp === "string"
    ? realIp
    : opts.req.socket.remoteAddress ?? "";
  
  // Normalize IPv6 localhost to IPv4
  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    clientIp = "127.0.0.1";
  }
  // Strip IPv6 prefix if present (e.g., "::ffff:192.168.1.1" -> "192.168.1.1")
  if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.substring(7);
  }
  
  // Check if IP is in allowed list
  const allowedIps = process.env.ALLOWED_IPS?.split(",").map(ip => ip.trim()) ?? [];
  const isAllowedIp = allowedIps.includes(clientIp) || allowedIps.length === 0;
  
  return { ...createInnerTRPCContext({}), isAuthorizedWithZapier, clientIp, isAllowedIp };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

const enforceUserIsAuthedWithZapier = t.middleware(({ ctx, next }) => {
  if (!ctx.isAuthorizedWithZapier) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {},
  });
});

const enforceAllowedIp = t.middleware(({ ctx, next }) => {
  if (!ctx.isAllowedIp) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "IP not allowed" })
  }

  return next({
    ctx: {},
  });
});

/**
 * Protected (authenticated) procedure
 */
export const protectedZapierAuthenticatedProcedure = t.procedure.use(enforceUserIsAuthedWithZapier);

/**
 * IP-protected procedure - only allows requests from IPs in ALLOWED_IPS env var
 */
export const protectedIpProcedure = t.procedure.use(enforceAllowedIp);