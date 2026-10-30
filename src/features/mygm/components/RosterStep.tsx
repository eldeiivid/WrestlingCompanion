import { useState } from "react";
import { Check, UserRound, X } from "lucide-react";

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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      className={`roster-card ${selected ? "roster-card--selected" : ""}`}
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
    >
      <div className="roster-card__image">
        {wrestler.image_url && !imageFailed ? (
          <img
            src={wrestler.image_url}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <UserRound size={48} aria-hidden="true" />
        )}

        {selected && (
          <span className="roster-card__check">
            <Check size={16} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="roster-card__details">
        <h3>{wrestler.name}</h3>
        <p>{wrestler.primary_class ?? "Unclassified"}</p>

        <div className="roster-card__stats">
          <span>{wrestler.default_role === "face" ? "Face" : "Heel"}</span>
          <span>Mic: {wrestler.mic_skill ?? "—"}</span>
          <span>Ring: {wrestler.in_ring_skill ?? "—"}</span>
        </div>
      </div>
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

  function toggleWrestler(wrestler: RosterWrestler) {
    onSelectionChange(
      selectedIds.has(wrestler.id)
        ? selectedWrestlers.filter((selected) => selected.id !== wrestler.id)
        : [...selectedWrestlers, wrestler],
    );
  }

  return (
    <section className="new-career__panel roster-step">
      <h2>Select your starting roster</h2>
      <p className="roster-step__description">
        Choose the wrestlers drafted to your brand.
      </p>

      <div className="roster-step__filters">
        <div className="new-career__field roster-step__search">
          <label htmlFor="roster-search">Search</label>
          <input
            id="roster-search"
            type="search"
            placeholder="Search wrestlers"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </div>

        <div className="new-career__field">
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

        <div className="new-career__field">
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

        <div className="new-career__field">
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

        <div className="new-career__field">
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

        <div className="new-career__field">
          <label htmlFor="roster-sort">Sort by</label>
          <select
            id="roster-sort"
            value={filters.sort}
            onChange={(event) =>
              updateFilter("sort", event.target.value as RosterSort)
            }
          >
            <option value="name">Name A–Z</option>
            <option value="mic_skill">Mic skill: highest first</option>
            <option value="in_ring_skill">Ring level: highest first</option>
          </select>
        </div>
      </div>

      <p className="roster-step__selection-count" role="status">
        {selectedWrestlers.length} wrestlers selected
      </p>

      {selectedWrestlers.length > 0 && (
        <ul className="roster-step__selection" aria-label="Selected wrestlers">
          {selectedWrestlers.map((wrestler) => (
            <li key={wrestler.id}>
              <span>{wrestler.name}</span>
              <button
                type="button"
                aria-label={`Remove ${wrestler.name} from selection`}
                onClick={() => toggleWrestler(wrestler)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isLoading ? (
        <p role="status">Loading wrestlers…</p>
      ) : errorMessage ? (
        <div>
          <p className="new-career__error" role="alert">
            {errorMessage}
          </p>
          <button className="new-career__button" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : wrestlers.length === 0 ? (
        <p>No wrestlers match your filters.</p>
      ) : (
        <>
          <p className="roster-step__results">{total} wrestlers found</p>

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

      <nav className="roster-step__pagination" aria-label="Roster pages">
        <button
          className="new-career__button"
          type="button"
          disabled={isLoading || Boolean(errorMessage) || page <= 1}
          onClick={() => changePage(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          className="new-career__button"
          type="button"
          disabled={isLoading || Boolean(errorMessage) || page >= totalPages}
          onClick={() => changePage(page + 1)}
        >
          Next page
        </button>
      </nav>

      <footer className="new-career__actions">
        <button className="new-career__button" type="button" onClick={onBack}>
          Back
        </button>

        <button
          className="new-career__button new-career__button--primary"
          type="button"
          disabled={selectedWrestlers.length === 0}
          onClick={onNext}
        >
          Next
        </button>
      </footer>
    </section>
  );
}
