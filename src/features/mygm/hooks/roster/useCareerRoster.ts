import { useEffect, useState } from "react";
import { getCareerRoster } from "../../services/roster/careerRosterService";
import type {
  CareerRosterFilters,
  CareerRosterPage,
} from "../../types/roster/careerRoster.types";

interface RosterControls {
  careerId: string;
  filters: CareerRosterFilters;
  page: number;
}

interface DebouncedSearch {
  careerId: string;
  value: string;
}

interface CareerRosterState {
  careerId: string;
  scope: string;
  data: CareerRosterPage | null;
  availableClasses: string[];
  isLoading: boolean;
  errorMessage: string;
}

const defaultFilters: CareerRosterFilters = {
  gender: "all",
  primaryClass: "all",
  role: "all",
  category: "all",
  search: "",
  sort: "name_asc",
};

function createControls(careerId: string): RosterControls {
  return {
    careerId,
    filters: { ...defaultFilters },
    page: 1,
  };
}

export function useCareerRoster(careerId: string, pageSize = 12) {
  const [controls, setControls] = useState<RosterControls>(() =>
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

  const { gender, primaryClass, role, category, sort } = filters;

  const search = filters.search.trim();

  const debouncedSearch =
    debounced.careerId === careerId ? debounced.value : "";

  const isSearching = search !== debouncedSearch;

  const scope = JSON.stringify([
    careerId,
    gender,
    primaryClass,
    role,
    category,
    search,
    sort,
    requestedPage,
    pageSize,
  ]);

  const [state, setState] = useState<CareerRosterState>(() => ({
    careerId,
    scope,
    data: null,
    availableClasses: [],
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

    setState((current) => ({
      careerId,
      scope,
      data: null,
      availableClasses:
        current.careerId === careerId ? current.availableClasses : [],
      isLoading: true,
      errorMessage: "",
    }));

    async function loadRoster() {
      try {
        const data = await getCareerRoster(
          {
            careerId,
            gender,
            primaryClass,
            role,
            category,
            search,
            sort,
            page: requestedPage,
            pageSize,
          },
          controller.signal,
        );

        if (!isActive) {
          return;
        }

        setState({
          careerId,
          scope,
          data,
          availableClasses: data.available_classes,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          careerId,
          scope,
          data: null,
          availableClasses:
            current.careerId === careerId ? current.availableClasses : [],
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "The roster could not be loaded.",
        }));
      }
    }

    void loadRoster();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    careerId,
    gender,
    primaryClass,
    role,
    category,
    search,
    sort,
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

  const availableClasses =
    state.careerId === careerId ? state.availableClasses : [];

  function updateFilters(changes: Partial<CareerRosterFilters>) {
    setControls((current) => {
      const base =
        current.careerId === careerId ? current : createControls(careerId);

      const nextFilters = {
        ...base.filters,
        ...changes,
      };

      if (
        current.careerId === careerId &&
        nextFilters.gender === base.filters.gender &&
        nextFilters.primaryClass === base.filters.primaryClass &&
        nextFilters.role === base.filters.role &&
        nextFilters.category === base.filters.category &&
        nextFilters.search === base.filters.search &&
        nextFilters.sort === base.filters.sort
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

    setState((current) => ({
      careerId,
      scope,
      data: null,
      availableClasses:
        current.careerId === careerId ? current.availableClasses : [],
      isLoading: true,
      errorMessage: "",
    }));

    setAttempt((current) => current + 1);
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
