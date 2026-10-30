import { useEffect, useRef, useState } from "react";

import { renameCareer as saveCareerName } from "../../services/settings/careerSettingsService";

import type {
  RenameCareerInput,
  RenameCareerResult,
} from "../../types/settings/careerSettings.types";

export function useRenameCareer() {
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

  async function rename(
    input: RenameCareerInput,
  ): Promise<RenameCareerResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    setErrorMessage("");

    try {
      return await saveCareerName(input);
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to rename the career. Please try again.",
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
    rename,
    clearError,
  };
}
