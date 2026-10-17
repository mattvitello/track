import type { Catalog } from "~/utils/catalog";

export async function revalidateCatalog(
  ctx: { revalidateCatalog?: (path: string) => Promise<void> },
  catalog: Catalog
) {
  try {
    await ctx.revalidateCatalog?.(`/${catalog}`);
  } catch {
    // A committed write must still succeed if regeneration is temporarily down.
    // Time-based ISR and the client's query invalidation provide a fallback.
    console.warn(
      `Could not regenerate /${catalog}; keeping its previous snapshot.`
    );
  }
}
