import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";

import { useRosterCatalog } from "../hooks/useRosterCatalog";
import type { RosterSort, RosterWrestler } from "../types/roster.types";

import "./RosterStep.scss";

interface RosterStepProps {
  selectedWrestlers: RosterWrestler[];
  onSelectionChange: (wrestlers: RosterWrestler[]) => void;
  onBack: () => void;
  onNext: () => void;
}

interface WrestlerCardProps {
  wrestler: RosterWrestler;
  selected: boolean;
  onToggle: () => void;
}

function WrestlerCard({ wrestler, selected, onToggle }: WrestlerCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage =
    wrestler.image_url !== null && wrestler.image_url !== failedUrl;

  const nameId = `roster-pick-${wrestler.id}`;

  return (
    <button
      className={["roster-pick-card", selected ? "is-selected" : ""]
        .filter(Boolean)
        .join(" ")}
      type="button"
      aria-labelledby={nameId}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <span className="roster-pick-card__portrait" aria-hidden="true">
        {showImage && wrestler.image_url ? (
          <img
            src={wrestler.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(wrestler.image_url)}
          />
        ) : (
          <UserRound size={52} strokeWidth={1.3} />
        )}

        <span className="roster-pick-card__indicator">
          {selected ? <Check size={15} /> : <Plus size={15} />}
        </span>
      </span>

      <span className="roster-pick-card__body">
        <strong className="roster-pick-card__name" id={nameId}>
          {wrestler.name}
        </strong>

        <span className="roster-pick-card__class">
          {wrestler.primary_class?.trim() || "Unclassified"}
        </span>

        <span className="roster-pick-card__role">
          {wrestler.default_role === "face" ? "Face" : "Heel"}
        </span>

        <span className="roster-pick-card__stats">
          <span>
            <span>Mic</span>
            <strong>{wrestler.mic_skill ?? "—"}</strong>
          </span>

          <span>
            <span>Ring</span>
            <strong>{wrestler.in_ring_skill ?? "—"}</strong>
          </span>
        </span>
      </span>
    </button>
  );
}

