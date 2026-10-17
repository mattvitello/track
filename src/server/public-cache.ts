const MUSIC_CHARTS = new Set([
  "music.getMostListenedToAlbums",
  "music.getMostListenedToAlbumsByYear",
]);

export function publicCacheHeaders(
  type: string,
  paths: string[] | undefined,
  hasErrors: boolean
) {
  const cacheable =
    type === "query" &&
    !hasErrors &&
    !!paths?.length &&
    paths.every((path) => MUSIC_CHARTS.has(path));
  return {
    "Cache-Control": cacheable
      ? "public, max-age=0, s-maxage=300, stale-while-revalidate=3600"
      : "private, no-store",
  };
}
