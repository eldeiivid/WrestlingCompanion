import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, UserRound } from "lucide-react";

import type {
  ChampionshipCategory,
  ChampionshipDivision,
  ChampionshipGender,
} from "../../../types/championships/championships.types";

import type { ChampionshipDetailData } from "../../../types/championships/championshipDetail.types";

import "./ChampionshipOverview.scss";

interface ChampionshipOverviewProps {
  data: ChampionshipDetailData;
}

const categoryLabels: Record<ChampionshipCategory, string> = {
  world: "World",
  midcard: "Midcard",
  tag_team: "Tag Team",
  mitb: "Money in the Bank",
  other: "Championship",
};

const genderLabels: Record<ChampionshipGender, string> = {
  male: "Men",
  female: "Women",
  mixed: "Mixed",
  open: "Open",
};

const divisionLabels: Record<ChampionshipDivision, string> = {
  singles: "Singles",
  tag_team: "Tag Team",
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
      className={`championship-overview__thumbnail championship-overview__thumbnail--${kind}`}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : kind === "title" ? (
        <Trophy size={80} />
      ) : (
        <UserRound size={28} />
      )}
    </span>
  );
}

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function ChampionshipOverview({
  data,
}: ChampionshipOverviewProps) {
  const headingId = useId();

  const {
    career_id: careerId,
    championship,
    current_reign: reign,
    history_summary: summary,
  } = data;

  const isBriefcase = championship.category === "mitb";

  const statusLabel = reign
    ? isBriefcase
      ? "Claimed"
      : "Held"
    : isBriefcase
      ? "Unclaimed"
      : "Vacant";

  return (
    <section className="championship-overview" aria-labelledby={headingId}>
      <div className="championship-overview__visual">
        <Thumbnail
          key={`title:${championship.id}:${championship.image_url}`}
          src={championship.image_url}
          kind="title"
        />
      </div>

      <div className="championship-overview__content">
        <header className="championship-overview__header">
          <p className="championship-overview__category">
            {categoryLabels[championship.category]}
          </p>

          <h2 id={headingId}>{championship.name}</h2>

          <div className="championship-overview__badges">
            <span>{genderLabels[championship.gender]}</span>

            {!isBriefcase && (
              <span>{divisionLabels[championship.division]}</span>
            )}

            <span>{statusLabel}</span>

            {!championship.is_active && <span>Inactive title</span>}
          </div>
        </header>

        <div className="championship-overview__current">
          <h3>{isBriefcase ? "Current holders" : "Current champions"}</h3>

          {reign ? (
            <>
              {reign.holders.length > 0 ? (
                <ul className="championship-overview__holders">
                  {reign.holders.map((holder) => (
                    <li key={holder.id}>
                      <Thumbnail
                        key={`holder:${holder.id}:${holder.image_url}`}
                        src={holder.image_url}
                        kind="holder"
                      />

                      <Link to={`/mygm/${careerId}/roster/${holder.id}`}>
                        {holder.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="championship-overview__message">
                  Holder information is unavailable.
                </p>
              )}

              <p className="championship-overview__since">
                Held since {formatPeriod(reign.won_tick)}
              </p>

              {reign.won_match ? (
                <Link
                  className="championship-overview__show-link"
                  to={`/mygm/${careerId}/history/${reign.won_match.event_id}`}
                >
                  View show: {reign.won_match.event_name}
                </Link>
              ) : (
                <p className="championship-overview__hint">
                  No acquisition match is recorded for this reign.
                </p>
              )}
            </>
          ) : (
            <p className="championship-overview__message">
              {isBriefcase
                ? "This briefcase currently has no holder."
                : "This championship is currently vacant."}
            </p>
          )}
        </div>

        <dl className="championship-overview__stats">
          {reign && !isBriefcase && (
            <>
              <div>
                <dt>Current reign length</dt>
                <dd>
                  {reign.duration_weeks}{" "}
                  {reign.duration_weeks === 1 ? "week" : "weeks"}
                </dd>
              </div>

              <div>
                <dt>Current successful defenses</dt>
                <dd>{reign.defenses}</dd>
              </div>
            </>
          )}

          <div>
            <dt>{isBriefcase ? "Holder periods" : "Total reigns"}</dt>
            <dd>{summary.reign_count}</dd>
          </div>

          <div>
            <dt>
              {isBriefcase ? "Completed holder periods" : "Completed reigns"}
            </dt>
            <dd>{summary.completed_reign_count}</dd>
          </div>

          {!isBriefcase && (
            <div>
              <dt>All-time successful defenses</dt>
              <dd>{summary.defense_count}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
