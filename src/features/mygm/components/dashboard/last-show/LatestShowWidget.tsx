import { Fragment, useId, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  LoaderCircle,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";

import { useLatestShow } from "../../../hooks/dashboard/useLatestShow";

import type {
  ShowDetailMatch,
  ShowDetailMatchParticipant,
} from "../../../types/show-history/showDetail.types";

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

function WidgetImage({
  src,
  fallback,
}: {
  src: string | null;
  fallback: ReactNode;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return src && src !== failedUrl ? (
    <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
  ) : (
    fallback
  );
}

function getTeams(match: ShowDetailMatch) {
  const teams = new Map<number, ShowDetailMatchParticipant[]>();

  for (const participant of match.participants) {
    const members = teams.get(participant.side) ?? [];

    members.push(participant);
    teams.set(participant.side, members);
  }

  return [...teams.entries()].sort(
    ([firstSide], [secondSide]) => firstSide - secondSide,
  );
}

function MatchHighlight({ title, match }: MatchHighlightProps) {
  const headingId = useId();
  const teams = getTeams(match);

  const participantNames = teams
    .map(([, members]) =>
      members.map((participant) => participant.name).join(" & "),
    )
    .join(" vs ");

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

  const resultHeading =
    match.outcome === "draw" || match.outcome === "no_contest"
      ? "Result"
      : winners.length > 1
        ? "Winners"
        : "Winner";

  return (
    <article className="latest-show__highlight" aria-labelledby={headingId}>
      <header className="latest-show__highlight-header">
        <h3 id={headingId}>{title}</h3>

        <span className="latest-show__match-rating">
          <Star size={14} aria-hidden="true" />

          {match.rating === null ? "Not rated" : `${match.rating} / 5`}
        </span>
      </header>

      {teams.length > 0 && (
        <div className="latest-show__teams" aria-hidden="true">
          {teams.map(([side, members], index) => (
            <Fragment key={side}>
              {index > 0 && <span className="latest-show__versus">vs</span>}

              <div className="latest-show__team">
                {members.slice(0, 2).map((participant) => (
                  <span
                    className={[
                      "latest-show__portrait",
                      participant.result === "winner" ? "is-winner" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={participant.wrestler_id}
                  >
                    <WidgetImage
                      src={participant.image_url}
                      fallback={<UserRound size={26} />}
                    />

                    {participant.result === "winner" && (
                      <span className="latest-show__winner-mark">
                        <Check size={11} />
                      </span>
                    )}
                  </span>
                ))}

                {members.length > 2 && (
                  <span className="latest-show__extra">
                    +{members.length - 2}
                  </span>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      )}

      <h4 className="latest-show__participants">
        {participantNames || "Participants not recorded"}
      </h4>

      <p className="latest-show__match-type">
        {match.label}
        {match.stipulation_name ? ` · ${match.stipulation_name}` : ""}
      </p>

      <dl className="latest-show__result">
        <dt>{resultHeading}</dt>
        <dd>{resultLabel}</dd>
      </dl>

      {match.titles.length > 0 && (
        <p className="latest-show__title-match">
          <Trophy size={15} aria-hidden="true" />

          <span>
            Title match ·{" "}
            {match.titles.map((championship) => championship.name).join(", ")}
          </span>
        </p>
      )}
    </article>
  );
}

export default function LatestShowWidget({ careerId }: LatestShowWidgetProps) {
  const headingId = useId();

  const { data, isLoading, errorMessage, retry } = useLatestShow(careerId);

  const matches = data
    ? data.segments
        .filter(
          (segment): segment is ShowDetailMatch => segment.kind === "match",
        )
        .sort((first, second) => first.position - second.position)
    : [];

  const opener = matches[0];

  const mainEvent =
    matches.length > 1 ? matches[matches.length - 1] : undefined;

  return (
    <section className="latest-show" aria-labelledby={headingId}>
      <header className="latest-show__header">
        <h2 id={headingId}>Latest show</h2>

        <Link to={`/mygm/${careerId}/history`}>
          View history
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {isLoading ? (
        <div className="latest-show__state" aria-busy="true">
          <LoaderCircle
            className="latest-show__spinner"
            size={24}
            aria-hidden="true"
          />

          <p role="status">Loading the latest show…</p>
        </div>
      ) : errorMessage ? (
        <div className="latest-show__state">
          <p className="latest-show__error" role="alert">
            {errorMessage}
          </p>

          <button className="latest-show__button" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : !data ? (
        <div className="latest-show__empty">
          <span className="latest-show__empty-icon">
            <CalendarPlus size={28} aria-hidden="true" />
          </span>

          <div>
            <h3>Your first show is waiting.</h3>

            <p>
              Complete a show to see its rating, opening match and main event
              here.
            </p>

            <Link
              className="latest-show__button"
              to={`/mygm/${careerId}/booking`}
            >
              Open booking
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="latest-show__panel">
          <div className="latest-show__overview">
            <div className="latest-show__identity">
              <span className="latest-show__logo" aria-hidden="true">
                <WidgetImage
                  src={data.event.logo_url ?? null}
                  fallback={
                    data.event.kind === "ple" ? (
                      <Trophy size={34} />
                    ) : (
                      <CalendarDays size={34} />
                    )
                  }
                />
              </span>

              <div className="latest-show__event-copy">
                <p className="latest-show__period">
                  Season {data.event.season} · Week {data.event.week}
                </p>

                <h3>{data.event.name}</h3>

                <p className="latest-show__metadata">
                  <span>{showTypeLabels[data.event.show_type]}</span>

                  <span>
                    {data.summary.match_count}{" "}
                    {data.summary.match_count === 1 ? "match" : "matches"}
                    {" · "}
                    {data.summary.promo_count}{" "}
                    {data.summary.promo_count === 1 ? "promo" : "promos"}
                  </span>
                </p>
              </div>
            </div>

            <div className="latest-show__overall-rating">
              <span>Show rating</span>

              <strong>
                <Star size={19} aria-hidden="true" />

                {data.event.rating === null ? (
                  "Not recorded"
                ) : (
                  <>
                    {data.event.rating.toFixed(2)}
                    <span>/ 5</span>
                  </>
                )}
              </strong>
            </div>
          </div>

          {opener ? (
            <div className="latest-show__highlights">
              <MatchHighlight
                title={matches.length === 1 ? "Opener & Main event" : "Opener"}
                match={opener}
              />

              {mainEvent && (
                <MatchHighlight title="Main event" match={mainEvent} />
              )}
            </div>
          ) : (
            <p className="latest-show__message">
              No matches were recorded for this show.
            </p>
          )}

          <footer className="latest-show__footer">
            <Link
              className="latest-show__results-link"
              to={`/mygm/${careerId}/history/${data.event.id}`}
            >
              Full show results
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </footer>
        </div>
      )}
    </section>
  );
}
