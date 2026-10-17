import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedIpProcedure,
} from "~/server/api/trpc";
import { cachedQuery, invalidateQueries } from "~/server/query-cache";
import { revalidateCatalog } from "~/server/revalidate-catalog";

export const cookingRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) =>
    cachedQuery("cooking:all", () =>
      ctx.prisma.cooking.findMany({
        orderBy: {
          cooked_at: "desc",
        },
      })
    )
  ),

  getByYear: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(({ ctx, input }) =>
      cachedQuery(`cooking:year:${input.year}`, () => {
        const startDate = new Date(`${input.year}-01-01T00:00:00Z`);
        const endDate = new Date(`${input.year + 1}-01-01T00:00:00Z`);

        return ctx.prisma.cooking.findMany({
          where: {
            cooked_at: {
              gte: startDate,
              lt: endDate,
            },
          },
          orderBy: {
            cooked_at: "desc",
          },
        });
      })
    ),

  isAllowed: publicProcedure.query(({ ctx }) => {
    return { isAllowed: ctx.isAllowedIp };
  }),

  create: protectedIpProcedure
    .input(
      z.object({
        name: z.string(),
        imageUrl: z.string().nullable(),
        rating: z.number().min(0.5).max(5),
        recipeUrl: z.string().nullable(),
        notes: z.string().nullable(),
        cookedAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.cooking.create({
        data: {
          name: input.name,
          image_url: input.imageUrl,
          rating: input.rating,
          recipe_url: input.recipeUrl,
          notes: input.notes,
          cooked_at: input.cookedAt,
        },
      });
      invalidateQueries("cooking:");
      await revalidateCatalog(ctx, "cooking");
      return entry;
    }),
});
