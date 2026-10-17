export const buildLastFmUrl = (parameters: {
  method: string;
  from?: number;
  to?: number;
  limit?: number;
  album?: string;
  artist?: string;
}) => {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("user", process.env.LASTFM_USER ?? "");
  url.searchParams.set("api_key", process.env.LASTFM_API_KEY ?? "");
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
};
