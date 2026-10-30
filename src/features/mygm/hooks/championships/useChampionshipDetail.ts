import { useEffect, useState } from "react";

import { getChampionshipDetail } from "../../services/championships/championshipDetailService";

import type { ChampionshipDetailData } from "../../types/championships/championshipDetail.types";

interface ChampionshipDetailState {
  key: string;
  data: ChampionshipDetailData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useChampionshipDetail(
  careerId: string,
  titleId: string | undefined,
) {
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<ChampionshipDetailState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const requestKey = JSON.stringify([careerId, titleId, retryCount]);

  useEffect(() => {
    if (!careerId || !titleId) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    setState({
      key: requestKey,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadDetail(championshipId: string) {
      try {
        const data = await getChampionshipDetail(
          careerId,
          championshipId,
          controller.signal,
        );

        if (!active) {
          return;
        }

        setState({
          key: requestKey,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!active || controller.signal.aborted) {
          return;
        }

        setState({
          key: requestKey,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unable to load the championship. Please try again.",
        });
      }
    }

    void loadDetail(titleId);

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, titleId, requestKey]);

  const hasRequiredIds = Boolean(careerId && titleId);
  const isCurrentRequest = state.key === requestKey;

  const isLoading = hasRequiredIds && (!isCurrentRequest || state.isLoading);

  const errorMessage = !hasRequiredIds
    ? "The career or championship identifier is missing."
    : isCurrentRequest
      ? state.errorMessage
      : "";

  const data =
    hasRequiredIds &&
    isCurrentRequest &&
    !state.isLoading &&
    !state.errorMessage
      ? state.data
      : null;

  function retry() {
    setRetryCount((previous) => previous + 1);
  }

  return {
    data,
    isLoading,
    errorMessage,
    retry,
  };
}
