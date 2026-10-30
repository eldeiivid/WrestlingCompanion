import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, UserRound } from "lucide-react";

import type { DashboardChampionship } from "../../../types/dashboard.types";

import "./ChampionsWidget.scss";

interface ChampionsWidgetProps {
  careerId: string;
  currentTick: number;
  championships: DashboardChampionship[];
}

const categoryLabels: Record<DashboardChampionship["category"], string> = {
  world: "World",
  midcard: "Midcard",
  tag_team: "Tag Team",
  mitb: "Money in the Bank",
  other: "Championship",
};

function Thumbnail({
  src,
  kind,
}: {
  src: string | null;
  kind: "title" | "holder";
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`champions-widget__thumbnail champions-widget__thumbnail--${kind}`}
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : kind === "title" ? (
        <Trophy size={32} aria-hidden="true" />
      ) : (
        <UserRound size={20} aria-hidden="true" />
      )}
    </span>
  );
}

export default function ChampionsWidget({
  careerId,
  currentTick,
  championships,
}: ChampionsWidgetProps) {
  const headingId = useId();

  return (
    <section className="champions-widget" aria-labelledby={headingId}>
      <header className="champions-widget__header">
        <h2 id={headingId}>Championships</h2>
        <Link to={`/mygm/${careerId}/titles`}>View all titles</Link>
      </header>

      {championships.length === 0 ? (
        <p className="champions-widget__empty">
          No titles selected for this career.
        </p>
      ) : (
        <ul
          className="champions-widget__list"
          aria-label="Active championships and briefcases"
        >
          {championships.map((title) => {
            const elapsedWeeks =
              title.won_tick === null
                ? 0
                : Math.max(0, currentTick - title.won_tick);

            return (
              <li className="champions-widget__card" key={title.id}>
                <Thumbnail
                  key={`${title.id}:${title.image_url}`}
                  src={title.image_url}
                  kind="title"
                />

                <p className="champions-widget__category">
                  {categoryLabels[title.category]}
                </p>

                <h3>{title.name}</h3>

                {title.reign_id ? (
                  title.holders.length > 0 ? (
                    <ul className="champions-widget__holders">
                      {title.holders.map((holder) => (
                        <li key={holder.id}>
                          <Thumbnail
                            key={`${holder.id}:${holder.image_url}`}
                            src={holder.image_url}
                            kind="holder"
                          />
                          <span>{holder.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="champions-widget__status">
                      Holder unavailable
                    </p>
                  )
                ) : (
                  <p className="champions-widget__status">
                    {title.category === "mitb" ? "Unclaimed" : "Vacant"}
                  </p>
                )}

                {title.category !== "mitb" &&
                  title.reign_id &&
                  title.won_tick !== null && (
                    <div className="champions-widget__stats">
                      <span>
                        {elapsedWeeks} {elapsedWeeks === 1 ? "week" : "weeks"}
                      </span>

                      <span>
                        {title.defenses}{" "}
                        {title.defenses === 1 ? "defense" : "defenses"}
                      </span>
                    </div>
                  )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
