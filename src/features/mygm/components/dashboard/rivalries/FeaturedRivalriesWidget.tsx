import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LoaderCircle, Swords } from "lucide-react";

import { useFeaturedRivalries } from "../../../hooks/rivalries/useFeaturedRivalries";

import type {
  FeaturedRivalry,
  RivalryKind,
} from "../../../types/rivalries/rivalries.types";

import RivalryDetailModal from "./RivalryDetailModal";
import RivalryLevel from "./RivalryLevel";
import RivalryParticipants from "./RivalryParticipants";

import "./FeaturedRivalriesWidget.scss";

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

  if (customName) return customName;

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
        <div className="featured-rivalries__heading">
          <h2 id={headingId}>Rivalries</h2>

          {!isLoading && !errorMessage && data && (
            <span className="featured-rivalries__count">
              {data.total_active} active
            </span>
          )}
        </div>

        <Link
          className="featured-rivalries__view-all"
          to={`/mygm/${careerId}/rivalries`}
        >
          View all rivalries
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div aria-busy={isLoading}>
        {isLoading && (
          <div className="featured-rivalries__state">
            <LoaderCircle
              className="featured-rivalries__spinner"
              size={24}
              aria-hidden="true"
            />

            <p role="status">Loading rivalries…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="featured-rivalries__state">
            <p className="featured-rivalries__error" role="alert">
              {errorMessage}
            </p>

            <button
              className="featured-rivalries__retry"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length === 0 && (
          <div className="featured-rivalries__empty">
            <span className="featured-rivalries__empty-icon">
              <Swords size={28} aria-hidden="true" />
            </span>

            <div>
              <h3>Every great story needs a rival.</h3>

              <p>
                Record a new rivalry in your show results to start tracking its
                progress.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && data && data.items.length > 0 && (
          <ul
            className={[
              "featured-rivalries__list",
              data.items.length === 1 ? "featured-rivalries__list--single" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Featured active rivalries"
            tabIndex={data.items.length > 1 ? 0 : undefined}
          >
            {data.items.map((rivalry) => {
              const name = getRivalryName(rivalry);

              return (
                <li key={rivalry.id}>
                  <article className="featured-rivalries__card">
                    <div className="featured-rivalries__visual">
                      <RivalryParticipants
                        members={rivalry.members}
                        variant="showcase"
                      />
                    </div>

                    <div className="featured-rivalries__body">
                      <header className="featured-rivalries__card-header">
                        <p>{kindLabels[rivalry.kind]}</p>
                        <h3>{name}</h3>
                      </header>

                      <RivalryLevel level={rivalry.level} />

                      <dl className="featured-rivalries__facts">
                        <div>
                          <dt>Started</dt>

                          <dd>
                            S{rivalry.started_season}
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

                      <button
                        className="featured-rivalries__open"
                        type="button"
                        aria-haspopup="dialog"
                        aria-label={`View rivalry: ${name}`}
                        onClick={() => setSelectedFeudId(rivalry.id)}
                      >
                        View rivalry
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </button>
                    </div>
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
