const FRESH_FOR_MS = 60 * 1000;
const RETAIN_FOR_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 128;

type Entry = {
  data?: unknown;
  updatedAt: number;
  pending?: Promise<unknown>;
};

const entries = new Map<string, Entry>();

/** The browser keeps showing cached data while awaiting this refresh. */
export async function cachedQuery<T>(
  key: string,
  load: () => Promise<T>,
  freshFor = FRESH_FOR_MS
): Promise<T> {
  const saved = entries.get(key);
  if (saved?.pending) return saved.pending as Promise<T>;
  if (saved && Date.now() - saved.updatedAt < freshFor) return saved.data as T;

  const entry: Entry = saved ?? { updatedAt: 0 };
  entries.set(key, entry);
  if (entries.size > MAX_ENTRIES) {
    for (const oldestKey of entries.keys()) {
      entries.delete(oldestKey);
      break;
    }
  }

  const request = Promise.resolve()
    .then(load)
    .then(
      (data) => {
        // A write may have invalidated this key while the read was in flight.
        if (entries.get(key) === entry) {
          entry.data = data;
          entry.updatedAt = Date.now();
        }
        return data;
      },
      (error: unknown) => {
        if (entry.updatedAt && Date.now() - entry.updatedAt < RETAIN_FOR_MS) {
          return entry.data as T;
        }
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      }
    );
  entry.pending = request;
  try {
    return await request;
  } finally {
    delete entry.pending;
  }
}

export function invalidateQueries(prefix: string) {
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) entries.delete(key);
  }
}
