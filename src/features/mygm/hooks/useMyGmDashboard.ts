import { useEffect, useState } from "react";

import { dashboardService } from "../services/dashboardService";
import type { MyGmDashboardData } from "../types/dashboard.types";

interface DashboardState {
  careerId: string;
  data: MyGmDashboardData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useMyGmDashboard(careerId: string) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<DashboardState>({
    careerId,
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({
      careerId,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadDashboard() {
      try {
        const data = await dashboardService.getDashboard(
          careerId,
          controller.signal,
        );

        if (!active) return;

        setState({
          careerId,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch {
        if (!active) return;

        setState({
          careerId,
          data: null,
          isLoading: false,
          errorMessage: "Unable to load the dashboard. Please try again.",
        });
      }
    }

    void loadDashboard();

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, attempt]);

  function retry() {
    setAttempt((value) => value + 1);
  }

  if (state.careerId !== careerId) {
    return {
      data: null,
      isLoading: true,
      errorMessage: "",
      retry,
    };
  }

  return {
    data: state.data,
    isLoading: state.isLoading,
    errorMessage: state.errorMessage,
    retry,
  };
}
