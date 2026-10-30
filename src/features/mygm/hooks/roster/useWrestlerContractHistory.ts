import { useEffect, useState } from "react";

import { getWrestlerContractHistory } from "../../services/roster/contractHistoryService";

import type { WrestlerContractHistoryPage } from "../../types/roster/wrestlerContractHistory.types";

interface HistoryControls {
  careerId: string;
  wrestlerId: string | undefined;
  pageSize: number;
  page: number;
}

interface HistoryRequestState {
  key: string;
  data: WrestlerContractHistoryPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useWrestlerContractHistory(
  careerId: string,
  wrestlerId: string | undefined,
  pageSize = 5,
) {
  const [controls, setControls] = useState<HistoryControls>(() => ({
    careerId,
    wrestlerId,
    pageSize,
    page: 1,
  }));

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<HistoryRequestState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const hasRequiredIds = Boolean(careerId && wrestlerId);

  const isCurrentScope =
    controls.careerId === careerId &&
    controls.wrestlerId === wrestlerId &&
    controls.pageSize === pageSize;

  const requestedPage = isCurrentScope ? controls.page : 1;

  const requestKey = JSON.stringify([
    careerId,
    wrestlerId,
    requestedPage,
    pageSize,
    retryCount,
  ]);

  useEffect(() => {
    if (!careerId || !wrestlerId) {
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

    async function loadHistory(profileId: string) {
      try {
        const data = await getWrestlerContractHistory(
          {
            careerId,
            wrestlerId: profileId,
            page: requestedPage,
            pageSize,
          },
          controller.signal,
        );

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
              : "Unable to load contract history. Please try again.",
        });
      }
    }

    void loadHistory(wrestlerId);

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, wrestlerId, requestedPage, pageSize, requestKey]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading = hasRequiredIds && (!isCurrentRequest || request.isLoading);

  const errorMessage = !hasRequiredIds
    ? "The career or wrestler identifier is missing."
    : isCurrentRequest
      ? request.errorMessage
      : "";

  const data =
    hasRequiredIds &&
    isCurrentRequest &&
    !request.isLoading &&
    !request.errorMessage
      ? request.data
      : null;

  function goToPage(nextPage: number) {
    if (!Number.isSafeInteger(nextPage) || nextPage < 1) {
      return;
    }

    if (data && nextPage > Math.max(1, data.total_pages)) {
      return;
    }

    setControls({
      careerId,
      wrestlerId,
      pageSize,
      page: nextPage,
    });
  }

  function retry() {
    setRetryCount((previous) => previous + 1);
  }

  return {
    data,
    page: data?.page ?? requestedPage,
    isLoading,
    errorMessage,
    goToPage,
    retry,
  };
}
