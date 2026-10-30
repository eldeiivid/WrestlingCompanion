import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import SeasonDraftCard from "./SeasonDraftCard";
import { useSeasonDraftOptions } from "../../hooks/season-draft/useSeasonDraftOptions";
import { useSaveSeasonDraft } from "../../hooks/season-draft/useSaveSeasonDraft";

import type { SeasonDraftFilters } from "../../types/season-draft/seasonDraftOptions.types";
import type {
  SaveSeasonDraftResult,
  SeasonTransitionData,
} from "../../types/season-draft/seasonDraft.types";

import "./SeasonDraftStep.scss";

interface SeasonDraftStepProps {
  data: SeasonTransitionData;
  onBack: (result: SaveSeasonDraftResult) => void;
  onContinue: (result: SaveSeasonDraftResult) => void;
}

type SaveDestination = "stay" | "back" | "continue";

const genderOptions: {
  value: SeasonDraftFilters["gender"];
  label: string;
}[] = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const roleOptions: {
  value: SeasonDraftFilters["role"];
  label: string;
}[] = [
  { value: "all", label: "All roles" },
  { value: "face", label: "Face" },
  { value: "heel", label: "Heel" },
];

const categoryOptions: {
  value: SeasonDraftFilters["category"];
  label: string;
}[] = [
  { value: "all", label: "All categories" },
  { value: "active", label: "Active" },
  { value: "legend", label: "Legend" },
  { value: "local", label: "Local" },
];

const sortOptions: {
  value: SeasonDraftFilters["sort"];
  label: string;
}[] = [
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
  { value: "mic_skill_desc", label: "Mic skill: highest first" },
  { value: "in_ring_skill_desc", label: "Ring level: highest first" },
];

