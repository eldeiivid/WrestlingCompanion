import { supabase } from "../../../../lib/supabase";
import type {
  FeaturedRivalriesData,
  GetRivalriesInput,
  RivalriesPage,
  RivalryDetailData,
  RivalryListItem,
} from "../../types/rivalries/rivalries.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isNullablePositiveInteger(value: unknown): boolean {
  return value === null || isPositiveInteger(value);
}

function isOneOf(value: unknown, options: readonly string[]): boolean {
  return typeof value === "string" && options.includes(value);
}

function isLevel(value: unknown): boolean {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isSide(value: unknown): boolean {
  return value === 1 || value === 2;
}

function isWrestler(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isMember(value: unknown): boolean {
  return isRecord(value) && isWrestler(value) && isSide(value.side);
}

function hasRivalryFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    isNullableString(value.name) &&
    isOneOf(value.kind, ["singles", "tag_team", "stable"]) &&
    isLevel(value.level) &&
    isPositiveInteger(value.started_tick) &&
    isPositiveInteger(value.started_season) &&
    isPositiveInteger(value.started_week) &&
    value.started_week <= 50 &&
    isNonNegativeInteger(value.weeks_active) &&
    Array.isArray(value.members) &&
    value.members.every(isMember)
  );
}

function isFeaturedRivalry(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasRivalryFields(value) &&
    isPositiveInteger(value.last_activity_tick)
  );
}

function isFeaturedRivalriesData(
  value: unknown,
): value is FeaturedRivalriesData {
  return (
    isRecord(value) &&
    typeof value.career_id === "string" &&
    isPositiveInteger(value.current_tick) &&
    isNonNegativeInteger(value.total_active) &&
    Array.isArray(value.items) &&
    value.items.length <= 3 &&
    value.items.length <= value.total_active &&
    value.items.every(isFeaturedRivalry)
  );
}

function isRivalryDetail(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasRivalryFields(value) &&
    isOneOf(value.status, ["active", "resolved", "stale"]) &&
    isNullablePositiveInteger(value.ended_tick) &&
    (value.winning_side === null || isSide(value.winning_side))
  );
}

function isPromoRating(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.id === "string" &&
      typeof value.name === "string")
  );
}

function isMatchRating(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 5)
  );
}

function isHistoryItem(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validKind = isOneOf(value.kind, [
    "match",
    "promo",
    "interference",
    "level_change",
    "resolution",
    "note",
  ]);

  const validSegmentKind =
    value.segment_kind === null ||
    isOneOf(value.segment_kind, ["match", "promo"]);

  const validEventStatus =
    value.event_status === null ||
    isOneOf(value.event_status, ["draft", "confirmed", "completed"]);

  const validAction =
    value.rivalry_action === null ||
    isOneOf(value.rivalry_action, ["none", "create", "increase", "resolve"]);

  return (
    typeof value.id === "string" &&
    isPositiveInteger(value.tick) &&
    isPositiveInteger(value.season) &&
    isPositiveInteger(value.week) &&
    value.week <= 50 &&
    validKind &&
    (value.new_level === null || isLevel(value.new_level)) &&
    isNullableString(value.notes) &&
    isNullableString(value.segment_id) &&
    isNullablePositiveInteger(value.segment_position) &&
    validSegmentKind &&
    isNullableString(value.segment_label) &&
    isNullableString(value.stipulation_name) &&
    isNullableString(value.event_id) &&
    isNullableString(value.event_name) &&
    validEventStatus &&
    validAction &&
    isMatchRating(value.match_rating) &&
    isPromoRating(value.promo_rating) &&
    Array.isArray(value.match_winners) &&
    value.match_winners.every(isWrestler)
  );
}

function isRivalryDetailData(value: unknown): value is RivalryDetailData {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isRivalryDetail(value.rivalry) ||
    !isRecord(value.history)
  ) {
    return false;
  }

  return (
    isNonNegativeInteger(value.history.total_count) &&
    typeof value.history.has_more === "boolean" &&
    Array.isArray(value.history.items) &&
    value.history.items.length <= value.history.total_count &&
    value.history.items.every(isHistoryItem)
  );
}

export async function getFeaturedRivalries(
  careerId: string,
  signal: AbortSignal,
): Promise<FeaturedRivalriesData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_featured_rivalries", {
      p_game_id: careerId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (!isFeaturedRivalriesData(payload) || payload.career_id !== careerId) {
    throw new Error("The featured rivalries response is invalid.");
  }

  return payload;
}

export async function getRivalryDetail(
  careerId: string,
  feudId: string,
  signal: AbortSignal,
  historyLimit = 5,
): Promise<RivalryDetailData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_rivalry_detail", {
      p_game_id: careerId,
      p_feud_id: feudId,
      p_history_limit: historyLimit,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (
    !isRivalryDetailData(payload) ||
    payload.career_id !== careerId ||
    payload.rivalry.id !== feudId
  ) {
    throw new Error("The rivalry detail response is invalid.");
  }

  return payload;
}

function isRivalryListItem(value: unknown): value is RivalryListItem {
  return isFeaturedRivalry(value) && isRivalryDetail(value);
}

function isRivalriesPage(value: unknown): value is RivalriesPage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.career_id === "string" &&
    isPositiveInteger(value.current_tick) &&
    isPositiveInteger(value.page) &&
    isPositiveInteger(value.page_size) &&
    value.page_size <= 20 &&
    isNonNegativeInteger(value.total_count) &&
    isPositiveInteger(value.total_pages) &&
    value.page <= value.total_pages &&
    Array.isArray(value.items) &&
    value.items.length <= value.page_size &&
    value.items.length <= value.total_count &&
    value.items.every(isRivalryListItem)
  );
}

export async function getRivalries(
  input: GetRivalriesInput,
  signal: AbortSignal,
): Promise<RivalriesPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_rivalries", {
      p_game_id: input.careerId,
      p_status: input.status,
      p_kind: input.kind,
      p_search: input.search,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (
    !isRivalriesPage(payload) ||
    payload.career_id !== input.careerId ||
    payload.page_size !== input.pageSize
  ) {
    throw new Error("The rivalries response is invalid.");
  }

  return payload;
}
