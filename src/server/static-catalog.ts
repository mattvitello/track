import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { invalidateQueries } from "~/server/query-cache";
import { CATALOG_REFRESH_SECONDS, type Catalog } from "~/utils/catalog";

export async function getStaticCatalogProps(catalog: Catalog) {
  const initialYear = new Date().getFullYear();
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      prisma,
      isAuthorizedWithZapier: false,
      clientIp: "",
      isAllowedIp: false,
      revalidateCatalog: () => Promise.resolve(),
    },
    transformer: superjson,
  });

  try {
    // On-demand regeneration must read the latest write, even in a warm process.
    invalidateQueries(catalog === "movies" ? "movie:" : `${catalog}:`);
    if (catalog === "music") {
      await helpers.music.getMostListenedToAlbumsByYear.fetch({
        limit: 24,
        year: initialYear,
      });
    } else if (catalog === "movies") {
      await helpers.movie.getByMinimumRatingAndWatchedYear.fetch({
        rating: 4,
        year: initialYear,
      });
    } else {
      await helpers.cooking.getByYear.fetch({ year: initialYear });
    }
  } catch {
    // Throw instead of publishing an empty page or replacing a valid ISR snapshot.
    // Do not include upstream error objects, which can contain credentialed URLs.
    helpers.queryClient.clear();
    throw new Error(
      `Could not generate the ${catalog} catalog. Keeping the previous deployment or snapshot.`
    );
  }

  // Match the API's JSON wire format, including Prisma Decimal.toJSON().
  // SuperJSON has already encoded dates and undefined values in its metadata.
  const state = helpers.dehydrate();
  const trpcState = JSON.parse(JSON.stringify(state)) as typeof state;
  helpers.queryClient.clear();
  return {
    props: { initialYear, trpcState },
    revalidate: CATALOG_REFRESH_SECONDS,
  };
}
