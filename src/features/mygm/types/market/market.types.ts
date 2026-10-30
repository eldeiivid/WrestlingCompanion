export type MarketGender = "male" | "female";

export type MarketRole = "face" | "heel";

export type MarketCategory = "active" | "legend" | "local";

export type MarketSort =
  | "name_asc"
  | "name_desc"
  | "mic_skill_desc"
  | "in_ring_skill_desc";

export interface MarketWrestler {
  market_key: string;
  catalog_wrestler_id: string | null;
  career_wrestler_id: string | null;

  name: string;
  gender: MarketGender;
  primary_class: string | null;
  secondary_class: string | null;
  role: MarketRole;
  mic_skill: number | null;
  in_ring_skill: number | null;
  image_url: string | null;
  mygm_category: MarketCategory | null;
}

export interface MarketFilters {
  gender: MarketGender | "all";
  primaryClass: string;
  role: MarketRole | "all";
  category: MarketCategory | "all";
  search: string;
  sort: MarketSort;
}

export interface GetMarketInput extends MarketFilters {
  careerId: string;
  page: number;
  pageSize: number;
}

export interface MarketPage {
  career_id: string;
  current_tick: number;
  available_count: number;

  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;

  available_classes: string[];
  items: MarketWrestler[];
}
