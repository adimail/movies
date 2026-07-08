import { Settings } from "../store";

export function getActiveFiltersText(settings: Settings) {
  const activeFilters: string[] = [];
  if (settings.favoritesOnly) activeFilters.push("Favorites Only");
  if (settings.selectedGenres.length > 0) {
    activeFilters.push(
      ...settings.selectedGenres.map((g) =>
        g
          .replace(/([A-Z])/g, " $1")
          .trim()
          .toUpperCase()
      )
    );
  }
  return activeFilters;
}

