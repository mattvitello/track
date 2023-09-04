export type TopAlbumsResponse = {
  topalbums: {
    album: Album[];
  };
  "@attr": {
    user: string,
    totalPages: string,
    page: string,
    total: string,
    perPage: string
  }
};

type Album = {
  artist: {
    url: string,
    name: string,
    mbid: string
  },
  image: {
    size: string,
    "#text": string
  }[],
  "@attr": {
    rank: string
  },
  playcount: string,
  url: string,
  name: string,
  mbid: string
};
