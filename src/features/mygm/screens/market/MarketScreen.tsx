import { useNavigate, useOutletContext } from "react-router-dom";

import MarketWrestlerCard from "../../components/market/MarketWrestlerCard";
import { useMarket } from "../../hooks/market/useMarket";

import type {
  MarketCategory,
  MarketGender,
  MarketRole,
  MarketSort,
  MarketWrestler,
} from "../../types/market/market.types";
import type { MyGmOutletContext } from "../../types/mygm.types";

import "./MarketScreen.scss";

const genderOptions: {
  value: MarketGender | "all";
  label: string;
}[] = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const roleOptions: {
  value: MarketRole | "all";
  label: string;
}[] = [
  { value: "all", label: "All roles" },
  { value: "face", label: "Face" },
  { value: "heel", label: "Heel" },
];

const categoryOptions: {
  value: MarketCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All categories" },
  { value: "active", label: "Active" },
  { value: "legend", label: "Legend" },
  { value: "local", label: "Local" },
];

const sortOptions: {
  value: MarketSort;
  label: string;
}[] = [
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
  { value: "mic_skill_desc", label: "Mic skill: highest first" },
  { value: "in_ring_skill_desc", label: "Ring level: highest first" },
];

export default function MarketScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const navigate = useNavigate();

  const {
    data,
    filters,
    availableClasses,
    page,
    isLoading,
    isSearching,
    errorMessage,
    updateFilters,
    resetFilters,
    goToPage,
    retry,
  } = useMarket(career.id);

  const hasFilters =
    filters.gender !== "all" ||
    filters.primaryClass !== "all" ||
    filters.role !== "all" ||
    filters.category !== "all" ||
    filters.search !== "" ||
    filters.sort !== "name_asc";

  function handleViewProfile(wrestler: MarketWrestler) {
    const basePath = `/mygm/${career.id}/market`;

    if (wrestler.career_wrestler_id) {
      navigate(`${basePath}/wrestlers/${wrestler.career_wrestler_id}`);

      return;
    }

    if (wrestler.catalog_wrestler_id) {
      navigate(`${basePath}/catalog/${wrestler.catalog_wrestler_id}`);
    }
  }

  return (
    <div className="market-screen">
      <header className="market-screen__header">
        <div>
          <p className="market-screen__eyebrow">Career market</p>
          <h1>Market</h1>

          <p className="market-screen__description">
            Explore available wrestlers and find your next signing.
          </p>
        </div>

        <button
          className="market-screen__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <section className="market-screen__filters" aria-label="Market filters">
        <label className="market-screen__field market-screen__field--search">
          <span>Search</span>

          <input
            type="search"
            value={filters.search}
            maxLength={200}
            placeholder="Search by wrestler name"
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <label className="market-screen__field">
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

        <label className="market-screen__field">
          <span>Primary class</span>

          <select
            value={filters.primaryClass}
            onChange={(event) =>
              updateFilters({ primaryClass: event.target.value })
            }
          >
            <option value="all">All classes</option>

            {filters.primaryClass !== "all" &&
              !availableClasses.includes(filters.primaryClass) && (
                <option value={filters.primaryClass}>
                  {filters.primaryClass}
                </option>
              )}

            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label className="market-screen__field">
          <span>Role</span>

          <select
            value={filters.role}
            onChange={(event) => {
              const option = roleOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ role: option.value });
              }
            }}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="market-screen__field">
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

        <label className="market-screen__field">
          <span>Sort by</span>

          <select
            value={filters.sort}
            onChange={(event) => {
              const option = sortOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ sort: option.value });
              }
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="market-screen__filter-actions">
          <button
            className="market-screen__button"
            type="button"
            disabled={!hasFilters}
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section
        className="market-screen__results"
        aria-label="Available wrestlers"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <p className="market-screen__message" role="status">
            {isSearching ? "Searching wrestlers…" : "Loading market…"}
          </p>
        ) : errorMessage ? (
          <div className="market-screen__error" role="alert">
            <p>{errorMessage}</p>

            <button
              className="market-screen__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <>
            <p className="market-screen__count" role="status">
              {data.total_count}{" "}
              {data.total_count === 1 ? "wrestler" : "wrestlers"} found
              {" · "}
              {data.available_count} available in the market
            </p>

            {data.items.length === 0 ? (
              <div className="market-screen__empty">
                <h2>No wrestlers found</h2>

                <p>
                  {hasFilters
                    ? "Try another search or adjust your filters."
                    : "No wrestlers are currently available to sign."}
                </p>

                {hasFilters && (
                  <button
                    className="market-screen__button"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="market-screen__grid">
                {data.items.map((wrestler) => (
                  <li key={wrestler.market_key}>
                    <MarketWrestlerCard
                      wrestler={wrestler}
                      onViewProfile={handleViewProfile}
                    />
                  </li>
                ))}
              </ul>
            )}

            {data.total_pages > 1 && (
              <nav
                className="market-screen__pagination"
                aria-label="Market pagination"
              >
                <button
                  className="market-screen__button"
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
                  className="market-screen__button"
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
