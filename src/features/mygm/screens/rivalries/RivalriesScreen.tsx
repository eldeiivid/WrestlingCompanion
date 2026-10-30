import { useId, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import RivalryDetailModal from "../../components/dashboard/rivalries/RivalryDetailModal";
import RivalryLevel from "../../components/dashboard/rivalries/RivalryLevel";
import RivalryParticipants from "../../components/dashboard/rivalries/RivalryParticipants";
import { useRivalries } from "../../hooks/rivalries/useRivalries";
import type { MyGmOutletContext } from "../../types/mygm.types";
import type {
  RivalriesFilters,
  RivalryKind,
  RivalryListItem,
  RivalryStatus,
} from "../../types/rivalries/rivalries.types";
import "./RivalriesScreen.scss";

const statusOptions: {
  value: RivalriesFilters["status"];
  label: string;
}[] = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "stale", label: "Stale" },
  { value: "all", label: "All statuses" },
];

const kindOptions: {
  value: RivalriesFilters["kind"];
  label: string;
}[] = [
  { value: "all", label: "All types" },
  { value: "singles", label: "Singles" },
  { value: "tag_team", label: "Tag team" },
  { value: "stable", label: "Stable" },
];

const statusLabels: Record<RivalryStatus, string> = {
  active: "Active",
  resolved: "Resolved",
  stale: "Stale",
};

const kindLabels: Record<RivalryKind, string> = {
  singles: "Singles",
  tag_team: "Tag team",
  stable: "Stable",
};

function getRivalryName(rivalry: RivalryListItem): string {
  if (rivalry.name?.trim()) {
    return rivalry.name.trim();
  }

  const firstSide = rivalry.members
    .filter((member) => member.side === 1)
    .map((member) => member.name)
    .join(" & ");

  const secondSide = rivalry.members
    .filter((member) => member.side === 2)
    .map((member) => member.name)
    .join(" & ");

  return firstSide && secondSide ? `${firstSide} vs ${secondSide}` : "Rivalry";
}

function formatTick(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function RivalriesScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const headingId = useId();

  const [selectedFeudId, setSelectedFeudId] = useState<string | null>(null);

  const {
    data,
    filters,
    isLoading,
    isSearching,
    errorMessage,
    updateFilters,
    resetFilters,
    goToPage,
    retry,
  } = useRivalries(career.id);

  const hasFilterChanges =
    filters.status !== "active" ||
    filters.kind !== "all" ||
    filters.search !== "";

  const firstResult =
    data && data.total_count > 0 ? (data.page - 1) * data.page_size + 1 : 0;

  const lastResult =
    data && data.items.length > 0 ? firstResult + data.items.length - 1 : 0;

  return (
    <section className="rivalries-screen" aria-labelledby={headingId}>
      <header className="rivalries-screen__header">
        <div>
          <p className="rivalries-screen__eyebrow">Career rivalries</p>

          <h1 id={headingId}>Rivalries</h1>

          <p className="rivalries-screen__description">
            Track participants, rivalry levels and recorded activity.
          </p>
        </div>

        <button
          className="rivalries-screen__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <fieldset className="rivalries-screen__filters">
        <legend className="rivalries-screen__sr-only">Filter rivalries</legend>

        <label className="rivalries-screen__field rivalries-screen__search">
          <span>Search</span>

          <input
            type="search"
            placeholder="Search by rivalry or wrestler name"
            maxLength={200}
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </label>

        <label className="rivalries-screen__field">
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

        <label className="rivalries-screen__field">
          <span>Type</span>

          <select
            value={filters.kind}
            onChange={(event) => {
              const option = kindOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                updateFilters({ kind: option.value });
              }
            }}
          >
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="rivalries-screen__button"
          type="button"
          disabled={!hasFilterChanges}
          onClick={resetFilters}
        >
          Reset filters
        </button>
      </fieldset>

      <div className="rivalries-screen__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="rivalries-screen__state">
            <p role="status">
              {isSearching ? "Searching rivalries…" : "Loading rivalries…"}
            </p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rivalries-screen__state">
            <h2>Rivalries could not be loaded</h2>
            <p role="alert">{errorMessage}</p>

            <button
              className="rivalries-screen__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length === 0 && (
          <div className="rivalries-screen__state">
            <h2>
              {hasFilterChanges
                ? "No matching rivalries"
                : "No active rivalries yet"}
            </h2>

            <p>
              {hasFilterChanges
                ? "Try another search or reset your filters."
                : "Create a rivalry through your show results to start tracking its progress."}
            </p>

            {hasFilterChanges ? (
              <button
                className="rivalries-screen__button"
                type="button"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            ) : (
              <Link
                className="rivalries-screen__button"
                to={`/mygm/${career.id}/booking`}
              >
                Go to booking
              </Link>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length > 0 && (
          <>
            <p className="rivalries-screen__results" role="status">
              Showing {firstResult}–{lastResult} of {data.total_count}{" "}
              {data.total_count === 1 ? "rivalry" : "rivalries"}
            </p>

            <ul className="rivalries-screen__list">
              {data.items.map((rivalry) => {
                const name = getRivalryName(rivalry);

                const winnerNames =
                  rivalry.winning_side === null
                    ? ""
                    : rivalry.members
                        .filter(
                          (member) => member.side === rivalry.winning_side,
                        )
                        .map((member) => member.name)
                        .join(" & ");

                return (
                  <li key={rivalry.id}>
                    <article className="rivalries-screen__card">
                      <header className="rivalries-screen__card-header">
                        <div className="rivalries-screen__badges">
                          <span>{statusLabels[rivalry.status]}</span>
                          <span>{kindLabels[rivalry.kind]}</span>
                        </div>

                        <h2>{name}</h2>
                      </header>

                      <RivalryParticipants members={rivalry.members} compact />

                      <RivalryLevel level={rivalry.level} />

                      <dl className="rivalries-screen__facts">
                        <div>
                          <dt>Started</dt>
                          <dd>
                            Season {rivalry.started_season}
                            {" · "}
                            Week {rivalry.started_week}
                          </dd>
                        </div>

                        <div>
                          <dt>Duration</dt>
                          <dd>
                            {rivalry.weeks_active}{" "}
                            {rivalry.weeks_active === 1 ? "week" : "weeks"}
                          </dd>
                        </div>

                        {rivalry.ended_tick !== null && (
                          <div>
                            <dt>Ended</dt>
                            <dd>{formatTick(rivalry.ended_tick)}</dd>
                          </div>
                        )}

                        {rivalry.status === "resolved" && (
                          <div>
                            <dt>Rivalry winner</dt>
                            <dd>{winnerNames || "No winner assigned"}</dd>
                          </div>
                        )}
                      </dl>

                      <footer className="rivalries-screen__card-footer">
                        <button
                          className="rivalries-screen__button"
                          type="button"
                          aria-haspopup="dialog"
                          aria-label={`View rivalry: ${name}`}
                          onClick={() => setSelectedFeudId(rivalry.id)}
                        >
                          View rivalry
                        </button>
                      </footer>
                    </article>
                  </li>
                );
              })}
            </ul>

            <nav
              className="rivalries-screen__pagination"
              aria-label="Rivalries pagination"
            >
              <button
                className="rivalries-screen__button"
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
                className="rivalries-screen__button"
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

      <RivalryDetailModal
        careerId={career.id}
        feudId={selectedFeudId}
        onClose={() => setSelectedFeudId(null)}
      />
    </section>
  );
}
