import { useEffect, useState } from "react";
import { getShowDetail } from "../../services/show-history/showHistoryService";
import type { ShowDetailData } from "../../types/show-history/showDetail.types";

interface ShowDetailState {
  scope: string;
  data: ShowDetailData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useShowDetail(careerId: string, eventId: string | undefined) {
  const scope = JSON.stringify([careerId, eventId ?? ""]);
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<ShowDetailState>(() => ({
    scope,
    data: null,
    isLoading: Boolean(eventId),
    errorMessage: eventId ? "" : "No show was selected.",
  }));

  useEffect(() => {
    if (!eventId) {
      setState({
        scope,
        data: null,
        isLoading: false,
        errorMessage: "No show was selected.",
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

    async function loadDetail(selectedEventId: string) {
      try {
        const data = await getShowDetail(
          careerId,
          selectedEventId,
          controller.signal,
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
              : "Show details could not be loaded.",
        });
      }
    }

    void loadDetail(eventId);

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, eventId, scope, attempt]);

  const isCurrentScope = state.scope === scope;

  const isLoading = Boolean(eventId) && (!isCurrentScope || state.isLoading);

  function retry() {
    if (isLoading || !eventId) {
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
    data: isCurrentScope ? state.data : null,
    isLoading,
    errorMessage: !eventId
      ? "No show was selected."
      : isCurrentScope
        ? state.errorMessage
        : "",
    retry,
  };
}
