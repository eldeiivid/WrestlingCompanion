import { useEffect, useMemo, useState } from "react";
import type { BookingSegmentSummary } from "../types/booking.types";
import type {
  BookingFeudResultDraft,
  BookingMatchResultDraft,
  BookingNewFeudMember,
  BookingPromoRatingId,
  BookingPromoResultDraft,
  BookingResultsDraft,
  BookingShowResultDraft,
} from "../types/bookingResults.types";

interface SegmentConfiguration {
  id: string;
  kind: "match" | "promo";
  signature: string;
  sides: number[];
}

interface DraftState {
  scope: string;
  draft: BookingResultsDraft;
  storageError: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPromoRatingId(value: unknown): value is BookingPromoRatingId {
  return (
    value === "excellent" ||
    value === "good" ||
    value === "okay" ||
    value === "weak" ||
    value === "embarrassing"
  );
}

function isMatchResult(value: unknown): value is BookingMatchResultDraft {
  if (!isRecord(value)) {
    return false;
  }

  const validWinner =
    value.winningSide === null ||
    (typeof value.winningSide === "number" &&
      Number.isInteger(value.winningSide) &&
      value.winningSide > 0);

  const validRating =
    value.ratingStars === null ||
    (typeof value.ratingStars === "number" &&
      Number.isFinite(value.ratingStars) &&
      value.ratingStars > 0 &&
      value.ratingStars <= 5);

  return validWinner && validRating;
}

function isPromoResult(value: unknown): value is BookingPromoResultDraft {
  if (
    !isRecord(value) ||
    !(value.ratingId === null || isPromoRatingId(value.ratingId))
  ) {
    return false;
  }

  if (value.effects === undefined) {
    return true;
  }

  if (!isRecord(value.effects)) {
    return false;
  }

  const validMoney =
    typeof value.effects.moneyChange === "string" &&
    /^-?\d*$/.test(value.effects.moneyChange);

  const validFans =
    typeof value.effects.fansChange === "string" &&
    /^-?\d*$/.test(value.effects.fansChange);

  return validMoney && validFans;
}

function isShowResult(value: unknown): value is BookingShowResultDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.moneyChange === "string" &&
    /^-?\d*$/.test(value.moneyChange) &&
    typeof value.fansChange === "string" &&
    /^-?\d*$/.test(value.fansChange)
  );
}

function isNewFeudMember(value: unknown): value is BookingNewFeudMember {
  return (
    isRecord(value) &&
    typeof value.wrestlerId === "string" &&
    value.wrestlerId.trim() !== "" &&
    (value.side === 1 || value.side === 2)
  );
}

function isFeudResult(value: unknown): value is BookingFeudResultDraft {
  if (!isRecord(value)) {
    return false;
  }

  switch (value.action) {
    case "none":
      return true;

    case "create":
      return (
        (value.kind === "singles" || value.kind === "tag_team") &&
        Array.isArray(value.members) &&
        value.members.every(isNewFeudMember)
      );

    case "increase":
      return typeof value.feudId === "string" && value.feudId.trim() !== "";

    case "resolve":
      return (
        typeof value.feudId === "string" &&
        value.feudId.trim() !== "" &&
        (value.winningSide === null ||
          value.winningSide === 1 ||
          value.winningSide === 2)
      );

    default:
      return false;
  }
}

function createEmptyDraft(eventId: string): BookingResultsDraft {
  return {
    eventId,
    matches: {},
    promos: {},
    show: {
      moneyChange: "",
      fansChange: "",
    },
    feuds: {},
  };
}

function getConfigurations(
  segments: BookingSegmentSummary[],
): SegmentConfiguration[] {
  return segments
    .map((segment): SegmentConfiguration => {
      if (segment.kind === "match") {
        const participants = [...segment.participants]
          .sort(
            (first, second) =>
              first.side - second.side ||
              first.wrestler_id.localeCompare(second.wrestler_id),
          )
          .map((participant) => ({
            id: participant.wrestler_id,
            side: participant.side,
          }));

        return {
          id: segment.id,
          kind: "match",
          sides: [
            ...new Set(participants.map((participant) => participant.side)),
          ],
          signature: JSON.stringify({
            format: segment.label,
            stipulation: segment.stipulation_name,
            participants,
            titleId: segment.title?.id ?? null,
            interference: segment.interference
              ? {
                  attackerId: segment.interference.wrestler_id,
                  targetId: segment.interference.target_wrestler_id,
                }
              : null,
          }),
        };
      }

      const participants = [...segment.participants]
        .sort(
          (first, second) =>
            first.role.localeCompare(second.role) ||
            first.wrestler_id.localeCompare(second.wrestler_id),
        )
        .map((participant) => ({
          id: participant.wrestler_id,
          role: participant.role,
        }));

      return {
        id: segment.id,
        kind: "promo",
        sides: [],
        signature: JSON.stringify({
          type: segment.promo_type_id,
          participants,
        }),
      };
    })
    .sort((first, second) => first.id.localeCompare(second.id));
}

