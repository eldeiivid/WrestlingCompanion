import { useEffect, useRef, useState } from "react";
import { closeShow as closeShowRequest } from "../services/bookingResultsService";
import type { CloseBookingShowInput } from "../types/bookingResults.types";

export function useCloseBookingShow() {
  const [isClosing, setIsClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlight = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  async function closeShow(input: CloseBookingShowInput): Promise<boolean> {
    if (inFlight.current || !isMounted.current) {
      return false;
    }

    inFlight.current = true;
    setIsClosing(true);
    setErrorMessage("");

    try {
      // Capture the submitted results before starting the request.
      const snapshot = structuredClone(input);

      await closeShowRequest(snapshot);

      return isMounted.current;
    } catch (error: unknown) {
      if (isMounted.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The show could not be closed. Please try again.",
        );
      }

      return false;
    } finally {
      inFlight.current = false;

      if (isMounted.current) {
        setIsClosing(false);
      }
    }
  }

  function clearError() {
    if (isMounted.current && !inFlight.current) {
      setErrorMessage("");
    }
  }

  return {
    isClosing,
    errorMessage,
    closeShow,
    clearError,
  };
}
