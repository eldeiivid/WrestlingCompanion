import { useId, useState } from "react";
import type { CSSProperties } from "react";
import { Star, Swords, Trophy, UserRound } from "lucide-react";

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

function AssetImage({
  src,
  kind,
}: {
  src: string | null;
  kind: "wrestler" | "title";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (src && src !== failedUrl) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(src)}
      />
    );
  }

  return kind === "title" ? (
    <Trophy size={32} strokeWidth={1.25} />
  ) : (
    <UserRound size={48} strokeWidth={1.25} />
  );
}

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

  const mobileColumns =
    teams.length === 4 ? 2 : Math.max(1, Math.min(teams.length, 3));

  const teamStyle = {
    "--match-mobile-columns": mobileColumns,
    "--match-desktop-columns": Math.max(1, Math.min(teams.length, 6)),
  } as CSSProperties;

  const rivalries = match.rivalries?.length ? match.rivalries : [match.rivalry];

  return (
    <article className="show-match-card" aria-labelledby={headingId}>
      <div className="show-match-card__hero">
        <header className="show-match-card__header">
          <div className="show-match-card__identity">
            <p className="show-match-card__position">
              <span>{match.position}</span>
              <Swords size={14} aria-hidden="true" />
              Match
              {positionLabel && (
                <span className="show-match-card__position-label">
                  · {positionLabel}
                </span>
              )}
            </p>

            <h3 id={headingId}>{match.label}</h3>

            {match.stipulation_name && (
              <p className="show-match-card__stipulation">
                {match.stipulation_name}
              </p>
            )}
          </div>

          <p className="show-match-card__rating">
            <span className="show-match-card__sr-only">Match rating: </span>
            <Star size={18} aria-hidden="true" />

            {match.rating === null ? (
              <span>Not rated</span>
            ) : (
              <>
                <strong>{match.rating}</strong>
                <span>
                  / 5<span className="show-match-card__sr-only"> stars</span>
                </span>
              </>
            )}
          </p>
        </header>

        {teams.length > 0 ? (
          <div className="show-match-card__matchup">
            <ul
              className={`show-match-card__teams${
                teams.length > 2 ? " show-match-card__teams--multi" : ""
              }`}
              style={teamStyle}
            >
              {teams.map((team) => {
                const isWinner =
                  team.participants.length > 0 &&
                  team.participants.every(
                    (participant) => participant.result === "winner",
                  );

                return (
                  <li
                    key={team.side}
                    className={`show-match-card__team${
                      isWinner ? " show-match-card__team--winner" : ""
                    }`}
                  >
                    <div className="show-match-card__team-header">
                      <h4>Team {team.side}</h4>
                    </div>

                    <ul className="show-match-card__members">
                      {team.participants.map((participant) => (
                        <li
                          className="show-match-card__member"
                          key={participant.wrestler_id}
                        >
                          <span
                            className="show-match-card__portrait"
                            aria-hidden="true"
                          >
                            <AssetImage
                              src={participant.image_url}
                              kind="wrestler"
                            />
                          </span>

                          <span className="show-match-card__member-name">
                            {participant.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isWinner && (
                      <span className="show-match-card__winner">
                        {team.participants.length === 1 ? "Winner" : "Winners"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {teams.length === 2 && (
              <span className="show-match-card__versus" aria-hidden="true">
                VS
              </span>
            )}
          </div>
        ) : (
          <p className="show-match-card__missing">Participants not recorded.</p>
        )}
      </div>

      <div className="show-match-card__content">
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
                  <span
                    className="show-match-card__title-image"
                    aria-hidden="true"
                  >
                    <AssetImage src={title.image_url} kind="title" />
                  </span>

                  <div>
                    <strong>{title.name}</strong>
                    <span>{titleResultLabels[title.result]}</span>
                  </div>
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

        {rivalries.map((rivalry) => (
          <ShowDetailRivalryOutcome
            key={rivalry.id ?? `${match.id}:no-rivalry`}
            rivalry={rivalry}
          />
        ))}

        {financesRecorded && (
          <p className="show-match-card__cost">
            <span>Match cost</span>
            <strong>{moneyFormatter.format(BigInt(match.cost))}</strong>
          </p>
        )}
      </div>
    </article>
  );
}
