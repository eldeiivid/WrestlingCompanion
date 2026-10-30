import { useEffect, useState } from "react";
import { openCurrentShow } from "../services/bookingService";
import type { MyGmBookingData } from "../types/booking.types";

interface BookingState {
  careerId: string;
  data: MyGmBookingData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string;
  refreshError: string;
}

export function useMyGmBooking(careerId: string) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<BookingState>({
    careerId,
    data: null,
    isLoading: true,
    isRefreshing: false,
    errorMessage: "",
    refreshError: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => {
      const hasCurrentData =
        current.careerId === careerId && current.data !== null;

      return {
        careerId,
        data: hasCurrentData ? current.data : null,
        isLoading: !hasCurrentData,
        isRefreshing: hasCurrentData,
        errorMessage: "",
        refreshError: "",
      };
    });

    openCurrentShow(careerId, controller.signal)
      .then((data) => {
        if (!active) return;

        setState({
          careerId,
          data,
          isLoading: false,
          isRefreshing: false,
          errorMessage: "",
          refreshError: "",
        });
      })
      .catch((error: unknown) => {
        if (!active) return;

        const message =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P0001" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unable to load the show. Please try again.";

        setState((current) => {
          const hasCurrentData =
            current.careerId === careerId && current.data !== null;

          return {
            careerId,
            data: hasCurrentData ? current.data : null,
            isLoading: false,
            isRefreshing: false,
            errorMessage: hasCurrentData ? "" : message,
            refreshError: hasCurrentData ? message : "",
          };
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, attempt]);

  function refreshBooking() {
    setState((current) => {
      if (current.careerId !== careerId) return current;

      const hasData = current.data !== null;

      return {
        ...current,
        isLoading: !hasData,
        isRefreshing: hasData,
        errorMessage: "",
        refreshError: "",
      };
    });

    setAttempt((current) => current + 1);
  }

  if (state.careerId !== careerId) {
    return {
      data: null,
      isLoading: true,
      isRefreshing: false,
      errorMessage: "",
      refreshError: "",
      refreshBooking,
    };
  }

  return {
    data: state.data,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    errorMessage: state.errorMessage,
    refreshError: state.refreshError,
    refreshBooking,
  };
}