export default function SeasonDraftStep({
  data,
  onBack,
  onContinue,
}: SeasonDraftStepProps) {
  const headingId = useId();

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(data.draft_keys),
  );

  const [savedKeys, setSavedKeys] = useState<Set<string>>(
    () => new Set(data.draft_keys),
  );

  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  const {
    data: options,
    filters,
    availableClasses,
    page,
    isLoading,
    isSearching,
    errorMessage: optionsError,
    updateFilters,
    resetFilters,
    goToPage,
    retry,
  } = useSeasonDraftOptions(data.career_id, data.transition.id);

  const {
    isSaving,
    errorMessage: saveError,
    save,
    clearError,
  } = useSaveSeasonDraft();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hasChanges =
    selectedKeys.size !== savedKeys.size ||
    [...selectedKeys].some((key) => !savedKeys.has(key));

  const hasFilters =
    filters.gender !== "all" ||
    filters.primaryClass !== "all" ||
    filters.role !== "all" ||
    filters.category !== "all" ||
    filters.search !== "" ||
    filters.sort !== "name_asc";

  const totalRoster = data.retained_count + selectedKeys.size;

  function handleSelectionChange(draftKey: string, isSelected: boolean) {
    if (
      isSaving ||
      submittingRef.current ||
      !options?.items.some((item) => item.draft_key === draftKey)
    ) {
      return;
    }

    setSelectedKeys((previous) => {
      const next = new Set(previous);

      if (isSelected) {
        next.add(draftKey);
      } else {
        next.delete(draftKey);
      }

      return next;
    });

    setSuccessMessage("");
    clearError();
  }

  function clearSelection() {
    if (isSaving || submittingRef.current) {
      return;
    }

    setSelectedKeys(new Set<string>());
    setSuccessMessage("");
    clearError();
  }

  async function handleSave(destination: SaveDestination) {
    if (isSaving || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSuccessMessage("");

    try {
      const result = await save({
        careerId: data.career_id,
        transitionId: data.transition.id,
        draftKeys: [...selectedKeys],
      });

      if (!result || !mountedRef.current) {
        return;
      }

      setSelectedKeys(new Set(result.draft_keys));
      setSavedKeys(new Set(result.draft_keys));
      setSuccessMessage("Draft selection saved.");

      if (destination === "back") {
        onBack(result);
      } else if (destination === "continue") {
        onContinue(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSave("continue");
  }

  return (
    <section className="season-draft-step" aria-labelledby={headingId}>
      <header className="season-draft-step__header">
        <h2 id={headingId}>Draft your roster</h2>

        <p>
          Select the additional wrestlers you drafted in the game. Your retained
          wrestlers are already included.
        </p>
      </header>

      <form onSubmit={handleSubmit} aria-busy={isSaving}>
        <fieldset className="season-draft-step__fields" disabled={isSaving}>
          <legend className="season-draft-step__legend">
            New draft selection
          </legend>

          <div className="season-draft-step__summary">
            <p>
              <strong>{data.retained_count}</strong> retained
            </p>

            <p>
              <strong>{selectedKeys.size}</strong> drafted
            </p>

            <p>
              <strong>{totalRoster}</strong> total roster
            </p>
          </div>

          <div className="season-draft-step__filters">
            <label className="season-draft-step__field season-draft-step__field--search">
              <span>Search</span>

              <input
                type="search"
                value={filters.search}
                maxLength={200}
                placeholder="Search by wrestler name"
                onChange={(event) =>
                  updateFilters({ search: event.target.value })
                }
              />
            </label>

            <label className="season-draft-step__field">
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

            <label className="season-draft-step__field">
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

            <label className="season-draft-step__field">
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

            <label className="season-draft-step__field">
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

            <label className="season-draft-step__field">
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

            <div className="season-draft-step__filter-actions">
              <button
                className="season-draft-step__button"
                type="button"
                disabled={isSaving || !hasFilters}
                onClick={resetFilters}
              >
                Reset filters
              </button>

              <button
                className="season-draft-step__button"
                type="button"
                disabled={isSaving || selectedKeys.size === 0}
                onClick={clearSelection}
              >
                Clear selection
              </button>
            </div>
          </div>

          <div className="season-draft-step__results" aria-busy={isLoading}>
            {isLoading ? (
              <p className="season-draft-step__state" role="status">
                {isSearching
                  ? "Searching wrestlers…"
                  : "Loading draft options…"}
              </p>
            ) : optionsError ? (
              <div className="season-draft-step__state">
                <p role="alert">{optionsError}</p>

                <button
                  className="season-draft-step__button"
                  type="button"
                  onClick={retry}
                >
                  Try again
                </button>
              </div>
            ) : options ? (
              <>
                <p className="season-draft-step__count" role="status">
                  {options.total_count}{" "}
                  {options.total_count === 1 ? "wrestler" : "wrestlers"} found
                </p>

                {options.items.length === 0 ? (
                  <p className="season-draft-step__state">
                    {hasFilters
                      ? "No wrestlers match these filters."
                      : "No additional wrestlers are available for the draft."}
                  </p>
                ) : (
                  <ul className="season-draft-step__grid">
                    {options.items.map((wrestler) => (
                      <li key={wrestler.draft_key}>
                        <SeasonDraftCard
                          wrestler={wrestler}
                          isSelected={selectedKeys.has(wrestler.draft_key)}
                          disabled={isSaving}
                          onSelectionChange={handleSelectionChange}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {options.total_pages > 1 && (
                  <nav
                    className="season-draft-step__pagination"
                    aria-label="Draft options pagination"
                  >
                    <button
                      className="season-draft-step__button"
                      type="button"
                      disabled={isSaving || page <= 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      Previous
                    </button>

                    <span>
                      Page {page} of {options.total_pages}
                    </span>

                    <button
                      className="season-draft-step__button"
                      type="button"
                      disabled={isSaving || page >= options.total_pages}
                      onClick={() => goToPage(page + 1)}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            ) : null}
          </div>

          {selectedKeys.size === 0 && (
            <p className="season-draft-step__hint">
              No additional wrestlers selected. Your retained wrestlers remain
              included in the roster.
            </p>
          )}

          {saveError && (
            <p className="season-draft-step__error" role="alert">
              {saveError}
            </p>
          )}

          {successMessage && (
            <p className="season-draft-step__success" role="status">
              {successMessage}
            </p>
          )}

          <footer className="season-draft-step__actions">
            <button
              className="season-draft-step__button"
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave("back")}
            >
              Save and back
            </button>

            <button
              className="season-draft-step__button"
              type="button"
              disabled={isSaving || !hasChanges}
              onClick={() => void handleSave("stay")}
            >
              Save selection
            </button>

            <button
              className="season-draft-step__button season-draft-step__button--primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save and continue"}
            </button>
          </footer>
        </fieldset>
      </form>
    </section>
  );
}
