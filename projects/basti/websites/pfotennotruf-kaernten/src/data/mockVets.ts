export type VetStatus = 'green' | 'yellow' | 'red' | 'grey';
export type SpeciesType = 'Katze' | 'Hund' | 'Kleintier' | 'Andere' | string;
export type ServiceType = 'Notfall' | 'normaler Termin' | 'Einschläferung' | 'Hausbesuch' | 'Schwere Erkrankung';

export interface VetInquiry {
  id: string;
  vetId: string; // Target veterinarian clinic id
  name: string; // Client's name
  phone: string; // Client's phone
  species: SpeciesType;
  situation: ServiceType;
  message: string;
  timestamp: string;
}

export interface Veterinarian {
  id: string;
  name: string;
  district: 'Villach' | 'Klagenfurt' | 'Spittal' | 'Wolfsberg' | 'St. Veit' | 'Feldkirchen' | 'Völkermarkt' | 'Hermagor';
  address: string;
  phone: string;
  openingHours: string;
  emergencyInfo: string;
  species: SpeciesType[];
  services: ServiceType[];
  status: VetStatus;
  lastConfirmed: string; // ISO String
}

// Generate ISO strings relative to current time for realistic demonstration
const hoursAgo = (h: number) => {
  const date = new Date();
  date.setHours(date.getHours() - h);
  return date.toISOString();
};

export const INITIAL_VETS: Veterinarian[] = [
  {
    id: 'vet-1',
    name: 'Kleintierklinik Villach',
    district: 'Villach',
    address: 'Draupromenade 14, 9500 Villach',
    phone: '+43 4242 000101',
    openingHours: 'Mo-Fr: 08:00 - 19:00, Sa-So: 24h Notdienst',
    emergencyInfo: 'Rund um die Uhr Notdienst für Notfälle. Bitte unbedingt vor Anfahrt telefonisch ankündigen.',
    species: ['Katze', 'Hund', 'Kleintier'],
    services: ['Notfall', 'Schwere Erkrankung', 'normaler Termin', 'Einschläferung', 'Hausbesuch'],
    status: 'green',
    lastConfirmed: hoursAgo(1), // 1 hour ago (Active Green)
  },
  {
    id: 'vet-2',
    name: 'Tierarztpraxis Dr. Paul Ogris',
    district: 'Feldkirchen',
    address: 'Klagenfurter Straße 22, 9560 Feldkirchen',
    phone: '+43 4276 000202',
    openingHours: 'Mo-Do: 08:30 - 12:00, Fr: 14:00 - 18:00',
    emergencyInfo: 'Telefonische Rufbereitschaft bis 22:00 Uhr an Wochentagen.',
    species: ['Katze', 'Hund', 'Kleintier', 'Andere'],
    services: ['Notfall', 'Schwere Erkrankung', 'normaler Termin', 'Einschläferung'],
    status: 'green',
    lastConfirmed: hoursAgo(3), // 3 hours ago (Active Green)
  },
  {
    id: 'vet-3',
    name: 'Vet-Zentrum Klagenfurt',
    district: 'Klagenfurt',
    address: 'Völkermarkter Straße 120, 9020 Klagenfurt',
    phone: '+43 463 000303',
    openingHours: 'Täglich 08:00 - 20:00',
    emergencyInfo: 'Abrufbarer Bereitschaftsdienst für registrierte Kunden.',
    species: ['Katze', 'Hund'],
    services: ['Notfall', 'Schwere Erkrankung', 'normaler Termin', 'Einschläferung', 'Hausbesuch'],
    status: 'green',
    lastConfirmed: hoursAgo(26), // 26 hours ago -> MUST expire and show as GREY!
  },
  {
    id: 'vet-4',
    name: 'Tierarzt-Gemeinschaftspraxis Lavanttal',
    district: 'Wolfsberg',
    address: 'Am Bahnhof 3, 9400 Wolfsberg',
    phone: '+43 4352 000404',
    openingHours: 'Mo-Fr: 08:00 - 12:00 und 15:00 - 18:00',
    emergencyInfo: 'Notfälle außerhalb der Zeiten nach telefonischer Rücksprache.',
    species: ['Katze', 'Hund', 'Kleintier', 'Andere'],
    services: ['normaler Termin', 'Hausbesuch'],
    status: 'yellow', // Confirmed but Yellow/Restricted
    lastConfirmed: hoursAgo(2),
  },
  {
    id: 'vet-5',
    name: 'Tierklinik Spittal an der Drau',
    district: 'Spittal',
    address: 'Hauptplatz 8, 9800 Spittal an der Drau',
    phone: '+43 4762 000505',
    openingHours: 'Mo-Sa: 08:00 - 18:00',
    emergencyInfo: 'Volle OP-Bereitschaft. Am Wochenende eingeschränkter Dienst.',
    species: ['Katze', 'Hund', 'Kleintier'],
    services: ['Notfall', 'Schwere Erkrankung', 'normaler Termin', 'Einschläferung', 'Hausbesuch'],
    status: 'green',
    lastConfirmed: hoursAgo(6), // 6 hours ago (Active Green)
  },
  {
    id: 'vet-6',
    name: 'Dr. Melitta Schwarz (Mobile Tierärztin)',
    district: 'Klagenfurt',
    address: 'Wiener Gasse 5, 9020 Klagenfurt',
    phone: '+43 664 000606',
    openingHours: 'Termine nach Vereinbarung (Mobil)',
    emergencyInfo: 'Spezialisiert auf stressfreie Hausbesuche und Einschläferungen im gewohnten Umfeld.',
    species: ['Katze', 'Hund', 'Kleintier'],
    services: ['normaler Termin', 'Einschläferung', 'Hausbesuch'],
    status: 'yellow',
    lastConfirmed: hoursAgo(4), // 4 hours ago (Active Yellow)
  },
  {
    id: 'vet-7',
    name: 'Tierarztpraxis St. Veit - Dr. Gerald Pichler',
    district: 'St. Veit',
    address: 'Grabenstraße 1, 9300 St. Veit an der Glan',
    phone: '+43 4212 000707',
    openingHours: 'Mo-Fr: 09:00 - 12:00, Di/Do: 16:00 - 19:00',
    emergencyInfo: 'Heute leider keine Notaufnahme wegen dringender Operationen.',
    species: ['Katze', 'Hund'],
    services: ['Schwere Erkrankung', 'normaler Termin'],
    status: 'red', // Red (Not available today)
    lastConfirmed: hoursAgo(8), // 8 hours ago
  },
  {
    id: 'vet-8',
    name: 'Vet-Med Hermagor (Dr. Lassnig)',
    district: 'Hermagor',
    address: 'Egarterplatz 4, 9620 Hermagor',
    phone: '+43 4282 000808',
    openingHours: 'Mo-Fr: 08:00 - 12:00',
    emergencyInfo: 'Telefonische Auskünfte jederzeit. Notfalldienst im Gailtal.',
    species: ['Katze', 'Hund', 'Kleintier', 'Andere'],
    services: ['Notfall', 'normaler Termin', 'Hausbesuch'],
    status: 'green',
    lastConfirmed: hoursAgo(48), // 48 hours ago -> MUST expire and show as GREY!
  }
];
