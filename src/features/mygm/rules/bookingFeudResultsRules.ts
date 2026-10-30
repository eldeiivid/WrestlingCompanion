import type { BookingSegmentSummary } from "../types/booking.types";
import type {
  BookingActiveFeud,
  BookingFeudResultDraft,
  BookingFeudResultsDraft,
  BookingNewFeudMember,
} from "../types/bookingResults.types";

interface FeudParticipant {
  wrestlerId: string;
  name: string;
}

export interface BookingFeudCandidate {
  key: string;
  kind: "singles" | "tag_team";
  label: string;
  members: BookingNewFeudMember[];
}

export function supportsBookingFeudResults(
  segment: BookingSegmentSummary,
): boolean {
  return (
    segment.kind === "match" ||
    segment.promo_type_id === "call_out" ||
    segment.promo_type_id === "tag_call_out"
  );
}

function getMembersKey(members: readonly BookingNewFeudMember[]): string {
  const firstSide = members
    .filter((member) => member.side === 1)
    .map((member) => member.wrestlerId)
    .sort();

  const secondSide = members
    .filter((member) => member.side === 2)
    .map((member) => member.wrestlerId)
    .sort();

  // Reversing the two sides still represents the same rivalry.
  return JSON.stringify(
    [JSON.stringify(firstSide), JSON.stringify(secondSide)].sort(),
  );
}

function getCandidateKey(
  kind: BookingFeudCandidate["kind"],
  members: readonly BookingNewFeudMember[],
): string {
  return `${kind}:${getMembersKey(members)}`;
}

function createCandidate(
  firstSide: FeudParticipant[],
  secondSide: FeudParticipant[],
): BookingFeudCandidate | null {
  const isSingles = firstSide.length === 1 && secondSide.length === 1;

  const isTagTeam = firstSide.length === 2 && secondSide.length === 2;

  if (!isSingles && !isTagTeam) {
    return null;
  }

  const participants = [...firstSide, ...secondSide];

  const uniqueIds = new Set(
    participants.map((participant) => participant.wrestlerId),
  );

  if (
    uniqueIds.size !== participants.length ||
    participants.some((participant) => !participant.wrestlerId.trim())
  ) {
    return null;
  }

  const kind = isSingles ? "singles" : "tag_team";

  const members: BookingNewFeudMember[] = [
    ...firstSide.map((participant) => ({
      wrestlerId: participant.wrestlerId,
      side: 1 as const,
    })),
    ...secondSide.map((participant) => ({
      wrestlerId: participant.wrestlerId,
      side: 2 as const,
    })),
  ];

  const firstLabel = firstSide
    .map((participant) => participant.name)
    .join(" & ");

  const secondLabel = secondSide
    .map((participant) => participant.name)
    .join(" & ");

  return {
    key: getCandidateKey(kind, members),
    kind,
    label: `${firstLabel} vs ${secondLabel}`,
    members,
  };
}

export function getBookingFeudCandidates(
  segment: BookingSegmentSummary,
): BookingFeudCandidate[] {
  if (!supportsBookingFeudResults(segment)) {
    return [];
  }

  const candidates = new Map<string, BookingFeudCandidate>();

  function addCandidate(
    firstSide: FeudParticipant[],
    secondSide: FeudParticipant[],
  ) {
    const candidate = createCandidate(firstSide, secondSide);

    if (candidate) {
      candidates.set(candidate.key, candidate);
    }
  }

  if (segment.kind === "promo") {
    const initiators = segment.participants
      .filter((participant) => participant.role === "initiator")
      .map((participant) => ({
        wrestlerId: participant.wrestler_id,
        name: participant.name,
      }));

    const targets = segment.participants
      .filter((participant) => participant.role === "target")
      .map((participant) => ({
        wrestlerId: participant.wrestler_id,
        name: participant.name,
      }));

    addCandidate(initiators, targets);

    return [...candidates.values()];
  }

  const sides = new Map<number, FeudParticipant[]>();

  for (const participant of segment.participants) {
    const members = sides.get(participant.side) ?? [];

    members.push({
      wrestlerId: participant.wrestler_id,
      name: participant.name,
    });

    sides.set(participant.side, members);
  }

  const groups = [...sides.entries()]
    .sort(([firstSide], [secondSide]) => firstSide - secondSide)
    .map(([, members]) => members);

  for (let first = 0; first < groups.length; first += 1) {
    for (let second = first + 1; second < groups.length; second += 1) {
      addCandidate(groups[first], groups[second]);
    }
  }

  if (segment.interference) {
    addCandidate(
      [
        {
          wrestlerId: segment.interference.wrestler_id,
          name: segment.interference.wrestler_name,
        },
      ],
      [
        {
          wrestlerId: segment.interference.target_wrestler_id,
          name: segment.interference.target_wrestler_name,
        },
      ],
    );
  }

  return [...candidates.values()];
}

