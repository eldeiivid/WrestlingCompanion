import { supabase } from "../../../../lib/supabase";

import type {
  GetRatingRecordsInput,
  GetReignRecordsInput,
  GetWrestlerRecordsInput,
  RatingRecordItem,
  RatingRecordsPage,
  RecordBookEvent,
  RecordBookMatch,
  RecordBookMatchParticipant,
  RecordBookTitle,
  RecordBookWrestler,
  ReignRecordItem,
  ReignRecordsPage,
  WrestlerRecordItem,
  WrestlerRecordsPage,
} from "../../types/record-book/recordBookPage.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 5
  );
}

function isWrestler(value: unknown): value is RecordBookWrestler {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isTitle(value: unknown): value is RecordBookTitle {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    (value.category === "world" ||
      value.category === "midcard" ||
      value.category === "tag_team" ||
      value.category === "other")
  );
}

interface PageEnvelope extends Record<string, unknown> {
  career_id: string;
  current_tick: number;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: unknown[];
}

function isPageEnvelope(value: unknown): value is PageEnvelope {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.page_size) ||
    value.page_size > 20 ||
    !isNonNegativeInteger(value.total_count) ||
    !isNonNegativeInteger(value.total_pages) ||
    !Array.isArray(value.items)
  ) {
    return false;
  }

  const expectedPages = Math.ceil(value.total_count / value.page_size);

  const expectedItems = Math.min(
    value.page_size,
    Math.max(0, value.total_count - (value.page - 1) * value.page_size),
  );

  return (
    value.total_pages === expectedPages &&
    value.page <= Math.max(1, expectedPages) &&
    value.items.length === expectedItems
  );
}

function isReignRecord(value: unknown): value is ReignRecordItem {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.rank) ||
    !isPositiveInteger(value.record_value) ||
    typeof value.reign_id !== "string" ||
    !isPositiveInteger(value.won_tick) ||
    !(
      value.lost_tick === null ||
      (isPositiveInteger(value.lost_tick) && value.lost_tick >= value.won_tick)
    ) ||
    typeof value.is_current !== "boolean" ||
    !isNonNegativeInteger(value.duration_weeks) ||
    !isNonNegativeInteger(value.defenses) ||
    !isTitle(value.title) ||
    !Array.isArray(value.holders) ||
    !value.holders.every(isWrestler)
  ) {
    return false;
  }

  return (
    value.is_current === (value.lost_tick === null) &&
    new Set(value.holders.map((holder) => holder.id)).size ===
      value.holders.length
  );
}

function isReignRecordsPage(value: unknown): value is ReignRecordsPage {
  if (
    !isPageEnvelope(value) ||
    !(value.record === "longest_reigns" || value.record === "most_defenses") ||
    !value.items.every(isReignRecord)
  ) {
    return false;
  }

  const currentTick = value.current_tick;
  const totalCount = value.total_count;
  const record = value.record;

  return (
    new Set(value.items.map((item) => item.reign_id)).size ===
      value.items.length &&
    value.items.every((item) => {
      const duration = Math.max(
        0,
        (item.lost_tick ?? currentTick) - item.won_tick,
      );

      const expectedValue =
        record === "longest_reigns" ? item.duration_weeks : item.defenses;

      return (
        item.rank <= totalCount &&
        item.duration_weeks === duration &&
        item.record_value === expectedValue
      );
    })
  );
}

function isWrestlerRecord(value: unknown): value is WrestlerRecordItem {
  return (
    isRecord(value) &&
    isPositiveInteger(value.rank) &&
    isPositiveInteger(value.record_value) &&
    isWrestler(value.wrestler)
  );
}

