import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const movieRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.movie.findMany();
  }),

  getCount: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.movie.count();
  }),

  getCountWhereRated: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.movie.count({
      where: { 
        my_rating: { 
          not: null 
        }
      }
    });
  }), 

});
