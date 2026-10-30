import { useEffect, useState } from "react";

import { getSeasonDraftReview } from "../../services/season-draft/seasonDraftService";

import type { SeasonDraftReviewData } from "../../types/season-draft/seasonDraftReview.types";

interface SeasonDraftReviewState {
  key: string;
  data: SeasonDraftReviewData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useSeasonDraftReview(careerId: string, transitionId: string) {
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<SeasonDraftReviewState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const requestKey = JSON.stringify([careerId, transitionId, retryCount]);

  useEffect(() => {
    if (!careerId || !transitionId) {
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

    async function loadReview() {
      try {
        const data = await getSeasonDraftReview(
          careerId,
          transitionId,
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
              : "Unable to load the season draft review. Please try again.",
        });
      }
    }

    void loadReview();

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, transitionId, requestKey]);

  const hasRequiredIds = Boolean(careerId && transitionId);
  const isCurrentRequest = state.key === requestKey;

  const isLoading = hasRequiredIds && (!isCurrentRequest || state.isLoading);

  const errorMessage = !hasRequiredIds
    ? "The career or season transition identifier is missing."
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
