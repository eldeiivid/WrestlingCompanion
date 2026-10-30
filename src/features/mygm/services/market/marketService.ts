import { supabase } from "../../../../lib/supabase";

import type {
  GetMarketInput,
  MarketPage,
  MarketWrestler,
} from "../../types/market/market.types";

import { isWrestlerProfileData } from "../roster/careerRosterService";

import type { MarketProfileData } from "../../types/market/marketProfile.types";

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

function isMarketWrestler(value: unknown): value is MarketWrestler {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidIdentity =
    isNullableString(value.catalog_wrestler_id) &&
    isNullableString(value.career_wrestler_id) &&
    (typeof value.catalog_wrestler_id === "string" ||
      typeof value.career_wrestler_id === "string");

  const expectedKey =
    typeof value.career_wrestler_id === "string"
      ? `career:${value.career_wrestler_id}`
      : typeof value.catalog_wrestler_id === "string"
        ? `catalog:${value.catalog_wrestler_id}`
        : null;

  return (
    hasValidIdentity &&
    value.market_key === expectedKey &&
    typeof value.name === "string" &&
    (value.gender === "male" || value.gender === "female") &&
    isNullableString(value.primary_class) &&
    isNullableString(value.secondary_class) &&
    (value.role === "face" || value.role === "heel") &&
    (value.mic_skill === null ||
      (isPositiveInteger(value.mic_skill) && value.mic_skill <= 5)) &&
    (value.in_ring_skill === null ||
      (typeof value.in_ring_skill === "number" &&
        Number.isSafeInteger(value.in_ring_skill))) &&
    isNullableString(value.image_url) &&
    (value.mygm_category === null ||
      value.mygm_category === "active" ||
      value.mygm_category === "legend" ||
      value.mygm_category === "local")
  );
}

function isMarketPage(value: unknown): value is MarketPage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isNonNegativeInteger(value.available_count) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.page_size) ||
    value.page_size > 24 ||
    !isNonNegativeInteger(value.total_count) ||
    !isNonNegativeInteger(value.total_pages) ||
    !Array.isArray(value.available_classes) ||
    !value.available_classes.every(
      (item: unknown) => typeof item === "string" && item.trim() !== "",
    ) ||
    !Array.isArray(value.items) ||
    !value.items.every(isMarketWrestler)
  ) {
    return false;
  }

  const expectedPages = Math.ceil(value.total_count / value.page_size);

  const expectedItemCount = Math.min(
    value.page_size,
    Math.max(0, value.total_count - (value.page - 1) * value.page_size),
  );

  const uniqueKeys = new Set(
    value.items.map((wrestler) => wrestler.market_key),
  );

  return (
    value.total_count <= value.available_count &&
    value.total_pages === expectedPages &&
    value.page <= Math.max(1, expectedPages) &&
    value.items.length === expectedItemCount &&
    uniqueKeys.size === value.items.length
  );
}

export async function getMarket(
  input: GetMarketInput,
  signal: AbortSignal,
): Promise<MarketPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_market", {
      p_game_id: input.careerId,
      p_gender: input.gender,
      p_class: input.primaryClass,
      p_role: input.role,
      p_category: input.category,
      p_search: input.search,
      p_sort: input.sort,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isMarketPage(data) ||
    data.career_id !== input.careerId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The market response is invalid.");
  }

  return data;
}

function isMarketProfileData(value: unknown): value is MarketProfileData {
  if (!isRecord(value)) {
    return false;
  }

  if (
    (value.source !== "catalog" && value.source !== "career") ||
    typeof value.catalog_wrestler_id !== "string" ||
    !isWrestlerProfileData(value.profile)
  ) {
    return false;
  }

  if (value.source === "catalog") {
    return (
      value.profile.wrestler.id === value.catalog_wrestler_id &&
      !value.profile.wrestler.is_on_roster &&
      value.profile.wrestler.membership === null
    );
  }

  return true;
}

export async function getMarketProfile(
  careerId: string,
  catalogWrestlerId: string,
  signal: AbortSignal,
  historyLimit = 5,
): Promise<MarketProfileData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_market_profile", {
      p_game_id: careerId,
      p_catalog_wrestler_id: catalogWrestlerId,
      p_history_limit: historyLimit,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isMarketProfileData(data) ||
    data.catalog_wrestler_id !== catalogWrestlerId ||
    data.profile.career_id !== careerId ||
    data.profile.match_history.items.length > historyLimit
  ) {
    throw new Error("The market profile response is invalid.");
  }

  return data;
}
