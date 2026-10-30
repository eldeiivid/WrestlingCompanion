import { useOutletContext } from "react-router-dom";

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
  { value: "all", label: "All statuses" },
  { value: "held", label: "Held" },
  { value: "vacant", label: "Vacant / Unclaimed" },
];

export default function ChampionshipsScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

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

  const hasFilters =
    filters.gender !== "all" ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.search !== "";

  return (
    <div className="championships-screen">
      <header className="championships-screen__header">
        <div>
          <p className="championships-screen__eyebrow">Your brand</p>

          <h1>Championships</h1>

          <p className="championships-screen__description">
            Explore your championships, current holders and title history.
          </p>
        </div>

        <button
          className="championships-screen__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      {data && (
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

      <section
        className="championships-screen__filters"
        aria-label="Championship filters"
      >
        <label className="championships-screen__field championships-screen__field--search">
          <span>Search</span>

          <input
            type="search"
            value={filters.search}
            maxLength={200}
            placeholder="Search by title name"
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

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

        <label className="championships-screen__field">
          <span>Status</span>

          <select
            value={filters.status}
            onChange={(event) => {
              const option = statusOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ status: option.value });
              }
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="championships-screen__filter-actions">
          <button
            className="championships-screen__button"
            type="button"
            disabled={!hasFilters}
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section
        className="championships-screen__results"
        aria-label="Championship results"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <p className="championships-screen__state" role="status">
            {isSearching
              ? "Searching championships…"
              : "Loading championships…"}
          </p>
        ) : errorMessage ? (
          <div className="championships-screen__state">
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
            <p className="championships-screen__count" role="status">
              {data.total_count} {data.total_count === 1 ? "title" : "titles"}{" "}
              found
            </p>

            {data.items.length === 0 ? (
              <div className="championships-screen__state">
                <h2>No titles found</h2>

                <p>
                  {hasFilters
                    ? "Try another search or adjust your filters."
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
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {data.total_pages}
                </span>

                <button
                  className="championships-screen__button"
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
    </div>
  );
}
