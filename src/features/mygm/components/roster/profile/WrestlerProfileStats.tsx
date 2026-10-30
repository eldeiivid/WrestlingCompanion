import { useId } from "react";
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

  const metrics = [
    {
      id: "matches",
      label: "Matches",
      value: numberFormatter.format(stats.matches),
    },
    {
      id: "wins",
      label: "Wins",
      value: numberFormatter.format(stats.wins),
    },
    {
      id: "losses",
      label: "Losses",
      value: numberFormatter.format(stats.losses),
    },
    ...(stats.draws > 0
      ? [
          {
            id: "draws",
            label: "Draws",
            value: numberFormatter.format(stats.draws),
          },
        ]
      : []),
    ...(stats.no_contests > 0
      ? [
          {
            id: "no-contests",
            label: "No contests",
            value: numberFormatter.format(stats.no_contests),
          },
        ]
      : []),
    {
      id: "average-rating",
      label: "Average match rating",
      value:
        stats.average_rating === null
          ? "Not rated"
          : `${stats.average_rating.toFixed(2)} / 5`,
    },
    {
      id: "high-rated-matches",
      label: "4.5+ star matches",
      value: numberFormatter.format(stats.high_rated_matches),
    },
    {
      id: "promos",
      label: "Promos performed",
      value: numberFormatter.format(stats.promos_performed),
    },
  ];

  return (
    <section className="wrestler-profile-stats" aria-labelledby={headingId}>
      <header className="wrestler-profile-stats__header">
        <h2 id={headingId}>Career statistics</h2>
        <p>Results from completed shows in this career.</p>
      </header>

      <dl className="wrestler-profile-stats__grid">
        {metrics.map((metric) => (
          <div key={metric.id}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
