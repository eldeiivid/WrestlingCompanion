import { supabase } from "../../../../lib/supabase";

import type {
  CareerSettingsCareer,
  CareerSettingsData,
  CareerSettingsRules,
  DeleteCareerInput,
  DeleteCareerResult,
  RenameCareerInput,
  RenameCareerResult,
} from "../../types/settings/careerSettings.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isCareerSettingsCareer(value: unknown): value is CareerSettingsCareer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.game_version === "string" &&
    isPositiveInteger(value.current_tick) &&
    isPositiveInteger(value.season) &&
    isPositiveInteger(value.week) &&
    value.season === Math.floor((value.current_tick - 1) / 50) + 1 &&
    value.week === ((value.current_tick - 1) % 50) + 1 &&
    typeof value.created_at === "string" &&
    Number.isFinite(Date.parse(value.created_at))
  );
}

function isCareerSettingsRules(value: unknown): value is CareerSettingsRules {
  return (
    isRecord(value) &&
    typeof value.difficulty === "string" &&
    value.difficulty.trim() !== "" &&
    typeof value.finances_enabled === "boolean" &&
    typeof value.fans_enabled === "boolean" &&
    typeof value.mitb_enabled === "boolean" &&
    value.weeks_per_season === 50
  );
}

function isCareerSettingsData(value: unknown): value is CareerSettingsData {
  return (
    isRecord(value) &&
    isCareerSettingsCareer(value.career) &&
    isCareerSettingsRules(value.rules)
  );
}

function isRenameCareerResult(value: unknown): value is RenameCareerResult {
  return (
    isRecord(value) &&
    typeof value.career_id === "string" &&
    typeof value.name === "string"
  );
}

function normalizeCareerName(value: string): string {
  // Match PostgreSQL btrim(text), which removes surrounding spaces.
  return value.replace(/^ +| +$/g, "");
}

export async function getCareerSettings(
  careerId: string,
  signal: AbortSignal,
): Promise<CareerSettingsData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_career_settings", {
      p_game_id: careerId,
    })
    .abortSignal(signal);

  if (error) {
    throw new Error(error.message);
  }

  if (!isCareerSettingsData(data) || data.career.id !== careerId) {
    throw new Error("The career settings response is invalid.");
  }

  return data;
}

export async function renameCareer(
  input: RenameCareerInput,
): Promise<RenameCareerResult> {
  const name = normalizeCareerName(input.name);
  const characterCount = Array.from(name).length;

  if (characterCount < 1 || characterCount > 100) {
    throw new Error("Career name must contain between 1 and 100 characters.");
  }

  const { data, error } = await supabase.rpc("wc_rename_mygm_career", {
    p_game_id: input.careerId,
    p_name: name,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !isRenameCareerResult(data) ||
    data.career_id !== input.careerId ||
    data.name !== name
  ) {
    throw new Error(
      "The updated career name could not be verified. Refresh the settings before trying again.",
    );
  }

  return data;
}

function isDeleteCareerResult(value: unknown): value is DeleteCareerResult {
  return isRecord(value) && typeof value.career_id === "string";
}

export async function deleteCareer(
  input: DeleteCareerInput,
): Promise<DeleteCareerResult> {
  const { data, error } = await supabase.rpc("wc_delete_mygm_career", {
    p_game_id: input.careerId,
    p_confirmation_name: input.confirmationName,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!isDeleteCareerResult(data) || data.career_id !== input.careerId) {
    throw new Error(
      "The deletion response could not be verified. Check your career list before trying again.",
    );
  }

  return data;
}
