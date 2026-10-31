import { useEffect, useState } from "react";

import { mygmService } from "../services/mygmService";

import type { MyGmCareerSummary } from "../types/mygm.types";

export function useMyGmCareers(ownerId: string | undefined) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [careers, setCareers] = useState<MyGmCareerSummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setCareers([]);
    setErrorMessage("");

    if (!ownerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    async function loadCareers() {
      try {
        const result = await mygmService.getCareers(
          ownerId!,
          controller.signal,
        );

        if (!active) return;

        setCareers(result);
      } catch {
        if (!active) return;

        setErrorMessage("Unable to load your careers. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCareers();

    return () => {
      active = false;
      controller.abort();
    };
  }, [ownerId, attempt]);

  function retry() {
    setAttempt((value) => value + 1);
  }

  return { careers, isLoading, errorMessage, retry };
}
