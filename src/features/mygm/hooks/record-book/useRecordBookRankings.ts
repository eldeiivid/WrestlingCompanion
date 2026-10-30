import { useEffect, useState } from "react";

import {
  getRatingRecords,
  getReignRecords,
  getWrestlerRecords,
} from "../../services/record-book/recordBookPageService";

import type {
  GetRecordBookInput,
  RatingRecordKind,
  RatingRecordsPage,
  RecordBookRecord,
  ReignRecordKind,
  ReignRecordsPage,
  WrestlerRecordKind,
  WrestlerRecordsPage,
} from "../../types/record-book/recordBookPage.types";

interface RankingPage {
  career_id: string;
  page: number;
  total_pages: number;
}

interface RankingControls<TRecord extends RecordBookRecord> {
  careerId: string;
  record: TRecord;
  pageSize: number;
  page: number;
}

interface RankingRequestState<TPage> {
  key: string;
  data: TPage | null;
  isLoading: boolean;
  errorMessage: string;
}

function useRecordRanking<
  TRecord extends RecordBookRecord,
  TPage extends RankingPage,
>(
  careerId: string,
  record: TRecord,
  pageSize: number,
  loadRanking: (
    input: GetRecordBookInput<TRecord>,
    signal: AbortSignal,
  ) => Promise<TPage>,
) {
  const [controls, setControls] = useState<RankingControls<TRecord>>(() => ({
    careerId,
    record,
    pageSize,
    page: 1,
  }));

  const [retryCount, setRetryCount] = useState(0);

  const [request, setRequest] = useState<RankingRequestState<TPage>>({
    key: "",
    data: null,
    isLoading: true,
    errorMessage: "",
  });

  const isCurrentScope =
    controls.careerId === careerId &&
    controls.record === record &&
    controls.pageSize === pageSize;

  const requestedPage = isCurrentScope ? controls.page : 1;

  const requestKey = JSON.stringify([
    careerId,
    record,
    requestedPage,
    pageSize,
    retryCount,
  ]);

  useEffect(() => {
    if (!careerId) {
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

    async function loadRecords() {
      try {
        const data = await loadRanking(
          {
            careerId,
            record,
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
              : "Unable to load the ranking. Please try again.",
        });
      }
    }

    void loadRecords();

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, record, requestedPage, pageSize, requestKey, loadRanking]);

  const isCurrentRequest = request.key === requestKey;

  const isLoading =
    Boolean(careerId) && (!isCurrentRequest || request.isLoading);

  const errorMessage = !careerId
    ? "The career identifier is missing."
    : isCurrentRequest
      ? request.errorMessage
      : "";

  const data =
    careerId &&
    isCurrentRequest &&
    !request.isLoading &&
    !request.errorMessage &&
    request.data?.career_id === careerId
      ? request.data
      : null;

  function goToPage(nextPage: number) {
    if (!careerId || !Number.isSafeInteger(nextPage) || nextPage < 1) {
      return;
    }

    if (data && nextPage > Math.max(1, data.total_pages)) {
      return;
    }

    setControls({
      careerId,
      record,
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

export function useReignRecords(
  careerId: string,
  record: ReignRecordKind,
  pageSize = 10,
) {
  return useRecordRanking<ReignRecordKind, ReignRecordsPage>(
    careerId,
    record,
    pageSize,
    getReignRecords,
  );
}

export function useWrestlerRecords(
  careerId: string,
  record: WrestlerRecordKind,
  pageSize = 10,
) {
  return useRecordRanking<WrestlerRecordKind, WrestlerRecordsPage>(
    careerId,
    record,
    pageSize,
    getWrestlerRecords,
  );
}

export function useRatingRecords(
  careerId: string,
  record: RatingRecordKind,
  pageSize = 10,
) {
  return useRecordRanking<RatingRecordKind, RatingRecordsPage>(
    careerId,
    record,
    pageSize,
    getRatingRecords,
  );
}