function restoreDraft(
  storageKey: string,
  eventId: string,
  configurations: SegmentConfiguration[],
): Pick<DraftState, "draft" | "storageError"> {
  const draft = createEmptyDraft(eventId);

  try {
    const storedValue = localStorage.getItem(storageKey);

    if (!storedValue) {
      return { draft, storageError: "" };
    }

    const stored: unknown = JSON.parse(storedValue);

    if (
      !isRecord(stored) ||
      stored.version !== 1 ||
      stored.eventId !== eventId ||
      !isRecord(stored.matches)
    ) {
      throw new Error("Invalid results draft.");
    }

    const storedPromos = isRecord(stored.promos) ? stored.promos : {};
    const storedFeuds = isRecord(stored.feuds) ? stored.feuds : {};

    if (isShowResult(stored.show)) {
      draft.show = {
        moneyChange: stored.show.moneyChange,
        fansChange: stored.show.fansChange,
      };
    }

    for (const configuration of configurations) {
      const feudEntry = storedFeuds[configuration.id];

      if (
        isRecord(feudEntry) &&
        feudEntry.signature === configuration.signature &&
        isFeudResult(feudEntry.result)
      ) {
        draft.feuds[configuration.id] = feudEntry.result;
      }

      const entries =
        configuration.kind === "match" ? stored.matches : storedPromos;

      const entry = entries[configuration.id];

      if (!isRecord(entry) || entry.signature !== configuration.signature) {
        continue;
      }

      if (
        configuration.kind === "match" &&
        isMatchResult(entry.result) &&
        (entry.result.winningSide === null ||
          configuration.sides.includes(entry.result.winningSide))
      ) {
        draft.matches[configuration.id] = {
          winningSide: entry.result.winningSide,
          ratingStars: entry.result.ratingStars,
        };
      }

      if (configuration.kind === "promo" && isPromoResult(entry.result)) {
        draft.promos[configuration.id] = {
          ratingId: entry.result.ratingId,
          effects: {
            moneyChange: entry.result.effects?.moneyChange ?? "",
            fansChange: entry.result.effects?.fansChange ?? "",
          },
        };
      }
    }

    return { draft, storageError: "" };
  } catch {
    return {
      draft,
      storageError: "The saved results draft could not be restored.",
    };
  }
}

