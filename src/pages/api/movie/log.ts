import { type NextApiRequest, type NextApiResponse } from "next";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import cors from "nextjs-cors";
import { z } from 'zod';
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

const LetterboxdMovie = z.object({
  title: z.string(),
  releaseYear: z.string(),
  rating: z.string().nullable(),
  letterboxdUrl: z.string(),
  watchedAt: z.string(),
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

  try {
    const letterboxdMovie = LetterboxdMovie.parse(req.body);
    const letterboxdId = extractIdFromLetterboxdUrl(letterboxdMovie.letterboxdUrl);
    const existingMovie = await caller.movie.getByLetterboxdId({ letterboxdId });
    const myRating = letterboxdMovie.rating ? Number(letterboxdMovie.rating) : null;

    if (!existingMovie) {
      const moviePosterUrl = extractPosterUrlFromLetterboxdDescription(letterboxdMovie.description);
      const adjustedMovieUrl = letterboxdMovie.letterboxdUrl.replace(/\/\w+\/film\//, "/film/");

      await caller.movie.create({
        title: letterboxdMovie.title,
        myRating: myRating,
        posterImageUrl: moviePosterUrl,
        letterboxdUrl: adjustedMovieUrl,
        releaseYear: Number(letterboxdMovie.releaseYear),
        watchedAt: new Date(`${letterboxdMovie.watchedAt}T00:00:00Z`),
        letterboxdId: letterboxdId
      });
    } else {
      await caller.movie.update({
        id: existingMovie.id,
        myRating: myRating,
      })
    }

    return res.status(200).json("Success");
  } catch (cause) {
    console.error(cause);
    if (cause instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(cause);
      return res.status(httpCode).json({ message: "Unauthorized" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
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
