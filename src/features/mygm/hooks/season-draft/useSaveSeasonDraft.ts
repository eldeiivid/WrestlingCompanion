import { useEffect, useRef, useState } from "react";

import { saveSeasonDraft } from "../../services/season-draft/seasonDraftService";

import type {
  SaveSeasonDraftInput,
  SaveSeasonDraftResult,
} from "../../types/season-draft/seasonDraft.types";

export function useSaveSeasonDraft() {
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
    input: SaveSeasonDraftInput,
  ): Promise<SaveSeasonDraftResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    setErrorMessage("");

    try {
      return await saveSeasonDraft(input);
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to save the draft selection. Please try again.",
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
