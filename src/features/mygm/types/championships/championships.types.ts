export type ChampionshipGender = "male" | "female" | "mixed" | "open";

export type ChampionshipDivision = "singles" | "tag_team";

export type ChampionshipCategory =
  | "world"
  | "midcard"
  | "tag_team"
  | "mitb"
  | "other";

export type ChampionshipStatusFilter = "all" | "held" | "vacant";

export interface ChampionshipHolder {
  id: string;
  name: string;
  image_url: string | null;
}

export interface ChampionshipListItem {
  id: string;
  name: string;
  image_url: string | null;
  gender: ChampionshipGender;
  division: ChampionshipDivision;
  category: ChampionshipCategory;

  reign_id: string | null;
  won_tick: number | null;
  duration_weeks: number | null;
  defenses: number;
  holders: ChampionshipHolder[];
}

export interface ChampionshipsSummary {
  championship_count: number;
  occupied_count: number;
  vacant_count: number;
  briefcase_count: number;
}

export interface ChampionshipsFilters {
  gender: ChampionshipGender | "all";
  category: ChampionshipCategory | "all";
  status: ChampionshipStatusFilter;
  search: string;
}

export interface GetChampionshipsInput extends ChampionshipsFilters {
  careerId: string;
  page: number;
  pageSize: number;
}

export interface ChampionshipsPage {
  career_id: string;
  current_tick: number;

  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;

  summary: ChampionshipsSummary;
  items: ChampionshipListItem[];
}
