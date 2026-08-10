export type AnimalType = "cat" | "dog" | "small" | "other";

export type Service = "emergency" | "appointment" | "euthanasia" | "homeVisit";

export type Region =
  | "Villach"
  | "Klagenfurt"
  | "Spittal"
  | "Wolfsberg"
  | "St. Veit"
  | "Feldkirchen"
  | "Völkermarkt"
  | "Hermagor";

export type AvailabilityStatus = "green" | "yellow" | "red" | "gray";

export type SearchFilters = {
  animalType: AnimalType | "all";
  service: Service | "all";
  region: Region | "all";
  onlyConfirmed: boolean;
};

export type VetPractice = {
  id: string;
  name: string;
  city: string;
  region: Region;
  address: string;
  postalCode: string;
  phone: string;
  openingHours: string[];
  emergencyInfo: string;
  animalTypes: AnimalType[];
  services: Service[];
  status: AvailabilityStatus;
  lastConfirmedAt: string | null;
};

export type Inquiry = {
  id: string;
  practiceId: string;
  createdAt: string;
  name: string;
  phone: string;
  animalType: AnimalType;
  service: Service;
  location: string;
  message: string;
};

export const animalTypeLabels: Record<AnimalType, string> = {
  cat: "Katze",
  dog: "Hund",
  small: "Kleintier",
  other: "Anderes Tier",
};

export const serviceLabels: Record<Service, string> = {
  emergency: "Notfall",
  appointment: "Normaler Termin",
  euthanasia: "Einschläferung",
  homeVisit: "Hausbesuch",
};

export const regionOptions: Region[] = [
  "Villach",
  "Klagenfurt",
  "Spittal",
  "Wolfsberg",
  "St. Veit",
  "Feldkirchen",
  "Völkermarkt",
  "Hermagor",
];

export const animalTypeOptions: AnimalType[] = ["cat", "dog", "small", "other"];

export const serviceOptions: Service[] = [
  "emergency",
  "appointment",
  "euthanasia",
  "homeVisit",
];
