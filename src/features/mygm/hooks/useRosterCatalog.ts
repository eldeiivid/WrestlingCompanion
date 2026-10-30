import { useEffect, useState } from "react";

import { rosterService, ROSTER_PAGE_SIZE } from "../services/rosterService";
import type { RosterFilters, RosterWrestler } from "../types/roster.types";

const initialFilters: RosterFilters = {
  search: "",
  gender: "",
  primaryClass: "",
  role: "",
  category: "",
  sort: "name",
};

export function useRosterCatalog() {
  const [query, setQuery] = useState({
    filters: initialFilters,
    page: 1,
  });

  const [wrestlers, setWrestlers] = useState<RosterWrestler[]>([]);
  const [primaryClasses, setPrimaryClasses] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingWrestlers, setLoadingWrestlers] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [wrestlerError, setWrestlerError] = useState("");
  const [classError, setClassError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoadingClasses(true);
    setClassError("");

    async function loadClasses() {
      try {
        const result = await rosterService.getPrimaryClasses(controller.signal);

        if (active) setPrimaryClasses(result);
      } catch {
        if (active) {
          setClassError("Unable to load class filters. Please try again.");
        }
      } finally {
        if (active) setLoadingClasses(false);
      }
    }

    void loadClasses();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoadingWrestlers(true);
    setWrestlerError("");

    async function loadWrestlers() {
      try {
        const result = await rosterService.getWrestlers(
          query.filters,
          query.page,
          controller.signal,
        );

        if (!active) return;

        setWrestlers(result.wrestlers);
        setTotal(result.total);
      } catch {
        if (active) {
          setWrestlerError("Unable to load wrestlers. Please try again.");
        }
      } finally {
        if (active) setLoadingWrestlers(false);
      }
    }

    // Avoid sending a request for every keystroke.
    const timeout = window.setTimeout(() => {
      void loadWrestlers();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, attempt]);

  function updateFilter<K extends keyof RosterFilters>(
    field: K,
    value: RosterFilters[K],
  ) {
    setQuery((previous) => ({
      filters: { ...previous.filters, [field]: value },
      page: 1,
    }));
  }

  function changePage(page: number) {
    setQuery((previous) => ({ ...previous, page }));
  }

  function retry() {
    setAttempt((value) => value + 1);
  }

  return {
    filters: query.filters,
    page: query.page,
    wrestlers,
    primaryClasses,
    total,
    totalPages: Math.max(1, Math.ceil(total / ROSTER_PAGE_SIZE)),
    isLoading: loadingWrestlers || loadingClasses,
    errorMessage: wrestlerError || classError,
    updateFilter,
    changePage,
    retry,
  };
}
