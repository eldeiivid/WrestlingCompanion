import { useEffect, useMemo, useState } from "react";

import { getNewsHistory } from "../../services/news/newsService";

import type {
  GetNewsHistoryInput,
  NewsHistoryFilters,
  NewsHistoryPage,
} from "../../types/news/newsHistory.types";

const defaultFilters: NewsHistoryFilters = {
  eventType: "all",
  search: "",
};

interface NewsHistoryControls {
  careerId: string;
  pageSize: number;
  filters: NewsHistoryFilters;
  page: number;
}

interface NewsHistoryRequestState {
  key: string;
  data: NewsHistoryPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useNewsHistory(careerId: string, pageSize = 10) {
  const [controls, setControls] = useState<NewsHistoryControls>(() => ({
    careerId,
    pageSize,
    filters: { ...defaultFilters },
    page: 1,
  }));

  const [debouncedSearch, setDebouncedSearch] = useState(() => ({
    careerId,
    value: "",
  }));

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<NewsHistoryRequestState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const isCurrentScope =
    controls.careerId === careerId && controls.pageSize === pageSize;

  const filters = isCurrentScope ? controls.filters : defaultFilters;
  const requestedPage = isCurrentScope ? controls.page : 1;

  const search =
    debouncedSearch.careerId === careerId ? debouncedSearch.value : "";

  const isSearching = filters.search !== search;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch({
        careerId,
        value: filters.search,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [careerId, filters.search]);

  const input = useMemo<GetNewsHistoryInput>(
    () => ({
      careerId,
      eventType: filters.eventType,
      search,
      page: requestedPage,
      pageSize,
    }),
    [careerId, filters.eventType, search, requestedPage, pageSize],
  );

  const requestKey = JSON.stringify([input, retryCount]);

  useEffect(() => {
    if (!careerId || isSearching) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    setRequest({
      key: requestKey,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadHistory() {
      try {
        const data = await getNewsHistory(input, controller.signal);

        if (!active) {
          return;
        }

        setRequest({
          key: requestKey,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!active || controller.signal.aborted) {
          return;
        }

        setRequest({
          key: requestKey,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unable to load news history. Please try again.",
        });
      }
    }

    void loadHistory();

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, input, requestKey, isSearching]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading =
    Boolean(careerId) &&
    (isSearching || !isCurrentRequest || request.isLoading);

  const errorMessage = !careerId
    ? "The career identifier is missing."
    : !isSearching && isCurrentRequest
      ? request.errorMessage
      : "";

  const data =
    careerId &&
    !isLoading &&
    !errorMessage &&
    request.data?.career_id === careerId
      ? request.data
      : null;

  function updateFilters(changes: Partial<NewsHistoryFilters>) {
    setControls((previous) => {
      const previousFilters =
        previous.careerId === careerId && previous.pageSize === pageSize
          ? previous.filters
          : defaultFilters;

      return {
        careerId,
        pageSize,
        filters: {
          ...previousFilters,
          ...changes,
        },
        page: 1,
      };
    });
  }

  function resetFilters() {
    setControls({
      careerId,
      pageSize,
      filters: { ...defaultFilters },
      page: 1,
    });
  }

  function goToPage(nextPage: number) {
    if (!careerId || !Number.isSafeInteger(nextPage) || nextPage < 1) {
      return;
    }

    if (data && nextPage > Math.max(1, data.total_pages)) {
      return;
    }

    setControls((previous) => ({
      careerId,
      pageSize,
      filters:
        previous.careerId === careerId && previous.pageSize === pageSize
          ? previous.filters
          : { ...defaultFilters },
      page: nextPage,
    }));
  }

  function retry() {
    setRetryCount((previous) => previous + 1);
  }

  return {
    data,
    filters,
    page: data?.page ?? requestedPage,
    isLoading,
    isSearching,
    errorMessage,
    updateFilters,
    resetFilters,
    goToPage,
    retry,
  };
}
