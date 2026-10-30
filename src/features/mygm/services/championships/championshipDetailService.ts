import { supabase } from "../../../../lib/supabase";

import type {
  ChampionshipCategory,
  ChampionshipHolder,
} from "../../types/championships/championships.types";

import type {
  ChampionshipCurrentReign,
  ChampionshipDefense,
  ChampionshipDefenseParticipant,
  ChampionshipDetailData,
  ChampionshipDetails,
  ChampionshipHistorySummary,
  ChampionshipMatchReference,
  ChampionshipReign,
  ChampionshipReignsPage,
  GetChampionshipReignsInput,
  GetReignDefensesInput,
  ReignDefensesPage,
} from "../../types/championships/championshipDetail.types";

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

function isCategory(value: unknown): value is ChampionshipCategory {
  return (
    value === "world" ||
    value === "midcard" ||
    value === "tag_team" ||
    value === "mitb" ||
    value === "other"
  );
}

function isHolder(value: unknown): value is ChampionshipHolder {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url)
  );
}

function isHolders(value: unknown): value is ChampionshipHolder[] {
  return (
    Array.isArray(value) &&
    value.every(isHolder) &&
    new Set(value.map((holder) => holder.id)).size === value.length
  );
}

function isMatchReference(value: unknown): value is ChampionshipMatchReference {
  return (
    isRecord(value) &&
    typeof value.segment_id === "string" &&
    typeof value.event_id === "string" &&
    typeof value.event_name === "string" &&
    isPositiveInteger(value.tick) &&
    isPositiveInteger(value.season) &&
    isPositiveInteger(value.week) &&
    value.season === Math.floor((value.tick - 1) / 50) + 1 &&
    value.week === ((value.tick - 1) % 50) + 1
  );
}

function isChampionshipDetails(value: unknown): value is ChampionshipDetails {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.image_url) &&
    (value.gender === "male" ||
      value.gender === "female" ||
      value.gender === "mixed" ||
      value.gender === "open") &&
    (value.division === "singles" || value.division === "tag_team") &&
    isCategory(value.category) &&
    typeof value.is_active === "boolean"
  );
}

function isCurrentReign(value: unknown): value is ChampionshipCurrentReign {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isPositiveInteger(value.won_tick) &&
    isNonNegativeInteger(value.duration_weeks) &&
    isNonNegativeInteger(value.defenses) &&
    isHolders(value.holders) &&
    (value.won_match === null ||
      (isMatchReference(value.won_match) &&
        value.won_match.tick === value.won_tick))
  );
}

function isHistorySummary(value: unknown): value is ChampionshipHistorySummary {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.reign_count) &&
    isNonNegativeInteger(value.completed_reign_count) &&
    isNonNegativeInteger(value.defense_count) &&
    value.completed_reign_count <= value.reign_count
  );
}

function isDetailData(value: unknown): value is ChampionshipDetailData {
  if (
    !isRecord(value) ||
    typeof value.career_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isChampionshipDetails(value.championship) ||
    !isHistorySummary(value.history_summary) ||
    !(value.current_reign === null || isCurrentReign(value.current_reign))
  ) {
    return false;
  }

  const currentReign = value.current_reign;
  const summary = value.history_summary;

  return (
    summary.reign_count - summary.completed_reign_count ===
      (currentReign === null ? 0 : 1) &&
    (currentReign === null ||
      (currentReign.duration_weeks ===
        Math.max(0, value.current_tick - currentReign.won_tick) &&
        currentReign.defenses <= summary.defense_count))
  );
}

