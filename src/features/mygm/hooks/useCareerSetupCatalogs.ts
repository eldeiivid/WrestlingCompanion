import { useEffect, useState } from "react";

import { careerSetupService } from "../services/careerSetupService";
import type { CareerSetupCatalogs } from "../types/careerSetup.types";

export function useCareerSetupCatalogs() {
  const [catalogs, setCatalogs] = useState<CareerSetupCatalogs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setErrorMessage("");
    setCatalogs(null);

    async function loadCatalogs() {
      try {
        const result = await careerSetupService.getCatalogs(controller.signal);

        if (!active) return;

        if (
          result.brands.length === 0 ||
          result.managers.length === 0 ||
          result.difficulties.length === 0
        ) {
          setErrorMessage(
            "Some setup options are unavailable. Please try again later.",
          );
          return;
        }

        setCatalogs(result);
      } catch {
        if (!active) return;

        setErrorMessage(
          "Unable to load career setup options. Please try again.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCatalogs();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setAttempt((value) => value + 1);
  }

  return {
    catalogs,
    isLoading,
    errorMessage,
    retry,
  };
}
