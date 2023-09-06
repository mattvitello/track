import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import { type TopAlbumsResponse } from "~/server/api/models/topalbumsresponse";
import { type WeeklyAlbumChartResponse } from "~/server/api/models/weeklyalbumchartresponse";
import { type AlbumInfoResponse } from "~/server/api/models/albuminforesponse";
import { type PrismaClient } from "@prisma/client";

type Album = {
  artist: string;
  name: string;
  imageUrl: string;
  playcount: string;
  url: string;
};

type LastFmAlbum = WeeklyAlbumChartResponse["weeklyalbumchart"]["album"][0];

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
    .query(async ({ ctx, input }) => {
      const startDate = new Date(`${input.year}-01-01T00:00:00Z`);
      const startDateAsUnixTimestamp = Math.round(startDate.getTime() / 1000);

      const endDate = new Date(`${input.year + 1}-01-01T00:00:00Z`);
      const endDateAsUnixTimestamp = Math.round(endDate.getTime() / 1000);

      const topAlbumsOfYear = (
        await axios.get<WeeklyAlbumChartResponse>(
          buildLastFmUrl({
            method: "user.getweeklyalbumchart",
            from: startDateAsUnixTimestamp,
            to: endDateAsUnixTimestamp,
          })
        )
      ).data.weeklyalbumchart.album.slice(0, input.limit);

      const albumsWithCoverArt = await ctx.prisma.album.findMany({
        where: {
          last_fm_url: {
            in: topAlbumsOfYear.map((album) => album.url),
          },
        },
      });

      const topAlbumsOfYearWithAssignedCoverArt = await Promise.all(
        topAlbumsOfYear.map(async (album) => {
          const albumDataWithImageUrl = albumsWithCoverArt.find(
            (albumWithCoverArt) => albumWithCoverArt.last_fm_url === album.url
          );

          const albumCoverArtImageUrl = albumDataWithImageUrl
            ? albumDataWithImageUrl.cover_art_image_url
            : await getAlbumFromLastFmAndSaveToDatabaseAndReturnImageUrl({
                album,
                prisma: ctx.prisma,
              });

          return {
            artist: album.artist["#text"],
            name: album.name,
            imageUrl: albumCoverArtImageUrl,
            playcount: album.playcount,
            url: album.url,
          } as Album;
        })
      );

      return topAlbumsOfYearWithAssignedCoverArt;
    }),
});

const getAlbumFromLastFmAndSaveToDatabaseAndReturnImageUrl = async ({
  album,
  prisma,
}: {
  album: LastFmAlbum;
  prisma: PrismaClient;
}): Promise<string> => {
  const lastFmAlbumResponse = await axios.get<AlbumInfoResponse>(
    buildLastFmUrl({
      method: "album.getInfo",
      album: album.name,
      artist: album.artist["#text"],
    })
  );

  const albumDetails = lastFmAlbumResponse.data.album;
  if (!albumDetails) {
    throw new Error(
      `No album info found for ${album.artist["#text"]} - ${album.name} on last.fm.`
    );
  }

  const coverArtImageUrl = albumDetails.image[3]
    ? albumDetails.image[3]["#text"]
    : "";

  const numberOfTracks = albumDetails.tracks?.track
    ? albumDetails.tracks.track.length
    : null;

  await prisma.album.create({
    data: {
      name: albumDetails.name,
      mbid: albumDetails.mbid,
      artist: albumDetails.artist,
      last_fm_url: albumDetails.url,
      number_of_tracks: numberOfTracks,
      cover_art_image_url: coverArtImageUrl,
    },
  });
  return coverArtImageUrl;
};

const buildLastFmUrl = ({
  method,
  from,
  to,
  limit,
  album,
  artist,
}: {
  method: string;
  from?: number;
  to?: number;
  limit?: number;
  album?: string;
  artist?: string;
}) => {
  return (
    `http://ws.audioscrobbler.com/2.0/?` +
    `method=${encodeURIComponent(method)}` +
    `&user=${process.env.LASTFM_USER}` +
    `${limit ? `&limit=${encodeURIComponent(limit)}` : ""}` +
    `${from ? `&from=${encodeURIComponent(from)}` : ""}` +
    `${to ? `&to=${encodeURIComponent(to)}` : ""}` +
    `${album ? `&album=${encodeURIComponent(album)}` : ""}` +
    `${artist ? `&artist=${encodeURIComponent(artist)}` : ""}` +
    `&api_key=${process.env.LASTFM_API_KEY}` +
    `&format=json`
  );
};
