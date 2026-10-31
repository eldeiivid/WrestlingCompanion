import { useId, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RotateCw,
  Search,
  SlidersHorizontal,
  Store,
  UsersRound,
} from "lucide-react";

import RosterWrestlerCard from "../../components/roster/RosterWrestlerCard";

import { useCareerRoster } from "../../hooks/roster/useCareerRoster";

import type { MyGmOutletContext } from "../../types/mygm.types";
import type { CareerRosterFilters } from "../../types/roster/careerRoster.types";

import "./RosterScreen.scss";

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

const genderOptions: FilterOption<CareerRosterFilters["gender"]>[] = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const roleOptions: FilterOption<CareerRosterFilters["role"]>[] = [
  { value: "all", label: "All roles" },
  { value: "face", label: "Face" },
  { value: "heel", label: "Heel" },
];

const categoryOptions: FilterOption<CareerRosterFilters["category"]>[] = [
  { value: "all", label: "All categories" },
  { value: "active", label: "Active" },
  { value: "legend", label: "Legend" },
  { value: "local", label: "Local" },
];

const sortOptions: FilterOption<CareerRosterFilters["sort"]>[] = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "mic_skill_desc", label: "Highest mic skill" },
  { value: "in_ring_skill_desc", label: "Highest ring level" },
];

export default function RosterScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

  const headingId = useId();
  const filtersId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    data,
    filters,
    availableClasses,
    isLoading,
    isSearching,
    errorMessage,
    updateFilters,
    resetFilters,
    goToPage,
    retry,
  } = useCareerRoster(career.id);

  const activeFilterCount = [
    filters.gender !== "all",
    filters.primaryClass !== "all",
    filters.role !== "all",
    filters.category !== "all",
  ].filter(Boolean).length;

  const hasFilterChanges =
    activeFilterCount > 0 ||
    filters.search !== "" ||
    filters.sort !== "name_asc";

  const classOptions =
    filters.primaryClass === "all" ||
    availableClasses.includes(filters.primaryClass)
      ? availableClasses
      : [...availableClasses, filters.primaryClass];

  const firstResult =
    data && data.total_count > 0 ? (data.page - 1) * data.page_size + 1 : 0;

  const lastResult =
    data && data.items.length > 0 ? firstResult + data.items.length - 1 : 0;

  function handlePageChange(page: number) {
    goToPage(page);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    bodyRef.current?.scrollIntoView({
      block: "start",
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  return (
    <section className="career-roster" aria-labelledby={headingId}>
      <header className="career-roster__header">
        <div className="career-roster__heading-copy">
          <p className="career-roster__eyebrow">Your brand</p>

          <div className="career-roster__title">
            <h1 id={headingId}>Roster</h1>

            {!isLoading && !errorMessage && data && (
              <span
                className="career-roster__total"
                aria-label={`${data.roster_count} wrestlers on your roster`}
              >
                {data.roster_count}
              </span>
            )}
          </div>

          <p className="career-roster__description">
            Manage your wrestlers, skills and contracts.
          </p>
        </div>

        <div className="career-roster__header-actions">
          <Link
            className="career-roster__market"
            to={`/mygm/${career.id}/market`}
            aria-label="Open market"
            title="Open market"
          >
            <Store size={19} aria-hidden="true" />
            <span>Market</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>

          <button
            className="career-roster__refresh"
            type="button"
            disabled={isLoading}
            onClick={retry}
            aria-label="Refresh roster"
            title="Refresh roster"
          >
            <RotateCw size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="career-roster__tools">
        <label className="career-roster__search">
          <span className="career-roster__sr-only">Search wrestlers</span>

          <Search size={18} aria-hidden="true" />

          <input
            type="search"
            placeholder="Search your roster"
            autoComplete="off"
            maxLength={200}
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <div className="career-roster__toolbar">
          <label className="career-roster__sort">
            <span className="career-roster__sr-only">Sort roster</span>

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

          <button
            className={[
              "career-roster__filter-toggle",
              filtersOpen || activeFilterCount > 0 ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen((previous) => !previous)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>
        </div>

        <fieldset
          className="career-roster__filters"
          id={filtersId}
          hidden={!filtersOpen}
        >
          <legend className="career-roster__sr-only">Filter roster</legend>

          <label className="career-roster__field">
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

          <label className="career-roster__field">
            <span>Primary class</span>

            <select
              value={filters.primaryClass}
              onChange={(event) =>
                updateFilters({
                  primaryClass: event.target.value,
                })
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

          <label className="career-roster__field">
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

          <label className="career-roster__field">
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
      </div>

      <div
        ref={bodyRef}
        className="career-roster__body"
        aria-busy={isLoading || isSearching}
      >
        {(hasFilterChanges || (!isLoading && !errorMessage && data)) && (
          <div className="career-roster__results-bar">
            <p role="status">
              {!isLoading && !errorMessage && data
                ? data.total_count > 0
                  ? `Showing ${firstResult}–${lastResult} of ${data.total_count}`
                  : "No results"
                : isSearching
                  ? "Searching…"
                  : "Updating roster…"}
            </p>

            {hasFilterChanges && (
              <button
                type="button"
                onClick={resetFilters}
                aria-label="Reset roster search, filters and sort"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="career-roster__state">
            <LoaderCircle
              className="career-roster__spinner"
              size={26}
              aria-hidden="true"
            />

            <p role="status">
              {isSearching ? "Searching roster…" : "Loading roster…"}
            </p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="career-roster__state">
            <h2>The roster could not be loaded.</h2>
            <p role="alert">{errorMessage}</p>

            <button
              className="career-roster__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length === 0 && (
          <div className="career-roster__state">
            <UsersRound size={32} aria-hidden="true" />

            <h2>
              {data.roster_count === 0
                ? "Your next signing starts here."
                : "No matching wrestlers."}
            </h2>

            <p>
              {data.roster_count === 0
                ? "Visit the market to add wrestlers to your brand."
                : "Try another name or adjust your filters."}
            </p>

            {data.roster_count === 0 ? (
              <Link
                className="career-roster__button"
                to={`/mygm/${career.id}/market`}
              >
                Explore market
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ) : hasFilterChanges ? (
              <button
                className="career-roster__button"
                type="button"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            ) : null}
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length > 0 && (
          <>
            <ul className="career-roster__list">
              {data.items.map((wrestler) => (
                <li key={wrestler.id}>
                  <RosterWrestlerCard
                    careerId={career.id}
                    wrestler={wrestler}
                    currentTick={data.current_tick}
                  />
                </li>
              ))}
            </ul>

            {data.total_pages > 1 && (
              <nav
                className="career-roster__pagination"
                aria-label="Roster pagination"
              >
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => handlePageChange(data.page - 1)}
                  aria-label="Previous roster page"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>

                <span>
                  Page <strong>{data.page}</strong> of {data.total_pages}
                </span>

                <button
                  type="button"
                  disabled={data.page >= data.total_pages}
                  onClick={() => handlePageChange(data.page + 1)}
                  aria-label="Next roster page"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
