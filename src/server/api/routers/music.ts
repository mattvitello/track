import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import { type TopAlbumsResponse } from "~/server/api/models/topalbumsresponse";
import { type WeeklyAlbumChartResponse } from "~/server/api/models/weeklyalbumchartresponse";
import { buildLastFmUrl } from "~/server/music/lastfm";
import { getAlbumCoverUrls } from "~/server/music/covers";
import { cachedQuery } from "~/server/query-cache";

export const musicRouter = createTRPCRouter({
  getMostListenedToAlbums: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100) }))
    .query(({ ctx, input }) =>
      cachedQuery(
        `music:all:${input.limit}`,
        async () => {
          const topAlbumsResponse = await axios.get<TopAlbumsResponse>(
            buildLastFmUrl({ method: "user.gettopalbums", limit: input.limit }),
            { timeout: 8000 }
          );

          const albums = topAlbumsResponse.data.topalbums.album.map((album) => {
            return {
              artist: album.artist.name,
              name: album.name,
              imageUrl: album.image[3] ? album.image[3]["#text"] : "",
              playcount: album.playcount,
              url: album.url,
            };
          });
          return getAlbumCoverUrls(ctx.prisma, albums);
        },
        5 * 60 * 1000
      )
    ),

  getMostListenedToAlbumsByYear: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100),
        year: z.number().int().min(2022).max(2100),
      })
    )
    .query(({ ctx, input }) =>
      cachedQuery(
        `music:${input.year}:${input.limit}`,
        async () => {
          const startDate = new Date(`${input.year}-01-01T00:00:00Z`);
          const startDateAsUnixTimestamp = Math.round(
            startDate.getTime() / 1000
          );

          const endDate = new Date(`${input.year + 1}-01-01T00:00:00Z`);
          const endDateAsUnixTimestamp = Math.round(endDate.getTime() / 1000);

          const topAlbumsOfYear = (
            await axios.get<WeeklyAlbumChartResponse>(
              buildLastFmUrl({
                method: "user.getweeklyalbumchart",
                from: startDateAsUnixTimestamp,
                to: endDateAsUnixTimestamp,
              }),
              { timeout: 8000 }
            )
          ).data.weeklyalbumchart.album.slice(0, input.limit);

          const albums = topAlbumsOfYear.map((album) => ({
            artist: album.artist["#text"],
            name: album.name,
            playcount: album.playcount,
            url: album.url,
          }));
          return getAlbumCoverUrls(ctx.prisma, albums);
        },
        5 * 60 * 1000
      )
    ),
});
