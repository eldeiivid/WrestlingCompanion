import { useId } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useShowHistory } from "../../hooks/show-history/useShowHistory";
import type { MyGmOutletContext } from "../../types/mygm.types";
import type { ShowHistoryType } from "../../types/show-history/showHistory.types";
import "./ShowHistoryScreen.scss";

const showTypeLabels: Record<ShowHistoryType, string> = {
  weekly: "Weekly show",
  go_home: "Go-home show",
  ple: "PLE",
  special: "Special show",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCompletedDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

export default function ShowHistoryScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const headingId = useId();

  const { data, isLoading, errorMessage, goToPage, retry } = useShowHistory(
    career.id,
  );

  const firstResult =
    data && data.total_count > 0 ? (data.page - 1) * data.page_size + 1 : 0;

  const lastResult = data ? firstResult + data.shows.length - 1 : 0;

  return (
    <section className="show-history" aria-labelledby={headingId}>
      <header className="show-history__header">
        <div>
          <p className="show-history__eyebrow">Career archive</p>

          <h1 id={headingId}>Show history</h1>

          <p className="show-history__description">
            Review your completed shows and their ratings.
          </p>
        </div>

        <button
          className="show-history__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <div className="show-history__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="show-history__state" role="status">
            <p>Loading show history…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="show-history__state" role="alert">
            <h2>Show history could not be loaded</h2>

            <p>{errorMessage}</p>

            <button
              className="show-history__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.shows.length === 0 && (
          <div className="show-history__state">
            <h2>No completed shows yet</h2>

            <p>Close your first show to start building your career history.</p>

            <Link
              className="show-history__button show-history__button--primary"
              to={`/mygm/${career.id}/booking`}
            >
              Go to booking
            </Link>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.shows.length > 0 && (
          <>
            <p className="show-history__results" role="status">
              Showing {firstResult}–{lastResult} of {data.total_count} completed{" "}
              {data.total_count === 1 ? "show" : "shows"}
            </p>

            <ul className="show-history__list">
              {data.shows.map((show) => {
                const completedDate = formatCompletedDate(show.completed_at);

                return (
                  <li key={show.id}>
                    <article className="show-history__card">
                      <header className="show-history__card-header">
                        <span className="show-history__badge">
                          {showTypeLabels[show.show_type]}
                        </span>

                        <p className="show-history__rating">
                          <span aria-hidden="true">★</span>

                          <span>
                            {show.rating === null
                              ? "Not rated"
                              : `${show.rating.toFixed(2)} / 5`}
                          </span>
                        </p>
                      </header>

                      <p className="show-history__week">
                        Season {show.season} · Week {show.week}
                      </p>

                      <h2>{show.name}</h2>

                      <dl className="show-history__stats">
                        <div>
                          <dt>Matches</dt>
                          <dd>{show.match_count}</dd>
                        </div>

                        <div>
                          <dt>Promos</dt>
                          <dd>{show.promo_count}</dd>
                        </div>
                      </dl>

                      {completedDate && show.completed_at && (
                        <p className="show-history__completed">
                          Recorded{" "}
                          <time dateTime={show.completed_at}>
                            {completedDate}
                          </time>
                        </p>
                      )}
                      <div className="show-history__card-actions">
                        <Link
                          className="show-history__button"
                          to={`/mygm/${career.id}/history/${show.id}`}
                          aria-label={`View ${show.name}, season ${show.season}, week ${show.week}`}
                        >
                          View show
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>

            <nav
              className="show-history__pagination"
              aria-label="Show history pagination"
            >
              <button
                className="show-history__button"
                type="button"
                disabled={data.page <= 1}
                onClick={() => goToPage(data.page - 1)}
              >
                Previous
              </button>

              <span>
                Page {data.page} of {data.total_pages}
              </span>

              <button
                className="show-history__button"
                type="button"
                disabled={data.page >= data.total_pages}
                onClick={() => goToPage(data.page + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
