import { useId } from "react";
import ShowDetailRivalryOutcome from "./ShowDetailRivalryOutcome";
import type {
  ShowDetailMatch,
  ShowDetailMatchParticipant,
  ShowDetailTitleResult,
} from "../../types/show-history/showDetail.types";
import "./ShowDetailMatchCard.scss";

interface ShowDetailMatchCardProps {
  match: ShowDetailMatch;
  financesRecorded: boolean;
  positionLabel?: string;
}

interface MatchTeam {
  side: number;
  participants: ShowDetailMatchParticipant[];
}

const titleResultLabels: Record<ShowDetailTitleResult, string> = {
  retained: "Successful defense",
  changed: "Title changed hands",
  awarded: "Vacant title awarded",
  unrecorded: "Title result not recorded",
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function getTeams(match: ShowDetailMatch): MatchTeam[] {
  const teams = new Map<number, ShowDetailMatchParticipant[]>();

  for (const participant of match.participants) {
    const members = teams.get(participant.side) ?? [];

    members.push(participant);
    teams.set(participant.side, members);
  }

  return [...teams.entries()]
    .sort(([firstSide], [secondSide]) => firstSide - secondSide)
    .map(([side, participants]) => ({
      side,
      participants,
    }));
}

export default function ShowDetailMatchCard({
  match,
  financesRecorded,
  positionLabel,
}: ShowDetailMatchCardProps) {
  const headingId = useId();
  const teams = getTeams(match);

  return (
    <article className="show-match-card" aria-labelledby={headingId}>
      <header className="show-match-card__header">
        <div>
          <p className="show-match-card__position">
            Segment {match.position} · Match
            {positionLabel ? ` · ${positionLabel}` : ""}
          </p>

          <h3 id={headingId}>{match.label}</h3>

          {match.stipulation_name && (
            <p className="show-match-card__stipulation">
              {match.stipulation_name}
            </p>
          )}
        </div>

        <p className="show-match-card__rating">
          <span aria-hidden="true">★</span>
          {match.rating === null ? "Not rated" : `${match.rating} / 5`}
        </p>
      </header>

      <ul className="show-match-card__teams">
        {teams.map((team) => {
          const isWinner =
            team.participants.length > 0 &&
            team.participants.every(
              (participant) => participant.result === "winner",
            );

          return (
            <li
              key={team.side}
              className={
                isWinner
                  ? "show-match-card__team show-match-card__team--winner"
                  : "show-match-card__team"
              }
            >
              <div className="show-match-card__team-header">
                <h4>Team {team.side}</h4>

                {isWinner && (
                  <span className="show-match-card__winner">
                    {team.participants.length === 1 ? "Winner" : "Winners"}
                  </span>
                )}
              </div>

              <ul className="show-match-card__members">
                {team.participants.map((participant) => (
                  <li key={participant.wrestler_id}>{participant.name}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      {match.outcome === "draw" && (
        <p className="show-match-card__note">This match ended in a draw.</p>
      )}

      {match.outcome === "no_contest" && (
        <p className="show-match-card__note">
          This match ended in a no contest.
        </p>
      )}

      {match.titles.length > 0 && (
        <section className="show-match-card__section">
          <h4>Championships</h4>

          <ul className="show-match-card__titles">
            {match.titles.map((title) => (
              <li key={title.id}>
                <strong>{title.name}</strong>

                <span>{titleResultLabels[title.result]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {match.interference && (
        <section className="show-match-card__section">
          <h4>Interference</h4>

          <p>
            {match.interference.wrestler_name}
            {" → "}
            {match.interference.target_wrestler_name}
          </p>
        </section>
      )}

      <ShowDetailRivalryOutcome rivalry={match.rivalry} />

      {financesRecorded && (
        <p className="show-match-card__cost">
          <span>Match cost</span>
          <strong>{moneyFormatter.format(BigInt(match.cost))}</strong>
        </p>
      )}
    </article>
  );
}