function isReign(value: unknown): value is ChampionshipReign {
  if (
    !isCurrentReign(value) ||
    !isRecord(value) ||
    !(
      value.lost_tick === null ||
      (isPositiveInteger(value.lost_tick) && value.lost_tick >= value.won_tick)
    ) ||
    typeof value.is_current !== "boolean" ||
    !(value.lost_match === null || isMatchReference(value.lost_match))
  ) {
    return false;
  }

  if (value.is_current) {
    return (
      value.lost_tick === null &&
      value.lost_match === null &&
      value.end_type === "ongoing"
    );
  }

  if (value.lost_tick === null) {
    return false;
  }

  return (
    value.duration_weeks === value.lost_tick - value.won_tick &&
    ((value.end_type === "without_match" && value.lost_match === null) ||
      (value.end_type === "match" &&
        (value.lost_match === null ||
          value.lost_match.tick === value.lost_tick)))
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

function isReignsPage(value: unknown): value is ChampionshipReignsPage {
  if (
    !isPageEnvelope(value) ||
    typeof value.title_id !== "string" ||
    !isCategory(value.category) ||
    !value.items.every(isReign)
  ) {
    return false;
  }

  const currentTick = value.current_tick;
  const reignIds = new Set(value.items.map((reign) => reign.id));

  return (
    reignIds.size === value.items.length &&
    value.items.filter((reign) => reign.is_current).length <= 1 &&
    value.items.every(
      (reign) =>
        !reign.is_current ||
        reign.duration_weeks === Math.max(0, currentTick - reign.won_tick),
    )
  );
}

function isDefenseParticipant(
  value: unknown,
): value is ChampionshipDefenseParticipant {
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

function isDefense(value: unknown): value is ChampionshipDefense {
  if (
    !isMatchReference(value) ||
    !isRecord(value) ||
    !isPositiveInteger(value.position) ||
    !(
      value.event_kind === "weekly" ||
      value.event_kind === "ple" ||
      value.event_kind === "special"
    ) ||
    typeof value.format_name !== "string" ||
    !isNullableString(value.stipulation_name) ||
    !(
      value.rating === null ||
      (typeof value.rating === "number" &&
        Number.isFinite(value.rating) &&
        value.rating >= 0 &&
        value.rating <= 5)
    ) ||
    !(
      value.outcome === null ||
      value.outcome === "decisive" ||
      value.outcome === "draw" ||
      value.outcome === "no_contest"
    ) ||
    !Array.isArray(value.participants) ||
    !value.participants.every(isDefenseParticipant)
  ) {
    return false;
  }

  return (
    new Set(value.participants.map((participant) => participant.wrestler_id))
      .size === value.participants.length
  );
}

function isDefensesPage(value: unknown): value is ReignDefensesPage {
  return (
    isPageEnvelope(value) &&
    typeof value.title_id === "string" &&
    typeof value.reign_id === "string" &&
    value.items.every(isDefense) &&
    new Set(value.items.map((item) => item.segment_id)).size ===
      value.items.length
  );
}

export async function getChampionshipDetail(
  careerId: string,
  titleId: string,
  signal: AbortSignal,
): Promise<ChampionshipDetailData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_championship_detail", {
      p_game_id: careerId,
      p_title_id: titleId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isDetailData(data) ||
    data.career_id !== careerId ||
    data.championship.id !== titleId
  ) {
    throw new Error("The championship detail response is invalid.");
  }

  return data;
}

export async function getChampionshipReigns(
  input: GetChampionshipReignsInput,
  signal: AbortSignal,
): Promise<ChampionshipReignsPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_championship_reigns", {
      p_game_id: input.careerId,
      p_title_id: input.titleId,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isReignsPage(data) ||
    data.career_id !== input.careerId ||
    data.title_id !== input.titleId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The championship reigns response is invalid.");
  }

  return data;
}

export async function getReignDefenses(
  input: GetReignDefensesInput,
  signal: AbortSignal,
): Promise<ReignDefensesPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_reign_defenses", {
      p_game_id: input.careerId,
      p_title_id: input.titleId,
      p_reign_id: input.reignId,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isDefensesPage(data) ||
    data.career_id !== input.careerId ||
    data.title_id !== input.titleId ||
    data.reign_id !== input.reignId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The reign defenses response is invalid.");
  }

  return data;
}
