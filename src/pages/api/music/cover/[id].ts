import { type NextApiRequest, type NextApiResponse } from "next";
import { prisma } from "~/server/db";
import { getAlbumCover } from "~/server/music/covers";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    response.status(405).end();
    return;
  }
  const id = request.query.id;
  if (typeof id !== "string" || !/^[a-z0-9]{20,32}$/.test(id)) {
    response.status(400).end();
    return;
  }

  try {
    const cover = await getAlbumCover(prisma, id);
    if (cover) {
      response.setHeader("Content-Type", cover.contentType);
      response.setHeader("Content-Length", cover.bytes.length);
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader(
        "Cache-Control",
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
      );
      if (request.method === "HEAD") response.status(200).end();
      else response.status(200).send(cover.bytes);
      return;
    }
    response.setHeader("Cache-Control", "no-store");
    response.redirect(307, "/empty-poster.png");
  } catch {
    response.setHeader("Cache-Control", "no-store");
    response.redirect(307, "/empty-poster.png");
  }
}
