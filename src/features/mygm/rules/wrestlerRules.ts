import type { RosterWrestler } from "../types/roster.types";

type WrestlerClassData = Pick<
  RosterWrestler,
  "primary_class" | "secondary_class" | "in_ring_skill"
>;

export function getAvailableClasses(wrestler: WrestlerClassData): string[] {
  const primary = wrestler.primary_class?.trim();
  const secondary = wrestler.secondary_class?.trim();

  if (!primary) return [];

  const canHaveSecondary = (wrestler.in_ring_skill ?? 0) >= 15;

  if (
    !canHaveSecondary ||
    !secondary ||
    secondary.toLowerCase() === primary.toLowerCase()
  ) {
    return [primary];
  }

  return [primary, secondary];
}

export function canSwapClasses(wrestler: WrestlerClassData): boolean {
  return getAvailableClasses(wrestler).length === 2;
}
