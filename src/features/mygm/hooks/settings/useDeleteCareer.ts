import { useEffect, useRef, useState } from "react";

import { deleteCareer as removeCareer } from "../../services/settings/careerSettingsService";

import type {
  DeleteCareerInput,
  DeleteCareerResult,
} from "../../types/settings/careerSettings.types";

export function useDeleteCareer() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function deleteCareer(
    input: DeleteCareerInput,
  ): Promise<DeleteCareerResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsDeleting(true);
    setErrorMessage("");

    try {
      return await removeCareer(input);
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to delete the career. Please try again.",
        );
      }

      return null;
    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setIsDeleting(false);
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
    isDeleting,
    errorMessage,
    deleteCareer,
    clearError,
  };
}
