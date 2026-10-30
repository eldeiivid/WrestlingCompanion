import { useEffect, useState } from "react";

import { getSeasonTransition } from "../../services/season-draft/seasonDraftService";

import type { SeasonTransitionData } from "../../types/season-draft/seasonDraft.types";

interface SeasonTransitionState {
  key: string;
  data: SeasonTransitionData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useSeasonTransition(careerId: string) {
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<SeasonTransitionState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const requestKey = JSON.stringify([careerId, retryCount]);

  useEffect(() => {
    if (!careerId) {
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

    async function loadTransition() {
      try {
        const data = await getSeasonTransition(careerId, controller.signal);

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
              : "Unable to load the season transition. Please try again.",
        });
      }
    }

    void loadTransition();

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, requestKey]);

  const isCurrentRequest = state.key === requestKey;

  const isLoading = Boolean(careerId) && (!isCurrentRequest || state.isLoading);

  const errorMessage = !careerId
    ? "The career identifier is missing."
    : isCurrentRequest
      ? state.errorMessage
      : "";

  const isReady =
    Boolean(careerId) &&
    isCurrentRequest &&
    !state.isLoading &&
    !state.errorMessage;

  const data = isReady ? state.data : null;

  function retry() {
    setRetryCount((previous) => previous + 1);
  }

  return {
    data,
    isLoading,
    isReady,
    errorMessage,
    hasPendingTransition: isReady && data !== null,
    retry,
  };
}
