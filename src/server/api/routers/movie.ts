import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const movieRouter = createTRPCRouter({
  getByLetterboxdId: publicProcedure
    .input(z.object({ letterboxdId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.movie.findFirst({
        where: {
          letterboxd_id: input.letterboxdId,
        },
      });
    }),

  getCount: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.movie.count();
  }),

  getCountWhereRated: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.movie.count({
      where: {
        my_rating: {
          not: null,
        },
      },
    });
  }),

  create: publicProcedure
    .input(z.object({ 
      title: z.string(),
      myRating: z.number().nullable(),
      posterImageUrl: z.string().nullable(),
      letterboxdUrl: z.string(),
      releaseYear: z.number(),
      watchedAt: z.date(),
      letterboxdId: z.string() 
    }))
    .query(({ ctx, input }) => {
      return ctx.prisma.movie.create({
        data: {
          title: input.title,
          my_rating: input.myRating,
          my_review: null,
          poster_image_url: input.posterImageUrl,
          letterboxd_url: input.letterboxdUrl,
          release_year: input.releaseYear,
          watched_at: input.watchedAt,
          letterboxd_id: input.letterboxdId
        }
      })
    }),

  update: publicProcedure
    .input(z.object({ 
      id: z.string(),
      myRating: z.number().nullable(),
    }))
    .query(({ ctx, input }) => {
      return ctx.prisma.movie.update({
        where: {
          id: input.id,
        },
        data: {
          my_rating: input.myRating,
        },
      });
    }),
});
