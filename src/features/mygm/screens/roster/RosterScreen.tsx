import { useId } from "react";
import { useOutletContext } from "react-router-dom";
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
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
  { value: "mic_skill_desc", label: "Mic skill: highest first" },
  { value: "in_ring_skill_desc", label: "In-ring level: highest first" },
];

export default function RosterScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const headingId = useId();

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

  const hasFilterChanges =
    filters.gender !== "all" ||
    filters.primaryClass !== "all" ||
    filters.role !== "all" ||
    filters.category !== "all" ||
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

  return (
    <section className="career-roster" aria-labelledby={headingId}>
      <header className="career-roster__header">
        <div>
          <p className="career-roster__eyebrow">Your brand</p>

          <h1 id={headingId}>Roster</h1>

          <p className="career-roster__description">
            Review your wrestlers, classes and skills.
          </p>

          {!isLoading && !errorMessage && data && (
            <p className="career-roster__total">
              {data.roster_count}{" "}
              {data.roster_count === 1 ? "wrestler" : "wrestlers"} on your
              roster
            </p>
          )}
        </div>

        <button
          className="career-roster__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <fieldset className="career-roster__filters">
        <legend className="career-roster__sr-only">
          Filter and sort the roster
        </legend>

        <label className="career-roster__field career-roster__search">
          <span>Search</span>

          <input
            type="search"
            placeholder="Search by wrestler name"
            maxLength={200}
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <label className="career-roster__field">
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

        <button
          className="career-roster__button career-roster__reset"
          type="button"
          disabled={!hasFilterChanges}
          onClick={resetFilters}
        >
          Reset filters
        </button>
      </fieldset>

      <div className="career-roster__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="career-roster__state">
            <p role="status">
              {isSearching ? "Searching roster…" : "Loading roster…"}
            </p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="career-roster__state">
            <h2>The roster could not be loaded</h2>

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
            <h2>
              {data.roster_count === 0
                ? "No wrestlers on your roster"
                : "No matching wrestlers"}
            </h2>

            <p>
              {data.roster_count === 0
                ? "Wrestlers added to your brand will appear here."
                : "Try another search or reset your filters."}
            </p>

            {hasFilterChanges && (
              <button
                className="career-roster__button"
                type="button"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length > 0 && (
          <>
            <p className="career-roster__results" role="status">
              Showing {firstResult}–{lastResult} of {data.total_count}{" "}
              {data.total_count === 1 ? "wrestler" : "wrestlers"}
            </p>

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

            <nav
              className="career-roster__pagination"
              aria-label="Roster pagination"
            >
              <button
                className="career-roster__button"
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
                className="career-roster__button"
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
