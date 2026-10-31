import { useId } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Medal, RefreshCw } from "lucide-react";

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
          className="record-ranking__button record-ranking__refresh"
          type="button"
          aria-label={`Refresh ${title.toLowerCase()}`}
          disabled={isLoading}
          onClick={onRetry}
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      <div className="record-ranking__content" aria-busy={isLoading}>
        {isLoading ? (
          <p className="record-ranking__state" role="status">
            Loading ranking…
          </p>
        ) : errorMessage ? (
          <div className="record-ranking__state">
            <h3>The ranking could not be loaded</h3>

            <p role="alert">{errorMessage}</p>

            <button
              className="record-ranking__button"
              type="button"
              onClick={onRetry}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : totalCount === 0 ? (
          <div className="record-ranking__state record-ranking__state--empty">
            <span className="record-ranking__empty-icon" aria-hidden="true">
              <Medal size={32} strokeWidth={1.5} />
            </span>

            <h3>A place in the record books awaits</h3>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="record-ranking__summary">
              <p role="status">
                <strong>{totalCount.toLocaleString("en-US")}</strong>{" "}
                {totalCount === 1 ? "record" : "records"}
              </p>

              <p>Tied records share the same rank.</p>
            </div>

            <ol className="record-ranking__list" role="list">
              {children}
            </ol>

            {totalPages > 1 && (
              <nav
                className="record-ranking__pagination"
                aria-label={`${title} pagination`}
              >
                <button
                  className="record-ranking__button record-ranking__page-button"
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                <span>
                  Page <strong>{page}</strong> of {totalPages}
                </span>

                <button
                  className="record-ranking__button record-ranking__page-button"
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
