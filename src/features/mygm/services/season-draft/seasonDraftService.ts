import { supabase } from "../../../../lib/supabase";

import type {
  SaveSeasonDraftInput,
  SaveSeasonDraftResult,
  SaveSeasonRetentionInput,
  SaveSeasonRetentionResult,
  SeasonCandidateChampionship,
  SeasonRetentionCandidate,
  SeasonTransition,
  SeasonTransitionData,
  SaveSeasonBalancesInput,
  SaveSeasonBalancesResult,
} from "../../types/season-draft/seasonDraft.types";

import type {
  GetSeasonDraftOptionsInput,
  SeasonDraftOption,
  SeasonDraftOptionsPage,
} from "../../types/season-draft/seasonDraftOptions.types";

import type { ChampionshipHolder } from "../../types/championships/championships.types";

import type { SeasonDraftConfirmationResult } from "../../types/season-draft/seasonDraftConfirmation.types";

import type {
  SeasonDraftReviewChampionship,
  SeasonDraftReviewData,
  SeasonDraftReviewRivalry,
  SeasonDraftReviewRivalryMember,
  SeasonDraftReviewWrestler,
} from "../../types/season-draft/seasonDraftReview.types";

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

function isSeasonTransition(value: unknown): value is SeasonTransition {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isPositiveInteger(value.from_season) &&
    isPositiveInteger(value.to_season) &&
    isPositiveInteger(value.from_tick) &&
    value.to_season === value.from_season + 1 &&
    value.from_tick === value.from_season * 50 &&
    value.status === "pending"
  );
}

function isCandidateChampionship(
  value: unknown,
): value is SeasonCandidateChampionship {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    (value.category === "world" ||
      value.category === "midcard" ||
      value.category === "tag_team" ||
      value.category === "mitb" ||
      value.category === "other")
  );
}

function isRetentionCandidate(
  value: unknown,
): value is SeasonRetentionCandidate {
  if (
    !isRecord(value) ||
    typeof value.membership_id !== "string" ||
    typeof value.wrestler_id !== "string" ||
    !isNullableString(value.source_wrestler_id) ||
    typeof value.name !== "string" ||
    !(value.gender === "male" || value.gender === "female") ||
    !isNullableString(value.primary_class) ||
    !isNullableString(value.secondary_class) ||
    !(value.role === "face" || value.role === "heel") ||
    !(
      value.mic_skill === null ||
      (isPositiveInteger(value.mic_skill) && value.mic_skill <= 5)
    ) ||
    !(
      value.in_ring_skill === null ||
      (typeof value.in_ring_skill === "number" &&
        Number.isSafeInteger(value.in_ring_skill))
    ) ||
    !isNullableString(value.image_url) ||
    !(
      value.mygm_category === null ||
      value.mygm_category === "active" ||
      value.mygm_category === "legend" ||
      value.mygm_category === "local"
    ) ||
    !(
      value.acquisition_type === "draft" ||
      value.acquisition_type === "market" ||
      value.acquisition_type === "custom" ||
      value.acquisition_type === "transfer"
    ) ||
    !(
      value.contract_end_tick === null ||
      isPositiveInteger(value.contract_end_tick)
    ) ||
    typeof value.is_retained !== "boolean" ||
    typeof value.is_champion !== "boolean" ||
    !Array.isArray(value.championships) ||
    !value.championships.every(isCandidateChampionship)
  ) {
    return false;
  }

  const championshipIds = new Set(value.championships.map((title) => title.id));

  return (
    championshipIds.size === value.championships.length &&
    value.is_champion ===
      value.championships.some((title) => title.category !== "mitb")
  );
}

function isDraftKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(career|catalog):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      value,
    )
  );
}

function isStartingBalance(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length <= 19 &&
      /^\d+$/.test(value) &&
      BigInt(value) <= 9223372036854775807n)
  );
}

