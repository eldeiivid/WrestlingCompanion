import type {
  CareerRosterAcquisition,
  CareerRosterCategory,
  CareerRosterGender,
  CareerRosterRole,
} from "../roster/careerRoster.types";

import type { ChampionshipCategory } from "../championships/championships.types";

export interface SeasonTransition {
  id: string;
  from_season: number;
  to_season: number;
  from_tick: number;
  status: "pending";
}

export interface SeasonCandidateChampionship {
  id: string;
  name: string;
  image_url: string | null;
  category: ChampionshipCategory;
}

export interface SeasonRetentionCandidate {
  membership_id: string;
  wrestler_id: string;
  source_wrestler_id: string | null;

  name: string;
  gender: CareerRosterGender;
  primary_class: string | null;
  secondary_class: string | null;
  role: CareerRosterRole;
  mic_skill: number | null;
  in_ring_skill: number | null;
  image_url: string | null;
  mygm_category: CareerRosterCategory | null;

  acquisition_type: CareerRosterAcquisition;
  contract_end_tick: number | null;

  is_retained: boolean;
  is_champion: boolean;
  championships: SeasonCandidateChampionship[];
}

export interface SeasonTransitionData {
  career_id: string;
  current_tick: number;

  transition: SeasonTransition;

  candidate_count: number;
  retained_count: number;
  candidates: SeasonRetentionCandidate[];

  draft_keys: string[];
  draft_count: number;

  finances_enabled: boolean;
  fans_enabled: boolean;
  starting_money: string | null;
  starting_fans: string | null;
}

export interface SaveSeasonRetentionInput {
  careerId: string;
  transitionId: string;
  membershipIds: string[];
}

export interface SaveSeasonRetentionResult {
  career_id: string;
  transition_id: string;
  retained_count: number;
  retained_membership_ids: string[];
}

export interface SaveSeasonDraftInput {
  careerId: string;
  transitionId: string;
  draftKeys: string[];
}

export interface SaveSeasonDraftResult {
  career_id: string;
  transition_id: string;
  draft_count: number;
  draft_keys: string[];
}

export interface SaveSeasonBalancesInput {
  careerId: string;
  transitionId: string;
  startingMoney: string | null;
  startingFans: string | null;
}

export interface SaveSeasonBalancesResult {
  career_id: string;
  transition_id: string;
  starting_money: string | null;
  starting_fans: string | null;
}
