import { supabase } from "../../../../lib/supabase";

import type {
  CareerRosterPage,
  GetCareerRosterInput,
} from "../../types/roster/careerRoster.types";

import type { WrestlerProfileData } from "../../types/roster/wrestlerProfile.types";

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

function isRating(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 5)
  );
}

function isMatchResult(value: unknown): boolean {
  return (
    value === null ||
    value === "winner" ||
    value === "loser" ||
    value === "draw" ||
    value === "no_contest"
  );
}

function isMembership(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validAcquisition =
    value.acquisition_type === "draft" ||
    value.acquisition_type === "market" ||
    value.acquisition_type === "custom" ||
    value.acquisition_type === "transfer";

  return (
    typeof value.id === "string" &&
    isPositiveInteger(value.joined_tick) &&
    (value.contract_end_tick === null ||
      (isPositiveInteger(value.contract_end_tick) &&
        value.contract_end_tick >= value.joined_tick)) &&
    validAcquisition
  );
}

function hasWrestlerFields(value: Record<string, unknown>): boolean {
  const validMicSkill =
    value.mic_skill === null ||
    (isPositiveInteger(value.mic_skill) && value.mic_skill <= 5);

  const validRingLevel =
    value.in_ring_skill === null || isNonNegativeInteger(value.in_ring_skill);

  const validCategory =
    value.mygm_category === null ||
    value.mygm_category === "active" ||
    value.mygm_category === "legend" ||
    value.mygm_category === "local";

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.gender === "male" || value.gender === "female") &&
    isNullableString(value.primary_class) &&
    isNullableString(value.secondary_class) &&
    (value.role === "face" || value.role === "heel") &&
    validMicSkill &&
    validRingLevel &&
    isNullableString(value.image_url) &&
    validCategory
  );
}

function isWrestler(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasWrestlerFields(value) &&
    isMembership(value.membership)
  );
}

function isCareerRosterPage(value: unknown): value is CareerRosterPage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.career_id === "string" &&
    isPositiveInteger(value.current_tick) &&
    isNonNegativeInteger(value.roster_count) &&
    isPositiveInteger(value.page) &&
    isPositiveInteger(value.page_size) &&
    value.page_size <= 24 &&
    isNonNegativeInteger(value.total_count) &&
    value.total_count <= value.roster_count &&
    isPositiveInteger(value.total_pages) &&
    value.page <= value.total_pages &&
    Array.isArray(value.available_classes) &&
    value.available_classes.every(
      (item) => typeof item === "string" && item.trim() !== "",
    ) &&
    Array.isArray(value.items) &&
    value.items.length <= value.page_size &&
    value.items.length <= value.total_count &&
    value.items.every(isWrestler)
  );
}

function isProfileWrestler(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !hasWrestlerFields(value) ||
    typeof value.is_on_roster !== "boolean"
  ) {
    return false;
  }

  if (value.membership === null) {
    return value.is_on_roster === false;
  }

  return (
    value.is_on_roster === true &&
    isRecord(value.membership) &&
    isMembership(value.membership) &&
    typeof value.membership.brand_id === "string"
  );
}

function isProfileStats(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonNegativeInteger(value.matches) &&
    isNonNegativeInteger(value.wins) &&
    isNonNegativeInteger(value.losses) &&
    isNonNegativeInteger(value.draws) &&
    isNonNegativeInteger(value.no_contests) &&
    isRating(value.average_rating) &&
    isNonNegativeInteger(value.high_rated_matches) &&
    value.high_rated_matches <= value.matches &&
    isNonNegativeInteger(value.promos_performed) &&
    value.wins + value.losses + value.draws + value.no_contests <= value.matches
  );
}

function isMatchParticipant(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    isPositiveInteger(value.side) &&
    isMatchResult(value.result)
  );
}

