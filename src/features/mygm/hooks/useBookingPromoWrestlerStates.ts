import { useEffect, useMemo, useState } from "react";
import { getBookingPromoWrestlerStates } from "../services/bookingResultsService";
import type { BookingSegmentSummary } from "../types/booking.types";
import type { BookingPromoWrestlerState } from "../types/bookingResults.types";

interface PromoWrestlersState {
  scope: string;
  wrestlers: BookingPromoWrestlerState[];
  isLoading: boolean;
  errorMessage: string;
}

export function useBookingPromoWrestlerStates(
  careerId: string,
  segments: BookingSegmentSummary[],
) {
  const wrestlerIds = useMemo(() => {
    const ids = new Set<string>();

    for (const segment of segments) {
      if (
        segment.kind !== "promo" ||
        (segment.promo_type_id !== "turn" &&
          segment.promo_type_id !== "class_change")
      ) {
        continue;
      }

      for (const participant of segment.participants) {
        if (participant.role === "initiator") {
          ids.add(participant.wrestler_id);
        }
      }
    }

    return [...ids].sort();
  }, [segments]);

  const scope = JSON.stringify([careerId, wrestlerIds]);

  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<PromoWrestlersState>(() => ({
    scope,
    wrestlers: [],
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({
      scope,
      wrestlers: [],
      isLoading: true,
      errorMessage: "",
    });

    async function loadWrestlers() {
      try {
        const wrestlers = await getBookingPromoWrestlerStates(
          careerId,
          wrestlerIds,
          controller.signal,
        );

        if (!isActive) {
          return;
        }

        setState({
          scope,
          wrestlers,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          scope,
          wrestlers: [],
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Promo participant details could not be loaded.",
        });
      }
    }

    void loadWrestlers();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, wrestlerIds, scope, attempt]);

  function retry() {
    setState({
      scope,
      wrestlers: [],
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  const isCurrentScope = state.scope === scope;

  return {
    wrestlers: isCurrentScope ? state.wrestlers : [],
    isLoading: !isCurrentScope || state.isLoading,
    errorMessage: isCurrentScope ? state.errorMessage : "",
    retry,
  };
}
