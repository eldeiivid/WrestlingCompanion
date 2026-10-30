import type { BookingMatchOptions } from "../types/booking.types";

export type MatchGenderFilter = "all" | "male" | "female";

export interface MatchFeudSuggestion {
  feudId: string;
  label: string;
  participantIds: string[];
  addedWrestlerIds: string[];
}

interface MatchFeudSuggestionsInput {
  format: BookingMatchOptions["formats"][number] | undefined;
  participantIds: string[];
  changedIndex: number;
  genderFilter: MatchGenderFilter;
  wrestlers: BookingMatchOptions["wrestlers"];
  feuds: BookingMatchOptions["feuds"];
}

function fillTeam(
  participantIds: string[],
  slotIndexes: number[],
  memberIds: string[],
): string[] | null {
  if (slotIndexes.length !== memberIds.length) {
    return null;
  }

  const selectedMembers = slotIndexes
    .map((index) => participantIds[index])
    .filter(Boolean);

  if (selectedMembers.some((id) => !memberIds.includes(id))) {
    return null;
  }

  const next = [...participantIds];

  for (const memberId of memberIds) {
    if (slotIndexes.some((index) => next[index] === memberId)) {
      continue;
    }

    // Do not move someone already selected on another team.
    if (next.includes(memberId)) {
      return null;
    }

    const emptyIndex = slotIndexes.find((index) => !next[index]);

    if (emptyIndex === undefined) {
      return null;
    }

    next[emptyIndex] = memberId;
  }

  return next;
}

export function getMatchFeudSuggestions({
  format,
  participantIds,
  changedIndex,
  genderFilter,
  wrestlers,
  feuds,
}: MatchFeudSuggestionsInput): MatchFeudSuggestion[] {
  if (!format || !participantIds[changedIndex]) {
    return [];
  }

  let offset = 0;

  const teams = format.team_sizes.map((size) => {
    const indexes = Array.from({ length: size }, (_, index) => offset + index);

    offset += size;

    return indexes;
  });

  if (participantIds.length !== offset) {
    return [];
  }

  const selectedTeam = teams.find((indexes) => indexes.includes(changedIndex));

  if (!selectedTeam) {
    return [];
  }

  const selectedId = participantIds[changedIndex];
  const suggestions: MatchFeudSuggestion[] = [];
  const seenAssignments = new Set<string>();

  for (const feud of feuds) {
    const selectedMember = feud.members.find(
      (member) => member.wrestler_id === selectedId,
    );

    if (!selectedMember) {
      continue;
    }

    if (feud.members.some((member) => member.side !== 1 && member.side !== 2)) {
      continue;
    }

    const ownMemberIds = feud.members
      .filter((member) => member.side === selectedMember.side)
      .map((member) => member.wrestler_id);

    const rivalMemberIds = feud.members
      .filter((member) => member.side !== selectedMember.side)
      .map((member) => member.wrestler_id);

    const allMemberIds = [...ownMemberIds, ...rivalMemberIds];

    if (
      ownMemberIds.length === 0 ||
      rivalMemberIds.length === 0 ||
      ownMemberIds.length > 2 ||
      rivalMemberIds.length > 2 ||
      ownMemberIds.length !== rivalMemberIds.length ||
      new Set(allMemberIds).size !== allMemberIds.length
    ) {
      continue;
    }

    if (
      !allMemberIds.every((id) =>
        wrestlers.some(
          (wrestler) => wrestler.id === id && wrestler.is_available,
        ),
      )
    ) {
      continue;
    }

    const withOwnTeam = fillTeam(participantIds, selectedTeam, ownMemberIds);

    if (!withOwnTeam) {
      continue;
    }

    const opposingTeams = teams
      .filter(
        (indexes) =>
          indexes !== selectedTeam && indexes.length === rivalMemberIds.length,
      )
      .sort((first, second) => {
        const firstSelected = first.filter(
          (index) => participantIds[index],
        ).length;

        const secondSelected = second.filter(
          (index) => participantIds[index],
        ).length;

        return secondSelected - firstSelected;
      });

    for (const opposingTeam of opposingTeams) {
      const next = fillTeam(withOwnTeam, opposingTeam, rivalMemberIds);

      if (!next) {
        continue;
      }

      const selectedIds = next.filter(Boolean);

      if (new Set(selectedIds).size !== selectedIds.length) {
        continue;
      }

      const addedWrestlerIds = next.filter(
        (id, index) => id && id !== participantIds[index],
      );

      if (addedWrestlerIds.length === 0) {
        continue;
      }

      const matchesFilter = addedWrestlerIds.every((id) => {
        const wrestler = wrestlers.find((item) => item.id === id);

        return (
          wrestler !== undefined &&
          (genderFilter === "all" || wrestler.gender === genderFilter)
        );
      });

      if (!matchesFilter) {
        continue;
      }

      const assignmentKey = JSON.stringify(next);

      if (seenAssignments.has(assignmentKey)) {
        continue;
      }

      const getNames = (ids: string[]) =>
        ids
          .map(
            (id) =>
              wrestlers.find((wrestler) => wrestler.id === id)?.name ??
              "Unknown wrestler",
          )
          .join(" & ");

      suggestions.push({
        feudId: feud.id,
        label: `${getNames(ownMemberIds)} vs ${getNames(rivalMemberIds)}`,
        participantIds: next,
        addedWrestlerIds,
      });

      seenAssignments.add(assignmentKey);
      break;
    }
  }

  return suggestions;
}
