import { useId, useState } from "react";
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
      <h2 id={headingId}>Active rivalries</h2>

      {rivalries.length === 0 ? (
        <p className="wrestler-active-rivalries__empty">No active rivalries.</p>
      ) : (
        <ul className="wrestler-active-rivalries__list">
          {rivalries.map((rivalry) => {
            const name = getRivalryName(rivalry);

            return (
              <li key={rivalry.id}>
                <article className="wrestler-active-rivalries__card">
                  <h3>{name}</h3>

                  <RivalryParticipants members={rivalry.members} compact />

                  <RivalryLevel level={rivalry.level} />

                  <p className="wrestler-active-rivalries__started">
                    Started: Season {rivalry.started_season}
                    {" · "}
                    Week {rivalry.started_week}
                  </p>

                  <button
                    className="wrestler-active-rivalries__button"
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`View rivalry: ${name}`}
                    onClick={() => setSelectedFeudId(rivalry.id)}
                  >
                    View rivalry
                  </button>
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
