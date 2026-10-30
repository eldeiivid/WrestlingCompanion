import { useEffect, useState } from "react";

import { championshipsService } from "../services/championshipsService";
import type { CatalogChampionship } from "../types/championships.types";

export function useChampionshipCatalog() {
  const [titles, setTitles] = useState<CatalogChampionship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setErrorMessage("");

    async function loadTitles() {
      try {
        const result = await championshipsService.getCatalog(controller.signal);

        if (!active) return;

        setTitles(result);
      } catch {
        if (!active) return;

        setErrorMessage("Unable to load championships. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadTitles();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setAttempt((value) => value + 1);
  }

  return {
    titles,
    isLoading,
    errorMessage,
    retry,
  };
}
