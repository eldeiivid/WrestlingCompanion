import { useEffect, useMemo, useState } from "react";

import { getMarket } from "../../services/market/marketService";

import type {
  GetMarketInput,
  MarketFilters,
  MarketPage,
} from "../../types/market/market.types";

const defaultFilters: MarketFilters = {
  gender: "all",
  primaryClass: "all",
  role: "all",
  category: "all",
  search: "",
  sort: "name_asc",
};

interface MarketControls {
  careerId: string;
  filters: MarketFilters;
  page: number;
}

interface MarketRequestState {
  key: string;
  data: MarketPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useMarket(careerId: string, pageSize = 12) {
  const [controls, setControls] = useState<MarketControls>(() => ({
    careerId,
    filters: { ...defaultFilters },
    page: 1,
  }));

  const [debouncedSearch, setDebouncedSearch] = useState(() => ({
    careerId,
    value: "",
  }));

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<MarketRequestState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const filters =
    controls.careerId === careerId ? controls.filters : defaultFilters;

  const requestedPage = controls.careerId === careerId ? controls.page : 1;

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

  const input = useMemo<GetMarketInput>(
    () => ({
      careerId,
      gender: filters.gender,
      primaryClass: filters.primaryClass,
      role: filters.role,
      category: filters.category,
      search,
      sort: filters.sort,
      page: requestedPage,
      pageSize,
    }),
    [
      careerId,
      filters.gender,
      filters.primaryClass,
      filters.role,
      filters.category,
      filters.sort,
      search,
      requestedPage,
      pageSize,
    ],
  );

  const requestKey = JSON.stringify([input, retryCount]);

  useEffect(() => {
    if (isSearching) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    setRequest((previous) => ({
      key: requestKey,
      data: previous.data,
      isLoading: true,
      errorMessage: "",
    }));

    async function loadMarket() {
      try {
        const data = await getMarket(input, controller.signal);

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

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to load the market. Please try again.";

        setRequest((previous) => ({
          key: requestKey,
          data: previous.data,
          isLoading: false,
          errorMessage,
        }));
      }
    }

    void loadMarket();

    return () => {
      active = false;
      controller.abort();
    };
  }, [input, requestKey, isSearching]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading = isSearching || !isCurrentRequest || request.isLoading;

  const errorMessage =
    !isSearching && isCurrentRequest ? request.errorMessage : "";

  const data =
    !isLoading && !errorMessage && request.data?.career_id === careerId
      ? request.data
      : null;

  const availableClasses =
    request.data?.career_id === careerId ? request.data.available_classes : [];

  function updateFilters(changes: Partial<MarketFilters>) {
    setControls((previous) => {
      const currentFilters =
        previous.careerId === careerId ? previous.filters : defaultFilters;

      return {
        careerId,
        filters: {
          ...currentFilters,
          ...changes,
        },
        page: 1,
      };
    });
  }

  function resetFilters() {
    setControls({
      careerId,
      filters: { ...defaultFilters },
      page: 1,
    });
  }

  function goToPage(nextPage: number) {
    if (!Number.isSafeInteger(nextPage) || nextPage < 1) {
      return;
    }

    setControls((previous) => ({
      careerId,
      filters:
        previous.careerId === careerId
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
    availableClasses,
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