function isSeasonTransitionData(value: unknown): value is SeasonTransitionData {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isSeasonTransition(value.transition) ||
    !isNonNegativeInteger(value.candidate_count) ||
    !isNonNegativeInteger(value.retained_count) ||
    !Array.isArray(value.candidates) ||
    !value.candidates.every(isRetentionCandidate) ||
    !Array.isArray(value.draft_keys) ||
    !value.draft_keys.every(isDraftKey) ||
    !isNonNegativeInteger(value.draft_count) ||
    typeof value.finances_enabled !== "boolean" ||
    typeof value.fans_enabled !== "boolean" ||
    !isStartingBalance(value.starting_money) ||
    !isStartingBalance(value.starting_fans)
  ) {
    return false;
  }

  const membershipIds = new Set(
    value.candidates.map((candidate) => candidate.membership_id),
  );

  const wrestlerIds = new Set(
    value.candidates.map((candidate) => candidate.wrestler_id),
  );

  const retainedCandidates = value.candidates.filter(
    (candidate) => candidate.is_retained,
  );

  const retainedKeys = new Set(
    retainedCandidates.map((candidate) => `career:${candidate.wrestler_id}`),
  );

  return (
    value.current_tick === value.transition.from_tick + 1 &&
    value.candidate_count === value.candidates.length &&
    value.retained_count === retainedCandidates.length &&
    membershipIds.size === value.candidates.length &&
    wrestlerIds.size === value.candidates.length &&
    value.draft_count === value.draft_keys.length &&
    new Set(value.draft_keys).size === value.draft_keys.length &&
    !value.draft_keys.some((key) => retainedKeys.has(key)) &&
    (value.finances_enabled || value.starting_money === null) &&
    (value.fans_enabled || value.starting_fans === null)
  );
}

function isSaveRetentionResult(
  value: unknown,
): value is SaveSeasonRetentionResult {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    typeof value.transition_id !== "string" ||
    !isNonNegativeInteger(value.retained_count) ||
    !Array.isArray(value.retained_membership_ids) ||
    !value.retained_membership_ids.every(
      (id: unknown) => typeof id === "string" && id.length > 0,
    )
  ) {
    return false;
  }

  return (
    value.retained_count === value.retained_membership_ids.length &&
    new Set(value.retained_membership_ids).size ===
      value.retained_membership_ids.length
  );
}

export async function getSeasonTransition(
  careerId: string,
  signal: AbortSignal,
): Promise<SeasonTransitionData | null> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_season_transition", {
      p_game_id: careerId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (data === null) {
    return null;
  }

  if (!isSeasonTransitionData(data) || data.career_id !== careerId) {
    throw new Error("The season transition response is invalid.");
  }

  return data;
}

export async function saveSeasonRetention(
  input: SaveSeasonRetentionInput,
): Promise<SaveSeasonRetentionResult> {
  const membershipIds = [...input.membershipIds];
  const selectedIds = new Set(membershipIds);

  if (
    membershipIds.some((id) => typeof id !== "string" || id.length === 0) ||
    selectedIds.size !== membershipIds.length
  ) {
    throw new Error("The retained wrestler selection is invalid.");
  }

  const { data, error } = await supabase.rpc("wc_save_mygm_season_retention", {
    p_game_id: input.careerId,
    p_transition_id: input.transitionId,
    p_membership_ids: membershipIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isSaveRetentionResult(data) ||
    data.career_id !== input.careerId ||
    data.transition_id !== input.transitionId ||
    data.retained_count !== membershipIds.length ||
    !data.retained_membership_ids.every((id) => selectedIds.has(id))
  ) {
    throw new Error(
      "The saved retention selection could not be verified. Reload the season draft before continuing.",
    );
  }

  return data;
}

function isSeasonDraftOption(value: unknown): value is SeasonDraftOption {
  if (
    !isRecord(value) ||
    !isDraftKey(value.draft_key) ||
    !isNullableString(value.catalog_wrestler_id) ||
    !isNullableString(value.career_wrestler_id) ||
    typeof value.name !== "string" ||
    !(value.gender === "male" || value.gender === "female") ||
    !isNullableString(value.primary_class) ||
    !isNullableString(value.secondary_class) ||
    !(value.role === "face" || value.role === "heel") ||
    !(
      value.mic_skill === null ||
      (isPositiveInteger(value.mic_skill) && value.mic_skill <= 5)
    ) ||
    !(
      value.in_ring_skill === null ||
      (typeof value.in_ring_skill === "number" &&
        Number.isSafeInteger(value.in_ring_skill))
    ) ||
    !isNullableString(value.image_url) ||
    !(
      value.mygm_category === null ||
      value.mygm_category === "active" ||
      value.mygm_category === "legend" ||
      value.mygm_category === "local"
    ) ||
    typeof value.was_on_previous_roster !== "boolean"
  ) {
    return false;
  }

  const expectedKey =
    value.career_wrestler_id !== null
      ? `career:${value.career_wrestler_id}`
      : value.catalog_wrestler_id !== null
        ? `catalog:${value.catalog_wrestler_id}`
        : null;

  return (
    value.draft_key === expectedKey &&
    (!value.was_on_previous_roster || value.career_wrestler_id !== null)
  );
}

function isSeasonDraftOptionsPage(
  value: unknown,
): value is SeasonDraftOptionsPage {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    typeof value.transition_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.page_size) ||
    value.page_size > 24 ||
    !isNonNegativeInteger(value.total_count) ||
    !isNonNegativeInteger(value.total_pages) ||
    !isNonNegativeInteger(value.available_count) ||
    !Array.isArray(value.available_classes) ||
    !value.available_classes.every(
      (item: unknown) => typeof item === "string" && item.trim() !== "",
    ) ||
    !Array.isArray(value.items) ||
    !value.items.every(isSeasonDraftOption)
  ) {
    return false;
  }

  const expectedPages = Math.ceil(value.total_count / value.page_size);

  const expectedItems = Math.min(
    value.page_size,
    Math.max(0, value.total_count - (value.page - 1) * value.page_size),
  );

  const draftKeys = new Set(value.items.map((item) => item.draft_key));

  return (
    value.total_count <= value.available_count &&
    value.total_pages === expectedPages &&
    value.page <= Math.max(1, expectedPages) &&
    value.items.length === expectedItems &&
    draftKeys.size === value.items.length &&
    new Set(value.available_classes).size === value.available_classes.length
  );
}

