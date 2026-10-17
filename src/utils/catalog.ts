export type Catalog = "music" | "movies" | "cooking";
export type CatalogPageProps = { initialYear: number };

export const CATALOG_REFRESH_SECONDS = 15 * 60;

export function getCatalogYears(firstYear: number, currentYear: number) {
  const years: Array<number | "All"> = [];
  for (let year = currentYear; year >= firstYear; year--) years.push(year);
  years.push("All");
  return years;
}
