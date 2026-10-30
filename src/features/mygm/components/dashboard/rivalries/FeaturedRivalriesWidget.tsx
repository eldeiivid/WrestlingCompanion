import { useId, useState } from "react";
import { useFeaturedRivalries } from "../../../hooks/rivalries/useFeaturedRivalries";
import type {
  FeaturedRivalry,
  RivalryKind,
} from "../../../types/rivalries/rivalries.types";
import RivalryDetailModal from "./RivalryDetailModal";
import RivalryLevel from "./RivalryLevel";
import RivalryParticipants from "./RivalryParticipants";
import "./FeaturedRivalriesWidget.scss";
import { Link } from "react-router-dom";

interface FeaturedRivalriesWidgetProps {
  careerId: string;
}

const kindLabels: Record<RivalryKind, string> = {
  singles: "Singles rivalry",
  tag_team: "Tag team rivalry",
  stable: "Stable rivalry",
};

function getRivalryName(rivalry: FeaturedRivalry): string {
  const customName = rivalry.name?.trim();

  if (customName) {
    return customName;
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

export default function FeaturedRivalriesWidget({
  careerId,
}: FeaturedRivalriesWidgetProps) {
  const headingId = useId();

  const [selectedFeudId, setSelectedFeudId] = useState<string | null>(null);

  const { data, isLoading, errorMessage, retry } =
    useFeaturedRivalries(careerId);

  return (
    <section className="featured-rivalries" aria-labelledby={headingId}>
      <header className="featured-rivalries__header">
        <div>
          <h2 id={headingId}>Rivalries</h2>
          <p>Your highest-level active rivalries.</p>
        </div>

        <div className="featured-rivalries__header-actions">
          {!isLoading && !errorMessage && data && (
            <span className="featured-rivalries__count">
              {data.total_active} active
            </span>
          )}

          <Link
            className="featured-rivalries__view-all"
            to={`/mygm/${careerId}/rivalries`}
          >
            View all rivalries
          </Link>
        </div>
      </header>

      <div aria-busy={isLoading}>
        {isLoading && (
          <div className="featured-rivalries__state">
            <p role="status">Loading rivalries…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="featured-rivalries__state">
            <p role="alert">{errorMessage}</p>

            <button
              className="featured-rivalries__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length === 0 && (
          <div className="featured-rivalries__state">
            <h3>No active rivalries yet</h3>

            <p>
              Record a new rivalry in your show results to start tracking its
              progress.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length > 0 && (
          <ul className="featured-rivalries__list">
            {data.items.map((rivalry) => {
              const name = getRivalryName(rivalry);

              return (
                <li key={rivalry.id}>
                  <article className="featured-rivalries__card">
                    <header className="featured-rivalries__card-header">
                      <p>{kindLabels[rivalry.kind]}</p>
                      <h3>{name}</h3>
                    </header>

                    <RivalryParticipants members={rivalry.members} compact />

                    <RivalryLevel level={rivalry.level} />

                    <dl className="featured-rivalries__facts">
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
                    </dl>

                    <footer className="featured-rivalries__card-footer">
                      <button
                        className="featured-rivalries__button"
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
        )}
      </div>

      <RivalryDetailModal
        careerId={careerId}
        feudId={selectedFeudId}
        onClose={() => setSelectedFeudId(null)}
      />
    </section>
  );
}
