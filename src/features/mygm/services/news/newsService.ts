import { supabase } from "../../../../lib/supabase";
import type { MyGmNewsFeed, MyGmNewsItem } from "../../types/news/news.types";
import type {
  GetNewsHistoryInput,
  NewsHistoryPage,
} from "../../types/news/newsHistory.types";

const supportedEventTypes = new Set<string>([
  "championship_won",
  "championship_defended",
  "rivalry_started",
  "rivalry_ended",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isLevel(value: unknown): boolean {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isWrestler(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isTitle(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isRivalryMember(value: unknown): boolean {
  return (
    isRecord(value) &&
    isWrestler(value) &&
    (value.side === 1 || value.side === 2)
  );
}

function hasChampionshipFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.reign_id === "string" &&
    isTitle(value.title) &&
    Array.isArray(value.champions) &&
    value.champions.length > 0 &&
    value.champions.every(isWrestler)
  );
}

function hasRivalryFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.feud_id === "string" &&
    isNullableString(value.name) &&
    (value.kind === "singles" ||
      value.kind === "tag_team" ||
      value.kind === "stable") &&
    Array.isArray(value.members) &&
    value.members.length > 0 &&
    value.members.every(isRivalryMember)
  );
}

function isNewsItem(value: unknown): value is MyGmNewsItem {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isNullableString(value.event_id) ||
    !isNullableString(value.segment_id) ||
    !isPositiveInteger(value.tick) ||
    !isPositiveInteger(value.season) ||
    !isPositiveInteger(value.week) ||
    value.week > 50 ||
    value.schema_version !== 1 ||
    typeof value.priority !== "number" ||
    !Number.isInteger(value.priority) ||
    value.priority < 0 ||
    value.priority > 100 ||
    typeof value.created_at !== "string" ||
    !isRecord(value.data)
  ) {
    return false;
  }

  const data = value.data;

  switch (value.event_type) {
    case "championship_won":
      return hasChampionshipFields(data);

    case "championship_defended":
      return (
        hasChampionshipFields(data) && isPositiveInteger(data.defense_count)
      );

    case "rivalry_started":
      return hasRivalryFields(data) && data.level === 1;

    case "rivalry_ended":
      return (
        hasRivalryFields(data) &&
        (data.level === null || isLevel(data.level)) &&
        (data.winning_side === null ||
          data.winning_side === 1 ||
          data.winning_side === 2)
      );

    default:
      return false;
  }
}

export async function getNews(
  careerId: string,
  signal: AbortSignal,
  limit = 10,
): Promise<MyGmNewsFeed> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_news", {
      p_game_id: careerId,
      p_limit: limit,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (
    !isRecord(payload) ||
    payload.career_id !== careerId ||
    !Array.isArray(payload.items)
  ) {
    throw new Error("The news response is invalid.");
  }

  const items: MyGmNewsItem[] = [];

  for (const item of payload.items) {
    if (
      !isRecord(item) ||
      typeof item.event_type !== "string" ||
      !isPositiveInteger(item.schema_version)
    ) {
      throw new Error("A news item is invalid.");
    }

    // Future event types or versions need their own presentation support.
    if (
      item.schema_version !== 1 ||
      !supportedEventTypes.has(item.event_type)
    ) {
      continue;
    }

    if (!isNewsItem(item)) {
      throw new Error("A news item contains invalid data.");
    }

    items.push(item);
  }

  return {
    career_id: careerId,
    items,
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNewsHistoryPage(value: unknown): value is NewsHistoryPage {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.page_size) ||
    value.page_size > 20 ||
    !isNonNegativeInteger(value.total_count) ||
    !isNonNegativeInteger(value.total_pages) ||
    !isNonNegativeInteger(value.available_count) ||
    !Array.isArray(value.items) ||
    !value.items.every(isNewsItem)
  ) {
    return false;
  }

  const expectedPages = Math.ceil(value.total_count / value.page_size);

  const expectedItems = Math.min(
    value.page_size,
    Math.max(0, value.total_count - (value.page - 1) * value.page_size),
  );

  const newsIds = new Set(value.items.map((item) => item.id));

  return (
    value.total_count <= value.available_count &&
    value.total_pages === expectedPages &&
    value.page <= Math.max(1, expectedPages) &&
    value.items.length === expectedItems &&
    newsIds.size === value.items.length &&
    value.items.every(
      (item) =>
        item.season === Math.floor((item.tick - 1) / 50) + 1 &&
        item.week === ((item.tick - 1) % 50) + 1,
    )
  );
}

export async function getNewsHistory(
  input: GetNewsHistoryInput,
  signal: AbortSignal,
): Promise<NewsHistoryPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_news_history", {
      p_game_id: input.careerId,
      p_event_type: input.eventType,
      p_search: input.search,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isNewsHistoryPage(data) ||
    data.career_id !== input.careerId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The news history response is invalid.");
  }

  if (
    input.eventType !== "all" &&
    data.items.some((item) => item.event_type !== input.eventType)
  ) {
    throw new Error("The news history contains an unexpected event type.");
  }

  return data;
}
