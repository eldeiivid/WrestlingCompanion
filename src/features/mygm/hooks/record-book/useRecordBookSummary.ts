import { useEffect, useState } from "react";
import { getRecordBookSummary } from "../../services/record-book/recordBookService";
import type { RecordBookSummaryData } from "../../types/record-book/recordBook.types";

interface RecordBookState {
  careerId: string;
  data: RecordBookSummaryData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useRecordBookSummary(careerId: string) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<RecordBookState>(() => ({
    careerId,
    data: null,
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({
      careerId,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadSummary() {
      try {
        const data = await getRecordBookSummary(careerId, controller.signal);

        if (!isActive) {
          return;
        }

        setState({
          careerId,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          careerId,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "The record book could not be loaded.",
        });
      }
    }

    void loadSummary();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, attempt]);

  const isCurrentCareer = state.careerId === careerId;
  const isLoading = !isCurrentCareer || state.isLoading;

  function retry() {
    if (isLoading) {
      return;
    }

    setState({
      careerId,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  return {
    data: isCurrentCareer ? state.data : null,
    isLoading,
    errorMessage: isCurrentCareer ? state.errorMessage : "",
    retry,
  };
}
