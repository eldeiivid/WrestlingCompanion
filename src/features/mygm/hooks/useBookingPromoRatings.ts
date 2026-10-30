import { useEffect, useState } from "react";
import { getPromoRatings } from "../services/bookingResultsService";
import type { BookingPromoRatingOption } from "../types/bookingResults.types";

export function useBookingPromoRatings() {
  const [ratings, setRatings] = useState<BookingPromoRatingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setIsLoading(true);
    setErrorMessage("");

    async function loadRatings() {
      try {
        const data = await getPromoRatings(controller.signal);

        if (!isActive) {
          return;
        }

        setRatings(data);
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Promo ratings could not be loaded.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadRatings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setAttempt((current) => current + 1);
  }

  return {
    ratings,
    isLoading,
    errorMessage,
    retry,
  };
}
