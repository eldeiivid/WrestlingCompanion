import { useEffect, useState } from "react";
import { getFeaturedRivalries } from "../../services/rivalries/rivalriesService";
import type { FeaturedRivalriesData } from "../../types/rivalries/rivalries.types";

interface FeaturedRivalriesState {
  careerId: string;
  data: FeaturedRivalriesData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useFeaturedRivalries(careerId: string) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<FeaturedRivalriesState>(() => ({
    careerId,
    data: null,
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({
      careerId,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadRivalries() {
      try {
        const data = await getFeaturedRivalries(careerId, controller.signal);

        if (!isActive) {
          return;
        }

        setState({
          careerId,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          careerId,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Featured rivalries could not be loaded.",
        });
      }
    }

    void loadRivalries();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, attempt]);

  const isCurrentCareer = state.careerId === careerId;
  const isLoading = !isCurrentCareer || state.isLoading;

  function retry() {
    if (isLoading) {
      return;
    }

    setState({
      careerId,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  return {
    data: isCurrentCareer ? state.data : null,
    isLoading,
    errorMessage: isCurrentCareer ? state.errorMessage : "",
    retry,
  };
}
