import { useEffect, useState } from "react";

import { getMarketProfile } from "../../services/market/marketService";

import type { MarketProfileData } from "../../types/market/marketProfile.types";

interface MarketProfileState {
  key: string;
  data: MarketProfileData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useMarketProfile(
  careerId: string,
  catalogWrestlerId: string | undefined,
  historyLimit = 5,
) {
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<MarketProfileState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const requestKey = JSON.stringify([
    careerId,
    catalogWrestlerId,
    historyLimit,
    retryCount,
  ]);

  useEffect(() => {
    if (!careerId || !catalogWrestlerId) {
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

    async function loadProfile(wrestlerId: string) {
      try {
        const data = await getMarketProfile(
          careerId,
          wrestlerId,
          controller.signal,
          historyLimit,
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
              : "Unable to load the wrestler profile. Please try again.",
        });
      }
    }

    void loadProfile(catalogWrestlerId);

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, catalogWrestlerId, historyLimit, requestKey]);

  const hasRequiredIds = Boolean(careerId && catalogWrestlerId);
  const isCurrentRequest = state.key === requestKey;

  const isLoading = hasRequiredIds && (!isCurrentRequest || state.isLoading);

  const errorMessage = !hasRequiredIds
    ? "The career or wrestler identifier is missing."
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
