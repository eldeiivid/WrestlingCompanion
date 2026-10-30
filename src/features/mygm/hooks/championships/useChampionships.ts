import { useEffect, useMemo, useState } from "react";

import { getChampionships } from "../../services/championships/championshipsService";

import type {
  ChampionshipsFilters,
  ChampionshipsPage,
  GetChampionshipsInput,
} from "../../types/championships/championships.types";

const defaultFilters: ChampionshipsFilters = {
  gender: "all",
  category: "all",
  status: "all",
  search: "",
};

interface ChampionshipsControls {
  careerId: string;
  pageSize: number;
  filters: ChampionshipsFilters;
  page: number;
}

interface ChampionshipsRequestState {
  key: string;
  data: ChampionshipsPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useChampionships(careerId: string, pageSize = 12) {
  const [controls, setControls] = useState<ChampionshipsControls>(() => ({
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

  const [request, setRequest] = useState<ChampionshipsRequestState>({
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

  const input = useMemo<GetChampionshipsInput>(
    () => ({
      careerId,
      gender: filters.gender,
      category: filters.category,
      status: filters.status,
      search,
      page: requestedPage,
      pageSize,
    }),
    [
      careerId,
      filters.gender,
      filters.category,
      filters.status,
      search,
      requestedPage,
      pageSize,
    ],
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

    async function loadChampionships() {
      try {
        const data = await getChampionships(input, controller.signal);

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
              : "Unable to load championships. Please try again.",
        });
      }
    }

    void loadChampionships();

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

  function updateFilters(changes: Partial<ChampionshipsFilters>) {
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
    if (!Number.isSafeInteger(nextPage) || nextPage < 1) {
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
