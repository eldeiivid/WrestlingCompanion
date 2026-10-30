import { useId } from "react";
import { Link } from "react-router-dom";
import type {
  WrestlerProfileMatch,
  WrestlerProfileMatchHistory,
} from "../../../types/roster/wrestlerProfile.types";
import "./WrestlerRecentMatches.scss";

interface WrestlerRecentMatchesProps {
  careerId: string;
  history: WrestlerProfileMatchHistory;
}

function getMatchup(match: WrestlerProfileMatch): string {
  const teams = new Map<number, string[]>();

  for (const participant of match.participants) {
    const members = teams.get(participant.side) ?? [];

    members.push(participant.name);
    teams.set(participant.side, members);
  }

  return [...teams.entries()]
    .sort(([firstSide], [secondSide]) => firstSide - secondSide)
    .map(([, names]) => names.join(" & "))
    .join(" vs ");
}

function getResultLabel(
  result: WrestlerProfileMatch["wrestler_result"],
): string {
  switch (result) {
    case "winner":
      return "Win";
    case "loser":
      return "Loss";
    case "draw":
      return "Draw";
    case "no_contest":
      return "No contest";
    default:
      return "Not recorded";
  }
}

export default function WrestlerRecentMatches({
  careerId,
  history,
}: WrestlerRecentMatchesProps) {
  const headingId = useId();

  return (
    <section className="wrestler-recent-matches" aria-labelledby={headingId}>
      <header className="wrestler-recent-matches__header">
        <h2 id={headingId}>Recent matches</h2>

        {history.items.length > 0 && (
          <p>
            Showing {history.items.length} of {history.total_count} completed{" "}
            {history.total_count === 1 ? "match" : "matches"}.
          </p>
        )}
      </header>

      {history.items.length === 0 ? (
        <p className="wrestler-recent-matches__empty">
          No completed matches yet.
        </p>
      ) : (
        <ol
          className="wrestler-recent-matches__list"
          aria-label="Recent matches, newest first"
        >
          {history.items.map((match) => {
            const winners = match.participants.filter(
              (participant) => participant.result === "winner",
            );

            return (
              <li key={match.segment_id}>
                <article className="wrestler-recent-matches__card">
                  <header className="wrestler-recent-matches__card-header">
                    <div>
                      <p className="wrestler-recent-matches__period">
                        Season {match.season} · Week {match.week}
                        {" · "}
                        Segment {match.position}
                      </p>

                      <h3>
                        {getMatchup(match) || "Participants not recorded"}
                      </h3>
                    </div>

                    <span
                      className={`wrestler-recent-matches__result wrestler-recent-matches__result--${match.wrestler_result ?? "unrecorded"}`}
                    >
                      {getResultLabel(match.wrestler_result)}
                    </span>
                  </header>

                  <p className="wrestler-recent-matches__format">
                    {match.format_name}
                    {match.stipulation_name
                      ? ` · ${match.stipulation_name}`
                      : ""}
                    {match.is_title_match ? " · Title match" : ""}
                  </p>

                  <dl className="wrestler-recent-matches__details">
                    <div>
                      <dt>Match rating</dt>
                      <dd>
                        {match.rating === null
                          ? "Not rated"
                          : `${match.rating} / 5 stars`}
                      </dd>
                    </div>

                    {winners.length > 0 && (
                      <div>
                        <dt>{winners.length === 1 ? "Winner" : "Winners"}</dt>

                        <dd>
                          {winners
                            .map((participant) => participant.name)
                            .join(" & ")}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <Link
                    className="wrestler-recent-matches__link"
                    to={`/mygm/${careerId}/history/${match.event_id}`}
                    aria-label={`View show from season ${match.season}, week ${match.week}`}
                  >
                    View show
                  </Link>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
