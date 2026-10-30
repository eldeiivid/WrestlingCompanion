import { useEffect, useState } from "react";
import { getRivalries } from "../../services/rivalries/rivalriesService";
import type {
  RivalriesFilters,
  RivalriesPage,
} from "../../types/rivalries/rivalries.types";

interface RivalriesControls {
  careerId: string;
  filters: RivalriesFilters;
  page: number;
}

interface DebouncedSearch {
  careerId: string;
  value: string;
}

interface RivalriesState {
  scope: string;
  data: RivalriesPage | null;
  isLoading: boolean;
  errorMessage: string;
}

const defaultFilters: RivalriesFilters = {
  status: "active",
  kind: "all",
  search: "",
};

function createControls(careerId: string): RivalriesControls {
  return {
    careerId,
    filters: { ...defaultFilters },
    page: 1,
  };
}

export function useRivalries(careerId: string, pageSize = 10) {
  const [controls, setControls] = useState<RivalriesControls>(() =>
    createControls(careerId),
  );

  const [debounced, setDebounced] = useState<DebouncedSearch>(() => ({
    careerId,
    value: "",
  }));

  const [attempt, setAttempt] = useState(0);

  const currentControls =
    controls.careerId === careerId ? controls : createControls(careerId);

  const { filters, page: requestedPage } = currentControls;
  const { status, kind } = filters;
  const search = filters.search.trim();

  const debouncedSearch =
    debounced.careerId === careerId ? debounced.value : "";

  const isSearching = search !== debouncedSearch;

  const scope = JSON.stringify([
    careerId,
    status,
    kind,
    search,
    requestedPage,
    pageSize,
  ]);

  const [state, setState] = useState<RivalriesState>(() => ({
    scope,
    data: null,
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    if (search === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebounced({
        careerId,
        value: search,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [careerId, search, debouncedSearch]);

  useEffect(() => {
    if (isSearching) {
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

    async function loadRivalries() {
      try {
        const data = await getRivalries(
          {
            careerId,
            status,
            kind,
            search,
            page: requestedPage,
            pageSize,
          },
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
              : "Rivalries could not be loaded.",
        });
      }
    }

    void loadRivalries();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    careerId,
    status,
    kind,
    search,
    requestedPage,
    pageSize,
    scope,
    isSearching,
    attempt,
  ]);

  const isCurrentScope = state.scope === scope;

  const isLoading = isSearching || !isCurrentScope || state.isLoading;

  const data = !isSearching && isCurrentScope ? state.data : null;

  const errorMessage = !isSearching && isCurrentScope ? state.errorMessage : "";

  function updateFilters(changes: Partial<RivalriesFilters>) {
    setControls((current) => {
      const base =
        current.careerId === careerId ? current : createControls(careerId);

      const nextFilters = {
        ...base.filters,
        ...changes,
      };

      if (
        current.careerId === careerId &&
        nextFilters.status === base.filters.status &&
        nextFilters.kind === base.filters.kind &&
        nextFilters.search === base.filters.search
      ) {
        return current;
      }

      return {
        careerId,
        filters: nextFilters,
        page: 1,
      };
    });
  }

  function resetFilters() {
    setControls(createControls(careerId));
  }

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

    setControls((current) => {
      const base =
        current.careerId === careerId ? current : createControls(careerId);

      return {
        ...base,
        page: nextPage,
      };
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
