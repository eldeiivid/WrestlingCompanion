import { useId, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import RivalryDetailModal from "../../dashboard/rivalries/RivalryDetailModal";
import RivalryLevel from "../../dashboard/rivalries/RivalryLevel";
import RivalryParticipants from "../../dashboard/rivalries/RivalryParticipants";
import type { FeaturedRivalry } from "../../../types/rivalries/rivalries.types";
import "./WrestlerActiveRivalries.scss";

interface WrestlerActiveRivalriesProps {
  careerId: string;
  rivalries: FeaturedRivalry[];
}

function getRivalryName(rivalry: FeaturedRivalry): string {
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

export default function WrestlerActiveRivalries({
  careerId,
  rivalries,
}: WrestlerActiveRivalriesProps) {
  const headingId = useId();

  const [selectedFeudId, setSelectedFeudId] = useState<string | null>(null);

  return (
    <section className="wrestler-active-rivalries" aria-labelledby={headingId}>
      <header className="wrestler-active-rivalries__header">
        <h2 id={headingId}>Active rivalries<span>{rivalries.length}</span></h2>
        <p>The stories this wrestler is involved in right now.</p>
      </header>

      {rivalries.length === 0 ? (
        <p className="wrestler-active-rivalries__empty">No active rivalries.</p>
      ) : (
        <ul className="wrestler-active-rivalries__list">
          {rivalries.map((rivalry) => {
            const name = getRivalryName(rivalry);

            return (
              <li key={rivalry.id}>
                <article className="wrestler-active-rivalries__card" data-level={rivalry.level}>
                  <div className="wrestler-active-rivalries__visual">
                    <RivalryParticipants members={rivalry.members} variant="showcase" />
                  </div>
                  <div className="wrestler-active-rivalries__content">
                  <p className="wrestler-active-rivalries__kind">{rivalry.kind === "singles" ? "Singles rivalry" : rivalry.kind === "tag_team" ? "Tag team rivalry" : "Stable rivalry"}</p>
                  <h3>{name}</h3>
                  <RivalryLevel level={rivalry.level} />
                  <dl className="wrestler-active-rivalries__facts">
                    <div><dt>Started</dt><dd>Season {rivalry.started_season} · Week {rivalry.started_week}</dd></div>
                    <div><dt>Duration</dt><dd>{rivalry.weeks_active} {rivalry.weeks_active === 1 ? "week" : "weeks"}</dd></div>
                  </dl>

                  <button
                    className="wrestler-active-rivalries__button"
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

      <RivalryDetailModal
        careerId={careerId}
        feudId={selectedFeudId}
        onClose={() => setSelectedFeudId(null)}
      />
    </section>
  );
}
