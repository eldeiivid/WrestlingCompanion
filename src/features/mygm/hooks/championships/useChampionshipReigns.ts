import { useEffect, useState } from "react";

import { getChampionshipReigns } from "../../services/championships/championshipDetailService";

import type { ChampionshipReignsPage } from "../../types/championships/championshipDetail.types";

interface ReignsControls {
  careerId: string;
  titleId: string | undefined;
  pageSize: number;
  page: number;
}

interface ReignsRequestState {
  key: string;
  data: ChampionshipReignsPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useChampionshipReigns(
  careerId: string,
  titleId: string | undefined,
  pageSize = 5,
) {
  const [controls, setControls] = useState<ReignsControls>(() => ({
    careerId,
    titleId,
    pageSize,
    page: 1,
  }));

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<ReignsRequestState>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const hasRequiredIds = Boolean(careerId && titleId);

  const isCurrentScope =
    controls.careerId === careerId &&
    controls.titleId === titleId &&
    controls.pageSize === pageSize;

  const requestedPage = isCurrentScope ? controls.page : 1;

  const requestKey = JSON.stringify([
    careerId,
    titleId,
    requestedPage,
    pageSize,
    retryCount,
  ]);

  useEffect(() => {
    if (!careerId || !titleId) {
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

    async function loadReigns(championshipId: string) {
      try {
        const data = await getChampionshipReigns(
          {
            careerId,
            titleId: championshipId,
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
              : "Unable to load the reign history. Please try again.",
        });
      }
    }

    void loadReigns(titleId);

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, titleId, requestedPage, pageSize, requestKey]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading = hasRequiredIds && (!isCurrentRequest || request.isLoading);

  const errorMessage = !hasRequiredIds
    ? "The career or championship identifier is missing."
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
      titleId,
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
