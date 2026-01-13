/* eslint-disable @typescript-eslint/require-await */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
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
    domains: ['ltrbxd.com', 's.ltrbxd.com', 'a.ltrbxd.com', 'fastly.net', 'lastfm.freetls.fastly.net', 'res.cloudinary.com'],
  },
};

export default config;
