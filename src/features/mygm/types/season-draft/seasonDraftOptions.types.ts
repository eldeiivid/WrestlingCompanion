import type { MarketFilters, MarketWrestler } from "../market/market.types";

export type SeasonDraftFilters = MarketFilters;

export interface SeasonDraftOption extends Omit<MarketWrestler, "market_key"> {
  draft_key: string;
  was_on_previous_roster: boolean;
}

export interface GetSeasonDraftOptionsInput extends SeasonDraftFilters {
  careerId: string;
  transitionId: string;
  page: number;
  pageSize: number;
}

export interface SeasonDraftOptionsPage {
  career_id: string;
  transition_id: string;
  current_tick: number;

  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  available_count: number;

  available_classes: string[];
  items: SeasonDraftOption[];
}
