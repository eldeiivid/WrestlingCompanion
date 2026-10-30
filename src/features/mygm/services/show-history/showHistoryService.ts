import { supabase } from "../../../../lib/supabase";
import type {
  ShowHistoryItem,
  ShowHistoryPage,
} from "../../types/show-history/showHistory.types";
import type {
  ShowDetailData,
  ShowDetailSegment,
} from "../../types/show-history/showDetail.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isAmountString(value: unknown): boolean {
  return typeof value === "string" && /^-?\d+$/.test(value);
}

function isUnsignedAmountString(value: unknown): boolean {
  return typeof value === "string" && /^\d+$/.test(value);
}

function isNullableAmountString(value: unknown): boolean {
  return value === null || isAmountString(value);
}

function isNullableUnsignedAmountString(value: unknown): boolean {
  return value === null || isUnsignedAmountString(value);
}

function isRating(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 5)
  );
}

function hasShowEventFields(value: Record<string, unknown>): boolean {
  const validKind =
    value.kind === "weekly" || value.kind === "ple" || value.kind === "special";

  const validShowType =
    value.show_type === "weekly" ||
    value.show_type === "go_home" ||
    value.show_type === "ple" ||
    value.show_type === "special";

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    validKind &&
    validShowType &&
    isPositiveInteger(value.tick) &&
    isPositiveInteger(value.season) &&
    isPositiveInteger(value.week) &&
    value.week <= 50 &&
    isRating(value.rating) &&
    isNullableString(value.completed_at)
  );
}

function isShowHistoryItem(value: unknown): value is ShowHistoryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasShowEventFields(value) &&
    isNonNegativeInteger(value.match_count) &&
    isNonNegativeInteger(value.promo_count)
  );
}

function isShowHistoryPage(value: unknown): value is ShowHistoryPage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.career_id === "string" &&
    isPositiveInteger(value.page) &&
    isPositiveInteger(value.page_size) &&
    value.page_size <= 20 &&
    isNonNegativeInteger(value.total_count) &&
    isPositiveInteger(value.total_pages) &&
    value.page <= value.total_pages &&
    Array.isArray(value.shows) &&
    value.shows.length <= value.page_size &&
    value.shows.every(isShowHistoryItem)
  );
}

function isRivalryMember(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    (value.side === 1 || value.side === 2)
  );
}

function isRivalry(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validAction =
    value.action === null ||
    value.action === "none" ||
    value.action === "create" ||
    value.action === "increase" ||
    value.action === "resolve";

  const validKind =
    value.kind === null ||
    value.kind === "singles" ||
    value.kind === "tag_team" ||
    value.kind === "stable";

  const validLevel =
    value.level_after === null ||
    value.level_after === 1 ||
    value.level_after === 2 ||
    value.level_after === 3 ||
    value.level_after === 4;

  return (
    validAction &&
    validKind &&
    validLevel &&
    isNullableString(value.id) &&
    isNullableString(value.name) &&
    (value.winning_side === null ||
      value.winning_side === 1 ||
      value.winning_side === 2) &&
    Array.isArray(value.members) &&
    value.members.every(isRivalryMember)
  );
}

function hasParticipantFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isMatchParticipant(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validResult =
    value.result === null ||
    value.result === "winner" ||
    value.result === "loser" ||
    value.result === "draw" ||
    value.result === "no_contest";

  return (
    hasParticipantFields(value) && isPositiveInteger(value.side) && validResult
  );
}

function isPromoParticipant(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasParticipantFields(value) &&
    (value.role === "initiator" ||
      value.role === "target" ||
      value.role === "support")
  );
}

function isTitle(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    (value.result === "retained" ||
      value.result === "changed" ||
      value.result === "awarded" ||
      value.result === "unrecorded")
  );
}

function isInterference(value: unknown): boolean {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.wrestler_id === "string" &&
      typeof value.wrestler_name === "string" &&
      typeof value.target_wrestler_id === "string" &&
      typeof value.target_wrestler_name === "string")
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

function isShowDetailSegment(value: unknown): value is ShowDetailSegment {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isPositiveInteger(value.position) ||
    typeof value.label !== "string" ||
    !isUnsignedAmountString(value.cost) ||
    !isRivalry(value.rivalry) ||
    !Array.isArray(value.participants)
  ) {
    return false;
  }

  if (value.kind === "match") {
    const validOutcome =
      value.outcome === null ||
      value.outcome === "decisive" ||
      value.outcome === "draw" ||
      value.outcome === "no_contest";

    return (
      isNullableString(value.format_id) &&
      isNullableString(value.stipulation_id) &&
      isNullableString(value.stipulation_name) &&
      isRating(value.rating) &&
      validOutcome &&
      value.participants.every(isMatchParticipant) &&
      Array.isArray(value.titles) &&
      value.titles.every(isTitle) &&
      isInterference(value.interference)
    );
  }

  if (value.kind === "promo") {
    return (
      isNullableString(value.promo_type_id) &&
      isPromoRating(value.promo_rating) &&
      isNullableAmountString(value.reported_money_change) &&
      isNullableAmountString(value.reported_fan_change) &&
      value.participants.every(isPromoParticipant)
    );
  }

  return false;
}

function isShowDetailData(value: unknown): value is ShowDetailData {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isRecord(value.event) ||
    !hasShowEventFields(value.event) ||
    !isRecord(value.summary) ||
    !Array.isArray(value.segments)
  ) {
    return false;
  }

  const summary = value.summary;

  return (
    isNonNegativeInteger(summary.match_count) &&
    isNonNegativeInteger(summary.promo_count) &&
    isUnsignedAmountString(summary.total_cost) &&
    typeof summary.finances_recorded === "boolean" &&
    typeof summary.fans_recorded === "boolean" &&
    isNullableAmountString(summary.money_change) &&
    isNullableAmountString(summary.fan_change) &&
    isNullableUnsignedAmountString(summary.final_money) &&
    isNullableUnsignedAmountString(summary.final_fans) &&
    value.segments.every(isShowDetailSegment)
  );
}

export async function getShowHistory(
  careerId: string,
  page: number,
  pageSize: number,
  signal: AbortSignal,
): Promise<ShowHistoryPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_show_history", {
      p_game_id: careerId,
      p_page: page,
      p_page_size: pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (
    !isShowHistoryPage(payload) ||
    payload.career_id !== careerId ||
    payload.page_size !== pageSize
  ) {
    throw new Error("The show history response is invalid.");
  }

  return payload;
}

export async function getShowDetail(
  careerId: string,
  eventId: string,
  signal: AbortSignal,
): Promise<ShowDetailData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_show_detail", {
      p_game_id: careerId,
      p_event_id: eventId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (
    !isShowDetailData(payload) ||
    payload.career_id !== careerId ||
    payload.event.id !== eventId
  ) {
    throw new Error("The show detail response is invalid.");
  }

  return payload;
}

export async function getLatestShow(
  careerId: string,
  signal: AbortSignal,
): Promise<ShowDetailData | null> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_latest_show", {
      p_game_id: careerId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (payload === null) {
    return null;
  }

  if (!isShowDetailData(payload) || payload.career_id !== careerId) {
    throw new Error("The latest show response is invalid.");
  }

  return payload;
}
