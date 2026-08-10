import { getEffectiveStatus } from "@/lib/status";
import type { SearchFilters, VetPractice } from "@/types/practice";

export const defaultSearchFilters: SearchFilters = {
  animalType: "all",
  service: "all",
  region: "all",
  onlyConfirmed: false,
};

export function filterPractices(
  practices: VetPractice[],
  filters: SearchFilters,
  now = new Date(),
): VetPractice[] {
  return practices.filter((practice) => {
    const matchesAnimal =
      filters.animalType === "all" || practice.animalTypes.includes(filters.animalType);
    const matchesService = filters.service === "all" || practice.services.includes(filters.service);
    const matchesRegion = filters.region === "all" || practice.region === filters.region;
    const matchesConfirmed =
      !filters.onlyConfirmed || getEffectiveStatus(practice, now) === "green";

    return matchesAnimal && matchesService && matchesRegion && matchesConfirmed;
  });
}