export async function getSeasonDraftOptions(
  input: GetSeasonDraftOptionsInput,
  signal: AbortSignal,
): Promise<SeasonDraftOptionsPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_season_draft_options", {
      p_game_id: input.careerId,
      p_transition_id: input.transitionId,
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
    !isSeasonDraftOptionsPage(data) ||
    data.career_id !== input.careerId ||
    data.transition_id !== input.transitionId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The season draft options response is invalid.");
  }

  return data;
}

function isSaveSeasonDraftResult(
  value: unknown,
): value is SaveSeasonDraftResult {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    typeof value.transition_id !== "string" ||
    !isNonNegativeInteger(value.draft_count) ||
    !Array.isArray(value.draft_keys) ||
    !value.draft_keys.every(isDraftKey)
  ) {
    return false;
  }

  return (
    value.draft_count === value.draft_keys.length &&
    new Set(value.draft_keys).size === value.draft_keys.length
  );
}

export async function saveSeasonDraft(
  input: SaveSeasonDraftInput,
): Promise<SaveSeasonDraftResult> {
  const draftKeys = [...input.draftKeys];
  const selectedKeys = new Set(draftKeys);

  if (!draftKeys.every(isDraftKey) || selectedKeys.size !== draftKeys.length) {
    throw new Error("The draft wrestler selection is invalid.");
  }

  const { data, error } = await supabase.rpc("wc_save_mygm_season_draft", {
    p_game_id: input.careerId,
    p_transition_id: input.transitionId,
    p_draft_keys: draftKeys,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isSaveSeasonDraftResult(data) ||
    data.career_id !== input.careerId ||
    data.transition_id !== input.transitionId ||
    data.draft_count !== draftKeys.length ||
    !data.draft_keys.every((key) => selectedKeys.has(key))
  ) {
    throw new Error(
      "The saved draft selection could not be verified. Reload the season draft before continuing.",
    );
  }

  return data;
}

function isSaveSeasonBalancesResult(
  value: unknown,
): value is SaveSeasonBalancesResult {
  return (
    isRecord(value) &&
    typeof value.career_id === "string" &&
    typeof value.transition_id === "string" &&
    isStartingBalance(value.starting_money) &&
    isStartingBalance(value.starting_fans)
  );
}

export async function saveSeasonBalances(
  input: SaveSeasonBalancesInput,
): Promise<SaveSeasonBalancesResult> {
  if (
    !isStartingBalance(input.startingMoney) ||
    !isStartingBalance(input.startingFans)
  ) {
    throw new Error(
      "Enter whole starting totals between 0 and 9,223,372,036,854,775,807.",
    );
  }

  const startingMoney =
    input.startingMoney === null
      ? null
      : BigInt(input.startingMoney).toString();

  const startingFans =
    input.startingFans === null ? null : BigInt(input.startingFans).toString();

  const { data, error } = await supabase.rpc("wc_save_mygm_season_balances", {
    p_game_id: input.careerId,
    p_transition_id: input.transitionId,
    p_starting_money: startingMoney,
    p_starting_fans: startingFans,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isSaveSeasonBalancesResult(data) ||
    data.career_id !== input.careerId ||
    data.transition_id !== input.transitionId ||
    data.starting_money !== startingMoney ||
    data.starting_fans !== startingFans
  ) {
    throw new Error(
      "The saved starting balances could not be verified. Reload the season draft before continuing.",
    );
  }

  return data;
}

function isReviewHolder(value: unknown): value is ChampionshipHolder {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isReviewWrestler(value: unknown): value is SeasonDraftReviewWrestler {
  if (
    !isRecord(value) ||
    !isDraftKey(value.selection_key) ||
    !(value.source === "retained" || value.source === "draft") ||
    !isNullableString(value.wrestler_id) ||
    !isNullableString(value.catalog_wrestler_id) ||
    typeof value.name !== "string" ||
    !isNullableString(value.image_url)
  ) {
    return false;
  }

  const expectedKey =
    value.wrestler_id !== null
      ? `career:${value.wrestler_id}`
      : value.catalog_wrestler_id !== null
        ? `catalog:${value.catalog_wrestler_id}`
        : null;

  return (
    value.selection_key === expectedKey &&
    (value.source !== "retained" || value.wrestler_id !== null)
  );
}

function isReviewChampionship(
  value: unknown,
): value is SeasonDraftReviewChampionship {
  if (
    !isRecord(value) ||
    !isCandidateChampionship(value) ||
    typeof value.will_vacate !== "boolean" ||
    !Array.isArray(value.holders) ||
    !value.holders.every(isReviewHolder)
  ) {
    return false;
  }

  return (
    new Set(value.holders.map((holder) => holder.id)).size ===
    value.holders.length
  );
}

function isReviewRivalryMember(
  value: unknown,
): value is SeasonDraftReviewRivalryMember {
  return (
    isRecord(value) &&
    isReviewHolder(value) &&
    (value.side === 1 || value.side === 2)
  );
}

function isReviewRivalry(value: unknown): value is SeasonDraftReviewRivalry {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isNullableString(value.name) ||
    !(
      value.kind === "singles" ||
      value.kind === "tag_team" ||
      value.kind === "stable"
    ) ||
    !(
      value.level === 1 ||
      value.level === 2 ||
      value.level === 3 ||
      value.level === 4
    ) ||
    typeof value.will_end !== "boolean" ||
    !Array.isArray(value.members) ||
    !value.members.every(isReviewRivalryMember)
  ) {
    return false;
  }

  return (
    new Set(value.members.map((member) => member.id)).size ===
    value.members.length
  );
}

function isSeasonDraftReviewData(
  value: unknown,
): value is SeasonDraftReviewData {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isSeasonTransition(value.transition) ||
    typeof value.finances_enabled !== "boolean" ||
    typeof value.fans_enabled !== "boolean" ||
    !isStartingBalance(value.starting_money) ||
    !isStartingBalance(value.starting_fans) ||
    !isNonNegativeInteger(value.roster_count) ||
    !Array.isArray(value.roster) ||
    !value.roster.every(isReviewWrestler) ||
    !Array.isArray(value.unavailable_draft_keys) ||
    !value.unavailable_draft_keys.every(isDraftKey) ||
    !Array.isArray(value.championships) ||
    !value.championships.every(isReviewChampionship) ||
    !Array.isArray(value.rivalries) ||
    !value.rivalries.every(isReviewRivalry)
  ) {
    return false;
  }

  const rosterKeys = new Set(
    value.roster.map((person) => person.selection_key),
  );

  const wrestlerIds = value.roster
    .map((person) => person.wrestler_id)
    .filter((id): id is string => id !== null);

  const catalogIds = value.roster
    .map((person) => person.catalog_wrestler_id)
    .filter((id): id is string => id !== null);

  const finalWrestlerIds = new Set(wrestlerIds);

  const uniqueChampionships = new Set(
    value.championships.map((title) => title.id),
  );

  const uniqueRivalries = new Set(value.rivalries.map((rivalry) => rivalry.id));

  return (
    value.current_tick === value.transition.from_tick + 1 &&
    value.roster_count === value.roster.length &&
    rosterKeys.size === value.roster.length &&
    finalWrestlerIds.size === wrestlerIds.length &&
    new Set(catalogIds).size === catalogIds.length &&
    new Set(value.unavailable_draft_keys).size ===
      value.unavailable_draft_keys.length &&
    value.unavailable_draft_keys.every((key) => !rosterKeys.has(key)) &&
    uniqueChampionships.size === value.championships.length &&
    uniqueRivalries.size === value.rivalries.length &&
    (value.finances_enabled || value.starting_money === null) &&
    (value.fans_enabled || value.starting_fans === null) &&
    value.championships.every((title) => {
      const shouldVacate =
        title.holders.length === 0 ||
        title.holders.some((holder) => !finalWrestlerIds.has(holder.id));

      return title.will_vacate === shouldVacate;
    }) &&
    value.rivalries.every((rivalry) => {
      const shouldEnd =
        rivalry.members.length === 0 ||
        rivalry.members.some((member) => !finalWrestlerIds.has(member.id));

      return rivalry.will_end === shouldEnd;
    })
  );
}

export async function getSeasonDraftReview(
  careerId: string,
  transitionId: string,
  signal: AbortSignal,
): Promise<SeasonDraftReviewData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_season_draft_review", {
      p_game_id: careerId,
      p_transition_id: transitionId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isSeasonDraftReviewData(data) ||
    data.career_id !== careerId ||
    data.transition.id !== transitionId
  ) {
    throw new Error("The season draft review response is invalid.");
  }

  return data;
}

