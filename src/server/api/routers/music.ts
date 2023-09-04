import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import { type TopAlbumsResponse } from "~/server/api/models/topalbumsresponse";
import { type WeeklyAlbumChartResponse } from "~/server/api/models/weeklyalbumchartresponse";

type Album = {
  artist: string,
  name: string,
  imageUrl: string,
  playcount: string,
  url: string,
}

export const musicRouter = createTRPCRouter({
  getMostListenedToAlbums: publicProcedure
    .input(z.object({ limit: z.number() }))
    .query(async ({ input }) => {
      const topAlbumsResponse = await axios.get<TopAlbumsResponse>(
        buildLastFmUrl({ method: "user.gettopalbums", limit: input.limit })
      );
      
      return topAlbumsResponse.data.topalbums.album.map((album) => {
        return {
          artist: album.artist.name,
          name: album.name,
          imageUrl: album.image[3] ? album.image[3]["#text"] : "",
          playcount: album.playcount,
          url: album.url,
        } as Album;
      });
    }),

  getMostListenedToAlbumsByYear: publicProcedure
    .input(z.object({ limit: z.number(), year: z.number() }))
    .query(async ({ input }) => {
      const startDate = new Date(`${input.year}-01-01T00:00:00Z`);
      const startDateAsUnixTimestamp = Math.round(startDate.getTime() / 1000);
      
      const endDate = new Date(`${input.year + 1}-01-01T00:00:00Z`);
      const endDateAsUnixTimestamp = Math.round(endDate.getTime() / 1000);

      const getAlbumsUrl = buildLastFmUrl({
        method: "user.getweeklyalbumchart",
        from: startDateAsUnixTimestamp,
        to: endDateAsUnixTimestamp,
      });
      console.log(getAlbumsUrl);

      const weeklyAlbumChartResponse = await axios.get<WeeklyAlbumChartResponse>(getAlbumsUrl);
      
      const reducedListOfTopAlbums = weeklyAlbumChartResponse.data.weeklyalbumchart.album.slice(0, input.limit);
      return reducedListOfTopAlbums.map((album) => {
          return {
            artist: album.artist["#text"],
            name: album.name,
            imageUrl: '',
            playcount: album.playcount,
            url: album.url,
          } as Album;
        });
    }),
});

const buildLastFmUrl = (props: {
  method: string;
  from?: number;
  to?: number;
  limit?: number;
}) => {
  const { method, from, to, limit } = props;

  return (
    `http://ws.audioscrobbler.com/2.0/?` +
    `method=${method}` +
    `&user=${process.env.LASTFM_USER}` +
    `${limit ? `&limit=${limit}` : ""}` +
    `${from ? `&from=${from}` : ""}` +
    `${to ? `&to=${to}` : ""}` +
    `&api_key=${process.env.LASTFM_API_KEY}` +
    `&format=json`
  );
};
