import { type NextApiRequest, type NextApiResponse } from "next";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import cors from "nextjs-cors";
import { z } from 'zod';
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

const LetterboxdMovie = z.object({
  title: z.string(),
  releaseYear: z.number(),
  rating: z.number().nullable(),
  letterboxdUrl: z.string(),
  watchedAt: z.date(),
  description: z.string(),
});

type LetterboxdMovie = z.infer<typeof LetterboxdMovie>;

const logMovieHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res);

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const ctx = createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  const numberOfMovies = await caller.movie.getCount();

  try {
    const letterboxdMovie = LetterboxdMovie.parse(req.body);
    const letterboxdId = extractIdFromLetterboxdUrl(letterboxdMovie.letterboxdUrl);
    const existingMovie = await caller.movie.getByLetterboxdId({ letterboxdId });

    if (!existingMovie) {
      const moviePosterUrl = extractPosterUrlFromLetterboxdDescription(letterboxdMovie.description);

      await caller.movie.create({
        title: letterboxdMovie.title,
        myRating: letterboxdMovie.rating,
        posterImageUrl: moviePosterUrl,
        letterboxdUrl: letterboxdMovie.letterboxdUrl,
        releaseYear: letterboxdMovie.releaseYear,
        watchedAt: letterboxdMovie.watchedAt,
        letterboxdId: letterboxdId
      });
    } else {
      await caller.movie.update({
        id: existingMovie.id,
        myRating: letterboxdMovie.rating,
      })
    }

    res.status(200).json({ isSuccess: true });
  } catch (cause) {
    if (cause instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(cause);
      return res.status(httpCode).json(cause);
    }
    console.error(cause);
    res.status(500).json({ message: "Internal server error" });
  }

  return res.status(200).json({...req.body, numberOfMovies});
};

const extractIdFromLetterboxdUrl = (url: string): string => {
  const filmSegment = "film/";
  const nextSlash = url.indexOf("/", url.indexOf(filmSegment) + filmSegment.length);
  
  if (nextSlash !== -1) {
    return url.substring(url.indexOf(filmSegment) + filmSegment.length, nextSlash);
  } else {
    throw new Error("Film ID not found in the URL.");
  }
}

const extractPosterUrlFromLetterboxdDescription = (input: string): string | null => {
  const regex = /<img\s+src="([^"]+)"/;
  const match = input.match(regex);

  if (match && match.length >= 2) {
      return match[1] ? match[1] : null;
  }

  return null;
}

export default logMovieHandler;
