import { useId, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  RefreshCw,
  Search,
} from "lucide-react";

import NewsHistoryCard from "../../components/news/NewsHistoryCard";
import RivalryDetailModal from "../../components/dashboard/rivalries/RivalryDetailModal";

import { useNewsHistory } from "../../hooks/news/useNewsHistory";

import type { MyGmOutletContext } from "../../types/mygm.types";
import type { NewsEventType } from "../../types/news/newsHistory.types";

import "./NewsScreen.scss";

const eventTypeOptions: {
  value: NewsEventType | "all";
  label: string;
}[] = [
  { value: "all", label: "All news" },
  { value: "championship_won", label: "New champions" },
  { value: "championship_defended", label: "Successful defenses" },
  { value: "rivalry_started", label: "New rivalries" },
  { value: "rivalry_ended", label: "Ended rivalries" },
];

interface SelectedRivalry {
  careerId: string;
  feudId: string;
}

export default function NewsScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const headingId = useId();

  const [selectedRivalry, setSelectedRivalry] =
    useState<SelectedRivalry | null>(null);

  const {
    data,
    filters,
    page,
    isLoading,
    isSearching,
    errorMessage,
    updateFilters,
    resetFilters,
    goToPage,
    retry,
  } = useNewsHistory(career.id);

  const hasFilters = filters.eventType !== "all" || filters.search !== "";

  const selectedFeudId =
    selectedRivalry?.careerId === career.id ? selectedRivalry.feudId : null;

  function handleViewRivalry(feudId: string) {
    setSelectedRivalry({
      careerId: career.id,
      feudId,
    });
  }

  return (
    <section className="news-screen" aria-labelledby={headingId}>
      <header className="news-screen__header">
        <div>
          <p className="news-screen__eyebrow">The stories behind your brand</p>

          <h1 id={headingId}>News</h1>

          <p className="news-screen__description">
            Championship moments, rivalry developments and the stories shaping
            your career.
          </p>
        </div>

        <button
          className="news-screen__button news-screen__refresh"
          type="button"
          disabled={isLoading}
          aria-label="Refresh news"
          onClick={retry}
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      <fieldset className="news-screen__filters">
        <legend className="news-screen__sr-only">Filter news</legend>

        <label className="news-screen__search">
          <span className="news-screen__sr-only">
            Search wrestlers, championships or rivalries
          </span>

          <Search size={18} aria-hidden="true" />

          <input
            type="search"
            value={filters.search}
            maxLength={200}
            placeholder="Search stories or wrestlers"
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <label className="news-screen__type-filter">
          <span className="news-screen__sr-only">News type</span>

          <select
            value={filters.eventType}
            onChange={(event) => {
              const option = eventTypeOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ eventType: option.value });
              }
            }}
          >
            {eventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <section
        className="news-screen__results"
        aria-label="News results"
        aria-busy={isLoading}
      >
        <div className="news-screen__results-header">
          <div>
            {!isLoading && !errorMessage && data && (
              <p className="news-screen__count" role="status">
                <strong>{data.total_count}</strong>{" "}
                {data.total_count === 1 ? "story" : "stories"} found
                <span>{data.available_count} in your career</span>
              </p>
            )}
          </div>

          {hasFilters && (
            <button
              className="news-screen__reset"
              type="button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="news-screen__state" role="status">
            {isSearching ? "Searching news…" : "Loading news…"}
          </p>
        ) : errorMessage ? (
          <div className="news-screen__state">
            <h2>News could not be loaded</h2>
            <p role="alert">{errorMessage}</p>

            <button
              className="news-screen__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <>
            {data.items.length === 0 ? (
              <div className="news-screen__state news-screen__empty">
                <Newspaper size={34} strokeWidth={1.25} aria-hidden="true" />

                <h2>
                  {hasFilters
                    ? "No matching stories"
                    : "Your story is still being written"}
                </h2>

                <p>
                  {hasFilters
                    ? "Try another search or reset your filters."
                    : "Complete shows with championship or rivalry developments to build your news archive."}
                </p>

                {hasFilters ? (
                  <button
                    className="news-screen__button"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                ) : (
                  <Link
                    className="news-screen__button news-screen__button--primary"
                    to={`/mygm/${career.id}/booking`}
                  >
                    Go to booking
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : (
              <ul className="news-screen__list">
                {data.items.map((item) => (
                  <li key={item.id}>
                    <NewsHistoryCard
                      careerId={career.id}
                      item={item}
                      onViewRivalry={handleViewRivalry}
                    />
                  </li>
                ))}
              </ul>
            )}

            {data.total_pages > 1 && (
              <nav
                className="news-screen__pagination"
                aria-label="News pagination"
              >
                <button
                  className="news-screen__button"
                  type="button"
                  disabled={page <= 1}
                  aria-label="Previous page"
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                <span>
                  Page {page} of {data.total_pages}
                </span>

                <button
                  className="news-screen__button"
                  type="button"
                  disabled={page >= data.total_pages}
                  aria-label="Next page"
                  onClick={() => goToPage(page + 1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        ) : null}
      </section>

      {selectedFeudId && (
        <RivalryDetailModal
          key={`news-rivalry:${career.id}:${selectedFeudId}`}
          careerId={career.id}
          feudId={selectedFeudId}
          onClose={() => setSelectedRivalry(null)}
        />
      )}
    </section>
  );
}
