import { type NextApiRequest, type NextApiResponse } from "next";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import cors from "nextjs-cors";

const logMovieHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res);

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const ctx = createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  const numberOfMovies = await caller.movie.getCount();

  return res.status(200).json({...req.body, numberOfMovies});
};

export default logMovieHandler;