export default function RosterStep({
  selectedWrestlers,
  onSelectionChange,
  onBack,
  onNext,
}: RosterStepProps) {
  const {
    filters,
    page,
    wrestlers,
    primaryClasses,
    total,
    totalPages,
    isLoading,
    errorMessage,
    updateFilter,
    changePage,
    retry,
  } = useRosterCatalog();

  const selectedIds = new Set(selectedWrestlers.map((wrestler) => wrestler.id));

  const activeFilterCount = [
    filters.gender,
    filters.primaryClass,
    filters.role,
    filters.category,
  ].filter(Boolean).length;

  const selectionLabel =
    selectedWrestlers.length === 1
      ? "1 wrestler selected"
      : `${selectedWrestlers.length} wrestlers selected`;

  function toggleWrestler(wrestler: RosterWrestler) {
    onSelectionChange(
      selectedIds.has(wrestler.id)
        ? selectedWrestlers.filter((selected) => selected.id !== wrestler.id)
        : [...selectedWrestlers, wrestler],
    );
  }

  return (
    <section className="roster-step" aria-labelledby="roster-step-title">
      <header className="roster-step__heading">
        <h2 id="roster-step-title">Build your starting roster.</h2>

        <p>
          Select the wrestlers drafted to your brand. Your selections stay with
          you as you browse.
        </p>
      </header>

      <div className="roster-step__toolbar">
        <div className="roster-step__field">
          <label htmlFor="roster-search">Find a wrestler</label>

          <div className="roster-step__search">
            <Search size={18} aria-hidden="true" />

            <input
              id="roster-search"
              type="search"
              placeholder="Search by name"
              autoComplete="off"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </div>
        </div>

        <div className="roster-step__field">
          <label htmlFor="roster-sort">Sort by</label>

          <select
            id="roster-sort"
            value={filters.sort}
            onChange={(event) =>
              updateFilter("sort", event.target.value as RosterSort)
            }
          >
            <option value="name">Name A–Z</option>
            <option value="mic_skill">Highest mic skill</option>
            <option value="in_ring_skill">Highest ring level</option>
          </select>
        </div>
      </div>

      <details className="roster-step__filters">
        <summary>
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="roster-step__filter-count">
              {activeFilterCount}
            </span>
          )}
        </summary>

        <div className="roster-step__filter-grid">
          <div className="roster-step__field">
            <label htmlFor="roster-gender">Gender</label>

            <select
              id="roster-gender"
              value={filters.gender}
              onChange={(event) =>
                updateFilter(
                  "gender",
                  event.target.value as "" | "male" | "female",
                )
              }
            >
              <option value="">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="roster-step__field">
            <label htmlFor="roster-class">Primary class</label>

            <select
              id="roster-class"
              value={filters.primaryClass}
              onChange={(event) =>
                updateFilter("primaryClass", event.target.value)
              }
            >
              <option value="">All classes</option>

              {primaryClasses.map((primaryClass) => (
                <option key={primaryClass} value={primaryClass}>
                  {primaryClass}
                </option>
              ))}
            </select>
          </div>

          <div className="roster-step__field">
            <label htmlFor="roster-role">Role</label>

            <select
              id="roster-role"
              value={filters.role}
              onChange={(event) =>
                updateFilter("role", event.target.value as "" | "face" | "heel")
              }
            >
              <option value="">All roles</option>
              <option value="face">Face</option>
              <option value="heel">Heel</option>
            </select>
          </div>

          <div className="roster-step__field">
            <label htmlFor="roster-category">Category</label>

            <select
              id="roster-category"
              value={filters.category}
              onChange={(event) =>
                updateFilter(
                  "category",
                  event.target.value as "" | "active" | "legend" | "local",
                )
              }
            >
              <option value="">All categories</option>
              <option value="active">Active</option>
              <option value="legend">Legend</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>
      </details>

      {selectedWrestlers.length > 0 && (
        <details className="roster-step__selection">
          <summary>
            <UserRound size={17} aria-hidden="true" />
            Review selected roster
            <span>{selectedWrestlers.length}</span>
          </summary>

          <ul aria-label="Selected wrestlers">
            {selectedWrestlers.map((wrestler) => (
              <li key={wrestler.id}>
                <span>{wrestler.name}</span>

                <button
                  type="button"
                  aria-label={`Remove ${wrestler.name} from selection`}
                  onClick={() => toggleWrestler(wrestler)}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="roster-step__catalog" aria-busy={isLoading}>
        {isLoading ? (
          <p className="roster-step__message" role="status">
            Loading wrestlers…
          </p>
        ) : errorMessage ? (
          <div className="roster-step__state">
            <p className="roster-step__error" role="alert">
              {errorMessage}
            </p>

            <button
              className="roster-step__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : wrestlers.length === 0 ? (
          <div className="roster-step__state">
            <Search size={28} aria-hidden="true" />
            <h3>No wrestlers found.</h3>
            <p>Try another name or adjust your filters.</p>
          </div>
        ) : (
          <>
            <p className="roster-step__results">
              {total} {total === 1 ? "wrestler" : "wrestlers"} found
            </p>

            <div className="roster-step__grid">
              {wrestlers.map((wrestler) => (
                <WrestlerCard
                  key={wrestler.id}
                  wrestler={wrestler}
                  selected={selectedIds.has(wrestler.id)}
                  onToggle={() => toggleWrestler(wrestler)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!errorMessage && totalPages > 0 && (
        <nav className="roster-step__pagination" aria-label="Roster pages">
          <button
            className="roster-step__page-button"
            type="button"
            disabled={isLoading || page <= 1}
            onClick={() => changePage(page - 1)}
            aria-label="Previous roster page"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <span>
            Page <strong>{page}</strong> of {totalPages}
          </span>

          <button
            className="roster-step__page-button"
            type="button"
            disabled={isLoading || page >= totalPages}
            onClick={() => changePage(page + 1)}
            aria-label="Next roster page"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </nav>
      )}

      <footer className="roster-step__actions">
        <p role="status" aria-live="polite">
          <UserRound size={17} aria-hidden="true" />
          {selectionLabel}
        </p>

        <div>
          <button
            className="roster-step__button"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back
          </button>

          <button
            className="roster-step__button roster-step__button--primary"
            type="button"
            disabled={selectedWrestlers.length === 0}
            onClick={onNext}
          >
            Championships
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
