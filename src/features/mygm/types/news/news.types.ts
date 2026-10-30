export interface NewsWrestler {
  id: string;
  name: string;
  image_url: string | null;
}

export interface NewsTitle {
  id: string;
  name: string;
  image_url: string | null;
}

export interface NewsRivalryMember extends NewsWrestler {
  side: 1 | 2;
}

export interface ChampionshipWonNewsData {
  reign_id: string;
  title: NewsTitle;
  champions: NewsWrestler[];
}

export interface ChampionshipDefendedNewsData extends ChampionshipWonNewsData {
  defense_count: number;
}

export interface RivalryStartedNewsData {
  feud_id: string;
  name: string | null;
  kind: "singles" | "tag_team" | "stable";
  level: 1;
  members: NewsRivalryMember[];
}

export interface RivalryEndedNewsData {
  feud_id: string;
  name: string | null;
  kind: "singles" | "tag_team" | "stable";
  level: 1 | 2 | 3 | 4 | null;
  winning_side: 1 | 2 | null;
  members: NewsRivalryMember[];
}

interface NewsItemBase<TType extends string, TData> {
  id: string;
  event_id: string | null;
  segment_id: string | null;
  tick: number;
  season: number;
  week: number;
  event_type: TType;
  schema_version: 1;
  priority: number;
  data: TData;
  created_at: string;
}

export type ChampionshipWonNews = NewsItemBase<
  "championship_won",
  ChampionshipWonNewsData
>;

export type ChampionshipDefendedNews = NewsItemBase<
  "championship_defended",
  ChampionshipDefendedNewsData
>;

export type RivalryStartedNews = NewsItemBase<
  "rivalry_started",
  RivalryStartedNewsData
>;

export type RivalryEndedNews = NewsItemBase<
  "rivalry_ended",
  RivalryEndedNewsData
>;

export type MyGmNewsItem =
  | ChampionshipWonNews
  | ChampionshipDefendedNews
  | RivalryStartedNews
  | RivalryEndedNews;

export interface MyGmNewsFeed {
  career_id: string;
  items: MyGmNewsItem[];
}
