import type { MyGmNewsItem } from "./news.types";

export type NewsEventType = MyGmNewsItem["event_type"];

export interface NewsHistoryFilters {
  eventType: NewsEventType | "all";
  search: string;
}

export interface GetNewsHistoryInput extends NewsHistoryFilters {
  careerId: string;
  page: number;
  pageSize: number;
}

export interface NewsHistoryPage {
  career_id: string;
  current_tick: number;

  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  available_count: number;

  items: MyGmNewsItem[];
}
