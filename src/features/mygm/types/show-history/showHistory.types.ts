export type ShowHistoryKind = "weekly" | "ple" | "special";

export type ShowHistoryType = "weekly" | "go_home" | "ple" | "special";

export interface ShowHistoryItem {
  id: string;
  name: string;
  kind: ShowHistoryKind;
  tick: number;
  season: number;
  week: number;
  show_type: ShowHistoryType;
  rating: number | null;
  completed_at: string | null;
  match_count: number;
  promo_count: number;
}

export interface ShowHistoryPage {
  career_id: string;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  shows: ShowHistoryItem[];
}
