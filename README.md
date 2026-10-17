# track.mattvitello.com

System for tracking and visualizing my data.

## Stack

- [Next.js](https://nextjs.org)
- [tRPC](https://trpc.io)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)

## Album covers

Music stores a durable copy of each cover in the existing Neon database. The
`album.cover_art_image_url` text field accepts either a legacy Last.fm URL or a
self-contained `data:image/...;base64,...` image. No schema migration or extra
storage account is required.

- Both yearly charts and All return `/api/music/cover/<album-id>` URLs. Chart
  responses select only album IDs, URLs, and update times, keeping image bytes out
  of the JSON. Image URLs include the stored cover's update time, so replacing a
  cover automatically bypasses an older cached image.
- On the first image request, the server downloads the existing Last.fm cover.
  If it is missing or broken, it asks Last.fm for the current album artwork.
  Only known Last.fm image hosts are fetched; redirects, large downloads, and
  invalid images are rejected.
- Covers are resized to 300×300 WebP with Sharp and stored once, capped at 96 KiB
  per image (128 KiB including base64). Once saved, they survive upstream URL
  changes and Last.fm outages. Existing covers are migrated as they are viewed.
  Static artwork is preferred over GIFs when Last.fm supplies both. JPEG, PNG,
  WebP, and GIF sources are supported; an animated source is saved as a still
  image using its first frame when no static source is available. The site never
  displays animated covers, keeping storage and transfer small.
- Successful responses are cached by browsers for one day and Vercel's CDN for
  seven days. Music images use `unoptimized` because they are already resized,
  avoiding Vercel image transformation usage.
- Missing artwork uses the local placeholder and is retried after 24 hours.
  Only an album response that confirms no artwork is available is saved as
  `missing:v1`. Download failures and Last.fm errors preserve the existing source
  and can retry on the next page load. Placeholder responses are never cached.
  Legacy empty entries retry immediately.
  An individual cover failure does not prevent the album grid from rendering.

This uses the existing free Neon and Vercel plans, with no paid image service,
background job, or new credentials. Storage and traffic still count toward those
plans' quotas; 1,000 covers use about 125 MiB of image text at the size cap, before database
overhead, and typically much less. Check total database usage in Neon as the
library grows. Current plan limits are listed at
[Neon pricing](https://neon.com/pricing) and
[Vercel Hobby](https://vercel.com/docs/plans/hobby).

Use Node.js 20.9 or later (verified on Node 22). To verify locally, run
`npm install` and `npm run dev` with the existing `.env`,
then open Music → 2026. A second request for a saved image should return its
bytes without contacting Last.fm. Deploy normally; no database migration is
needed. `vercel.json` allows up to 30 seconds for an initial cover download and
recovery; subsequent requests use the stored image or CDN cache.

## Loading and caching

The current-year music, movie, and cooking lists are rendered into HTML during
`npm run build`. A first-time visitor gets the list and its image URLs in the
initial response, without first downloading JavaScript and calling the list API.
The generated snapshot remains available across function cold starts and database
sleep. Other years and All load on first selection and then use the query cache.

Next.js regenerates each page in the background on the first visit after 15
minutes, not on a schedule. Successful movie creates/updates and cooking creates
also await on-demand regeneration of their page. A failed regeneration retains
the last successful snapshot and does not turn a committed write into a failed
save. A failed initial generation fails the build instead of deploying an empty
list. Existing deployments remain available when a new build fails. Build and
regeneration require the existing database and Last.fm environment variables.

Public lists stay fresh in React Query for 15 minutes, avoiding duplicate reads on
initial hydration. A whitelist persists public lists locally for up to 24 hours;
restoration happens after React hydration to avoid mismatched HTML. Dates survive
restoration. Permissions and writes are never persisted. Storage failures fall
back to ordinary loading. The initial selected year comes from the snapshot, so
server and browser markup stay consistent across New Year.

Music chart API responses additionally use Vercel's CDN: five minutes fresh and
up to one hour stale while refreshing. Only successful music-only query batches
receive shared cache headers. Movie and cooking API responses remain uncached by
the CDN so a post-save refetch can read current data; their generated pages still
use ISR. Permission checks, protected operations, mutations, mixed batches, and
errors use `private, no-store`.

A bounded server process cache shares concurrent reads and retains Last.fm charts
for five minutes and movie/cooking lists for one minute. On upstream failures it
can reuse results up to 24 hours old. This opportunistic cache resets on restart;
ISR supplies the durable page snapshot. Regeneration clears its catalog's process
cache before reading, so a warm process cannot regenerate from an old result.

Recipe thumbnails use responsive sizes and Cloudinary square crops with automatic
format/quality. Other image hosts use Next's image optimizer with a seven-day
minimum cache TTL. `vercel.json` sets the single function region to `cle1`
(`us-east-2`), matching the current Neon database. Update it if the database moves.
No database migration, new service, keep-alive job, paid dependency, or additional
credentials are needed. Existing build, transfer, ISR and compute allowances still
apply. CDN cache behavior and the region setting take effect on Vercel deployment.

Validate with `node --test tests/cache.test.js`, `npx tsc --noEmit`, and
`npm run build`. Start the production build with `npm run start`; `next dev` does
not exercise production ISR caching. With Chrome's cache disabled and API requests
blocked, each default list should still render from its HTML. Unblock the API to
check year filters and All. Check Cooking at desktop/mobile widths for thumbnail
requests. The normal Add permission check remains client-specific.
