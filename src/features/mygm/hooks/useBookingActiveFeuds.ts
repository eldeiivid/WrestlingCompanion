import { useEffect, useState } from "react";
import { getBookingActiveFeuds } from "../services/bookingResultsService";
import type { BookingActiveFeud } from "../types/bookingResults.types";

interface FeudsState {
  careerId: string;
  eventId: string;
  feuds: BookingActiveFeud[];
  isLoading: boolean;
  errorMessage: string;
}

export function useBookingActiveFeuds(careerId: string, eventId: string) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<FeudsState>(() => ({
    careerId,
    eventId,
    feuds: [],
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({
      careerId,
      eventId,
      feuds: [],
      isLoading: true,
      errorMessage: "",
    });

    async function loadFeuds() {
      try {
        const feuds = await getBookingActiveFeuds(
          careerId,
          eventId,
          controller.signal,
        );

        if (!isActive) {
          return;
        }

        setState({
          careerId,
          eventId,
          feuds,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          careerId,
          eventId,
          feuds: [],
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Rivalries could not be loaded.",
        });
      }
    }

    void loadFeuds();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, eventId, attempt]);

  const isCurrentScope =
    state.careerId === careerId && state.eventId === eventId;

  function retry() {
    setState({
      careerId,
      eventId,
      feuds: [],
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  return {
    feuds: isCurrentScope ? state.feuds : [],
    isLoading: !isCurrentScope || state.isLoading,
    errorMessage: isCurrentScope ? state.errorMessage : "",
    retry,
  };
}