export interface ConfirmSeasonDraftInput {
  careerId: string;
  transitionId: string;
  expectedReview: Awaited<ReturnType<typeof getSeasonDraftReview>>;
}

export async function confirmSeasonDraft({
  careerId,
  transitionId,
  expectedReview,
}: ConfirmSeasonDraftInput): Promise<SeasonDraftConfirmationResult> {
  if (
    expectedReview.career_id !== careerId ||
    expectedReview.transition.id !== transitionId
  ) {
    throw new Error("The season draft review does not match this career.");
  }

  if (expectedReview.unavailable_draft_keys.length > 0) {
    throw new Error(
      "Some selected wrestlers are unavailable. Update the draft roster.",
    );
  }

  const { data, error } = await supabase.rpc("wc_confirm_mygm_season_draft", {
    p_game_id: careerId,
    p_transition_id: transitionId,
    p_expected_review: expectedReview,
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload: unknown = data;

  if (!isRecord(payload)) {
    throw new Error("The season draft confirmation response is invalid.");
  }

  const retainedCount = expectedReview.roster.filter(
    (wrestler) => wrestler.source === "retained",
  ).length;

  const draftedCount = expectedReview.roster.filter(
    (wrestler) => wrestler.source === "draft",
  ).length;

  const vacatedCount = expectedReview.championships.filter(
    (championship) => championship.will_vacate,
  ).length;

  const endedRivalryCount = expectedReview.rivalries.filter(
    (rivalry) => rivalry.will_end,
  ).length;

  if (
    payload.career_id !== careerId ||
    payload.transition_id !== transitionId ||
    payload.status !== "completed" ||
    !isPositiveInteger(payload.season) ||
    payload.season !== expectedReview.transition.to_season ||
    !isPositiveInteger(payload.current_tick) ||
    payload.current_tick !== expectedReview.current_tick ||
    !isNonNegativeInteger(payload.roster_count) ||
    payload.roster_count !== expectedReview.roster.length ||
    !isNonNegativeInteger(payload.retained_count) ||
    payload.retained_count !== retainedCount ||
    !isNonNegativeInteger(payload.drafted_count) ||
    payload.drafted_count !== draftedCount ||
    !isNonNegativeInteger(payload.vacated_championship_count) ||
    payload.vacated_championship_count !== vacatedCount ||
    !isNonNegativeInteger(payload.ended_rivalry_count) ||
    payload.ended_rivalry_count !== endedRivalryCount ||
    !isStartingBalance(payload.starting_money) ||
    payload.starting_money !== expectedReview.starting_money ||
    !isStartingBalance(payload.starting_fans) ||
    payload.starting_fans !== expectedReview.starting_fans
  ) {
    throw new Error("The season draft confirmation response is invalid.");
  }

  return {
    career_id: careerId,
    transition_id: transitionId,
    status: "completed",
    season: payload.season,
    current_tick: payload.current_tick,
    roster_count: payload.roster_count,
    retained_count: payload.retained_count,
    drafted_count: payload.drafted_count,
    vacated_championship_count: payload.vacated_championship_count,
    ended_rivalry_count: payload.ended_rivalry_count,
    starting_money: expectedReview.starting_money,
    starting_fans: expectedReview.starting_fans,
  };
}
