import type {
  ChampionshipCategory,
  ChampionshipHolder,
} from "../championships/championships.types";

export type RecordBookSection =
  | "championships"
  | "matches"
  | "shows"
  | "wrestlemania";

export type ReignRecordKind = "longest_reigns" | "most_defenses";

export type WrestlerRecordKind =
  | "most_reigns"
  | "most_wins"
  | "most_matches"
  | "high_rated_matches"
  | "wrestlemania_main_events";

export type RatingRecordKind = "best_shows" | "best_matches";

export type RecordBookRecord =
  | ReignRecordKind
  | WrestlerRecordKind
  | RatingRecordKind;

export interface GetRecordBookInput<
  TRecord extends RecordBookRecord = RecordBookRecord,
> {
  careerId: string;
  record: TRecord;
  page: number;
  pageSize: number;
}

export type GetReignRecordsInput = GetRecordBookInput<ReignRecordKind>;

export type GetWrestlerRecordsInput = GetRecordBookInput<WrestlerRecordKind>;

export type GetRatingRecordsInput = GetRecordBookInput<RatingRecordKind>;

export interface RecordBookPage<TRecord extends RecordBookRecord, TItem> {
  career_id: string;
  current_tick: number;
  record: TRecord;

  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;

  items: TItem[];
}

export interface RecordBookRank {
  rank: number;
  record_value: number;
}

export interface RecordBookTitle {
  id: string;
  name: string;
  image_url: string | null;
  category: Exclude<ChampionshipCategory, "mitb">;
}

export interface ReignRecordItem extends RecordBookRank {
  reign_id: string;
  won_tick: number;
  lost_tick: number | null;
  is_current: boolean;
  duration_weeks: number;
  defenses: number;
  title: RecordBookTitle;
  holders: ChampionshipHolder[];
}

export type ReignRecordsPage = RecordBookPage<ReignRecordKind, ReignRecordItem>;

export interface RecordBookWrestler {
  id: string;
  name: string;
  image_url: string | null;
}

export interface WrestlerRecordItem extends RecordBookRank {
  wrestler: RecordBookWrestler;
}

export type WrestlerRecordsPage = RecordBookPage<
  WrestlerRecordKind,
  WrestlerRecordItem
>;

export interface RecordBookEvent {
  id: string;
  name: string;
  kind: "weekly" | "ple" | "special";
  tick: number;
  season: number;
  week: number;
  rating: number | null;
}

export type RecordBookParticipantResult =
  | "winner"
  | "loser"
  | "draw"
  | "no_contest";

export interface RecordBookMatchParticipant {
  wrestler_id: string;
  name: string;
  image_url: string | null;
  side: number;
  result: RecordBookParticipantResult | null;
}

export interface RecordBookMatch {
  segment_id: string;
  position: number;
  format_name: string;
  stipulation_name: string | null;
  rating: number;
  participants: RecordBookMatchParticipant[];
}

export interface ShowRatingRecordItem extends RecordBookRank {
  id: string;
  kind: "show";
  event: RecordBookEvent;
  match: null;
}

export interface MatchRatingRecordItem extends RecordBookRank {
  id: string;
  kind: "match";
  event: RecordBookEvent;
  match: RecordBookMatch;
}

export type RatingRecordItem = ShowRatingRecordItem | MatchRatingRecordItem;

export type RatingRecordsPage =
  | RecordBookPage<"best_shows", ShowRatingRecordItem>
  | RecordBookPage<"best_matches", MatchRatingRecordItem>;
