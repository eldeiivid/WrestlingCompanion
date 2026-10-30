import type {
  BookingMatchFeudOption,
  BookingMatchFormat,
  BookingMatchInterferenceInput,
  BookingMatchTitleOption,
  BookingMatchWrestler,
} from "../types/booking.types";

interface MatchTitleEligibilityInput {
  format: BookingMatchFormat | undefined;
  participantIds: string[];
  wrestlers: BookingMatchWrestler[];
  titles: BookingMatchTitleOption[];
}

export function getEligibleMatchTitles({
  format,
  participantIds,
  wrestlers,
  titles,
}: MatchTitleEligibilityInput): BookingMatchTitleOption[] {
  if (!format || format.team_sizes.length < 2) {
    return [];
  }

  const expectedParticipants = format.team_sizes.reduce(
    (total, size) => total + size,
    0,
  );

  const hasCompleteSelection =
    participantIds.length === expectedParticipants &&
    participantIds.every((id) => id !== "") &&
    new Set(participantIds).size === expectedParticipants;

  if (!hasCompleteSelection) {
    return [];
  }

  const wrestlersById = new Map(
    wrestlers.map((wrestler) => [wrestler.id, wrestler]),
  );

  const selectedWrestlers = participantIds
    .map((id) => wrestlersById.get(id))
    .filter(
      (wrestler): wrestler is BookingMatchWrestler => wrestler !== undefined,
    );

  if (selectedWrestlers.length !== expectedParticipants) {
    return [];
  }

  const sideByWrestlerId = new Map<string, number>();
  let participantIndex = 0;

  for (const [teamIndex, size] of format.team_sizes.entries()) {
    for (let memberIndex = 0; memberIndex < size; memberIndex += 1) {
      const wrestlerId = participantIds[participantIndex];

      if (!wrestlerId) return [];

      sideByWrestlerId.set(wrestlerId, teamIndex + 1);
      participantIndex += 1;
    }
  }

  return titles.filter((title) => {
    const requiredTeamSize = title.division === "singles" ? 1 : 2;

    const hasCompatibleFormat = format.team_sizes.every(
      (size) => size === requiredTeamSize,
    );

    if (!hasCompatibleFormat) {
      return false;
    }

    if (
      (title.gender === "male" || title.gender === "female") &&
      selectedWrestlers.some((wrestler) => wrestler.gender !== title.gender)
    ) {
      return false;
    }

    if (title.is_vacant) {
      return title.holders.length === 0;
    }

    const holderIds = title.holders.map((holder) => holder.wrestler_id);

    if (
      holderIds.length !== requiredTeamSize ||
      new Set(holderIds).size !== requiredTeamSize
    ) {
      return false;
    }

    const holderSides = holderIds.map((id) => sideByWrestlerId.get(id));

    if (holderSides.some((side) => side === undefined)) {
      return false;
    }

    return new Set(holderSides).size === 1;
  });
}

export function getSuggestedMatchTitleId(
  eligibleTitles: BookingMatchTitleOption[],
): string | null {
  const defendedTitles = eligibleTitles.filter((title) => !title.is_vacant);

  if (defendedTitles.length !== 1) {
    return null;
  }

  return defendedTitles[0]?.id ?? null;
}

interface InterferenceEligibilityInput {
  participantIds: string[];
  wrestlers: BookingMatchWrestler[];
}

interface InterferenceSuggestionInput extends InterferenceEligibilityInput {
  feuds: BookingMatchFeudOption[];
}

interface InterferenceTargetSuggestionInput {
  attackerId: string;
  participantIds: string[];
  feuds: BookingMatchFeudOption[];
}

export function getEligibleInterferenceAttackers({
  participantIds,
  wrestlers,
}: InterferenceEligibilityInput): BookingMatchWrestler[] {
  const participantSet = new Set(participantIds);

  return wrestlers.filter(
    (wrestler) =>
      wrestler.is_available &&
      wrestler.can_interfere &&
      !participantSet.has(wrestler.id),
  );
}

function getRivalTargetIds(
  attackerId: string,
  participantIds: string[],
  feuds: BookingMatchFeudOption[],
): string[] {
  const participantSet = new Set(participantIds);
  const targetIds = new Set<string>();

  for (const feud of feuds) {
    const attacker = feud.members.find(
      (member) => member.wrestler_id === attackerId,
    );

    if (!attacker) continue;

    for (const member of feud.members) {
      if (
        member.side !== attacker.side &&
        member.wrestler_id !== attackerId &&
        participantSet.has(member.wrestler_id)
      ) {
        targetIds.add(member.wrestler_id);
      }
    }
  }

  return [...targetIds];
}

export function getSuggestedInterferenceTargetId({
  attackerId,
  participantIds,
  feuds,
}: InterferenceTargetSuggestionInput): string | null {
  if (
    !attackerId ||
    participantIds.some((id) => id === "") ||
    participantIds.includes(attackerId)
  ) {
    return null;
  }

  const targetIds = getRivalTargetIds(attackerId, participantIds, feuds);

  return targetIds.length === 1 ? (targetIds[0] ?? null) : null;
}

export function getSuggestedInterference({
  participantIds,
  wrestlers,
  feuds,
}: InterferenceSuggestionInput): BookingMatchInterferenceInput | null {
  if (
    participantIds.length < 2 ||
    participantIds.some((id) => id === "") ||
    new Set(participantIds).size !== participantIds.length
  ) {
    return null;
  }

  const attackers = getEligibleInterferenceAttackers({
    participantIds,
    wrestlers,
  });

  const suggestions = new Map<string, BookingMatchInterferenceInput>();

  for (const attacker of attackers) {
    const targetIds = getRivalTargetIds(attacker.id, participantIds, feuds);

    for (const targetId of targetIds) {
      const key = `${attacker.id}:${targetId}`;

      // Multiple rivalries can suggest the same combination.
      suggestions.set(key, {
        wrestler_id: attacker.id,
        target_wrestler_id: targetId,
      });
    }
  }

  if (suggestions.size !== 1) {
    return null;
  }

  return [...suggestions.values()][0] ?? null;
}
