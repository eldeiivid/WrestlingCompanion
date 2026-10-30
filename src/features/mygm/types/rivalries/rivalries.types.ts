export type RivalryKind = "singles" | "tag_team" | "stable";

export type RivalryLevel = 1 | 2 | 3 | 4;

export type RivalrySide = 1 | 2;

export type RivalryStatus = "active" | "resolved" | "stale";

export type RivalryAction = "none" | "create" | "increase" | "resolve";

export interface RivalryWrestler {
  wrestler_id: string;
  name: string;
  image_url: string | null;
}

export interface RivalryMember extends RivalryWrestler {
  side: RivalrySide;
}

export interface FeaturedRivalry {
  id: string;
  name: string | null;
  kind: RivalryKind;
  level: RivalryLevel;
  started_tick: number;
  started_season: number;
  started_week: number;
  weeks_active: number;
  last_activity_tick: number;
  members: RivalryMember[];
}

export interface FeaturedRivalriesData {
  career_id: string;
  current_tick: number;
  total_active: number;
  items: FeaturedRivalry[];
}

export interface RivalryDetail extends Omit<
  FeaturedRivalry,
  "last_activity_tick"
> {
  status: RivalryStatus;
  ended_tick: number | null;
  winning_side: RivalrySide | null;
}

export type RivalryHistoryKind =
  | "match"
  | "promo"
  | "interference"
  | "level_change"
  | "resolution"
  | "note";

export interface RivalryHistoryItem {
  id: string;
  tick: number;
  season: number;
  week: number;

  kind: RivalryHistoryKind;
  new_level: RivalryLevel | null;
  notes: string | null;

  segment_id: string | null;
  segment_position: number | null;
  segment_kind: "match" | "promo" | null;
  segment_label: string | null;
  stipulation_name: string | null;

  event_id: string | null;
  event_name: string | null;
  event_status: "draft" | "confirmed" | "completed" | null;

  rivalry_action: RivalryAction | null;
  match_rating: number | null;

  promo_rating: {
    id: string;
    name: string;
  } | null;

  match_winners: RivalryWrestler[];
}

export interface RivalryHistory {
  total_count: number;
  has_more: boolean;
  items: RivalryHistoryItem[];
}

export interface RivalryDetailData {
  career_id: string;
  current_tick: number;
  rivalry: RivalryDetail;
  history: RivalryHistory;
}

export interface RivalryListItem extends FeaturedRivalry {
  status: RivalryStatus;
  ended_tick: number | null;
  winning_side: RivalrySide | null;
}

export interface RivalriesFilters {
  status: RivalryStatus | "all";
  kind: RivalryKind | "all";
  search: string;
}

export interface GetRivalriesInput extends RivalriesFilters {
  careerId: string;
  page: number;
  pageSize: number;
}

export interface RivalriesPage {
  career_id: string;
  current_tick: number;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: RivalryListItem[];
}