function isWrestlerRecordsPage(value: unknown): value is WrestlerRecordsPage {
  if (
    !isPageEnvelope(value) ||
    !(
      value.record === "most_reigns" ||
      value.record === "most_wins" ||
      value.record === "most_matches" ||
      value.record === "high_rated_matches" ||
      value.record === "wrestlemania_main_events"
    ) ||
    !value.items.every(isWrestlerRecord)
  ) {
    return false;
  }

  const totalCount = value.total_count;

  return (
    new Set(value.items.map((item) => item.wrestler.id)).size ===
      value.items.length && value.items.every((item) => item.rank <= totalCount)
  );
}

function isEvent(value: unknown): value is RecordBookEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.kind === "weekly" ||
      value.kind === "ple" ||
      value.kind === "special") &&
    isPositiveInteger(value.tick) &&
    isPositiveInteger(value.season) &&
    isPositiveInteger(value.week) &&
    value.season === Math.floor((value.tick - 1) / 50) + 1 &&
    value.week === ((value.tick - 1) % 50) + 1 &&
    (value.rating === null || isRating(value.rating))
  );
}

function isParticipant(value: unknown): value is RecordBookMatchParticipant {
  return (
    isRecord(value) &&
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    isPositiveInteger(value.side) &&
    (value.result === null ||
      value.result === "winner" ||
      value.result === "loser" ||
      value.result === "draw" ||
      value.result === "no_contest")
  );
}

function isMatch(value: unknown): value is RecordBookMatch {
  if (
    !isRecord(value) ||
    typeof value.segment_id !== "string" ||
    !isPositiveInteger(value.position) ||
    typeof value.format_name !== "string" ||
    !isNullableString(value.stipulation_name) ||
    !isRating(value.rating) ||
    !Array.isArray(value.participants) ||
    !value.participants.every(isParticipant)
  ) {
    return false;
  }

  return (
    new Set(value.participants.map((participant) => participant.wrestler_id))
      .size === value.participants.length
  );
}

function isRatingRecord(value: unknown): value is RatingRecordItem {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isPositiveInteger(value.rank) ||
    !isRating(value.record_value) ||
    !isEvent(value.event)
  ) {
    return false;
  }

  if (value.kind === "show") {
    return (
      value.match === null &&
      value.id === value.event.id &&
      value.record_value === value.event.rating
    );
  }

  if (value.kind === "match") {
    return (
      isMatch(value.match) &&
      value.id === value.match.segment_id &&
      value.record_value === value.match.rating
    );
  }

  return false;
}

function isRatingRecordsPage(value: unknown): value is RatingRecordsPage {
  if (
    !isPageEnvelope(value) ||
    !(value.record === "best_shows" || value.record === "best_matches") ||
    !value.items.every(isRatingRecord)
  ) {
    return false;
  }

  const expectedKind = value.record === "best_shows" ? "show" : "match";

  const totalCount = value.total_count;

  return (
    new Set(value.items.map((item) => item.id)).size === value.items.length &&
    value.items.every(
      (item) => item.kind === expectedKind && item.rank <= totalCount,
    )
  );
}

export async function getReignRecords(
  input: GetReignRecordsInput,
  signal: AbortSignal,
): Promise<ReignRecordsPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_reign_records", {
      p_game_id: input.careerId,
      p_record: input.record,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isReignRecordsPage(data) ||
    data.career_id !== input.careerId ||
    data.record !== input.record ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The reign records response is invalid.");
  }

  return data;
}

export async function getWrestlerRecords(
  input: GetWrestlerRecordsInput,
  signal: AbortSignal,
): Promise<WrestlerRecordsPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_wrestler_records", {
      p_game_id: input.careerId,
      p_record: input.record,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isWrestlerRecordsPage(data) ||
    data.career_id !== input.careerId ||
    data.record !== input.record ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The wrestler records response is invalid.");
  }

  return data;
}

export async function getRatingRecords(
  input: GetRatingRecordsInput,
  signal: AbortSignal,
): Promise<RatingRecordsPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_rating_records", {
      p_game_id: input.careerId,
      p_record: input.record,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isRatingRecordsPage(data) ||
    data.career_id !== input.careerId ||
    data.record !== input.record ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The rating records response is invalid.");
  }

  return data;
}