function isProfileMatch(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validEventKind =
    value.event_kind === "weekly" ||
    value.event_kind === "ple" ||
    value.event_kind === "special";

  const validOutcome =
    value.outcome === null ||
    value.outcome === "decisive" ||
    value.outcome === "draw" ||
    value.outcome === "no_contest";

  return (
    typeof value.segment_id === "string" &&
    isPositiveInteger(value.position) &&
    typeof value.event_id === "string" &&
    typeof value.event_name === "string" &&
    validEventKind &&
    isPositiveInteger(value.tick) &&
    isPositiveInteger(value.season) &&
    isPositiveInteger(value.week) &&
    value.week <= 50 &&
    typeof value.format_name === "string" &&
    isNullableString(value.stipulation_name) &&
    isRating(value.rating) &&
    validOutcome &&
    isPositiveInteger(value.wrestler_side) &&
    isMatchResult(value.wrestler_result) &&
    typeof value.is_title_match === "boolean" &&
    Array.isArray(value.participants) &&
    value.participants.every(isMatchParticipant)
  );
}

function isChampionshipHolder(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isProfileChampionship(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validCategory =
    value.category === "world" ||
    value.category === "midcard" ||
    value.category === "tag_team" ||
    value.category === "mitb" ||
    value.category === "other";

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    validCategory &&
    typeof value.reign_id === "string" &&
    isPositiveInteger(value.won_tick) &&
    isNonNegativeInteger(value.duration_weeks) &&
    isNonNegativeInteger(value.defenses) &&
    Array.isArray(value.holders) &&
    value.holders.every(isChampionshipHolder)
  );
}

function isProfileRivalryMember(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    (value.side === 1 || value.side === 2)
  );
}

function isProfileRivalry(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const validKind =
    value.kind === "singles" ||
    value.kind === "tag_team" ||
    value.kind === "stable";

  const validLevel =
    value.level === 1 ||
    value.level === 2 ||
    value.level === 3 ||
    value.level === 4;

  return (
    typeof value.id === "string" &&
    isNullableString(value.name) &&
    validKind &&
    validLevel &&
    isPositiveInteger(value.started_tick) &&
    isPositiveInteger(value.started_season) &&
    isPositiveInteger(value.started_week) &&
    value.started_week <= 50 &&
    isNonNegativeInteger(value.weeks_active) &&
    isPositiveInteger(value.last_activity_tick) &&
    Array.isArray(value.members) &&
    value.members.every(isProfileRivalryMember)
  );
}

export function isWrestlerProfileData(
  value: unknown,
): value is WrestlerProfileData {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isProfileWrestler(value.wrestler) ||
    !isRecord(value.stats) ||
    !isProfileStats(value.stats) ||
    !Array.isArray(value.championships) ||
    !value.championships.every(isProfileChampionship) ||
    !Array.isArray(value.rivalries) ||
    !value.rivalries.every(isProfileRivalry) ||
    !isRecord(value.match_history)
  ) {
    return false;
  }

  const history = value.match_history;

  return (
    isNonNegativeInteger(history.total_count) &&
    history.total_count === value.stats.matches &&
    typeof history.has_more === "boolean" &&
    Array.isArray(history.items) &&
    history.items.length <= history.total_count &&
    history.has_more === history.total_count > history.items.length &&
    history.items.every(isProfileMatch)
  );
}

export async function getCareerRoster(
  input: GetCareerRosterInput,
  signal: AbortSignal,
): Promise<CareerRosterPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_roster", {
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

  const payload: unknown = data;

  if (
    !isCareerRosterPage(payload) ||
    payload.career_id !== input.careerId ||
    payload.page_size !== input.pageSize
  ) {
    throw new Error("The career roster response is invalid.");
  }

  return payload;
}

export async function getWrestlerProfile(
  careerId: string,
  wrestlerId: string,
  signal: AbortSignal,
  historyLimit = 5,
): Promise<WrestlerProfileData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_wrestler_profile", {
      p_game_id: careerId,
      p_wrestler_id: wrestlerId,
      p_history_limit: historyLimit,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (
    !isWrestlerProfileData(payload) ||
    payload.career_id !== careerId ||
    payload.wrestler.id !== wrestlerId ||
    payload.match_history.items.length > historyLimit
  ) {
    throw new Error("The wrestler profile response is invalid.");
  }

  return payload;
}
