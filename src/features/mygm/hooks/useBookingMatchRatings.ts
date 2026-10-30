import { useEffect, useState } from "react";
import { getMatchRatings } from "../services/bookingResultsService";
import type { BookingMatchRatingOption } from "../types/bookingResults.types";

interface MatchRatingsState {
  ratings: BookingMatchRatingOption[];
  isLoading: boolean;
  errorMessage: string;
}

export function useBookingMatchRatings() {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<MatchRatingsState>({
    ratings: [],
    isLoading: true,
    errorMessage: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({
      ratings: [],
      isLoading: true,
      errorMessage: "",
    });

    getMatchRatings(controller.signal)
      .then((ratings) => {
        if (!active) return;

        setState({
          ratings,
          isLoading: false,
          errorMessage: "",
        });
      })
      .catch((error: unknown) => {
        if (!active) return;

        const message =
          error instanceof Error && error.message
            ? error.message
            : "Unable to load match ratings. Please try again.";

        setState({
          ratings: [],
          isLoading: false,
          errorMessage: message,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setAttempt((current) => current + 1);
  }

  return {
    ratings: state.ratings,
    isLoading: state.isLoading,
    errorMessage: state.errorMessage,
    retry,
  };
}
