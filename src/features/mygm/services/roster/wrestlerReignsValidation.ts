import type { WrestlerProfileReign } from "../../types/roster/wrestlerProfile.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isInteger(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

export function isWrestlerReignHistory(
  value: unknown,
  currentTick: number,
  wrestlerId: string,
): value is WrestlerProfileReign[] {
  if (!Array.isArray(value)) return false;
  const reignIds = new Set<string>();

  return value.every(reign => {
    if (!isRecord(reign) || typeof reign.reign_id !== "string" || !reign.reign_id || reignIds.has(reign.reign_id)) return false;
    reignIds.add(reign.reign_id);
    if (
      typeof reign.id !== "string" ||
      typeof reign.name !== "string" ||
      !(reign.image_url === null || typeof reign.image_url === "string") ||
      !["world", "midcard", "tag_team", "mitb", "other"].includes(String(reign.category)) ||
      !["singles", "tag_team"].includes(String(reign.division)) ||
      !isInteger(reign.won_tick, 1) || reign.won_tick > currentTick ||
      !(reign.lost_tick === null || (isInteger(reign.lost_tick, reign.won_tick) && reign.lost_tick <= currentTick)) ||
      reign.status !== (reign.lost_tick === null ? "current" : "completed") ||
      !isInteger(reign.duration_weeks, 0) ||
      reign.duration_weeks !== (reign.lost_tick ?? currentTick) - reign.won_tick ||
      !isInteger(reign.defenses, 0) ||
      (reign.category === "mitb" && reign.defenses !== 0) ||
      !Array.isArray(reign.holders)
    ) return false;

    const holderIds = new Set<string>();
    return reign.holders.every(holder => {
      if (!isRecord(holder) || typeof holder.id !== "string" || typeof holder.name !== "string" ||
        !(holder.image_url === null || typeof holder.image_url === "string") || holderIds.has(holder.id)) return false;
      holderIds.add(holder.id);
      return true;
    }) && holderIds.has(wrestlerId);
  });
}
