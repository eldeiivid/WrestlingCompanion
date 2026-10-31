import { useId, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";

import RivalryDetailModal from "../../components/dashboard/rivalries/RivalryDetailModal";
import RivalryLevel from "../../components/dashboard/rivalries/RivalryLevel";

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
  { value: "stale", label: "Inactive" },
  { value: "all", label: "All" },
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
  stale: "Inactive",
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

function MemberPortrait({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="rivalries-screen__portrait" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <UserRound size={48} strokeWidth={1.25} />
      )}
    </span>
  );
}

function RivalryCard({
  rivalry,
  onOpen,
}: {
  rivalry: RivalryListItem;
  onOpen: () => void;
}) {
  const headingId = useId();
  const name = getRivalryName(rivalry);

  const sides = ([1, 2] as const).map((side) => ({
    side,
    members: rivalry.members.filter((member) => member.side === side),
  }));

  const winnerNames =
    rivalry.winning_side === null
      ? ""
      : rivalry.members
          .filter((member) => member.side === rivalry.winning_side)
          .map((member) => member.name)
          .join(" & ");

  return (
    <article className="rivalries-screen__card" aria-labelledby={headingId}>
      <div className="rivalries-screen__visual">
        <div className="rivalries-screen__card-meta">
          <span className="rivalries-screen__kind">
            {kindLabels[rivalry.kind]}
          </span>

          <span
            className={`rivalries-screen__status rivalries-screen__status--${rivalry.status}`}
          >
            {statusLabels[rivalry.status]}
          </span>
        </div>

        <div className="rivalries-screen__sides">
          {sides.map((side) => (
            <div
              className="rivalries-screen__side"
              key={side.side}
              role="group"
              aria-label={`Side ${side.side}`}
            >
              <div className="rivalries-screen__members">
                {side.members.length > 0 ? (
                  side.members.map((member) => (
                    <figure
                      className="rivalries-screen__member"
                      key={member.wrestler_id}
                    >
                      <MemberPortrait src={member.image_url} />
                      <figcaption>{member.name}</figcaption>
                    </figure>
                  ))
                ) : (
                  <p className="rivalries-screen__missing">
                    Participants unavailable
                  </p>
                )}
              </div>
            </div>
          ))}

          <span className="rivalries-screen__versus" aria-hidden="true">
            VS
          </span>
        </div>
      </div>

      <div className="rivalries-screen__card-content">
        <h2 id={headingId}>{name}</h2>

        <div className="rivalries-screen__level">
          <RivalryLevel level={rivalry.level} />
        </div>

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
        </dl>

        {rivalry.status === "resolved" && (
          <div className="rivalries-screen__winner">
            <Trophy size={16} aria-hidden="true" />
            <div>
              <span>Rivalry winner</span>
              <p>{winnerNames || "No winner assigned"}</p>
            </div>
          </div>
        )}

        <button
          className="rivalries-screen__open"
          type="button"
          aria-haspopup="dialog"
          aria-label={`View rivalry: ${name}`}
          onClick={onOpen}
        >
          View rivalry
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
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
          <p className="rivalries-screen__eyebrow">Your ongoing stories</p>
          <h1 id={headingId}>Rivalries</h1>

          <p className="rivalries-screen__description">
            Follow every rivalry, from the first confrontation to the finale.
          </p>
        </div>

        <button
          className="rivalries-screen__button rivalries-screen__refresh"
          type="button"
          disabled={isLoading}
          aria-label="Refresh rivalries"
          onClick={retry}
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      <fieldset className="rivalries-screen__filters">
        <legend className="rivalries-screen__sr-only">Filter rivalries</legend>

        <div
          className="rivalries-screen__statuses"
          role="group"
          aria-label="Filter by rivalry status"
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filters.status === option.value}
              onClick={() => updateFilters({ status: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rivalries-screen__tools">
          <label className="rivalries-screen__search">
            <span className="rivalries-screen__sr-only">
              Search by rivalry or wrestler name
            </span>

            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              placeholder="Search rivalries or wrestlers"
              maxLength={200}
              value={filters.search}
              onChange={(event) =>
                updateFilters({ search: event.target.value })
              }
            />
          </label>

          <label className="rivalries-screen__type-filter">
            <span className="rivalries-screen__sr-only">Rivalry type</span>

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
        </div>
      </fieldset>

      <div className="rivalries-screen__body" aria-busy={isLoading}>
        <div className="rivalries-screen__results-header">
          <div>
            {!isLoading && !errorMessage && data && (
              <p className="rivalries-screen__results" role="status">
                {data.items.length > 0
                  ? `Showing ${firstResult}–${lastResult} of ${data.total_count}`
                  : "0"}{" "}
                {data.total_count === 1 ? "rivalry" : "rivalries"}
              </p>
            )}
          </div>

          {hasFilterChanges && (
            <button
              className="rivalries-screen__reset"
              type="button"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          )}
        </div>

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
          <div className="rivalries-screen__state rivalries-screen__empty">
            <Swords size={34} strokeWidth={1.25} aria-hidden="true" />

            <h2>
              {hasFilterChanges
                ? "No matching rivalries"
                : "No active rivalries yet"}
            </h2>

            <p>
              {hasFilterChanges
                ? "Try another search or reset your filters."
                : "Start a rivalry through your show results to begin its story."}
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
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length > 0 && (
          <>
            <ul className="rivalries-screen__list">
              {data.items.map((rivalry) => (
                <li key={rivalry.id}>
                  <RivalryCard
                    rivalry={rivalry}
                    onOpen={() => setSelectedFeudId(rivalry.id)}
                  />
                </li>
              ))}
            </ul>

            {data.total_pages > 1 && (
              <nav
                className="rivalries-screen__pagination"
                aria-label="Rivalries pagination"
              >
                <button
                  className="rivalries-screen__button"
                  type="button"
                  disabled={data.page <= 1}
                  aria-label="Previous page"
                  onClick={() => goToPage(data.page - 1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                <span>
                  Page {data.page} of {data.total_pages}
                </span>

                <button
                  className="rivalries-screen__button"
                  type="button"
                  disabled={data.page >= data.total_pages}
                  aria-label="Next page"
                  onClick={() => goToPage(data.page + 1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </nav>
            )}
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
