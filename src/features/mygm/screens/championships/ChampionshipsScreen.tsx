import { useId, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";

import ChampionshipCard from "../../components/championships/ChampionshipCard";
import { useChampionships } from "../../hooks/championships/useChampionships";

import type {
  ChampionshipCategory,
  ChampionshipGender,
  ChampionshipStatusFilter,
} from "../../types/championships/championships.types";
import type { MyGmOutletContext } from "../../types/mygm.types";

import "./ChampionshipsScreen.scss";

const genderOptions: {
  value: ChampionshipGender | "all";
  label: string;
}[] = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
  { value: "mixed", label: "Mixed" },
  { value: "open", label: "Open" },
];

const categoryOptions: {
  value: ChampionshipCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All categories" },
  { value: "world", label: "World" },
  { value: "midcard", label: "Midcard" },
  { value: "tag_team", label: "Tag Team" },
  { value: "mitb", label: "Money in the Bank" },
  { value: "other", label: "Other" },
];

const statusOptions: {
  value: ChampionshipStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All titles" },
  { value: "held", label: "Held" },
  { value: "vacant", label: "Vacant / Unclaimed" },
];

export default function ChampionshipsScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

  const headingId = useId();
  const filtersId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  } = useChampionships(career.id);

  const activeFilterCount = [
    filters.gender !== "all",
    filters.category !== "all",
  ].filter(Boolean).length;

  const hasFilters =
    activeFilterCount > 0 || filters.status !== "all" || filters.search !== "";

  return (
    <section className="championships-screen" aria-labelledby={headingId}>
      <header className="championships-screen__header">
        <div>
          <p className="championships-screen__eyebrow">Your brand’s gold</p>

          <h1 id={headingId}>Championships</h1>

          <p className="championships-screen__description">
            Follow your champions, their reigns and the history behind each
            title.
          </p>
        </div>

        <button
          className="championships-screen__button championships-screen__refresh"
          type="button"
          disabled={isLoading}
          aria-label="Refresh championships"
          onClick={retry}
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      {data && !errorMessage && (
        <section aria-label="Championship overview">
          <dl className="championships-screen__summary">
            <div>
              <dt>Championships</dt>
              <dd>{data.summary.championship_count}</dd>
            </div>

            <div>
              <dt>Occupied</dt>
              <dd>{data.summary.occupied_count}</dd>
            </div>

            <div>
              <dt>Vacant</dt>
              <dd>{data.summary.vacant_count}</dd>
            </div>

            {data.summary.briefcase_count > 0 && (
              <div>
                <dt>MITB briefcases</dt>
                <dd>{data.summary.briefcase_count}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <div
        className="championships-screen__statuses"
        role="group"
        aria-label="Filter by championship status"
      >
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filters.status === option.value}
            onClick={() => updateFilters({ status: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="championships-screen__tools">
        <label className="championships-screen__search">
          <span className="championships-screen__sr-only">
            Search by title name
          </span>

          <Search size={18} aria-hidden="true" />

          <input
            type="search"
            value={filters.search}
            maxLength={200}
            placeholder="Search championships"
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <button
          className="championships-screen__button championships-screen__filter-toggle"
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="championships-screen__filter-count">
              <span className="championships-screen__sr-only">
                Active filters:{" "}
              </span>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <fieldset
        className="championships-screen__filters"
        id={filtersId}
        hidden={!filtersOpen}
      >
        <legend className="championships-screen__sr-only">
          Additional championship filters
        </legend>

        <label className="championships-screen__field">
          <span>Gender</span>

          <select
            value={filters.gender}
            onChange={(event) => {
              const option = genderOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ gender: option.value });
              }
            }}
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="championships-screen__field">
          <span>Category</span>

          <select
            value={filters.category}
            onChange={(event) => {
              const option = categoryOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ category: option.value });
              }
            }}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <section
        className="championships-screen__results"
        aria-label="Championship results"
        aria-busy={isLoading}
      >
        <div className="championships-screen__results-header">
          <div>
            {!isLoading && !errorMessage && data && (
              <p className="championships-screen__count" role="status">
                <strong>{data.total_count}</strong>{" "}
                {data.total_count === 1 ? "title" : "titles"} found
              </p>
            )}
          </div>

          {hasFilters && (
            <button
              className="championships-screen__reset"
              type="button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="championships-screen__state" role="status">
            {isSearching
              ? "Searching championships…"
              : "Loading championships…"}
          </p>
        ) : errorMessage ? (
          <div className="championships-screen__state">
            <h2>Championships could not be loaded</h2>
            <p role="alert">{errorMessage}</p>

            <button
              className="championships-screen__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <>
            {data.items.length === 0 ? (
              <div className="championships-screen__state championships-screen__empty">
                <Trophy size={34} strokeWidth={1.25} aria-hidden="true" />

                <h2>
                  {hasFilters ? "No matching titles" : "No championships yet"}
                </h2>

                <p>
                  {hasFilters
                    ? "Try another search or reset your filters."
                    : "No active titles are assigned to this brand."}
                </p>

                {hasFilters && (
                  <button
                    className="championships-screen__button"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="championships-screen__grid">
                {data.items.map((championship) => (
                  <li key={championship.id}>
                    <ChampionshipCard
                      careerId={career.id}
                      championship={championship}
                    />
                  </li>
                ))}
              </ul>
            )}

            {data.total_pages > 1 && (
              <nav
                className="championships-screen__pagination"
                aria-label="Championships pagination"
              >
                <button
                  className="championships-screen__button"
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
                  className="championships-screen__button"
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
    </section>
  );
}
