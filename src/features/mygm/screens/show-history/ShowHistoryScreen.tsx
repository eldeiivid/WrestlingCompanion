import { useId, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  Star,
  Trophy,
} from "lucide-react";

import { useShowHistory } from "../../hooks/show-history/useShowHistory";

import type { MyGmOutletContext } from "../../types/mygm.types";
import type { ShowHistoryType } from "../../types/show-history/showHistory.types";

import "./ShowHistoryScreen.scss";

const showTypeLabels: Record<ShowHistoryType, string> = {
  weekly: "Weekly show",
  go_home: "Go Home show",
  ple: "PLE",
  special: "Special show",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCompletedDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function ShowMark({ src, isPle }: { src: string | null; isPle: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="show-history__mark" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(src)}
        />
      ) : isPle ? (
        <Trophy size={48} strokeWidth={1.25} />
      ) : (
        <CalendarDays size={44} strokeWidth={1.25} />
      )}
    </span>
  );
}

export default function ShowHistoryScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const headingId = useId();

  const { data, isLoading, errorMessage, goToPage, retry } = useShowHistory(
    career.id,
  );

  const firstResult =
    data && data.total_count > 0 ? (data.page - 1) * data.page_size + 1 : 0;

  const lastResult =
    data && data.shows.length > 0 ? firstResult + data.shows.length - 1 : 0;

  return (
    <section className="show-history" aria-labelledby={headingId}>
      <header className="show-history__header">
        <div>
          <p className="show-history__eyebrow">Your career, recorded</p>

          <h1 id={headingId}>Show history</h1>

          <p className="show-history__description">
            Revisit the matches, moments and results behind your brand.
          </p>
        </div>

        <button
          className="show-history__button show-history__refresh"
          type="button"
          disabled={isLoading}
          aria-label="Refresh show history"
          onClick={retry}
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      <div className="show-history__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="show-history__state">
            <p role="status">Loading show history…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="show-history__state">
            <h2>Show history could not be loaded</h2>
            <p role="alert">{errorMessage}</p>

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
          <div className="show-history__state show-history__empty">
            <History size={34} strokeWidth={1.25} aria-hidden="true" />

            <h2>Your history starts with your first show</h2>

            <p>
              Close your first show to keep its card, ratings and results here.
            </p>

            <Link
              className="show-history__button show-history__button--primary"
              to={`/mygm/${career.id}/booking`}
            >
              Go to booking
              <ArrowUpRight size={16} aria-hidden="true" />
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

                const isWeekly =
                  show.show_type === "weekly" || show.show_type === "go_home";

                const isPle = show.show_type === "ple";
                const ratingId = `${headingId}-${show.id}-rating`;
                const cardHeadingId = `${headingId}-${show.id}-title`;

                return (
                  <li key={show.id}>
                    <article
                      className={`show-history__card${
                        isPle ? " show-history__card--ple" : ""
                      }`}
                      aria-labelledby={cardHeadingId}
                    >
                      <Link
                        className="show-history__card-link"
                        to={`/mygm/${career.id}/history/${show.id}`}
                        aria-label={`View ${show.name}, season ${show.season}, week ${show.week}`}
                        aria-describedby={ratingId}
                      >
                        <div className="show-history__visual">
                          <span className="show-history__badge">
                            {showTypeLabels[show.show_type]}
                          </span>

                          <div className="show-history__art">
                            <ShowMark
                              src={isWeekly ? career.brand_logo_url : null}
                              isPle={isPle}
                            />

                            <span
                              className="show-history__week-number"
                              aria-hidden="true"
                            >
                              {String(show.week).padStart(2, "0")}
                            </span>
                          </div>
                        </div>

                        <div className="show-history__content">
                          <p className="show-history__week">
                            Season {show.season} · Week {show.week}
                          </p>

                          <div className="show-history__title-row">
                            <h2 id={cardHeadingId}>{show.name}</h2>

                            <p className="show-history__rating" id={ratingId}>
                              <span className="show-history__sr-only">
                                Show rating:{" "}
                              </span>
                              <Star size={16} aria-hidden="true" />

                              {show.rating === null ? (
                                <span>Not rated</span>
                              ) : (
                                <>
                                  <strong>{show.rating.toFixed(2)}</strong>
                                  <span>
                                    / 5
                                    <span className="show-history__sr-only">
                                      {" "}
                                      stars
                                    </span>
                                  </span>
                                </>
                              )}
                            </p>
                          </div>

                          <p className="show-history__segments">
                            {show.match_count}{" "}
                            {show.match_count === 1 ? "match" : "matches"}
                            {" · "}
                            {show.promo_count}{" "}
                            {show.promo_count === 1 ? "promo" : "promos"}
                          </p>

                          {completedDate && show.completed_at && (
                            <p className="show-history__completed">
                              Recorded{" "}
                              <time dateTime={show.completed_at}>
                                {completedDate}
                              </time>
                            </p>
                          )}

                          <span className="show-history__open">
                            View show
                            <ArrowUpRight size={17} aria-hidden="true" />
                          </span>
                        </div>
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ul>

            {data.total_pages > 1 && (
              <nav
                className="show-history__pagination"
                aria-label="Show history pagination"
              >
                <button
                  className="show-history__button"
                  type="button"
                  disabled={data.page <= 1}
                  aria-label="Previous page"
                  onClick={() => goToPage(data.page - 1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                <span>
                  Page {data.page} of {data.total_pages}
                </span>

                <button
                  className="show-history__button"
                  type="button"
                  disabled={data.page >= data.total_pages}
                  aria-label="Next page"
                  onClick={() => goToPage(data.page + 1)}
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
