import type {
  ChampionshipCategory,
  ChampionshipDivision,
  ChampionshipGender,
  ChampionshipHolder,
} from "./championships.types";

export interface ChampionshipDetails {
  id: string;
  name: string;
  image_url: string | null;
  gender: ChampionshipGender;
  division: ChampionshipDivision;
  category: ChampionshipCategory;
  is_active: boolean;
}

export interface ChampionshipMatchReference {
  segment_id: string;
  event_id: string;
  event_name: string;
  tick: number;
  season: number;
  week: number;
}

export interface ChampionshipCurrentReign {
  id: string;
  won_tick: number;
  duration_weeks: number;
  defenses: number;
  holders: ChampionshipHolder[];
  won_match: ChampionshipMatchReference | null;
}

export interface ChampionshipHistorySummary {
  reign_count: number;
  completed_reign_count: number;
  defense_count: number;
}

export interface ChampionshipDetailData {
  career_id: string;
  current_tick: number;
  championship: ChampionshipDetails;
  current_reign: ChampionshipCurrentReign | null;
  history_summary: ChampionshipHistorySummary;
}

export type ChampionshipReignEndType = "ongoing" | "match" | "without_match";

export interface ChampionshipReign {
  id: string;
  won_tick: number;
  lost_tick: number | null;
  is_current: boolean;
  duration_weeks: number;
  end_type: ChampionshipReignEndType;
  holders: ChampionshipHolder[];
  defenses: number;
  won_match: ChampionshipMatchReference | null;
  lost_match: ChampionshipMatchReference | null;
}

export interface GetChampionshipReignsInput {
  careerId: string;
  titleId: string;
  page: number;
  pageSize: number;
}

export interface ChampionshipReignsPage {
  career_id: string;
  title_id: string;
  category: ChampionshipCategory;
  current_tick: number;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: ChampionshipReign[];
}

export type ChampionshipMatchOutcome = "decisive" | "draw" | "no_contest";

export type ChampionshipParticipantResult =
  | "winner"
  | "loser"
  | "draw"
  | "no_contest";

export interface ChampionshipDefenseParticipant {
  wrestler_id: string;
  name: string;
  image_url: string | null;
  side: number;
  result: ChampionshipParticipantResult | null;
}

export interface ChampionshipDefense extends ChampionshipMatchReference {
  position: number;
  event_kind: "weekly" | "ple" | "special";
  format_name: string;
  stipulation_name: string | null;
  rating: number | null;
  outcome: ChampionshipMatchOutcome | null;
  participants: ChampionshipDefenseParticipant[];
}

export interface GetReignDefensesInput {
  careerId: string;
  titleId: string;
  reignId: string;
  page: number;
  pageSize: number;
}

export interface ReignDefensesPage {
  career_id: string;
  title_id: string;
  reign_id: string;
  current_tick: number;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: ChampionshipDefense[];
}
