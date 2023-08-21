import { type NextApiRequest, type NextApiResponse } from "next";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const logMovieHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const ctx = createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  await caller.movie.getCount();

  return res.status(200).json(req.body);
};

export default logMovieHandler;