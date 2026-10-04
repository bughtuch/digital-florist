// Illustrative bloom data — used on homepage Permanence section.
// Replace with Supabase queries in Build 02.

export type BloomMetadata = {
  title: string;
  cityCode: string;
  editionNumber: number;
  editionTotal: number;
  collection: 'AFTERHOURS' | 'MORNING' | 'MEMORY' | 'RITUAL' | 'CITY';
};

export const featuredBloom: BloomMetadata = {
  title: 'BLACK CALLA',
  cityCode: 'LON',
  editionNumber: 18,
  editionTotal: 250,
  collection: 'MEMORY',
};

export const collections = [
  'AFTERHOURS',
  'MORNING',
  'MEMORY',
  'RITUAL',
  'CITY',
] as const;

export const launchCities = [
  { name: 'London', code: 'LON' },
  { name: 'Dubai', code: 'DXB' },
  { name: 'Milano', code: 'MIL' },
  { name: 'Seoul', code: 'SEL' },
  { name: 'Tokyo', code: 'TYO' },
] as const;
