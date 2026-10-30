import { useEffect, useState } from "react";

import { getCareerSettings } from "../../services/settings/careerSettingsService";

import type { CareerSettingsData } from "../../types/settings/careerSettings.types";

interface CareerSettingsState {
  key: string;
  data: CareerSettingsData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useCareerSettings(careerId: string) {
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<CareerSettingsState>({
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

    async function loadSettings() {
      try {
        const data = await getCareerSettings(careerId, controller.signal);

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
              : "Unable to load career settings. Please try again.",
        });
      }
    }

    void loadSettings();

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

  const data =
    careerId && isCurrentRequest && !state.isLoading && !state.errorMessage
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
