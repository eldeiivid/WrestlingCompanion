export type BookingShowType = "weekly" | "go_home" | "ple";

export interface BookingEvent {
  id: string;
  name: string;
  tick: number;
  status: BookingEventStatus;
}

export interface BookingLimits {
  min_matches: number;
  max_matches: number;
  max_promos: number;
  must_start_with_match: boolean;
  must_end_with_match: boolean;
}

export interface BookingMatchParticipantSummary {
  wrestler_id: string;
  name: string;
  image_url: string | null;
  side: number;
}

export interface BookingPromoParticipantSummary {
  wrestler_id: string;
  name: string;
  image_url: string | null;
  role: BookingPromoRole;
}

export type BookingSegmentSummary =
  | {
      id: string;
      position: number;
      kind: "match";
      stipulation_image_url: string | null;
      label: string;
      cost: string;
      stipulation_name: string | null;
      title: BookingMatchTitleSummary | null;
      interference: BookingMatchInterferenceSummary | null;
      participants: BookingMatchParticipantSummary[];
    }
  | {
      id: string;
      position: number;
      kind: "promo";
      label: string;
      promo_type_id: BookingPromoTypeId;
      cost: string;
      participants: BookingPromoParticipantSummary[];
    };

export interface MyGmBookingData {
  career_id: string;
  current_tick: number;
  show_type: BookingShowType;
  event: BookingEvent;
  limits: BookingLimits;
  finances_enabled: boolean;
  fans_enabled: boolean;
  budget_available: string;
  total_cost: string;
  fans_available: string;
  segments: BookingSegmentSummary[];
}

export interface BookingMatchFormat {
  id: string;
  name: string;
  team_sizes: number[];
}

export interface BookingMatchStipulation {
  id: string;
  name: string;
  image_url: string | null;
  cost: string;
  format_ids: string[];
}

export interface BookingMatchWrestler {
  id: string;
  name: string;
  image_url: string | null;
  gender: "male" | "female";
  is_available: boolean;
  can_interfere: boolean;
}

export interface BookingMatchOptions {
  formats: BookingMatchFormat[];
  stipulations: BookingMatchStipulation[];
  wrestlers: BookingMatchWrestler[];
  titles: BookingMatchTitleOption[];
  interference_cost: string;
  feuds: BookingMatchFeudOption[];
}

export interface AddBookingMatchInput {
  careerId: string;
  eventId: string;
  segmentId: string;
  formatId: string;
  stipulationId: string;
  titleId?: string | null;
  interference?: BookingMatchInterferenceInput | null;
  participants: {
    wrestler_id: string;
    side: number;
  }[];
}

export type BookingPromoTypeId =
  | "ad_break"
  | "call_out"
  | "charity"
  | "class_change"
  | "invasion"
  | "self_promo"
  | "tag_call_out"
  | "training"
  | "turn";

export type BookingPromoRole = "initiator" | "target";

export interface BookingPromoType {
  id: BookingPromoTypeId;
  name: string;
  cost: string;
}

export interface BookingPromoWrestler {
  id: string;
  name: string;
  image_url: string | null;
  can_initiate: boolean;
  can_swap_classes: boolean;
}

export interface BookingPromoOptions {
  types: BookingPromoType[];
  wrestlers: BookingPromoWrestler[];
}

export interface AddBookingPromoInput {
  careerId: string;
  eventId: string;
  segmentId: string;
  promoTypeId: BookingPromoTypeId;
  participants: {
    wrestler_id: string;
    role: BookingPromoRole;
  }[];
}

export interface BookingEditableMatch {
  id: string;
  event_id: string;
  kind: "match";
  format_id: string;
  stipulation_id: string;
  title_id: string | null;
  interference: BookingMatchInterferenceInput | null;
  cost: string;
  participants: {
    wrestler_id: string;
    side: number;
  }[];
}

export interface BookingEditablePromo {
  id: string;
  event_id: string;
  kind: "promo";
  promo_type_id: BookingPromoTypeId;
  cost: string;
  participants: {
    wrestler_id: string;
    role: BookingPromoRole;
  }[];
}

export type BookingEditableSegment =
  | BookingEditableMatch
  | BookingEditablePromo;

export interface BookingMatchEditorData {
  options: BookingMatchOptions;
  segment: BookingEditableMatch;
}

export interface BookingPromoEditorData {
  options: BookingPromoOptions;
  segment: BookingEditablePromo;
}

export interface BookingMatchTitleSummary {
  id: string;
  name: string;
  image_url: string | null;
}

export interface BookingMatchTitleOption extends BookingMatchTitleSummary {
  gender: "male" | "female" | "mixed" | "open";
  division: "singles" | "tag_team";
  is_vacant: boolean;
  holders: {
    wrestler_id: string;
    name: string;
  }[];
}

export interface BookingMatchInterferenceInput {
  wrestler_id: string;
  target_wrestler_id: string;
}

export interface BookingMatchInterferenceSummary extends BookingMatchInterferenceInput {
  wrestler_name: string;
  target_wrestler_name: string;
}

export interface BookingMatchFeudOption {
  id: string;
  members: {
    wrestler_id: string;
    side: 1 | 2;
  }[];
}

export type BookingEventStatus = "draft" | "confirmed" | "completed";
