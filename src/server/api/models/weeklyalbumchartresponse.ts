export type WeeklyAlbumChartResponse = {
  weeklyalbumchart: {
    album: Album[];
  };
};

type Album = {
  artist: {
    mbid: string,
    "#text": string
  },
  "@attr": {
    rank: string
  },
  playcount: string,
  url: string,
  name: string,
  mbid: string
};
