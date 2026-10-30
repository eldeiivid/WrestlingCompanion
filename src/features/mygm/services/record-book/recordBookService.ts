import { supabase } from "../../../../lib/supabase";
import type { RecordBookSummaryData } from "../../types/record-book/recordBook.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isEntity(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.image_url === null || typeof value.image_url === "string")
  );
}

function isReign(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.rank) &&
    typeof value.reign_id === "string" &&
    isEntity(value.title) &&
    Array.isArray(value.holders) &&
    value.holders.every(isEntity) &&
    isPositiveInteger(value.won_tick) &&
    (value.lost_tick === null ||
      (isPositiveInteger(value.lost_tick) &&
        value.lost_tick >= value.won_tick)) &&
    isNonNegativeInteger(value.duration_weeks) &&
    isNonNegativeInteger(value.defenses) &&
    typeof value.is_active === "boolean" &&
    value.is_active === (value.lost_tick === null)
  );
}

function isHighRatedWrestler(value: unknown): boolean {
  return (
    isRecord(value) &&
    isPositiveInteger(value.rank) &&
    isEntity(value.wrestler) &&
    isPositiveInteger(value.match_count)
  );
}

function isMainEventer(value: unknown): boolean {
  return (
    isRecord(value) &&
    isPositiveInteger(value.rank) &&
    isEntity(value.wrestler) &&
    isPositiveInteger(value.appearance_count)
  );
}

function isTopThreeArray(
  value: unknown,
  validateItem: (item: unknown) => boolean,
): boolean {
  return Array.isArray(value) && value.length <= 3 && value.every(validateItem);
}

function isRecordBookSummary(value: unknown): value is RecordBookSummaryData {
  return (
    isRecord(value) &&
    typeof value.career_id === "string" &&
    isPositiveInteger(value.current_tick) &&
    isTopThreeArray(value.longest_reigns, isReign) &&
    isTopThreeArray(value.most_defenses, isReign) &&
    isTopThreeArray(value.high_rated_wrestlers, isHighRatedWrestler) &&
    isTopThreeArray(value.wrestlemania_main_eventers, isMainEventer)
  );
}

export async function getRecordBookSummary(
  careerId: string,
  signal: AbortSignal,
): Promise<RecordBookSummaryData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_record_book_summary", {
      p_game_id: careerId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (!isRecordBookSummary(payload) || payload.career_id !== careerId) {
    throw new Error("The record book response is invalid.");
  }

  return payload;
}
