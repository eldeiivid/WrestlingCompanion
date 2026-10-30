import { useId } from "react";
import type { ReactNode } from "react";

import "./RecordRanking.scss";

interface RecordRankingProps {
  title: string;
  description: string;
  emptyMessage: string;
  isLoading: boolean;
  errorMessage: string;
  page: number;
  totalPages: number;
  totalCount: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  children: ReactNode;
}

export default function RecordRanking({
  title,
  description,
  emptyMessage,
  isLoading,
  errorMessage,
  page,
  totalPages,
  totalCount,
  onRetry,
  onPageChange,
  children,
}: RecordRankingProps) {
  const headingId = useId();

  return (
    <section className="record-ranking" aria-labelledby={headingId}>
      <header className="record-ranking__header">
        <div>
          <h2 id={headingId}>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          className="record-ranking__button"
          type="button"
          disabled={isLoading}
          onClick={onRetry}
        >
          Refresh
        </button>
      </header>

      <div className="record-ranking__content" aria-busy={isLoading}>
        {isLoading ? (
          <p className="record-ranking__state" role="status">
            Loading ranking…
          </p>
        ) : errorMessage ? (
          <div className="record-ranking__state">
            <p role="alert">{errorMessage}</p>

            <button
              className="record-ranking__button"
              type="button"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        ) : totalCount === 0 ? (
          <p className="record-ranking__state">{emptyMessage}</p>
        ) : (
          <>
            <div className="record-ranking__summary">
              <p role="status">
                {totalCount} {totalCount === 1 ? "record" : "records"}
              </p>

              <p>Tied records share the same rank.</p>
            </div>

            <ol className="record-ranking__list">{children}</ol>

            {totalPages > 1 && (
              <nav
                className="record-ranking__pagination"
                aria-label={`${title} pagination`}
              >
                <button
                  className="record-ranking__button"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  className="record-ranking__button"
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
