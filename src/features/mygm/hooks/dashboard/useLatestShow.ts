import { useEffect, useState } from "react";
import { getLatestShow } from "../../services/show-history/showHistoryService";
import type { ShowDetailData } from "../../types/show-history/showDetail.types";

interface LatestShowState {
  careerId: string;
  data: ShowDetailData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useLatestShow(careerId: string) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<LatestShowState>(() => ({
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

    async function loadLatestShow() {
      try {
        const data = await getLatestShow(careerId, controller.signal);

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
              : "The latest show could not be loaded.",
        });
      }
    }

    void loadLatestShow();

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
