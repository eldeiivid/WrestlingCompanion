import { supabase } from "../../../../lib/supabase";

import type {
  ExtendContractInput,
  ExtendContractResult,
  SignWrestlerInput,
  SignWrestlerResult,
  TerminateContractInput,
  TerminateContractResult,
} from "../../types/market/marketContracts.types";

const maxBigInt = 9223372036854775807n;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isValidCost(value: string | null): boolean {
  if (value === null) {
    return true;
  }

  if (!/^\d+$/.test(value)) {
    return false;
  }

  return BigInt(value) <= maxBigInt;
}

function isSignWrestlerResult(value: unknown): value is SignWrestlerResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.career_id === "string" &&
    typeof value.wrestler_id === "string" &&
    typeof value.membership_id === "string" &&
    isPositiveInteger(value.joined_tick) &&
    isPositiveInteger(value.contract_end_tick) &&
    value.contract_end_tick >= value.joined_tick
  );
}

function isTerminateContractResult(
  value: unknown,
): value is TerminateContractResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.career_id === "string" &&
    typeof value.wrestler_id === "string" &&
    typeof value.membership_id === "string" &&
    isPositiveInteger(value.left_tick)
  );
}

export async function terminateContract(
  input: TerminateContractInput,
): Promise<TerminateContractResult> {
  const { data, error } = await supabase.rpc("wc_terminate_mygm_contract", {
    p_game_id: input.careerId,
    p_membership_id: input.membershipId,
    p_request_id: input.requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isTerminateContractResult(data) ||
    data.career_id !== input.careerId ||
    data.membership_id !== input.membershipId
  ) {
    throw new Error(
      "The termination response could not be verified. Refresh the wrestler profile before trying again.",
    );
  }

  return data;
}

export async function signWrestler(
  input: SignWrestlerInput,
): Promise<SignWrestlerResult> {
  if (
    !Number.isSafeInteger(input.contractWeeks) ||
    input.contractWeeks < 1 ||
    input.contractWeeks > 2147483646
  ) {
    throw new Error("Enter a valid contract length of at least one week.");
  }

  if (!isValidCost(input.cost)) {
    throw new Error(
      "Enter a signing cost between 0 and 9,223,372,036,854,775,807.",
    );
  }

  const { data, error } = await supabase.rpc("wc_sign_mygm_wrestler", {
    p_game_id: input.careerId,
    p_request_id: input.requestId,
    p_contract_weeks: input.contractWeeks,
    p_source: input.wrestler.source,

    p_wrestler_id:
      input.wrestler.source === "career" ? input.wrestler.wrestlerId : null,

    p_catalog_wrestler_id:
      input.wrestler.source === "catalog"
        ? input.wrestler.catalogWrestlerId
        : null,

    p_cost: input.cost,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isSignWrestlerResult(data) ||
    data.career_id !== input.careerId ||
    data.contract_end_tick - data.joined_tick + 1 !== input.contractWeeks ||
    (input.wrestler.source === "career" &&
      data.wrestler_id !== input.wrestler.wrestlerId)
  ) {
    throw new Error(
      "The signing response could not be verified. Refresh the roster before trying again.",
    );
  }

  return data;
}

function isExtendContractResult(value: unknown): value is ExtendContractResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.career_id === "string" &&
    typeof value.wrestler_id === "string" &&
    typeof value.membership_id === "string" &&
    isPositiveInteger(value.previous_end_tick) &&
    isPositiveInteger(value.contract_end_tick) &&
    isPositiveInteger(value.added_weeks) &&
    value.contract_end_tick - value.previous_end_tick === value.added_weeks
  );
}

export async function extendContract(
  input: ExtendContractInput,
): Promise<ExtendContractResult> {
  if (
    !Number.isSafeInteger(input.addedWeeks) ||
    input.addedWeeks < 1 ||
    input.addedWeeks > 2147483646
  ) {
    throw new Error("Enter a valid extension of at least one week.");
  }

  if (!isValidCost(input.cost)) {
    throw new Error(
      "Enter an extension cost between 0 and 9,223,372,036,854,775,807.",
    );
  }

  const { data, error } = await supabase.rpc("wc_extend_mygm_contract", {
    p_game_id: input.careerId,
    p_membership_id: input.membershipId,
    p_request_id: input.requestId,
    p_added_weeks: input.addedWeeks,
    p_cost: input.cost,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isExtendContractResult(data) ||
    data.career_id !== input.careerId ||
    data.membership_id !== input.membershipId ||
    data.added_weeks !== input.addedWeeks
  ) {
    throw new Error(
      "The extension response could not be verified. Refresh the wrestler profile before trying again.",
    );
  }

  return data;
}
