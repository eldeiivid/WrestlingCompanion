import { useEffect, useRef, useState } from "react";

import { saveSeasonBalances } from "../../services/season-draft/seasonDraftService";

import type {
  SaveSeasonBalancesInput,
  SaveSeasonBalancesResult,
} from "../../types/season-draft/seasonDraft.types";

export function useSaveSeasonBalances() {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function save(
    input: SaveSeasonBalancesInput,
  ): Promise<SaveSeasonBalancesResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    setErrorMessage("");

    try {
      return await saveSeasonBalances(input);
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to save the starting balances. Please try again.",
        );
      }

      return null;
    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }

  function clearError() {
    if (!mountedRef.current || inFlightRef.current) {
      return;
    }

    setErrorMessage("");
  }

  return {
    isSaving,
    errorMessage,
    save,
    clearError,
  };
}
