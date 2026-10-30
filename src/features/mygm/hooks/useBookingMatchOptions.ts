import { useEffect, useState } from "react";
import {
  getMatchForEditing,
  getMatchOptions,
} from "../services/bookingService";
import type {
  BookingEditableMatch,
  BookingMatchOptions,
} from "../types/booking.types";

interface MatchOptionsState {
  key: string;
  data: BookingMatchOptions | null;
  segment: BookingEditableMatch | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useBookingMatchOptions(
  careerId: string,
  eventId: string,
  segmentId?: string,
) {
  const key = `${careerId}:${eventId}:${segmentId ?? "new"}`;

  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<MatchOptionsState>({
    key,
    data: null,
    segment: null,
    isLoading: true,
    errorMessage: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({
      key,
      data: null,
      segment: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadOptions() {
      try {
        let data: BookingMatchOptions;
        let segment: BookingEditableMatch | null = null;

        if (segmentId) {
          const result = await getMatchForEditing(
            careerId,
            eventId,
            segmentId,
            controller.signal,
          );

          data = result.options;
          segment = result.segment;
        } else {
          data = await getMatchOptions(careerId, eventId, controller.signal);
        }

        if (!active) return;

        setState({
          key,
          data,
          segment,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!active) return;

        const message =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P0001" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unable to load match options. Please try again.";

        setState({
          key,
          data: null,
          segment: null,
          isLoading: false,
          errorMessage: message,
        });
      }
    }

    void loadOptions();

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, eventId, segmentId, key, attempt]);

  function retry() {
    setAttempt((current) => current + 1);
  }

  if (state.key !== key) {
    return {
      data: null,
      segment: null,
      isLoading: true,
      errorMessage: "",
      retry,
    };
  }

  return {
    data: state.data,
    segment: state.segment,
    isLoading: state.isLoading,
    errorMessage: state.errorMessage,
    retry,
  };
}
