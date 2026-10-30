import { useId, useState } from "react";
import { useOutletContext } from "react-router-dom";

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
          <p className="news-screen__eyebrow">Your brand stories</p>

          <h1 id={headingId}>News</h1>

          <p className="news-screen__description">
            Explore championship moments and rivalry developments throughout
            your career.
          </p>
        </div>

        <button
          className="news-screen__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <section className="news-screen__filters" aria-label="News filters">
        <label className="news-screen__field news-screen__field--search">
          <span>Search</span>

          <input
            type="search"
            value={filters.search}
            maxLength={200}
            placeholder="Search wrestlers, championships or rivalries"
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <label className="news-screen__field">
          <span>News type</span>

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

        <div className="news-screen__filter-actions">
          <button
            className="news-screen__button"
            type="button"
            disabled={!hasFilters}
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section
        className="news-screen__results"
        aria-label="News results"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <p className="news-screen__state" role="status">
            {isSearching ? "Searching news…" : "Loading news…"}
          </p>
        ) : errorMessage ? (
          <div className="news-screen__state">
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
            <p className="news-screen__count" role="status">
              {data.total_count} {data.total_count === 1 ? "story" : "stories"}{" "}
              found
              {" · "}
              {data.available_count} in your career
            </p>

            {data.items.length === 0 ? (
              <div className="news-screen__state">
                <h2>{hasFilters ? "No matching news" : "No news yet"}</h2>

                <p>
                  {hasFilters
                    ? "Try another search or adjust your filters."
                    : "Complete shows with championship or rivalry developments to generate news."}
                </p>

                {hasFilters && (
                  <button
                    className="news-screen__button"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
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
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {data.total_pages}
                </span>

                <button
                  className="news-screen__button"
                  type="button"
                  disabled={page >= data.total_pages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
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
