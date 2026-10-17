/* eslint-disable @typescript-eslint/require-await */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      // Next 13's tracer omits Sharp's ESM libvips module. Local node_modules
      // hides this; a deployed function must contain the complete runtime.
      // Next 13 caches resolved includes relative to the first route directory.
      // Equivalent but distinct globs prevent reuse across different depths.
      "/{music,movies,cooking}": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
      "/api/{trpc,movie}/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*"],
      "/api/music/cover/*": ["./node_modules/sharp/**", "./node_modules/@img/**"],
    },
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/movies',
        permanent: true,
      },
    ]
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 7,
    domains: ['ltrbxd.com', 's.ltrbxd.com', 'a.ltrbxd.com', 'fastly.net', 'lastfm.freetls.fastly.net', 'res.cloudinary.com'],
  },
};

export default config;
