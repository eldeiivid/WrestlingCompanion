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
  if (rivalry.action === null) {
    return null;
  }

  const firstSide = getSideNames(rivalry, 1);
  const secondSide = getSideNames(rivalry, 2);

  const name =
    rivalry.name?.trim() ||
    (firstSide && secondSide ? `${firstSide} vs ${secondSide}` : "Rivalry");

  return (
    <section className="show-rivalry-outcome">
      <h4>Rivalry outcome</h4>

      {rivalry.action === "none" ? (
        <p>No rivalry change.</p>
      ) : (
        <>
          <p className="show-rivalry-outcome__name">{name}</p>

          {rivalry.action === "create" && <p>New rivalry created.</p>}

          {rivalry.action === "increase" && <p>Rivalry level increased.</p>}

          {rivalry.action === "resolve" && <p>Rivalry ended.</p>}

          {rivalry.level_after !== null && (
            <p>Recorded level: {rivalry.level_after} / 4</p>
          )}

          {rivalry.action === "resolve" && (
            <p>
              Winner:{" "}
              {rivalry.winning_side === null
                ? "No winner assigned"
                : getSideNames(rivalry, rivalry.winning_side) || "Not recorded"}
            </p>
          )}
        </>
      )}
    </section>
  );
}