export function useBookingResultsDraft(
  careerId: string,
  eventId: string,
  segments: BookingSegmentSummary[],
) {
  const storageKey = `wc:mygm:results:v1:${careerId}:${eventId}`;

  const configurations = useMemo(() => getConfigurations(segments), [segments]);

  const scope = JSON.stringify([storageKey, configurations]);

  const [state, setState] = useState<DraftState>(() => ({
    scope,
    ...restoreDraft(storageKey, eventId, configurations),
  }));

  useEffect(() => {
    setState((current) => {
      if (current.scope === scope) {
        return current;
      }

      return {
        scope,
        ...restoreDraft(storageKey, eventId, configurations),
      };
    });
  }, [scope, storageKey, eventId, configurations]);

  useEffect(() => {
    if (state.scope !== scope) {
      return;
    }

    const matches: Record<
      string,
      { signature: string; result: BookingMatchResultDraft }
    > = {};

    const promos: Record<
      string,
      { signature: string; result: BookingPromoResultDraft }
    > = {};

    const feuds: Record<
      string,
      { signature: string; result: BookingFeudResultDraft }
    > = {};

    for (const configuration of configurations) {
      const feudResult = state.draft.feuds[configuration.id];

      if (feudResult) {
        feuds[configuration.id] = {
          signature: configuration.signature,
          result: feudResult,
        };
      }

      if (configuration.kind === "match") {
        const result = state.draft.matches[configuration.id];

        if (result) {
          matches[configuration.id] = {
            signature: configuration.signature,
            result,
          };
        }
      } else {
        const result = state.draft.promos[configuration.id];

        if (result) {
          promos[configuration.id] = {
            signature: configuration.signature,
            result,
          };
        }
      }
    }

    try {
      const hasShowResult =
        state.draft.show.moneyChange !== "" ||
        state.draft.show.fansChange !== "";

      if (
        Object.keys(matches).length === 0 &&
        Object.keys(promos).length === 0 &&
        Object.keys(feuds).length === 0 &&
        !hasShowResult
      ) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            version: 1,
            eventId,
            matches,
            promos,
            show: state.draft.show,
            feuds,
          }),
        );
      }
    } catch {
      const message = "Your results draft could not be saved on this device.";

      setState((current) =>
        current.scope !== scope || current.storageError === message
          ? current
          : { ...current, storageError: message },
      );
    }
  }, [state.scope, state.draft, scope, storageKey, eventId, configurations]);

  function updateMatchResult(
    segmentId: string,
    changes: Partial<BookingMatchResultDraft>,
  ) {
    const configuration = configurations.find(
      (segment) => segment.id === segmentId && segment.kind === "match",
    );

    if (!configuration) {
      return;
    }

    setState((current) => {
      if (current.scope !== scope) {
        return current;
      }

      const result: BookingMatchResultDraft = {
        winningSide: null,
        ratingStars: null,
        ...current.draft.matches[segmentId],
        ...changes,
      };

      if (
        !isMatchResult(result) ||
        (result.winningSide !== null &&
          !configuration.sides.includes(result.winningSide))
      ) {
        return current;
      }

      return {
        ...current,
        draft: {
          ...current.draft,
          matches: {
            ...current.draft.matches,
            [segmentId]: result,
          },
        },
      };
    });
  }

  function updatePromoResult(
    segmentId: string,
    changes: Partial<BookingPromoResultDraft>,
  ) {
    const configuration = configurations.find(
      (segment) => segment.id === segmentId && segment.kind === "promo",
    );

    if (!configuration) {
      return;
    }

    setState((current) => {
      if (current.scope !== scope) {
        return current;
      }

      const previous = current.draft.promos[segmentId];

      const result: BookingPromoResultDraft = {
        ratingId: previous?.ratingId ?? null,
        ...changes,
        effects: {
          moneyChange: previous?.effects?.moneyChange ?? "",
          fansChange: previous?.effects?.fansChange ?? "",
          ...changes.effects,
        },
      };

      if (!isPromoResult(result)) {
        return current;
      }

      return {
        ...current,
        draft: {
          ...current.draft,
          promos: {
            ...current.draft.promos,
            [segmentId]: result,
          },
        },
      };
    });
  }

  function updateShowResult(changes: Partial<BookingShowResultDraft>) {
    setState((current) => {
      if (current.scope !== scope) {
        return current;
      }

      const result: BookingShowResultDraft = {
        ...current.draft.show,
        ...changes,
      };

      if (!isShowResult(result)) {
        return current;
      }

      return {
        ...current,
        draft: {
          ...current.draft,
          show: result,
        },
      };
    });
  }

  function updateFeudResult(segmentId: string, result: BookingFeudResultDraft) {
    const segment = segments.find((item) => item.id === segmentId);

    const supportsFeuds =
      segment?.kind === "match" ||
      (segment?.kind === "promo" &&
        (segment.promo_type_id === "call_out" ||
          segment.promo_type_id === "tag_call_out"));

    if (!supportsFeuds || !isFeudResult(result)) {
      return;
    }

    setState((current) => {
      if (current.scope !== scope) {
        return current;
      }

      return {
        ...current,
        draft: {
          ...current.draft,
          feuds: {
            ...current.draft.feuds,
            [segmentId]: result,
          },
        },
      };
    });
  }

  function clearDraft() {
    let storageError = "";

    try {
      localStorage.removeItem(storageKey);
    } catch {
      storageError = "The saved results draft could not be removed.";
    }

    setState({
      scope,
      draft: createEmptyDraft(eventId),
      storageError,
    });
  }

  const isLoadingDraft = state.scope !== scope;

  const visibleDraft: BookingResultsDraft = isLoadingDraft
    ? createEmptyDraft(eventId)
    : state.draft;

  return {
    draft: visibleDraft,
    isLoadingDraft,
    storageError: isLoadingDraft ? "" : state.storageError,
    updateMatchResult,
    updatePromoResult,
    updateShowResult,
    updateFeudResult,
    clearDraft,
  };
}
