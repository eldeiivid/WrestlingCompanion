import { useId, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

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

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <label className="market-screen__field">
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) => {
          const option = options.find(
            (item) => item.value === event.target.value,
          );

          if (option) {
            onChange(option.value);
          }
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const genderOptions: FilterOption<MarketGender | "all">[] = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const roleOptions: FilterOption<MarketRole | "all">[] = [
  { value: "all", label: "All roles" },
  { value: "face", label: "Face" },
  { value: "heel", label: "Heel" },
];

const categoryOptions: FilterOption<MarketCategory | "all">[] = [
  { value: "all", label: "All categories" },
  { value: "active", label: "Active" },
  { value: "legend", label: "Legend" },
  { value: "local", label: "Local" },
];

const sortOptions: FilterOption<MarketSort>[] = [
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
  { value: "mic_skill_desc", label: "Mic skill: highest first" },
  { value: "in_ring_skill_desc", label: "Ring level: highest first" },
];

export default function MarketScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const navigate = useNavigate();

  const headingId = useId();
  const filtersId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFilterCount = [
    filters.gender !== "all",
    filters.primaryClass !== "all",
    filters.role !== "all",
    filters.category !== "all",
  ].filter(Boolean).length;

  const hasFilters =
    activeFilterCount > 0 ||
    filters.search !== "" ||
    filters.sort !== "name_asc";

  const classOptions =
    filters.primaryClass === "all" ||
    availableClasses.includes(filters.primaryClass)
      ? availableClasses
      : [...availableClasses, filters.primaryClass];

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
    <section className="market-screen" aria-labelledby={headingId}>
      <header className="market-screen__header">
        <div>
          <p className="market-screen__eyebrow">Build your brand</p>
          <h1 id={headingId}>Market</h1>

          <p className="market-screen__description">
            Find the next addition to your roster.
          </p>
        </div>

        <button
          className="market-screen__button market-screen__refresh"
          type="button"
          disabled={isLoading}
          onClick={retry}
          aria-label="Refresh market"
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      <div className="market-screen__tools">
        <label className="market-screen__search">
          <span className="market-screen__sr-only">
            Search by wrestler name
          </span>

          <Search size={18} aria-hidden="true" />

          <input
            type="search"
            value={filters.search}
            maxLength={200}
            placeholder="Search wrestlers"
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <div className="market-screen__tool-actions">
          <FilterSelect
            label="Sort by"
            value={filters.sort}
            options={sortOptions}
            onChange={(sort) => updateFilters({ sort })}
          />

          <button
            className="market-screen__button market-screen__filter-toggle"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="market-screen__filter-count">
                <span className="market-screen__sr-only">Active filters: </span>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <fieldset
        className="market-screen__filters"
        id={filtersId}
        hidden={!filtersOpen}
      >
        <legend className="market-screen__sr-only">Market filters</legend>

        <FilterSelect
          label="Gender"
          value={filters.gender}
          options={genderOptions}
          onChange={(gender) => updateFilters({ gender })}
        />

        <label className="market-screen__field">
          <span>Primary class</span>

          <select
            value={filters.primaryClass}
            onChange={(event) =>
              updateFilters({ primaryClass: event.target.value })
            }
          >
            <option value="all">All classes</option>

            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <FilterSelect
          label="Role"
          value={filters.role}
          options={roleOptions}
          onChange={(role) => updateFilters({ role })}
        />

        <FilterSelect
          label="Category"
          value={filters.category}
          options={categoryOptions}
          onChange={(category) => updateFilters({ category })}
        />
      </fieldset>

      <section
        className="market-screen__results"
        aria-label="Available wrestlers"
        aria-busy={isLoading}
      >
        <div className="market-screen__results-header">
          <div>
            {!isLoading && !errorMessage && data && (
              <p className="market-screen__count" role="status">
                <strong>{data.total_count}</strong>{" "}
                {data.total_count === 1 ? "wrestler" : "wrestlers"} found
                <span>{data.available_count} available in the market</span>
              </p>
            )}
          </div>

          {hasFilters && (
            <button
              className="market-screen__reset"
              type="button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="market-screen__message" role="status">
            {isSearching ? "Searching wrestlers…" : "Loading market…"}
          </p>
        ) : errorMessage ? (
          <div className="market-screen__error">
            <p role="alert">{errorMessage}</p>

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
            {data.items.length === 0 ? (
              <div className="market-screen__empty">
                <h2>No wrestlers found</h2>

                <p>
                  {hasFilters
                    ? "Try another search or reset your filters."
                    : "No wrestlers are currently available to sign."}
                </p>
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
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                <span>
                  Page {page} of {data.total_pages}
                </span>

                <button
                  className="market-screen__button"
                  type="button"
                  disabled={page >= data.total_pages}
                  onClick={() => goToPage(page + 1)}
                  aria-label="Next page"
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
