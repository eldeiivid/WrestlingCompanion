import { useId } from "react";
import { Link } from "react-router-dom";
import CareerWelcome from "../welcome/CareerWelcome";
import { useLatestShow } from "../../../hooks/dashboard/useLatestShow";
import type { ShowDetailMatch } from "../../../types/show-history/showDetail.types";
import type { ShowHistoryType } from "../../../types/show-history/showHistory.types";
import "./LatestShowWidget.scss";

interface LatestShowWidgetProps {
  careerId: string;
}

interface MatchHighlightProps {
  title: string;
  match: ShowDetailMatch;
}

const showTypeLabels: Record<ShowHistoryType, string> = {
  weekly: "Weekly show",
  go_home: "Go-home show",
  ple: "PLE",
  special: "Special show",
};

function getParticipantNames(match: ShowDetailMatch): string {
  const teams = new Map<number, string[]>();

  for (const participant of match.participants) {
    const names = teams.get(participant.side) ?? [];

    names.push(participant.name);
    teams.set(participant.side, names);
  }

  return [...teams.entries()]
    .sort(([firstSide], [secondSide]) => firstSide - secondSide)
    .map(([, names]) => names.join(" & "))
    .join(" vs ");
}

function MatchHighlight({ title, match }: MatchHighlightProps) {
  const winners = match.participants.filter(
    (participant) => participant.result === "winner",
  );

  const winnerNames = winners
    .map((participant) => participant.name)
    .join(" & ");

  const resultLabel =
    match.outcome === "draw"
      ? "Draw"
      : match.outcome === "no_contest"
        ? "No contest"
        : winnerNames || "Winner not recorded";

  return (
    <article className="latest-show__highlight">
      <header className="latest-show__highlight-header">
        <h3>{title}</h3>

        <span className="latest-show__match-rating">
          <span aria-hidden="true">★ </span>
          {match.rating === null ? "Not rated" : `${match.rating} / 5`}
        </span>
      </header>

      <p className="latest-show__participants">
        {getParticipantNames(match) || "Participants not recorded"}
      </p>

      <p className="latest-show__match-type">
        {match.label}
        {match.stipulation_name ? ` · ${match.stipulation_name}` : ""}
      </p>

      <dl className="latest-show__result">
        <dt>
          {match.outcome === "draw" || match.outcome === "no_contest"
            ? "Result"
            : winners.length > 1
              ? "Winners"
              : "Winner"}
        </dt>

        <dd>{resultLabel}</dd>
      </dl>

      {match.titles.length > 0 && (
        <p className="latest-show__title-match">
          Title match ·{" "}
          {match.titles.map((championship) => championship.name).join(", ")}
        </p>
      )}
    </article>
  );
}

export default function LatestShowWidget({ careerId }: LatestShowWidgetProps) {
  const headingId = useId();

  const { data, isLoading, errorMessage, retry } = useLatestShow(careerId);

  if (isLoading) {
    return (
      <section
        className="latest-show"
        aria-labelledby={headingId}
        aria-busy="true"
      >
        <h2 id={headingId}>Latest show</h2>

        <p className="latest-show__message" role="status">
          Loading the latest show…
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="latest-show" aria-labelledby={headingId}>
        <h2 id={headingId}>Latest show</h2>

        <p className="latest-show__message" role="alert">
          {errorMessage}
        </p>

        <button className="latest-show__button" type="button" onClick={retry}>
          Try again
        </button>
      </section>
    );
  }

  if (!data) {
    return (
      <div className="latest-show latest-show--empty">
        <CareerWelcome careerId={careerId} hasCompletedShows={false} />
      </div>
    );
  }

  const matches = data.segments
    .filter((segment) => segment.kind === "match")
    .sort((first, second) => first.position - second.position);

  const opener = matches[0];

  const mainEvent =
    matches.length > 1 ? matches[matches.length - 1] : undefined;

  return (
    <section className="latest-show" aria-labelledby={headingId}>
      <header className="latest-show__header">
        <div>
          <h2 id={headingId}>Latest show</h2>

          <p className="latest-show__period">
            Season {data.event.season} · Week {data.event.week}
          </p>

          <p className="latest-show__name">{data.event.name}</p>
        </div>

        <div className="latest-show__overall-rating">
          <span>Show rating</span>

          <strong>
            <span aria-hidden="true">★ </span>
            {data.event.rating === null
              ? "Not recorded"
              : `${data.event.rating.toFixed(2)} / 5`}
          </strong>
        </div>
      </header>

      <div className="latest-show__metadata">
        <span className="latest-show__badge">
          {showTypeLabels[data.event.show_type]}
        </span>

        <span>
          {data.summary.match_count}{" "}
          {data.summary.match_count === 1 ? "match" : "matches"}
          {" · "}
          {data.summary.promo_count}{" "}
          {data.summary.promo_count === 1 ? "promo" : "promos"}
        </span>
      </div>

      {opener ? (
        <div className="latest-show__highlights">
          <MatchHighlight
            title={matches.length === 1 ? "Opener & Main event" : "Opener"}
            match={opener}
          />

          {mainEvent && <MatchHighlight title="Main event" match={mainEvent} />}
        </div>
      ) : (
        <p className="latest-show__message">
          No matches were recorded for this show.
        </p>
      )}

      <footer className="latest-show__footer">
        <Link
          className="latest-show__button"
          to={`/mygm/${careerId}/history/${data.event.id}`}
        >
          View show results
        </Link>
      </footer>
    </section>
  );
}
