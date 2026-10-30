import type {
  CareerRosterMembership,
  CareerRosterWrestler,
} from "./careerRoster.types";

import type {
  ShowDetailMatchOutcome,
  ShowDetailMatchParticipant,
  ShowDetailParticipantResult,
} from "../show-history/showDetail.types";

import type { DashboardChampionship } from "../dashboard.types";
import type { FeaturedRivalry } from "../rivalries/rivalries.types";

export interface WrestlerProfileMembership extends CareerRosterMembership {
  brand_id: string;
}

export interface WrestlerProfileWrestler extends Omit<
  CareerRosterWrestler,
  "membership"
> {
  is_on_roster: boolean;
  membership: WrestlerProfileMembership | null;
}

export interface WrestlerProfileStats {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  no_contests: number;
  average_rating: number | null;
  high_rated_matches: number;
  promos_performed: number;
}

export interface WrestlerProfileMatch {
  segment_id: string;
  position: number;

  event_id: string;
  event_name: string;
  event_kind: "weekly" | "ple" | "special";

  tick: number;
  season: number;
  week: number;

  format_name: string;
  stipulation_name: string | null;
  rating: number | null;
  outcome: ShowDetailMatchOutcome | null;

  wrestler_side: number;
  wrestler_result: ShowDetailParticipantResult | null;

  is_title_match: boolean;
  participants: ShowDetailMatchParticipant[];
}

export interface WrestlerProfileMatchHistory {
  total_count: number;
  has_more: boolean;
  items: WrestlerProfileMatch[];
}

export interface WrestlerProfileData {
  career_id: string;
  current_tick: number;
  wrestler: WrestlerProfileWrestler;
  stats: WrestlerProfileStats;
  championships: WrestlerProfileChampionship[];
  rivalries: FeaturedRivalry[];
  match_history: WrestlerProfileMatchHistory;
}

export interface WrestlerProfileChampionship extends DashboardChampionship {
  reign_id: string;
  won_tick: number;
  duration_weeks: number;
}
