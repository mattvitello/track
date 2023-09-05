export type AlbumInfoResponse = {
  album: {
    artist: string,
    name: string,
    mbid: string,
    image: {
      size: string,
      "#text": string
    }[],
    tracks: {
      track: { name: string }[]
    }
    url: string,
  }
};
