import { supabase } from "../../../../lib/supabase";

import type {
  ChampionshipHolder,
  ChampionshipListItem,
  ChampionshipsPage,
  ChampionshipsSummary,
  GetChampionshipsInput,
} from "../../types/championships/championships.types";

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

function isChampionshipHolder(value: unknown): value is ChampionshipHolder {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isChampionshipListItem(value: unknown): value is ChampionshipListItem {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !isNullableString(value.image_url) ||
    !(
      value.gender === "male" ||
      value.gender === "female" ||
      value.gender === "mixed" ||
      value.gender === "open"
    ) ||
    !(value.division === "singles" || value.division === "tag_team") ||
    !(
      value.category === "world" ||
      value.category === "midcard" ||
      value.category === "tag_team" ||
      value.category === "mitb" ||
      value.category === "other"
    ) ||
    !isNullableString(value.reign_id) ||
    !isNonNegativeInteger(value.defenses) ||
    !Array.isArray(value.holders) ||
    !value.holders.every(isChampionshipHolder)
  ) {
    return false;
  }

  const holderIds = new Set(value.holders.map((holder) => holder.id));

  if (holderIds.size !== value.holders.length) {
    return false;
  }

  if (value.reign_id === null) {
    return (
      value.won_tick === null &&
      value.duration_weeks === null &&
      value.defenses === 0 &&
      value.holders.length === 0
    );
  }

  return (
    isPositiveInteger(value.won_tick) &&
    isNonNegativeInteger(value.duration_weeks)
  );
}

function isChampionshipsSummary(value: unknown): value is ChampionshipsSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonNegativeInteger(value.championship_count) &&
    isNonNegativeInteger(value.occupied_count) &&
    isNonNegativeInteger(value.vacant_count) &&
    isNonNegativeInteger(value.briefcase_count) &&
    value.occupied_count + value.vacant_count === value.championship_count
  );
}

function isChampionshipsPage(value: unknown): value is ChampionshipsPage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.page_size) ||
    value.page_size > 24 ||
    !isNonNegativeInteger(value.total_count) ||
    !isNonNegativeInteger(value.total_pages) ||
    !isChampionshipsSummary(value.summary) ||
    !Array.isArray(value.items) ||
    !value.items.every(isChampionshipListItem)
  ) {
    return false;
  }

  const currentTick = value.current_tick;
  const expectedPages = Math.ceil(value.total_count / value.page_size);

  const expectedItemCount = Math.min(
    value.page_size,
    Math.max(0, value.total_count - (value.page - 1) * value.page_size),
  );

  const titleIds = new Set(value.items.map((title) => title.id));

  const availableTitles =
    value.summary.championship_count + value.summary.briefcase_count;

  return (
    value.total_count <= availableTitles &&
    value.total_pages === expectedPages &&
    value.page <= Math.max(1, expectedPages) &&
    value.items.length === expectedItemCount &&
    titleIds.size === value.items.length &&
    value.items.every((title) => {
      if (title.won_tick === null) {
        return true;
      }

      return title.duration_weeks === Math.max(0, currentTick - title.won_tick);
    })
  );
}

export async function getChampionships(
  input: GetChampionshipsInput,
  signal: AbortSignal,
): Promise<ChampionshipsPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_championships", {
      p_game_id: input.careerId,
      p_gender: input.gender,
      p_category: input.category,
      p_status: input.status,
      p_search: input.search,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isChampionshipsPage(data) ||
    data.career_id !== input.careerId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The championships response is invalid.");
  }

  return data;
}
