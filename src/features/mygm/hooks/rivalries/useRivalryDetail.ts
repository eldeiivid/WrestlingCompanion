import { useEffect, useState } from "react";
import { getRivalryDetail } from "../../services/rivalries/rivalriesService";
import type { RivalryDetailData } from "../../types/rivalries/rivalries.types";

interface RivalryDetailState {
  scope: string;
  data: RivalryDetailData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useRivalryDetail(
  careerId: string,
  feudId: string | null,
  historyLimit = 5,
) {
  const scope = JSON.stringify([careerId, feudId, historyLimit]);

  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<RivalryDetailState>(() => ({
    scope,
    data: null,
    isLoading: Boolean(feudId),
    errorMessage: "",
  }));

  useEffect(() => {
    if (!feudId) {
      setState({
        scope,
        data: null,
        isLoading: false,
        errorMessage: "",
      });

      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadDetail(selectedFeudId: string) {
      try {
        const data = await getRivalryDetail(
          careerId,
          selectedFeudId,
          controller.signal,
          historyLimit,
        );

        if (!isActive) {
          return;
        }

        setState({
          scope,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          scope,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Rivalry details could not be loaded.",
        });
      }
    }

    void loadDetail(feudId);

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, feudId, historyLimit, scope, attempt]);

  const isCurrentScope = state.scope === scope;

  const isLoading = Boolean(feudId) && (!isCurrentScope || state.isLoading);

  function retry() {
    if (!feudId || isLoading) {
      return;
    }

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  return {
    data: feudId && isCurrentScope ? state.data : null,
    isLoading,
    errorMessage: feudId && isCurrentScope ? state.errorMessage : "",
    retry,
  };
}
