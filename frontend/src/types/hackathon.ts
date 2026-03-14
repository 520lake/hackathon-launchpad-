// ==========================================================================
// Shared hackathon types – mirrors the backend response schemas.
// Imported by pages, components, and utility functions across the frontend
// to keep type definitions consistent and avoid per-file duplication.
// ==========================================================================

// --------------------------------------------------------------------------
// Enums (match backend Python enums exactly)
// --------------------------------------------------------------------------

export type HackathonStatus = "draft" | "published" | "ongoing" | "ended";

export type RegistrationType = "individual" | "team";

export type HackathonFormat = "online" | "offline";

export type SectionType =
  | "markdown"
  | "schedules"
  | "prizes"
  | "judging_criteria";

// --------------------------------------------------------------------------
// Nested entity types (children of a hackathon)
// --------------------------------------------------------------------------

/** A single host / co-organizer displayed on hackathon cards and detail pages. */
export interface HackathonHost {
  id: number;
  hackathon_id: number;
  name: string;
  logo_url: string | null;
  display_order: number;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;
}

/** A partner / sponsor shown on the detail page, grouped by category. */
export interface Partner {
  id: number;
  hackathon_id: number;
  name: string;
  logo_url: string | null;
  category: string;
  website_url: string | null;
  display_order: number;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;
}

/** One event within a schedules section (e.g. "报名阶段", "答辩"). */
export interface ScheduleItem {
  id: number;
  hackathon_id: number;
  section_id: number;
  event_name: string;
  start_time: string;
  end_time: string;
  display_order: number;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;
}

/** One prize row within a prizes section. */
export interface PrizeItem {
  id: number;
  hackathon_id: number;
  section_id: number;
  name: string;
  winning_standards: string | null;
  quantity: number;
  /** Total cash value for this prize tier (e.g. 10000.00). */
  total_cash_amount: number;
  /**
   * JSON-encoded array of sub-awards, e.g.
   * [{"type":"cash","amount":5000}, {"type":"item","name":"MacBook"}].
   */
  awards_sublist: string;
  display_order: number;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;
}

/** One scoring dimension within a judging_criteria section. */
export interface JudgingCriterionItem {
  id: number;
  hackathon_id: number;
  section_id: number;
  name: string;
  /** Whole-number percentage, e.g. 30 means 30%. */
  weight_percentage: number;
  description: string | null;
  display_order: number;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;
}

/**
 * A content section belonging to a hackathon.
 * The `section_type` determines which child array is populated:
 *  - "markdown" -> content holds the rich text string
 *  - "schedules" -> schedules[]
 *  - "prizes" -> prizes[]
 *  - "judging_criteria" -> judging_criteria[]
 */
export interface Section {
  id: number;
  hackathon_id: number;
  section_type: SectionType;
  title: string | null;
  display_order: number;
  /** Markdown / rich-text content (populated for "markdown" sections). */
  content: string | null;
  created_at: string;
  created_by: number | null;
  updated_at: string;
  updated_by: number | null;

  // Child arrays – present only for the matching section_type
  schedules?: ScheduleItem[];
  prizes?: PrizeItem[];
  judging_criteria?: JudgingCriterionItem[];
}

// --------------------------------------------------------------------------
// Full hackathon detail – returned by GET /hackathons/{id}
// --------------------------------------------------------------------------

/**
 * Complete hackathon object used on the detail page, create/edit page,
 * judging modal, and anywhere the full data is needed.
 */
export interface HackathonDetail {
  id: number;
  title: string;
  description: string | null;
  tags: string[];
  cover_image: string | null;
  registration_type: RegistrationType;
  format: HackathonFormat;
  start_date: string;
  end_date: string;

  // Structured geographic location (China province/city/district cascade)
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  is_address_hidden: boolean;

  status: HackathonStatus;

  // Audit / ownership fields
  created_by: number;
  created_at: string;
  updated_at: string;
  updated_by: number | null;

  // Nested relations (populated by the detail endpoint)
  sections: Section[];
  hosts: HackathonHost[];
  partners: Partner[];
}

// --------------------------------------------------------------------------
// Lightweight list-item type – returned by GET /hackathons (list endpoint)
// --------------------------------------------------------------------------

/**
 * Shape returned by the list endpoint. Same core fields as HackathonDetail
 * but without sections or partners. Includes a lightweight prize summary
 * so cards can display prize info without loading full section data.
 */
export interface HackathonListItem {
  id: number;
  title: string;
  description: string | null;
  tags: string[];
  cover_image: string | null;
  registration_type: RegistrationType;
  format: HackathonFormat;
  start_date: string;
  end_date: string;
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  is_address_hidden: boolean;
  status: HackathonStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  updated_by: number | null;

  hosts: HackathonHost[];

  /** Sum of all prize.total_cash_amount for this hackathon. */
  total_cash_prize: number;
  /** True if any prize has non-cash items in its awards_sublist. */
  has_non_cash_prizes: boolean;
}

// --------------------------------------------------------------------------
// Card display type – pure presentation, consumed by HackathonCard component
// --------------------------------------------------------------------------

/**
 * Lightweight, display-oriented type for card/list views.
 * Built from HackathonListItem via the toHackathonCardData() mapper.
 */
export interface HackathonCardData {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  /** Host entries shown on the card (name + optional logo). */
  hosts: Array<{ name: string; logo_url?: string }>;
  /** Tag labels displayed as small badges on the card. */
  tags: string[];
  status: string;
  /** Formatted date range string, e.g. "2026.01.01 - 2026.03.31". */
  dateRange: string;
  /** Formatted location string, e.g. "北京 朝阳区" or "线上". */
  location: string;
  /** Prize display text, e.g. "¥10,000 + 非现金奖品". */
  prizeText: string;
  /** True when the current user is an organizer of this hackathon. */
  isOrganizer?: boolean;
}
