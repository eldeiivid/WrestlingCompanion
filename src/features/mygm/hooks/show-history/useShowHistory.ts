import { useEffect, useState } from "react";
import { getShowHistory } from "../../services/show-history/showHistoryService";
import type { ShowHistoryPage } from "../../types/show-history/showHistory.types";

interface PaginationState {
  careerId: string;
  page: number;
}

interface ShowHistoryState {
  scope: string;
  data: ShowHistoryPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useShowHistory(careerId: string, pageSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    careerId,
    page: 1,
  }));

  const [attempt, setAttempt] = useState(0);

  const requestedPage = pagination.careerId === careerId ? pagination.page : 1;

  const scope = JSON.stringify([careerId, requestedPage, pageSize]);

  const [state, setState] = useState<ShowHistoryState>(() => ({
    scope,
    data: null,
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadHistory() {
      try {
        const data = await getShowHistory(
          careerId,
          requestedPage,
          pageSize,
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
              : "Show history could not be loaded.",
        });
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, requestedPage, pageSize, scope, attempt]);

  const isCurrentScope = state.scope === scope;

  const data = isCurrentScope ? state.data : null;
  const isLoading = !isCurrentScope || state.isLoading;
  const errorMessage = isCurrentScope ? state.errorMessage : "";

  function goToPage(nextPage: number) {
    if (
      isLoading ||
      !data ||
      !Number.isSafeInteger(nextPage) ||
      nextPage < 1 ||
      nextPage > data.total_pages ||
      nextPage === data.page
    ) {
      return;
    }

    setPagination({
      careerId,
      page: nextPage,
    });
  }

  function retry() {
    if (isLoading) {
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
    data,
    isLoading,
    errorMessage,
    page: data?.page ?? requestedPage,
    goToPage,
    retry,
  };
}
