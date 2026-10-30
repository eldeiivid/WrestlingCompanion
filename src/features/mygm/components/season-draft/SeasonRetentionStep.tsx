import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import SeasonRetentionCard from "./SeasonRetentionCard";
import { useSaveSeasonRetention } from "../../hooks/season-draft/useSaveSeasonRetention";

import type {
  SaveSeasonRetentionResult,
  SeasonTransitionData,
} from "../../types/season-draft/seasonDraft.types";

import "./SeasonRetentionStep.scss";

interface SeasonRetentionStepProps {
  data: SeasonTransitionData;
  onContinue: (result: SaveSeasonRetentionResult) => void;
}

type GenderFilter = "all" | "male" | "female";

type ViewFilter = "all" | "selected" | "unselected" | "champions";

function getInitialSelection(data: SeasonTransitionData): Set<string> {
  return new Set(
    data.candidates
      .filter((candidate) => candidate.is_retained)
      .map((candidate) => candidate.membership_id),
  );
}

export default function SeasonRetentionStep({
  data,
  onContinue,
}: SeasonRetentionStepProps) {
  const headingId = useId();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    getInitialSelection(data),
  );

  const [savedIds, setSavedIds] = useState<Set<string>>(() =>
    getInitialSelection(data),
  );

  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [view, setView] = useState<ViewFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  const { isSaving, errorMessage, save, clearError } = useSaveSeasonRetention();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedCount = selectedIds.size;

  const hasChanges =
    selectedIds.size !== savedIds.size ||
    [...selectedIds].some((id) => !savedIds.has(id));

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCandidates = data.candidates.filter((candidate) => {
    if (gender !== "all" && candidate.gender !== gender) {
      return false;
    }

    if (
      normalizedSearch &&
      !candidate.name.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }

    const isSelected = selectedIds.has(candidate.membership_id);

    switch (view) {
      case "selected":
        return isSelected;

      case "unselected":
        return !isSelected;

      case "champions":
        return candidate.is_champion;

      default:
        return true;
    }
  });

  function handleSelectionChange(membershipId: string, isSelected: boolean) {
    if (
      isSaving ||
      submittingRef.current ||
      !data.candidates.some(
        (candidate) => candidate.membership_id === membershipId,
      )
    ) {
      return;
    }

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (isSelected) {
        next.add(membershipId);
      } else {
        next.delete(membershipId);
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

    setSelectedIds(new Set<string>());
    setSuccessMessage("");
    clearError();
  }

  async function handleSave(continueAfterSave: boolean) {
    if (isSaving || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSuccessMessage("");

    try {
      const result = await save({
        careerId: data.career_id,
        transitionId: data.transition.id,
        membershipIds: [...selectedIds],
      });

      if (!result || !mountedRef.current) {
        return;
      }

      setSelectedIds(new Set(result.retained_membership_ids));
      setSavedIds(new Set(result.retained_membership_ids));
      setSuccessMessage("Retention selection saved.");

      if (continueAfterSave) {
        onContinue(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSave(true);
  }

  return (
    <section className="season-retention-step" aria-labelledby={headingId}>
      <header className="season-retention-step__header">
        <h2 id={headingId}>Retain wrestlers</h2>

        <p>
          Select the wrestlers you retained in the game for Season{" "}
          {data.transition.to_season}.
        </p>
      </header>

      <p className="season-retention-step__hint">
        Champions are recommended, but the choice and number of retained
        wrestlers are up to you. Remaining weeks from previous contracts will
        not carry over.
      </p>

      <form onSubmit={handleSubmit} aria-busy={isSaving}>
        <fieldset className="season-retention-step__fields" disabled={isSaving}>
          <legend className="season-retention-step__legend">
            Retention selection
          </legend>

          <div className="season-retention-step__filters">
            <label className="season-retention-step__field season-retention-step__field--search">
              <span>Search</span>

              <input
                type="search"
                value={search}
                maxLength={200}
                placeholder="Search by wrestler name"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="season-retention-step__field">
              <span>Gender</span>

              <select
                value={gender}
                onChange={(event) => {
                  const value = event.target.value;

                  if (
                    value === "all" ||
                    value === "male" ||
                    value === "female"
                  ) {
                    setGender(value);
                  }
                }}
              >
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label className="season-retention-step__field">
              <span>Show</span>

              <select
                value={view}
                onChange={(event) => {
                  const value = event.target.value;

                  if (
                    value === "all" ||
                    value === "selected" ||
                    value === "unselected" ||
                    value === "champions"
                  ) {
                    setView(value);
                  }
                }}
              >
                <option value="all">All wrestlers</option>
                <option value="selected">Selected</option>
                <option value="unselected">Not selected</option>
                <option value="champions">Champions</option>
              </select>
            </label>
          </div>

          <div className="season-retention-step__selection">
            <p role="status">
              <strong>{selectedCount}</strong>{" "}
              {selectedCount === 1 ? "wrestler selected" : "wrestlers selected"}
            </p>

            <button
              className="season-retention-step__button"
              type="button"
              disabled={isSaving || selectedCount === 0}
              onClick={clearSelection}
            >
              Clear selection
            </button>
          </div>

          <p className="season-retention-step__results">
            Showing {filteredCandidates.length} of {data.candidate_count}{" "}
            wrestlers
          </p>

          {filteredCandidates.length > 0 ? (
            <ul className="season-retention-step__grid">
              {filteredCandidates.map((candidate) => (
                <li key={candidate.membership_id}>
                  <SeasonRetentionCard
                    candidate={candidate}
                    isSelected={selectedIds.has(candidate.membership_id)}
                    disabled={isSaving}
                    onSelectionChange={handleSelectionChange}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="season-retention-step__empty">
              {data.candidate_count === 0
                ? "No wrestlers are available to retain."
                : "No wrestlers match these filters."}
            </p>
          )}

          {selectedCount === 0 && (
            <p className="season-retention-step__hint">
              No wrestlers selected. You can continue to the new draft without
              retaining anyone.
            </p>
          )}

          {errorMessage && (
            <p className="season-retention-step__error" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="season-retention-step__success" role="status">
              {successMessage}
            </p>
          )}

          <footer className="season-retention-step__actions">
            <button
              className="season-retention-step__button"
              type="button"
              disabled={isSaving || !hasChanges}
              onClick={() => void handleSave(false)}
            >
              Save selection
            </button>

            <button
              className="season-retention-step__button season-retention-step__button--primary"
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
