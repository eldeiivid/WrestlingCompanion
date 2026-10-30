import type {
  ChampionshipCategory,
  ChampionshipHolder,
} from "../championships/championships.types";

import type { SeasonTransition } from "./seasonDraft.types";

export interface SeasonDraftReviewWrestler {
  selection_key: string;
  source: "retained" | "draft";

  wrestler_id: string | null;
  catalog_wrestler_id: string | null;

  name: string;
  image_url: string | null;
}

export interface SeasonDraftReviewChampionship {
  id: string;
  name: string;
  image_url: string | null;
  category: ChampionshipCategory;

  will_vacate: boolean;
  holders: ChampionshipHolder[];
}

export interface SeasonDraftReviewRivalryMember {
  id: string;
  name: string;
  image_url: string | null;
  side: 1 | 2;
}

export interface SeasonDraftReviewRivalry {
  id: string;
  name: string | null;
  kind: "singles" | "tag_team" | "stable";
  level: 1 | 2 | 3 | 4;

  will_end: boolean;
  members: SeasonDraftReviewRivalryMember[];
}

export interface SeasonDraftReviewData {
  career_id: string;
  current_tick: number;
  transition: SeasonTransition;

  finances_enabled: boolean;
  fans_enabled: boolean;
  starting_money: string | null;
  starting_fans: string | null;

  roster_count: number;
  roster: SeasonDraftReviewWrestler[];

  unavailable_draft_keys: string[];
  championships: SeasonDraftReviewChampionship[];
  rivalries: SeasonDraftReviewRivalry[];
}
