import { useId } from "react";
import { Flag, Swords, TrendingUp } from "lucide-react";

import type { ShowDetailRivalry } from "../../types/show-history/showDetail.types";

import "./ShowDetailRivalryOutcome.scss";

interface ShowDetailRivalryOutcomeProps {
  rivalry: ShowDetailRivalry;
}

function getSideNames(rivalry: ShowDetailRivalry, side: 1 | 2): string {
  return rivalry.members
    .filter((member) => member.side === side)
    .map((member) => member.name)
    .join(" & ");
}

export default function ShowDetailRivalryOutcome({
  rivalry,
}: ShowDetailRivalryOutcomeProps) {
  const headingId = useId();

  if (rivalry.action === null) {
    return null;
  }

  if (rivalry.action === "none") {
    return (
      <section
        className="show-rivalry-outcome show-rivalry-outcome--unchanged"
        aria-label="Rivalry outcome"
      >
        <p className="show-rivalry-outcome__unchanged">
          <Swords size={14} aria-hidden="true" />
          <span>Rivalries</span>
          No change
        </p>
      </section>
    );
  }

  const firstSide = getSideNames(rivalry, 1);
  const secondSide = getSideNames(rivalry, 2);

  const customName = rivalry.name?.trim();

  const participants =
    firstSide && secondSide ? `${firstSide} vs ${secondSide}` : null;

  const name = customName || participants || "Rivalry";

  const actionLabel =
    rivalry.action === "create"
      ? "Rivalry started"
      : rivalry.action === "increase"
        ? "Level increased"
        : "Rivalry ended";

  const Icon =
    rivalry.action === "create"
      ? Swords
      : rivalry.action === "increase"
        ? TrendingUp
        : Flag;

  return (
    <section className="show-rivalry-outcome" aria-labelledby={headingId}>
      <header className="show-rivalry-outcome__header">
        <h4 id={headingId}>
          <Icon size={15} aria-hidden="true" />
          {actionLabel}
        </h4>

        {rivalry.level_after !== null && (
          <span
            className="show-rivalry-outcome__level"
            aria-label={`Recorded level ${rivalry.level_after} of 4`}
          >
            Level {rivalry.level_after} / 4
          </span>
        )}
      </header>

      <p className="show-rivalry-outcome__name">{name}</p>

      {customName && participants && (
        <p className="show-rivalry-outcome__participants">{participants}</p>
      )}

      {rivalry.action === "resolve" && (
        <p className="show-rivalry-outcome__winner">
          <span>Rivalry winner</span>
          <strong>
            {rivalry.winning_side === null
              ? "No winner assigned"
              : getSideNames(rivalry, rivalry.winning_side) || "Not recorded"}
          </strong>
        </p>
      )}
    </section>
  );
}
