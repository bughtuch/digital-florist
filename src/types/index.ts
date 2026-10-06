// ——————————————————————————————————————
// Digital Florist — core application types
// ——————————————————————————————————————

export type DbCity = {
  id: string;
  name: string;
  code: string;
  slug: string;
  display_order: number;
  active: boolean;
  default_currency: string;
  created_at: string;
};

export type DbCollection = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type BloomStatus = 'draft' | 'available' | 'archived';

export type DbBloom = {
  id: string;
  slug: string;
  title: string;
  house_line: string | null;
  city_id: string;
  collection_id: string;
  archive_code: string;
  edition_total: number;
  edition_sold: number;
  /** Amount in currency's smallest unit (pence, cents, fils, yen, won…). */
  price_minor: number;
  currency: string;
  status: BloomStatus;
  still_asset_url: string | null;
  motion_asset_url: string | null;
  source_asset_url: string | null;
  material_note: string | null;
  year: number;
  display_order: number;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbBloomTranslation = {
  id: string;
  bloom_id: string;
  locale: string;
  translated_title: string | null;
  translated_house_line: string | null;
  translated_material_note: string | null;
};

// Application type — bloom with resolved relations
export type BloomWithRelations = DbBloom & {
  city: DbCity;
  collection: DbCollection;
};

// Edition display helper output
export type EditionDisplay = {
  isArchived: boolean;
  label: string; // e.g. "019 / 250" or "ARCHIVED"
};

// ——————————————————————————————————————
// Gift / Payment types (Build 03)
// ——————————————————————————————————————

export type GiftStatus =
  | 'draft'
  | 'checkout_created'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export type DbGift = {
  id: string;
  bloom_id: string;
  sender_name: string;
  sender_email: string;
  recipient_name: string;
  recipient_email: string;
  private_message: string;
  locale: string;
  edition_number: number | null;
  /** Amount in currency's smallest unit — snapshot at purchase time, immutable. */
  amount_minor: number;
  currency: string;
  status: GiftStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  expired_at: string | null;
};

// Minimal bloom data passed to the send flow client component
export type SendBloomData = {
  id: string;
  slug: string;
  title: string;
  cityCode: string;
  archiveCode: string;
  editionDisplay: string;   // e.g. "019 / 250"
  isArchived: boolean;
  stillAssetUrl: string | null;
  priceMinor: number;        // official list price in smallest currency unit
  currency: string;          // ISO-4217 currency code
};

// What the /[locale]/sent page displays after payment is confirmed
export type GiftConfirmation = {
  bloomTitle: string;
  cityCode: string;
  archiveCode: string;
  editionNumber: number;
  editionTotal: number;
};

// ——————————————————————————————————————
// Creator / Attribution types (Build 10)
// ——————————————————————————————————————

export type DbCreator = {
  id: string;
  name: string;
  slug: string;
  city_id: string | null;
  email: string | null;
  commission_bps: number; // e.g. 4000 = 40%
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatorAttributionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export type DbCreatorAttribution = {
  id: string;
  creator_id: string;
  gift_id: string;
  commission_bps: number;
  commission_amount_minor: number;
  currency: string;
  status: CreatorAttributionStatus;
  created_at: string;
};
