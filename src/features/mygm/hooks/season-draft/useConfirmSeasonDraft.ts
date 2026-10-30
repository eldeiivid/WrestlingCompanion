import { useCallback, useEffect, useRef, useState } from "react";

import {
  confirmSeasonDraft,
  type ConfirmSeasonDraftInput,
} from "../../services/season-draft/seasonDraftService";

import type { SeasonDraftConfirmationResult } from "../../types/season-draft/seasonDraftConfirmation.types";

export function useConfirmSeasonDraft() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const confirm = useCallback(
    async (
      input: ConfirmSeasonDraftInput,
    ): Promise<SeasonDraftConfirmationResult | null> => {
      if (!mountedRef.current || inFlightRef.current) {
        return null;
      }

      inFlightRef.current = true;
      setIsConfirming(true);
      setErrorMessage("");

      try {
        const result = await confirmSeasonDraft(input);

        return result;
      } catch (error: unknown) {
        if (mountedRef.current) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to confirm the season draft. Please try again.",
          );
        }

        return null;
      } finally {
        inFlightRef.current = false;

        if (mountedRef.current) {
          setIsConfirming(false);
        }
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    if (mountedRef.current && !inFlightRef.current) {
      setErrorMessage("");
    }
  }, []);

  return {
    isConfirming,
    errorMessage,
    confirm,
    clearError,
  };
}