function getActiveFeudKey(feud: BookingActiveFeud): string {
  return getCandidateKey(
    feud.kind === "tag_team" ? "tag_team" : "singles",
    feud.members.map((member) => ({
      wrestlerId: member.wrestler_id,
      side: member.side,
    })),
  );
}

export function getCompatibleBookingFeuds(
  segment: BookingSegmentSummary,
  feuds: readonly BookingActiveFeud[],
): BookingActiveFeud[] {
  const candidateKeys = new Set(
    getBookingFeudCandidates(segment).map((candidate) => candidate.key),
  );

  return feuds.filter(
    (feud) =>
      (feud.kind === "singles" || feud.kind === "tag_team") &&
      candidateKeys.has(getActiveFeudKey(feud)),
  );
}

export function getBookingFeudResultError(
  segment: BookingSegmentSummary,
  result: BookingFeudResultDraft | undefined,
  feuds: readonly BookingActiveFeud[],
): string | null {
  if (!supportsBookingFeudResults(segment)) {
    return null;
  }

  if (!result) {
    return "Choose a rivalry outcome.";
  }

  if (result.action === "none") {
    return null;
  }

  const compatibleFeuds = getCompatibleBookingFeuds(segment, feuds);

  if (result.action === "create") {
    const candidates = getBookingFeudCandidates(segment);

    const key = getCandidateKey(result.kind, result.members);

    const candidate = candidates.find((option) => option.key === key);

    if (!candidate) {
      return "Choose valid opposing participants for the new rivalry.";
    }

    const alreadyExists = compatibleFeuds.some(
      (feud) => getActiveFeudKey(feud) === key,
    );

    if (alreadyExists) {
      return "These participants already have an active rivalry.";
    }

    return null;
  }

  const feud = compatibleFeuds.find((option) => option.id === result.feudId);

  if (!feud) {
    return "Choose an active rivalry involving opposing participants.";
  }

  if (result.action === "increase" && feud.level >= 4) {
    return "This rivalry has already reached level 4.";
  }

  if (
    result.action === "resolve" &&
    result.winningSide !== null &&
    !feud.members.some((member) => member.side === result.winningSide)
  ) {
    return "Choose a valid winning side for the rivalry.";
  }

  return null;
}

export function getBookingFeudContexts(
  segments: BookingSegmentSummary[],
  results: BookingFeudResultsDraft,
  initialFeuds: readonly BookingActiveFeud[],
  tick: number,
): Map<string, BookingActiveFeud[]> {
  const contexts = new Map<string, BookingActiveFeud[]>();

  let activeFeuds = [...initialFeuds];

  const orderedSegments = [...segments].sort(
    (first, second) => first.position - second.position,
  );

  for (const segment of orderedSegments) {
    // Each segment receives the state before its own action.
    contexts.set(segment.id, [...activeFeuds]);

    const result = results[segment.id];

    if (
      !supportsBookingFeudResults(segment) ||
      !result ||
      getBookingFeudResultError(segment, result, activeFeuds) !== null
    ) {
      continue;
    }

    if (result.action === "create") {
      const names = new Map(
        segment.participants.map((participant): [string, string] => [
          participant.wrestler_id,
          participant.name,
        ]),
      );

      if (segment.kind === "match" && segment.interference) {
        names.set(
          segment.interference.wrestler_id,
          segment.interference.wrestler_name,
        );

        names.set(
          segment.interference.target_wrestler_id,
          segment.interference.target_wrestler_name,
        );
      }

      const createdFeud: BookingActiveFeud = {
        // Temporary reference used only within this results draft.
        id: `draft:${segment.id}`,
        name: null,
        kind: result.kind,
        level: 1,
        started_tick: tick,
        members: result.members.map((member) => ({
          wrestler_id: member.wrestlerId,
          name: names.get(member.wrestlerId) ?? "Unknown wrestler",
          side: member.side,
        })),
      };

      activeFeuds = [...activeFeuds, createdFeud];
    }

    if (result.action === "increase") {
      activeFeuds = activeFeuds.map((feud) => {
        if (feud.id !== result.feudId) {
          return feud;
        }

        return {
          ...feud,
          level: getNextFeudLevel(feud.level),
        };
      });
    }

    if (result.action === "resolve") {
      activeFeuds = activeFeuds.filter((feud) => feud.id !== result.feudId);
    }
  }

  return contexts;
}

function getNextFeudLevel(
  level: BookingActiveFeud["level"],
): BookingActiveFeud["level"] {
  switch (level) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
    case 4:
      return 4;
  }
}
