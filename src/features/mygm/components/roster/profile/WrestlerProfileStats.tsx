import { useId } from "react";
import { Mic, Sparkles, Star, TrendingUp } from "lucide-react";

import type { WrestlerProfileStats as WrestlerStats } from "../../../types/roster/wrestlerProfile.types";

import "./WrestlerProfileStats.scss";

interface WrestlerProfileStatsProps {
  stats: WrestlerStats;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export default function WrestlerProfileStats({
  stats,
}: WrestlerProfileStatsProps) {
  const headingId = useId();
  const winRate = stats.matches > 0 ? (stats.wins / stats.matches) * 100 : null;

  const results = [
    {
      id: "matches",
      label: "Matches",
      value: stats.matches,
    },
    {
      id: "wins",
      label: "Wins",
      value: stats.wins,
    },
    {
      id: "losses",
      label: "Losses",
      value: stats.losses,
    },
    ...(stats.draws > 0
      ? [{ id: "draws", label: "Draws", value: stats.draws }]
      : []),
    ...(stats.no_contests > 0
      ? [
          {
            id: "no-contests",
            label: "No contests",
            value: stats.no_contests,
          },
        ]
      : []),
  ];

  return (
    <section className="wrestler-profile-stats" aria-labelledby={headingId}>
      <header className="wrestler-profile-stats__header">
        <h2 id={headingId}>Career statistics</h2>
        <p>Results from completed shows in this career.</p>
      </header>

      <div className="wrestler-profile-stats__panel">
        <div className="wrestler-profile-stats__performance">
          <div className="wrestler-profile-stats__win-rate">
            <p><TrendingUp size={17} aria-hidden="true" />Win rate</p>
            <strong>{winRate === null ? "—" : `${winRate.toFixed(1)}%`}</strong>
            {winRate !== null && <progress value={winRate} max={100} aria-label="Win rate across all matches" />}
            <span>{winRate === null ? "No matches recorded yet" : "Wins across all matches"}</span>
          </div>
        <dl className="wrestler-profile-stats__results">
          {results.map((result) => (
            <div
              className={`wrestler-profile-stats__result wrestler-profile-stats__result--${result.id}`}
              key={result.id}
            >
              <dt>{result.label}</dt>
              <dd>{numberFormatter.format(result.value)}</dd>
            </div>
          ))}
        </dl>
        </div>

        <dl className="wrestler-profile-stats__details">
          <div>
            <dt>
              <Star size={15} aria-hidden="true" />
              Average match rating
            </dt>
            <dd>
              {stats.average_rating === null ? (
                <span className="wrestler-profile-stats__unrated">
                  Not rated
                </span>
              ) : (
                <>
                  {stats.average_rating.toFixed(2)}
                  <span> / 5</span>
                </>
              )}
            </dd>
          </div>

          <div>
            <dt><Sparkles size={15} aria-hidden="true" />4.5+ star matches</dt>
            <dd>{numberFormatter.format(stats.high_rated_matches)}</dd>
          </div>

          <div>
            <dt><Mic size={15} aria-hidden="true" />Promos performed</dt>
            <dd>{numberFormatter.format(stats.promos_performed)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
