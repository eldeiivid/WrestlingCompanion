import { useId } from "react";
import { Star } from "lucide-react";

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
            <dt>4.5+ star matches</dt>
            <dd>{numberFormatter.format(stats.high_rated_matches)}</dd>
          </div>

          <div>
            <dt>Promos performed</dt>
            <dd>{numberFormatter.format(stats.promos_performed)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
