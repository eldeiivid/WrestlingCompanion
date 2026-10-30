import { useEffect, useState } from "react";

import { getReignDefenses } from "../../services/championships/championshipDetailService";

import type { ReignDefensesPage } from "../../types/championships/championshipDetail.types";

interface DefensesControls {
  careerId: string;
  titleId: string | undefined;
  reignId: string | null;
  pageSize: number;
  page: number;
}

interface DefensesRequestState {
  key: string;
  data: ReignDefensesPage | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useReignDefenses(
  careerId: string,
  titleId: string | undefined,
  reignId: string | null,
  pageSize = 5,
) {
  const [controls, setControls] = useState<DefensesControls>(() => ({
    careerId,
    titleId,
    reignId,
    pageSize,
    page: 1,
  }));

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<DefensesRequestState>({
    key: "",
    data: null,
    isLoading: false,
    errorMessage: "",
  });

  const hasRequiredIds = Boolean(careerId && titleId && reignId);

  const isCurrentScope =
    controls.careerId === careerId &&
    controls.titleId === titleId &&
    controls.reignId === reignId &&
    controls.pageSize === pageSize;

  const requestedPage = isCurrentScope ? controls.page : 1;

  const requestKey = JSON.stringify([
    careerId,
    titleId,
    reignId,
    requestedPage,
    pageSize,
    retryCount,
  ]);

  useEffect(() => {
    if (!careerId || !titleId || !reignId) {
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

    async function loadDefenses(
      championshipId: string,
      selectedReignId: string,
    ) {
      try {
        const data = await getReignDefenses(
          {
            careerId,
            titleId: championshipId,
            reignId: selectedReignId,
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
              : "Unable to load the reign defenses. Please try again.",
        });
      }
    }

    void loadDefenses(titleId, reignId);

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, titleId, reignId, requestedPage, pageSize, requestKey]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading = hasRequiredIds && (!isCurrentRequest || request.isLoading);

  const errorMessage =
    !careerId || !titleId
      ? "The career or championship identifier is missing."
      : reignId && isCurrentRequest
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
    if (!hasRequiredIds || !Number.isSafeInteger(nextPage) || nextPage < 1) {
      return;
    }

    if (data && nextPage > Math.max(1, data.total_pages)) {
      return;
    }

    setControls({
      careerId,
      titleId,
      reignId,
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
