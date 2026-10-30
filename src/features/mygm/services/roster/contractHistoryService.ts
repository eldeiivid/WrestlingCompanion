import { supabase } from "../../../../lib/supabase";

import type {
  ContractHistoryAction,
  GetWrestlerContractHistoryInput,
  WrestlerContractHistoryPage,
  WrestlerContractStage,
} from "../../types/roster/wrestlerContractHistory.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value);
}

function isCost(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length <= 19 &&
      /^\d+$/.test(value) &&
      BigInt(value) <= 9223372036854775807n)
  );
}

function isContractAction(value: unknown): value is ContractHistoryAction {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    !isPositiveInteger(value.tick) ||
    !isNullablePositiveInteger(value.added_weeks) ||
    !isNullablePositiveInteger(value.previous_end_tick) ||
    !isNullablePositiveInteger(value.new_end_tick) ||
    !isCost(value.cost) ||
    typeof value.created_at !== "string"
  ) {
    return false;
  }

  switch (value.action) {
    case "signed":
      return (
        value.added_weeks !== null &&
        value.previous_end_tick === null &&
        value.new_end_tick !== null &&
        value.new_end_tick - value.tick + 1 === value.added_weeks
      );

    case "terminated":
    case "expired":
    case "season_ended":
      return (
        value.added_weeks === null &&
        value.new_end_tick === null &&
        value.cost === null
      );

    case "retained":
    case "drafted":
      return (
        value.added_weeks === null &&
        value.previous_end_tick === null &&
        value.new_end_tick === null &&
        value.cost === null
      );

    default:
      return false;
  }
}

function isContractStage(value: unknown): value is WrestlerContractStage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (typeof value.membership_id === "string" &&
      typeof value.brand_id === "string" &&
      typeof value.brand_name === "string" &&
      (value.acquisition_type === "draft" ||
        value.acquisition_type === "market" ||
        value.acquisition_type === "custom" ||
        value.acquisition_type === "transfer") &&
      isPositiveInteger(value.joined_tick) &&
      isNullablePositiveInteger(value.left_tick) &&
      (value.left_tick === null || value.left_tick >= value.joined_tick) &&
      isNullablePositiveInteger(value.contract_end_tick) &&
      (value.contract_end_tick === null ||
        value.contract_end_tick >= value.joined_tick) &&
      (value.status === "active" ||
        value.status === "scheduled" ||
        value.status === "terminated" ||
        value.status === "expired" ||
        value.status === "ended")) ||
    (value.status === "season_ended" &&
      (value.remaining_weeks === null ||
        isNonNegativeInteger(value.remaining_weeks)) &&
      Array.isArray(value.actions) &&
      value.actions.every(isContractAction))
  );
}

function isContractHistoryPage(
  value: unknown,
): value is WrestlerContractHistoryPage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.career_id !== "string" ||
    typeof value.wrestler_id !== "string" ||
    !isPositiveInteger(value.current_tick) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.page_size) ||
    value.page_size > 20 ||
    !isNonNegativeInteger(value.total_count) ||
    !isNonNegativeInteger(value.total_pages) ||
    !Array.isArray(value.items) ||
    !value.items.every(isContractStage)
  ) {
    return false;
  }
  const currentTick = value.current_tick;

  const expectedPages = Math.ceil(value.total_count / value.page_size);

  const expectedItemCount = Math.min(
    value.page_size,
    Math.max(0, value.total_count - (value.page - 1) * value.page_size),
  );

  const membershipIds = new Set(value.items.map((item) => item.membership_id));

  return (
    value.total_pages === expectedPages &&
    value.page <= Math.max(1, expectedPages) &&
    value.items.length === expectedItemCount &&
    membershipIds.size === value.items.length &&
    value.items.every((item) => {
      const expectedRemaining =
        item.status === "active" && item.contract_end_tick !== null
          ? Math.max(0, item.contract_end_tick - currentTick + 1)
          : null;

      return item.remaining_weeks === expectedRemaining;
    })
  );
}

export async function getWrestlerContractHistory(
  input: GetWrestlerContractHistoryInput,
  signal: AbortSignal,
): Promise<WrestlerContractHistoryPage> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_wrestler_contract_history", {
      p_game_id: input.careerId,
      p_wrestler_id: input.wrestlerId,
      p_page: input.page,
      p_page_size: input.pageSize,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isContractHistoryPage(data) ||
    data.career_id !== input.careerId ||
    data.wrestler_id !== input.wrestlerId ||
    data.page_size !== input.pageSize
  ) {
    throw new Error("The contract history response is invalid.");
  }

  return data;
}
