import { useEffect, useMemo, useState } from "react";

import { getSeasonDraftOptions } from "../../services/season-draft/seasonDraftService";

import type {
  GetSeasonDraftOptionsInput,
  SeasonDraftFilters,
  SeasonDraftOptionsPage,
} from "../../types/season-draft/seasonDraftOptions.types";

const defaultFilters: SeasonDraftFilters = {
  gender: "all",
  primaryClass: "all",
  role: "all",
  category: "all",
  search: "",
  sort: "name_asc",
};

interface DraftOptionsControls {
  careerId: string;
  transitionId: string;
  pageSize: number;
  filters: SeasonDraftFilters;
  page: number;
}

interface DebouncedSearch {
  careerId: string;
  transitionId: string;
  value: string;
}

interface DraftOptionsRequestState {
  key: string;
  data: SeasonDraftOptionsPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useSeasonDraftOptions(
  careerId: string,
  transitionId: string,
  pageSize = 12,
) {
  const [controls, setControls] = useState<DraftOptionsControls>(() => ({
    careerId,
    transitionId,
    pageSize,
    filters: { ...defaultFilters },
    page: 1,
  }));

  const [debouncedSearch, setDebouncedSearch] = useState<DebouncedSearch>(
    () => ({
      careerId,
      transitionId,
      value: "",
    }),
  );

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<DraftOptionsRequestState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const isCurrentScope =
    controls.careerId === careerId &&
    controls.transitionId === transitionId &&
    controls.pageSize === pageSize;

  const filters = isCurrentScope ? controls.filters : defaultFilters;

  const requestedPage = isCurrentScope ? controls.page : 1;

  const search =
    debouncedSearch.careerId === careerId &&
    debouncedSearch.transitionId === transitionId
      ? debouncedSearch.value
      : "";

  const isSearching = filters.search !== search;
  const hasRequiredIds = Boolean(careerId && transitionId);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch({
        careerId,
        transitionId,
        value: filters.search,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [careerId, transitionId, filters.search]);

  const input = useMemo<GetSeasonDraftOptionsInput>(
    () => ({
      careerId,
      transitionId,
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
      transitionId,
      filters.gender,
      filters.primaryClass,
      filters.role,
      filters.category,
      search,
      filters.sort,
      requestedPage,
      pageSize,
    ],
  );

  const requestKey = JSON.stringify([input, retryCount]);

  useEffect(() => {
    if (!hasRequiredIds || isSearching) {
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

    async function loadOptions() {
      try {
        const data = await getSeasonDraftOptions(input, controller.signal);

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

        setRequest((previous) => ({
          key: requestKey,
          data: previous.data,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unable to load draft options. Please try again.",
        }));
      }
    }

    void loadOptions();

    return () => {
      active = false;
      controller.abort();
    };
  }, [hasRequiredIds, input, requestKey, isSearching]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading =
    hasRequiredIds && (isSearching || !isCurrentRequest || request.isLoading);

  const errorMessage = !hasRequiredIds
    ? "The career or season transition identifier is missing."
    : !isSearching && isCurrentRequest
      ? request.errorMessage
      : "";

  const isMatchingData =
    request.data?.career_id === careerId &&
    request.data?.transition_id === transitionId;

  const data =
    isMatchingData && !isLoading && !errorMessage ? request.data : null;

  const availableClasses = isMatchingData
    ? (request.data?.available_classes ?? [])
    : [];

  function updateFilters(changes: Partial<SeasonDraftFilters>) {
    setControls((previous) => {
      const previousFilters =
        previous.careerId === careerId &&
        previous.transitionId === transitionId &&
        previous.pageSize === pageSize
          ? previous.filters
          : defaultFilters;

      return {
        careerId,
        transitionId,
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
      transitionId,
      pageSize,
      filters: { ...defaultFilters },
      page: 1,
    });
  }

  function goToPage(nextPage: number) {
    if (!hasRequiredIds || !Number.isSafeInteger(nextPage) || nextPage < 1) {
      return;
    }

    if (data && nextPage > Math.max(1, data.total_pages)) {
      return;
    }

    setControls((previous) => ({
      careerId,
      transitionId,
      pageSize,
      filters:
        previous.careerId === careerId &&
        previous.transitionId === transitionId &&
        previous.pageSize === pageSize
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
