import {
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
} from "@tanstack/react-query";
import superjson from "superjson";
import { CATALOG_REFRESH_SECONDS } from "./catalog";

const STORAGE_KEY = "track:public-queries:v1";
const MAX_AGE = 24 * 60 * 60 * 1000;
const PUBLIC_QUERIES = new Set([
  "music.getMostListenedToAlbums",
  "music.getMostListenedToAlbumsByYear",
  "movie.getAllByMinimumRating",
  "movie.getByMinimumRatingAndWatchedYear",
  "cooking.getAll",
  "cooking.getByYear",
]);

const isPublicQuery = (key: unknown) =>
  Array.isArray(key) &&
  Array.isArray(key[0]) &&
  PUBLIC_QUERIES.has(key[0].join("."));

export function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        cacheTime: MAX_AGE,
      },
    },
  });
  // Generated catalogs already carry data. Avoid immediately repeating their
  // build-time reads on every new visitor while the snapshot is still fresh.
  for (const path of PUBLIC_QUERIES) {
    client.setQueryDefaults([path.split(".")], {
      staleTime: CATALOG_REFRESH_SECONDS * 1000,
    });
  }
  if (typeof window === "undefined") return client;

  client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "success") return;
    if (!isPublicQuery(event.query.queryKey)) return;
    try {
      const state = dehydrate(client, {
        dehydrateMutations: false,
        shouldDehydrateQuery: (query) =>
          isPublicQuery(query.queryKey) &&
          query.state.status === "success" &&
          Date.now() - query.state.dataUpdatedAt < MAX_AGE,
      });
      window.localStorage.setItem(STORAGE_KEY, superjson.stringify(state));
    } catch {
      // Browsing still works in private mode and when the storage quota is full.
    }
  });
  return client;
}

/** Restore after React hydration so cached markup cannot mismatch server HTML. */
export function restoreQueryClient(client: QueryClient) {
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = superjson.parse<DehydratedState>(saved);
      state.mutations = [];
      state.queries = state.queries.filter(
        (query) =>
          isPublicQuery(query.queryKey) &&
          query.state.status === "success" &&
          Date.now() - query.state.dataUpdatedAt < MAX_AGE
      );
      for (const query of state.queries) {
        // Keep saved data visible while the mounted queries refresh.
        query.state.isInvalidated = true;
        query.state.fetchStatus = "idle";
      }
      hydrate(client, state);
    }
  } catch {
    // Unavailable storage or old/corrupt data must never prevent loading.
  }
}
